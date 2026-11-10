import test from 'node:test';
import assert from 'node:assert/strict';
import {games} from '../data/games.js';
import {recommend,questions} from '../recommender.js';

const base={platform:'PC',mode:'solo',taste:'story',difficulty:'medium',length:'long',world:'fantasy'};
test('Catálogo tem 300 jogos únicos, 25 por ano, com fontes válidas',()=>{
  assert.equal(games.length,300);assert.equal(new Set(games.map(g=>g.id)).size,300);
  const steamIds=games.filter(g=>g.steamId).map(g=>g.steamId);
  assert.equal(new Set(steamIds).size,steamIds.length);
  for(let year=2015;year<=2026;year++)assert.equal(games.filter(g=>g.year===year).length,25,`Ano ${year}`);
  for(const game of games){
    assert.ok(game.description.length>50,game.title);assert.match(game.source,/^https:\/\//);assert.match(game.cover,/^https:\/\//);
    if(game.score!==null){assert.ok(Number.isInteger(game.score)&&game.score>=0&&game.score<=100,game.title);assert.match(game.source,/^https:\/\/www\.metacritic\.com\/game\/.+\/critic-reviews\/\?platform=(pc|playstation-4|playstation-5|xbox-series-x|nintendo-switch|nintendo-switch-2)$/);assert.ok(game.scorePlatform);}
    if(game.steamId)assert.ok(Number.isInteger(game.steamId)&&game.steamId>0);
    assert.ok(['released','upcoming'].includes(game.status));assert.ok(['solo','coop','both','online'].includes(game.mode));assert.ok(['easy','medium','hard'].includes(game.difficulty));assert.ok(['short','medium','long'].includes(game.length));assert.ok(game.tags.length>0);assert.ok(game.platforms.length>0);
  }
});
test('2026 distingue jogos lançados de futuros e não atribui nota aos futuros',()=>{
  const current=games.filter(game=>game.year===2026);
  assert.ok(current.some(game=>game.status==='released'));assert.ok(current.some(game=>game.status==='upcoming'));
  for(const game of current){assert.ok(game.releaseLabel);assert.match(game.releaseSource,/^https:\/\//);if(game.status==='upcoming'){assert.equal(game.score,null);if(game.releaseDate)assert.ok(game.releaseDate>'2026-11-10',game.title);}else if(game.releaseDate)assert.ok(game.releaseDate<='2026-11-10',game.title);}
});
test('Plataforma e modo são respeitados em todas as combinações do questionário',()=>{
  let checked=0;
  function visit(index,answers){if(index<questions.length){for(const [value] of questions[index].options)visit(index+1,{...answers,[questions[index].key]:value});return;}
    const results=recommend(games,answers);assert.ok(results.length<=3);
    for(const {game} of results){assert.notEqual(game.status,'upcoming');if(answers.platform!=='any')assert.ok(game.platforms.includes(answers.platform));if(answers.mode==='solo')assert.ok(['solo','both'].includes(game.mode));if(answers.mode==='coop')assert.ok(['coop','both'].includes(game.mode));}checked++;
  }
  visit(0,{});assert.equal(checked,4050);
});
test('Relaxar na fazenda e enfrentar chefes produzem recomendações diferentes',()=>{
  const cozy=recommend(games,{...base,taste:'cozy',difficulty:'easy',length:'short',world:'history'});
  const action=recommend(games,{...base,taste:'action',difficulty:'hard',length:'long'});
  assert.ok(cozy[0].game.tags.includes('cozy'));assert.notEqual(cozy[0].game.id,action[0].game.id);
});
test('Cooperativo obrigatório nunca aparece para quem quer jogar sozinho',()=>{
  assert.ok(recommend(games,base).every(({game})=>!['split-fiction','it-takes-two'].includes(game.id)));
});
test('Competitivo online obrigatório fica fora das sugestões solo e cooperativas',()=>{
  const siege=games.filter(game=>game.id==='tom-clancys-rainbow-six-siege');
  assert.equal(siege.length,1);assert.deepEqual(recommend(siege,base),[]);
  assert.deepEqual(recommend(siege,{...base,mode:'coop'}),[]);
  assert.equal(recommend(siege,{...base,mode:'any'})[0].game.id,siege[0].id);
});
test('Sem combinação compatível, retorna vazio em vez de ignorar a plataforma',()=>{
  assert.deepEqual(recommend(games,{...base,platform:'Plataforma inexistente'}),[]);
});
test('Questionário não sugere jogos que ainda não podem ser jogados',()=>{
  const unreleased=games.filter(game=>game.status==='upcoming');
  assert.ok(unreleased.length>0);assert.deepEqual(recommend(unreleased,{...base,platform:'any',mode:'any'}),[]);
});
test('Recomendação prioriza gosto em vez de apenas repetir a maior nota',()=>{
  const result=recommend(games,{...base,taste:'strategy',length:'short',world:'any'});
  assert.ok(result[0].game.tags.includes('strategy'));assert.ok(result[0].reasons.length>=2);assert.notEqual(result[0].game.id,'red-dead-redemption-2');
});
