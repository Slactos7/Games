import {createApp} from '../server/app.mjs';

const app = await createApp({secureCookies:process.env.COOKIE_SECURE === 'true'});
app.server.listen(Number(process.env.PORT) || 4173, '127.0.0.1', () => {
  console.log(`Local: http://127.0.0.1:${app.server.address().port}`);
  console.log('SQLite local: storage/checkpoint.sqlite');
});
app.server.on('error', error => {console.error(error.message); process.exitCode=1; app.db.close();});
for (const signal of ['SIGINT','SIGTERM']) process.once(signal, async () => {await app.close(); process.exit(0);});
