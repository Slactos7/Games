import http from 'node:http';
import {readFile, readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {randomBytes, scrypt, timingSafeEqual, createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {openDatabase} from './database.mjs';
import {games} from '../data/games.js';
import {gameOfYear} from '../data/awards.js';

const derive = promisify(scrypt);
const root = fileURLToPath(new URL('../', import.meta.url));
const catalog = new Set([...games, ...gameOfYear.map(a => a.game)].map(g => g.id));
const sessionAge = 7 * 24 * 60 * 60;
const hash = value => createHash('sha256').update(value).digest('hex');
const publicUser = row => ({id:row.id, username:row.username});
const types = {'.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.jpg':'image/jpeg'};
class ApiError extends Error {
  constructor(status, message) {super(message); this.status = status;}
}
const fail = (status, message) => {throw new ApiError(status, message);};

async function body(req) {
  if (req.headers['content-type']?.split(';')[0] !== 'application/json') fail(415, 'Envie os dados em JSON.');
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 8192) fail(413, 'Os dados enviados são muito grandes.');
    chunks.push(chunk);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString());
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch {fail(400, 'Dados inválidos.');}
}
async function passwordHash(password, salt) {
  return Buffer.from(await derive(password, salt, 64, {N:131072, r:8, p:1, maxmem:256 * 1024 * 1024}));
}

export async function createApp({dbPath = path.join(root, 'storage', 'checkpoint.sqlite'), secureCookies = false} = {}) {
  const db = openDatabase(dbPath);
  // Only explicit browser assets are public; the database and server stay private.
  const publicFiles = new Set();
  async function collect(directory = '') {
    for (const entry of await readdir(path.join(root, directory), {withFileTypes:true})) {
      const name = directory ? `${directory}/${entry.name}` : entry.name;
      if (entry.isDirectory() && (['assets','data'].includes(name) || directory)) await collect(name);
      else if (entry.isFile() && (directory || /\.(html|css|js|svg)$/.test(name))) publicFiles.add(name);
    }
  }
  await collect();
  const attempts = new Map();
  let hashing = 0;
  const sessionToken = req => /(?:^|;\s*)checkpoint_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
  function currentUser(req) {
    const token = sessionToken(req);
    return token ? db.prepare('SELECT u.id, u.username FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').get(hash(token), Date.now()) : undefined;
  }
  function requireUser(req) {
    const user = currentUser(req);
    if (!user) fail(401, 'Entre na sua conta para continuar.');
    return user;
  }
  function setSession(res, userId) {
    const token = randomBytes(32).toString('hex');
    db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(Date.now());
    db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(hash(token), userId, Date.now() + sessionAge * 1000);
    res.setHeader('Set-Cookie', `checkpoint_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionAge}${secureCookies ? '; Secure' : ''}`);
  }
  function rateLimit(req) {
    const now = Date.now(), key = req.socket.remoteAddress;
    for (const [ip, window] of attempts) if (window.until < now) attempts.delete(ip);
    const window = attempts.get(key) || {count:0, until:now + 15 * 60000};
    attempts.set(key, window);
    if (++window.count > 20) fail(429, 'Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.');
  }
  async function authenticate(req, res, register) {
    rateLimit(req);
    const data = await body(req);
    const username = typeof data.username === 'string' ? data.username.trim() : '';
    const password = data.password;
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) fail(400, 'Use de 3 a 24 letras, números ou sublinhados no nome de usuário.');
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) fail(400, 'A senha deve ter de 8 a 128 caracteres.');
    if (hashing >= 2) fail(429, 'O login está ocupado. Tente novamente em instantes.');
    hashing++;
    try {
      const existing = db.prepare('SELECT * FROM users WHERE username=?').get(username);
      const salt = register || !existing ? randomBytes(16).toString('hex') : existing.salt;
      const derived = await passwordHash(password, salt);
      if (register) {
        if (existing) fail(409, 'Este nome de usuário já está em uso.');
        let result;
        try {result = db.prepare('INSERT INTO users (username,password_hash,salt,created_at) VALUES (?,?,?,?)').run(username, derived.toString('hex'), salt, Date.now());}
        catch (error) {if (error.code?.startsWith('ERR_SQLITE')) fail(409, 'Este nome de usuário já está em uso.'); throw error;}
        const user = {id:Number(result.lastInsertRowid), username};
        setSession(res, user.id);
        return {status:201, data:{user}};
      }
      if (!existing || !timingSafeEqual(derived, Buffer.from(existing.password_hash, 'hex'))) fail(401, 'Usuário ou senha incorretos.');
      const previous = sessionToken(req);
      if (previous) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(previous));
      setSession(res, existing.id);
      return {data:{user:publicUser(existing)}};
    } finally {hashing--;}
  }
  function validGame(id) {if (!catalog.has(id)) fail(400, 'Selecione um jogo válido do catálogo.');}
  async function api(req, res, url) {
    const route = url.pathname, method = req.method;
    if (!['GET','HEAD'].includes(method)) {
      if (req.headers['x-checkpoint-request'] !== '1') fail(403, 'Solicitação não autorizada. Atualize a página.');
      const origin = req.headers.origin;
      if (origin && origin !== `http://${req.headers.host}` && !(secureCookies && origin === `https://${req.headers.host}`)) fail(403, 'Origem não permitida.');
      if (req.headers['sec-fetch-site'] === 'cross-site') fail(403, 'Origem não permitida.');
    }
    if (route === '/api/register' && method === 'POST') return authenticate(req, res, true);
    if (route === '/api/login' && method === 'POST') return authenticate(req, res, false);
    if (route === '/api/me' && method === 'GET') return {data:{user:currentUser(req) || null}};
    if (route === '/api/logout' && method === 'POST') {
      const token = sessionToken(req);
      if (token) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(token));
      res.setHeader('Set-Cookie', `checkpoint_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secureCookies ? '; Secure' : ''}`);
      return {data:{ok:true}};
    }
    const user = requireUser(req);
    if (route === '/api/favorites' && method === 'GET') return {data:{favorites:db.prepare('SELECT game_id AS gameId FROM favorites WHERE user_id=? ORDER BY created_at DESC, game_id').all(user.id).map(r => r.gameId)}};
    if (route.startsWith('/api/favorites/') && ['PUT','DELETE'].includes(method)) {
      const id = decodeURIComponent(route.slice('/api/favorites/'.length));
      validGame(id);
      if (method === 'PUT') db.prepare('INSERT OR IGNORE INTO favorites VALUES (?,?,?)').run(user.id, id, Date.now());
      else db.prepare('DELETE FROM favorites WHERE user_id=? AND game_id=?').run(user.id, id);
      return {data:{ok:true}};
    }
    if (route === '/api/users' && method === 'GET') {
      const q = (url.searchParams.get('q') || '').trim();
      if (!/^[a-zA-Z0-9_]{2,24}$/.test(q)) return {data:{users:[]}};
      return {data:{users:db.prepare('SELECT id, username FROM users WHERE id<>? AND instr(lower(username), lower(?))=1 ORDER BY username LIMIT 12').all(user.id,q)}};
    }
    if (route === '/api/recommendations' && method === 'GET') {
      const sent = url.searchParams.get('box') === 'sent';
      const rows = db.prepare(`SELECT r.id, r.game_id AS gameId, r.message, r.created_at AS createdAt, s.username AS sender, u.username AS recipient FROM recommendations r JOIN users s ON s.id=r.sender_id JOIN users u ON u.id=r.recipient_id WHERE r.${sent ? 'sender_id' : 'recipient_id'}=? ORDER BY r.created_at DESC, r.id DESC LIMIT 200`).all(user.id);
      return {data:{recommendations:rows}};
    }
    if (route === '/api/recommendations' && method === 'POST') {
      const {gameId, recipient, message = ''} = await body(req);
      validGame(gameId);
      if (typeof recipient !== 'string' || !/^[a-zA-Z0-9_]{3,24}$/.test(recipient)) fail(400, 'Escolha um destinatário.');
      if (typeof message !== 'string' || message.length > 500) fail(400, 'A mensagem pode ter até 500 caracteres.');
      const receiver = db.prepare('SELECT id FROM users WHERE username=?').get(recipient);
      if (!receiver) fail(404, 'Usuário não encontrado.');
      if (receiver.id === user.id) fail(400, 'Escolha outro usuário para recomendar.');
      if (db.prepare('SELECT count(*) AS n FROM recommendations WHERE sender_id=? AND created_at>?').get(user.id,Date.now()-3600000).n >= 30) fail(429, 'Limite de 30 recomendações por hora atingido.');
      if (db.prepare('SELECT id FROM recommendations WHERE sender_id=? AND recipient_id=? AND game_id=?').get(user.id,receiver.id,gameId)) fail(409, 'Você já recomendou este jogo para essa pessoa.');
      const result = db.prepare('INSERT INTO recommendations (sender_id,recipient_id,game_id,message,created_at) VALUES (?,?,?,?,?)').run(user.id,receiver.id,gameId,message.trim(),Date.now());
      return {status:201, data:{id:Number(result.lastInsertRowid)}};
    }
    const recId = /^\/api\/recommendations\/(\d+)$/.exec(route)?.[1];
    if (recId && method === 'DELETE') {
      const row = db.prepare('SELECT sender_id, recipient_id FROM recommendations WHERE id=?').get(Number(recId));
      if (!row || (row.sender_id !== user.id && row.recipient_id !== user.id)) fail(404, 'Recomendação não encontrada.');
      db.prepare('DELETE FROM recommendations WHERE id=?').run(Number(recId));
      return {data:{ok:true}};
    }
    fail(404, 'Recurso não encontrado.');
  }
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options','DENY');
    try {
      const port = server.address()?.port;
      if (![ `127.0.0.1:${port}`, `localhost:${port}` ].includes(req.headers.host)) fail(403, 'Use o endereço local mostrado pelo servidor.');
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/')) {
        res.setHeader('Cache-Control','no-store');
        const result = await api(req,res,url);
        res.writeHead(result.status || 200, {'Content-Type':'application/json; charset=utf-8'});
        res.end(JSON.stringify(result.data));
      } else {
        if (!['GET','HEAD'].includes(req.method)) fail(405,'Método não permitido.');
        const name = decodeURIComponent(url.pathname).replace(/^\//,'') || 'index.html';
        if (!publicFiles.has(name)) fail(404,'Página não encontrada.');
        const content = await readFile(path.join(root,name));
        res.writeHead(200, {'Content-Type':types[path.extname(name)] || 'application/octet-stream','Cache-Control':'no-cache'});
        res.end(req.method === 'HEAD' ? undefined : content);
      }
    } catch (error) {
      const status = error.status || (error instanceof URIError ? 400 : 500);
      if (status === 500) console.error('Falha interna:', error.message);
      res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
      res.end(JSON.stringify({error:status === 500 ? 'Não foi possível concluir. Tente novamente.' : error.message}));
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  return {server, db, async close() {await new Promise(resolve => server.close(resolve)); db.close();}};
}
