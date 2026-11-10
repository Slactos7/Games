import {createApp} from '../server/app.mjs';
import {runtimeConfig} from '../server/config.mjs';

const config = runtimeConfig();
const app = await createApp(config);
app.server.listen(config.port, config.host, () => {
  console.log(config.publicOrigin ? `Online: ${config.publicOrigin}` : `Local: http://127.0.0.1:${app.server.address().port}`);
  console.log(`SQLite: ${config.dbPath}`);
});
app.server.on('error', error => {console.error(error.message); process.exitCode=1; app.db.close();});
for (const signal of ['SIGINT','SIGTERM']) process.once(signal, async () => {await app.close(); process.exit(0);});
