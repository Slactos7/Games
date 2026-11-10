import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {runtimeConfig} from '../server/config.mjs';
import {createApp} from '../server/app.mjs';

test('configuração local continua isolada e não exige domínio ou volume', () => {
  const config=runtimeConfig({});
  assert.equal(config.host,'127.0.0.1');
  assert.equal(config.secureCookies,false);
  assert.equal(config.port,4173);
  assert.ok(config.dbPath.endsWith('checkpoint.sqlite'));
});
test('Railway usa domínio, porta e volume injetados e cookies Secure', () => {
  const volume=path.join(tmpdir(),'checkpoint-volume');
  const config=runtimeConfig({RAILWAY_ENVIRONMENT_ID:'test',RAILWAY_PUBLIC_DOMAIN:'checkpoint.up.railway.app',RAILWAY_VOLUME_MOUNT_PATH:volume,PORT:'8080'});
  assert.equal(config.host,'0.0.0.0');
  assert.equal(config.port,8080);
  assert.equal(config.dbPath,path.join(volume,'checkpoint.sqlite'));
  assert.equal(config.publicOrigin,'https://checkpoint.up.railway.app');
  assert.equal(config.secureCookies,true);
});
test('produção rejeita domínio inseguro e banco fora do volume', () => {
  const env={NODE_ENV:'production',APP_ORIGIN:'https://games.example',DB_PATH:path.join(tmpdir(),'checkpoint.sqlite')};
  assert.throws(()=>runtimeConfig({...env,APP_ORIGIN:'http://games.example'}),/HTTPS/);
  assert.throws(()=>runtimeConfig({...env,APP_ORIGIN:'https://games.example/path'}),/HTTPS/);
  assert.throws(()=>runtimeConfig({...env,APP_ORIGIN:''}),/domínio/);
  assert.throws(()=>runtimeConfig({...env,RAILWAY_ENVIRONMENT_ID:'test'}),/volume persistente/);
  assert.throws(()=>runtimeConfig({...env,DB_PATH:'relative.sqlite'}),/absoluto/);
  assert.throws(()=>runtimeConfig({...env,RAILWAY_VOLUME_MOUNT_PATH:path.join(tmpdir(),'volume')}),/dentro do volume/);
  assert.throws(()=>runtimeConfig({...env,PORT:'invalid'}),/porta/);
  assert.equal(runtimeConfig({...env,RAILWAY_PUBLIC_DOMAIN:'original.up.railway.app'}).publicOrigin,env.APP_ORIGIN);
});
test('proxy HTTPS: domínio permitido, origem exata, cookies seguros e healthcheck Railway', async () => {
  const app=await createApp({dbPath:':memory:',publicOrigin:'https://checkpoint.up.railway.app'});
  await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
  const request=(route,{method='GET',host='checkpoint.up.railway.app',origin,data,cookie,headers={}}={})=>new Promise((resolve,reject)=>{
    const req=http.request({hostname:'127.0.0.1',port:app.server.address().port,path:route,method,headers:{Host:host,'Content-Type':'application/json','X-Checkpoint-Request':'1',...(origin?{Origin:origin}:{}),...(cookie?{Cookie:cookie}:{}),...headers}},res=>{
      let body='';res.setEncoding('utf8');res.on('data',chunk=>body+=chunk);res.on('end',()=>{let json;try{json=JSON.parse(body);}catch{json=body;}resolve({status:res.statusCode,headers:res.headers,json});});
    });
    req.on('error',reject);req.end(data?JSON.stringify(data):undefined);
  });
  try {
    assert.equal((await request('/healthz',{host:'healthcheck.railway.app'})).status,200);
    assert.equal((await request('/api/me',{host:'healthcheck.railway.app'})).status,403);
    assert.equal((await request('/api/me',{host:'evil.example',headers:{'X-Forwarded-Host':'checkpoint.up.railway.app'}})).status,403);
    assert.equal((await request('/')).status,200);
    const data={username:'online_test',password:'SenhaOnline123!'};
    assert.equal((await request('/api/register',{method:'POST',origin:'https://evil.example',data})).status,403);
    assert.equal((await request('/api/register',{method:'POST',origin:'http://checkpoint.up.railway.app',data})).status,403);
    const registered=await request('/api/register',{method:'POST',origin:'https://checkpoint.up.railway.app',data});
    assert.equal(registered.status,201);
    const cookie=registered.headers['set-cookie'][0];
    assert.match(cookie,/; Secure/);assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Strict/);
    assert.equal((await request('/api/me',{cookie:cookie.split(';')[0]})).json.user.username,'online_test');
    const saved=await request('/api/favorites/elden-ring',{method:'PUT',origin:'https://checkpoint.up.railway.app',cookie:cookie.split(';')[0]});
    assert.equal(saved.status,200);
    assert.equal((await request('/storage/checkpoint.sqlite')).status,404);
  } finally {await app.close();}
});
