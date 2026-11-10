import test from 'node:test';
import assert from 'node:assert/strict';
import {games} from '../data/games.js';
import {gameOfYear,pendingAward} from '../data/awards.js';

test('Cada ano do catálogo tem um vencedor ou uma indicação explícita de resultado pendente',()=>{
  const years=[...new Set(games.map(game=>game.year))].sort();
  const awardYears=[...gameOfYear.map(award=>award.year),pendingAward.year].sort();
  assert.deepEqual(awardYears,years);
  assert.equal(gameOfYear.length,11);
  assert.equal(new Set(gameOfYear.map(award=>award.game.id)).size,11);
  for(const award of gameOfYear){assert.equal(award.status,'winner');assert.equal(award.game.year,award.year);assert.ok(award.game.title);assert.match(award.awardSource,/^https:\/\//);assert.match(award.game.cover,/^https:\/\//);assert.ok(award.game.score>=0&&award.game.score<=100);}
});

test('Vencedores correspondem ao prêmio principal de cada edição do The Game Awards',()=>{
  const expected={2015:'the-witcher-3-wild-hunt',2016:'overwatch-2016',2017:'the-legend-of-zelda-breath-of-the-wild',2018:'god-of-war',2019:'sekiro-shadows-die-twice',2020:'the-last-of-us-part-ii',2021:'it-takes-two',2022:'elden-ring',2023:'baldurs-gate-3',2024:'astro-bot',2025:'clair-obscur-expedition-33'};
  for(const award of gameOfYear)assert.equal(award.game.id,expected[award.year]);
  const original=gameOfYear.find(award=>award.year===2016).game;
  assert.equal(original.score,91);assert.match(original.source,/overwatch-2016/);
});

test('2026 não recebe um vencedor antecipado',()=>{
  assert.equal(pendingAward.year,2026);assert.equal(pendingAward.status,'pending');assert.equal(pendingAward.game,null);
  assert.equal(pendingAward.ceremonyDate,'2026-12-10');assert.ok(pendingAward.ceremonyDate>'2026-11-10');
  assert.ok(gameOfYear.every(award=>award.year<2026));
});
