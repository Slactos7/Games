import path from 'node:path';
import {fileURLToPath} from 'node:url';

const localStorage = fileURLToPath(new URL('../storage',import.meta.url));
export function runtimeConfig(env = process.env) {
  const railway = Boolean(env.RAILWAY_ENVIRONMENT_ID);
  const production = railway || env.NODE_ENV === 'production';
  const volume = env.RAILWAY_VOLUME_MOUNT_PATH;
  const originValue = env.APP_ORIGIN || (env.RAILWAY_PUBLIC_DOMAIN ? `https://${env.RAILWAY_PUBLIC_DOMAIN}` : '');
  let publicOrigin;
  if (originValue) {
    const url = new URL(originValue);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('APP_ORIGIN deve ser a origem HTTPS do site, sem caminho (ex.: https://seu-site.up.railway.app).');
    publicOrigin = url.origin;
  }
  if (production && !publicOrigin) throw new Error('Gere um domínio público no Railway e faça Redeploy, ou configure APP_ORIGIN com o endereço HTTPS do site.');
  if (railway && !volume) throw new Error('Anexe um volume persistente ao serviço Railway com Mount Path /data antes de iniciar.');
  if (production && !volume && !env.DB_PATH) throw new Error('Configure DB_PATH para um disco persistente em produção.');
  if (env.DB_PATH && !path.isAbsolute(env.DB_PATH)) throw new Error('DB_PATH deve ser um caminho absoluto.');
  const dbPath = env.DB_PATH || path.join(volume || localStorage,'checkpoint.sqlite');
  if (volume) {
    const relative = path.relative(path.resolve(volume),path.resolve(dbPath));
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('O arquivo DB_PATH deve ficar dentro do volume persistente.');
  }
  const port = Number(env.PORT || 4173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT deve ser uma porta válida.');
  return {dbPath, publicOrigin, secureCookies:production || Boolean(publicOrigin) || env.COOKIE_SECURE === 'true', host:production ? '0.0.0.0' : '127.0.0.1', port};
}
