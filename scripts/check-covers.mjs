import {writeFile} from 'node:fs/promises';
import {games} from '../data/games.js';

const write=process.argv.includes('--write');
const requested=process.argv.find(arg=>arg.startsWith('--ids='))?.slice(6).split(',');
const catalog=requested?games.filter(game=>requested.includes(game.id)):games;
const report=[];
const fixes={};
let cursor=0;
const decode=value=>value.replaceAll('&amp;','&');
async function fetchPublic(url){return fetch(url,{signal:AbortSignal.timeout(18000),headers:{'User-Agent':'Checkpoint-Cover-Check/1.0'}});}
async function isImage(url){
  if(!url)return false;
  try{const response=await fetchPublic(url);if(!response.ok||!response.headers.get('content-type')?.startsWith('image/')){await response.body?.cancel();return false;}const bytes=new Uint8Array(await response.arrayBuffer());return bytes.length>256;}catch{return false;}
}
async function resolve(game){
  if(await isImage(game.cover))return {id:game.id,title:game.title,ok:true,url:game.cover,changed:false};
  const candidates=[];
  if(game.steamId){
    try{const response=await fetchPublic(`https://store.steampowered.com/api/appdetails?appids=${game.steamId}`);if(response.ok){const body=await response.json();const app=body[game.steamId]?.data;if(app?.header_image)candidates.push(app.header_image);}}catch{}
    try{const response=await fetchPublic(`https://store.steampowered.com/app/${game.steamId}/`);if(response.ok){const html=await response.text();const header=html.match(/<img[^>]*class="game_header_image_full"[^>]*src="([^"]+)"/i)?.[1]||html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)?.[1];if(header)candidates.push(decode(header));}}catch{}
    candidates.push(`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steamId}/header.jpg`);
  }
  for(const url of [...new Set(candidates)])if(await isImage(url))return {id:game.id,title:game.title,ok:true,url,changed:true};
  return {id:game.id,title:game.title,ok:false,url:game.cover,changed:false};
}
async function worker(){while(cursor<catalog.length){const game=catalog[cursor++];const result=await resolve(game);report.push(result);if(result.changed)fixes[game.id]=result.url;if(!result.ok)console.log(`SEM CAPA: ${game.title}`);if(report.length%25===0)console.log(`Verificados: ${report.length}/${catalog.length}`);}}
await Promise.all(Array.from({length:6},worker));
if(write){
  const {coverOverrides}=await import('../data/cover-overrides.js');
  await writeFile(new URL('../data/cover-overrides.js',import.meta.url),'// URLs de capas verificadas em '+new Date().toISOString().slice(0,10)+'.\nexport const coverOverrides = '+JSON.stringify({...coverOverrides,...fixes},null,2)+';\n');
  await writeFile(new URL('../cover-audit.json',import.meta.url),JSON.stringify({checkedAt:new Date().toISOString(),total:report.length,verified:report.filter(x=>x.ok).length,fixed:Object.keys(fixes).length,results:report.sort((a,b)=>a.id.localeCompare(b.id))},null,2)+'\n');
}
console.log(JSON.stringify({total:report.length,verified:report.filter(x=>x.ok).length,fixed:Object.keys(fixes).length,missing:report.filter(x=>!x.ok).map(x=>x.id)}));
if(report.some(x=>!x.ok))process.exitCode=1;
