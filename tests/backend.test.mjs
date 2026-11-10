import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, unlink, rmdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {createApp} from '../server/app.mjs';

test('SQLite, contas, favoritos e recomendações com isolamento entre usuários', async t => {
  const temporary = await mkdtemp(path.join(tmpdir(), 'checkpoint-backend-'));
  const dbPath = path.join(temporary, 'test.sqlite');
  let app, base;
  const accounts = {};
  async function start() {
    app = await createApp({dbPath});
    await new Promise(resolve => app.server.listen(0,'127.0.0.1',resolve));
    base = `http://127.0.0.1:${app.server.address().port}`;
  }
  async function request(route, {method='GET', data, as, headers={}} = {}) {
    const response = await fetch(base+route, {method, headers:{'Content-Type':'application/json','X-Checkpoint-Request':'1', ...(as ? {Cookie:accounts[as]} : {}), ...headers}, ...(data ? {body:JSON.stringify(data)} : {})});
    const content = await response.text();
    let json; try {json=JSON.parse(content);} catch {json=content;}
    return {status:response.status, json, cookie:response.headers.get('set-cookie'), headers:response.headers};
  }
  const game='elden-ring';
  let recommendation;
  try {
    await start();
    await t.test('cadastro valida entradas, gera hash e protege o cookie', async () => {
      assert.equal((await request('/api/register',{method:'POST',data:{username:'x',password:'short'}})).status,400);
      for (const username of ['alice_test','bob_test','carol_test']) {
        const r=await request('/api/register',{method:'POST',data:{username,password:'SenhaLocal123!'}});
        assert.equal(r.status,201); assert.equal(r.json.user.username,username);
        assert.deepEqual(Object.keys(r.json.user).sort(),['id','username']);
        assert.match(r.cookie,/HttpOnly/); assert.match(r.cookie,/SameSite=Strict/);
        accounts[username]=r.cookie.split(';')[0];
      }
      const rows=app.db.prepare('SELECT password_hash, salt FROM users').all();
      assert.equal(new Set(rows.map(r=>r.password_hash)).size,3);
      assert.equal(new Set(rows.map(r=>r.salt)).size,3);
      assert.ok(rows.every(r=>r.password_hash.length===128 && r.password_hash!=='SenhaLocal123!'));
      assert.equal((await request('/api/register',{method:'POST',data:{username:'ALICE_TEST',password:'OutraSenha123'}})).status,409);
      assert.equal((await request('/api/login',{method:'POST',data:{username:'alice_test',password:'SenhaErrada123'}})).status,401);
      const login=await request('/api/login',{method:'POST',data:{username:'ALICE_TEST',password:'SenhaLocal123!'}});
      assert.equal(login.status,200); assert.equal(login.json.user.username,'alice_test');
      accounts.alice_test=login.cookie.split(';')[0];
      assert.equal((await request('/api/me',{as:'alice_test'})).json.user.username,'alice_test');
      const token=accounts.alice_test.split('=')[1];
      assert.ok(app.db.prepare('SELECT token_hash FROM sessions').all().every(s=>s.token_hash!==token));
    });
    await t.test('favoritos são privados, idempotentes e limitados a jogos válidos', async () => {
      assert.equal((await request('/api/favorites')).status,401);
      assert.equal((await request(`/api/favorites/${game}`,{method:'PUT',as:'alice_test'})).status,200);
      assert.equal((await request(`/api/favorites/${game}`,{method:'PUT',as:'alice_test'})).status,200);
      assert.deepEqual((await request('/api/favorites',{as:'alice_test'})).json.favorites,[game]);
      assert.deepEqual((await request('/api/favorites',{as:'bob_test'})).json.favorites,[]);
      assert.equal((await request('/api/favorites/not-a-game',{method:'PUT',as:'alice_test'})).status,400);
      await request(`/api/favorites/${game}`,{method:'DELETE',as:'bob_test'});
      assert.deepEqual((await request('/api/favorites',{as:'alice_test'})).json.favorites,[game]);
    });
    await t.test('recomendações encontram usuários e chegam só ao destinatário', async () => {
      const people=await request('/api/users?q=bo',{as:'alice_test'});
      assert.deepEqual(people.json.users.map(p=>p.username),['bob_test']);
      const send=await request('/api/recommendations',{method:'POST',as:'alice_test',data:{gameId:game,recipient:'bob_test',message:'Mundo aberto para explorar! <script>alert(1)</script>'}});
      assert.equal(send.status,201); recommendation=send.json.id;
      const incoming=(await request('/api/recommendations',{as:'bob_test'})).json.recommendations;
      assert.equal(incoming.length,1); assert.equal(incoming[0].sender,'alice_test'); assert.equal(incoming[0].gameId,game);
      assert.equal((await request('/api/recommendations?box=sent',{as:'alice_test'})).json.recommendations.length,1);
      assert.deepEqual((await request('/api/recommendations',{as:'carol_test'})).json.recommendations,[]);
      assert.equal((await request(`/api/recommendations/${recommendation}`,{method:'DELETE',as:'carol_test'})).status,404);
      assert.equal((await request('/api/recommendations',{method:'POST',as:'alice_test',data:{gameId:game,recipient:'bob_test'}})).status,409);
      assert.equal((await request('/api/recommendations',{method:'POST',as:'alice_test',data:{gameId:game,recipient:'alice_test'}})).status,400);
      assert.equal((await request('/api/recommendations',{method:'POST',as:'alice_test',data:{gameId:game,recipient:'unknown_user'}})).status,404);
      assert.equal((await request('/api/recommendations',{method:'POST',as:'alice_test',data:{gameId:'fake',recipient:'bob_test'}})).status,400);
    });
    await t.test('bloqueia solicitações externas e exposição de dados do servidor', async () => {
      assert.equal((await request(`/api/favorites/${game}`,{method:'DELETE',as:'alice_test',headers:{Origin:'https://example.com'}})).status,403);
      assert.equal((await request('/api/logout',{method:'POST',as:'alice_test',headers:{'X-Checkpoint-Request':''}})).status,403);
      const hostStatus = await new Promise((resolve,reject) => {
        http.get(base+'/api/me', {headers:{Host:'example.com'}}, response => {
          response.resume(); resolve(response.statusCode);
        }).on('error',reject);
      });
      assert.equal(hostStatus,403);
      for (const url of ['/storage/checkpoint.sqlite','/server/app.mjs','/package.json','/.git/config','/tests/backend.test.mjs','/scripts/serve.mjs','/%2e%2e%2fpackage.json']) assert.equal((await request(url)).status,404,url);
      assert.equal((await request('/')).status,200);
      assert.equal((await request('/social.js')).status,200);
      assert.equal((await request('/data/awards.js')).status,200);
    });
    await t.test('contas, sessões, favoritos e recomendações persistem ao reiniciar', async () => {
      await app.close(); app=null; await start();
      assert.equal((await request('/api/me',{as:'alice_test'})).json.user.username,'alice_test');
      assert.deepEqual((await request('/api/favorites',{as:'alice_test'})).json.favorites,[game]);
      assert.equal((await request('/api/recommendations',{as:'bob_test'})).json.recommendations.length,1);
      assert.equal((await request(`/api/recommendations/${recommendation}`,{method:'DELETE',as:'bob_test'})).status,200);
      assert.deepEqual((await request('/api/recommendations?box=sent',{as:'alice_test'})).json.recommendations,[]);
      await request(`/api/favorites/${game}`,{method:'DELETE',as:'alice_test'});
      assert.deepEqual((await request('/api/favorites',{as:'alice_test'})).json.favorites,[]);
    });
    await t.test('logout invalida a sessão e sessões expiradas não autenticam', async () => {
      const logout=await request('/api/logout',{method:'POST',as:'alice_test'});
      assert.equal(logout.status,200); assert.match(logout.cookie,/Max-Age=0/);
      assert.equal((await request('/api/favorites',{as:'alice_test'})).status,401);
      app.db.prepare('UPDATE sessions SET expires_at=0').run();
      assert.equal((await request('/api/me',{as:'bob_test'})).json.user,null);
      assert.equal((await request('/api/favorites',{as:'bob_test'})).status,401);
    });
    await t.test('limita tentativas repetidas de autenticação', async () => {
      let last;
      for (let i=0;i<21;i++) last=await request('/api/login',{method:'POST',data:{username:'invalid',password:'x'}});
      assert.equal(last.status,429);
    });
  } finally {
    if (app) await app.close();
    for (const suffix of ['', '-wal', '-shm']) await unlink(dbPath+suffix).catch(error=>{if(error.code!=='ENOENT')throw error;});
    await rmdir(temporary);
  }
});
