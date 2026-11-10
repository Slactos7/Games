import {games} from './data/games.js';
import {questions,recommend} from './recommender.js';
import {scoreBand} from './score.js';
import {gameOfYear,pendingAward} from './data/awards.js';
import {socialActions,initSocial,renderPersonal,renderAccount} from './social.js';

const $=id=>document.getElementById(id);
const latestYear=Math.max(...games.map(game=>game.year));
const state={year:latestYear,search:'',genre:'all',sort:'score',status:'all'};
const quiz={step:0,answers:{},finished:false};
const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const modeLabel=mode=>({coop:'Cooperativo obrigatório',both:'Solo / cooperativo',online:'Multijogador online',solo:'Um jogador'}[mode]);
const awardByGameId=new Map(gameOfYear.map(award=>[award.game.id,award]));

function card(game){
  const upcoming=game.status==='upcoming';
  const rated=Number.isFinite(game.score);
  const scoreLabel=rated?`Metascore: ${game.score}/100 · ${game.scorePlatform}`:upcoming?'Ainda não lançado · sem Metascore':'Metascore ainda não disponível';
  const sourceLabel=rated?`Metascore · ${game.scorePlatform} ↗`:'Ver detalhes ↗';
  return `<article class="game-card${upcoming?' upcoming-card':''}"><a class="cover-link" href="${game.source}" target="_blank" rel="noopener noreferrer" aria-label="Ver ${escape(game.title)}. ${escape(scoreLabel)}"><span class="cover-fallback" aria-hidden="true">${escape(game.title)}</span><img src="${game.cover}" data-fallbacks="${escape(JSON.stringify(game.coverFallbacks||[]))}" alt="${upcoming?'Arte promocional':'Capa'} de ${escape(game.title)}" loading="lazy" width="600" height="900"><span class="card-type">${game.genre}</span><span class="score ${scoreBand(game.score)}" title="${escape(scoreLabel)}">${rated?game.score:'—'}</span></a><div class="card-title"><h4><a href="${game.source}" target="_blank" rel="noopener noreferrer">${escape(game.title)}</a></h4><span aria-hidden="true">↗</span></div>${awardByGameId.has(game.id)?`<span class="goty-card-badge">★ Jogo do Ano ${awardByGameId.get(game.id).year}</span>`:''}${game.year===2026?`<a class="release-label${upcoming?' release-upcoming':''}" href="${game.releaseSource||game.source}" target="_blank" rel="noopener noreferrer">${escape(game.releaseLabel)} ↗</a>`:''}<p>${escape(game.description)}</p><div class="card-bottom"><span>${game.genre} · ${modeLabel(game.mode)}</span><a href="${game.source}" target="_blank" rel="noopener noreferrer">${sourceLabel}</a></div><div class="platforms">${game.platforms.join(' · ')}</div>${socialActions(game)}</article>`;
}

function handleImages(root){root.querySelectorAll('img').forEach(img=>{
  const alternatives=JSON.parse(img.dataset.fallbacks||'[]');
  let next=0;
  const fallback=()=>{if(next<alternatives.length){img.src=alternatives[next++];}else img.classList.add('failed');};
  img.addEventListener('error',fallback);
  img.addEventListener('load',()=>img.classList.remove('failed'));
  if(img.complete&&!img.naturalWidth)fallback();
});}

function renderCatalog(){
  document.querySelectorAll('.year-btn').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.year===String(state.year))));
  const filtered=games.filter(game=>(state.year==='all'||game.year===state.year)&&(state.genre==='all'||game.genre===state.genre)&&(state.status==='all'||game.status===state.status)&&normalize(game.title).includes(normalize(state.search)));
  const years=[...new Set(filtered.map(game=>game.year))].sort((a,b)=>b-a);
  const order=(a,b)=>state.sort==='title'?a.title.localeCompare(b.title,'pt-BR'):(b.score??-1)-(a.score??-1)||a.title.localeCompare(b.title,'pt-BR');
  $('games').innerHTML=years.map(year=>{
    const group=filtered.filter(game=>game.year===year).sort(order);
    const released=group.filter(game=>game.status!=='upcoming');
    const upcoming=group.filter(game=>game.status==='upcoming').sort((a,b)=>(a.releaseDate||'9999').localeCompare(b.releaseDate||'9999')||a.title.localeCompare(b.title,'pt-BR'));
    const content=year===2026?`${released.length?`<p class="release-heading">Já lançados <span>${released.length} jogos</span></p><div class="grid">${released.map(card).join('')}</div>`:''}${upcoming.length?`<p class="release-heading future-heading">Próximos lançamentos <span>${upcoming.length} jogos · datas sujeitas a alterações</span></p><div class="grid">${upcoming.map(card).join('')}</div>`:''}`:`<div class="grid">${group.map(card).join('')}</div>`;
    return `<section class="year-section" aria-labelledby="year-${year}"><div class="year-heading"><h3 id="year-${year}">${year}</h3><span>${group.length} ${group.length===1?'jogo selecionado':'jogos selecionados'}</span></div>${content}</section>`;
  }).join('');
  $('result-count').textContent=`${filtered.length} ${filtered.length===1?'jogo encontrado':'jogos encontrados'}${state.year==='all'?' · todos os anos':` · ${state.year}`}`;
  $('empty').hidden=filtered.length!==0;
  $('clear-filters').hidden=state.year===latestYear&&!state.search&&state.genre==='all'&&state.sort==='score'&&state.status==='all';
  handleImages($('games'));
}

function resetFilters(){Object.assign(state,{year:'all',search:'',genre:'all',sort:'score',status:'all'});$('search').value='';$('genre').value='all';$('sort').value='score';$('release-status').value='all';renderCatalog();}

function renderQuiz(){
  const panel=$('quiz-panel');
  if(quiz.finished){
    const results=recommend(games,quiz.answers);
    const best=results[0];
    panel.innerHTML=best?`<div class="quiz-result"><span class="match-tag">✧ SEU PRÓXIMO CHECKPOINT</span><h2 tabindex="-1">${best.points>=8?'Isso tem a sua cara.':'Uma descoberta para experimentar.'}</h2><p class="quiz-help">Uma sugestão com base nas suas escolhas, entre os jogos do nosso catálogo.</p>${card(best.game)}<div class="reason">${best.reasons.length?best.reasons.map(escape).join('<br>'):'Disponível na plataforma e no modo escolhidos. Vale explorar uma experiência diferente.'}</div>${results.length>1?`<div class="alternatives">Outros caminhos que você pode gostar${results.slice(1).map(({game})=>`<a class="alternative" href="${game.source}" target="_blank" rel="noopener noreferrer">${escape(game.title)} <span class="mini-score ${scoreBand(game.score)}">${game.score??'—'} ↗</span></a>`).join('')}</div>`:''}<div class="quiz-actions"><button class="text-button" id="quiz-edit">← Ajustar respostas</button><button class="button primary" id="quiz-reset">Refazer quiz ↺</button></div></div>`:`<h2 tabindex="-1">Ainda não temos essa combinação.</h2><p class="quiz-help">Nosso catálogo é uma seleção limitada. Ajuste a plataforma ou o modo para encontrar outras opções.</p><button class="button primary" id="quiz-reset">Refazer quiz</button>`;
    $('quiz-reset').onclick=()=>{quiz.step=0;quiz.answers={};quiz.finished=false;renderQuiz();focusQuestion();};
    if($('quiz-edit'))$('quiz-edit').onclick=()=>{quiz.step=0;quiz.finished=false;renderQuiz();focusQuestion();};
    handleImages(panel);return;
  }
  const question=questions[quiz.step];
  panel.innerHTML=`<div class="quiz-top"><span>SEU PERFIL DE JOGADOR</span><span>${String(quiz.step+1).padStart(2,'0')} / 06</span></div><progress value="${quiz.step}" max="6" aria-label="${quiz.step} de 6 perguntas respondidas"></progress><h2 id="question-title" tabindex="-1">${question.title}</h2><p class="quiz-help" id="question-help">${question.help}</p><fieldset class="quiz-options" aria-labelledby="question-title" aria-describedby="question-help"><legend class="sr-only">${question.title}</legend>${question.options.map(([value,label,help])=>`<label class="quiz-option"><input type="radio" name="answer" value="${value}" ${quiz.answers[question.key]===value?'checked':''}><span><strong>${label}</strong><small>${help}</small></span></label>`).join('')}</fieldset><div class="quiz-actions"><button class="text-button" id="quiz-back" ${quiz.step===0?'disabled':''}>← Anterior</button><button class="button primary" id="quiz-next" ${quiz.answers[question.key]?'':'disabled'}>${quiz.step===questions.length-1?'Ver meu jogo':'Continuar'} <span aria-hidden="true">→</span></button></div>`;
  panel.querySelectorAll('input').forEach(input=>input.onchange=()=>{quiz.answers[question.key]=input.value;$('quiz-next').disabled=false;});
  $('quiz-back').onclick=()=>{if(quiz.step>0){quiz.step--;renderQuiz();focusQuestion();}};
  $('quiz-next').onclick=()=>{if(!quiz.answers[question.key])return;if(quiz.step<questions.length-1)quiz.step++;else quiz.finished=true;renderQuiz();focusQuestion();};
}
function focusQuestion(){$('quiz-panel').querySelector('h2')?.focus();}

function renderAwards(){
  if($('goty-content').childElementCount)return;
  const latest=gameOfYear[0],game=latest.game;
  $('goty-years').innerHTML=[pendingAward,...gameOfYear].map(award=>`<a href="#goty-${award.year}" aria-label="${award.year}${award.status==='pending'?', aguardando resultado':''}">${award.year}</a>`).join('');
  const archive=gameOfYear.slice(1).map(award=>{
    const awardDetails=`${award.game.note?`<p class="goty-note">${escape(award.game.note)}</p>`:''}<a class="award-source" href="${award.awardSource}" target="_blank" rel="noopener noreferrer">Consultar prêmio de ${award.year} ↗</a>`;
    return `<section class="goty-entry" id="goty-${award.year}" aria-labelledby="goty-heading-${award.year}"><div class="goty-entry-header"><h3 id="goty-heading-${award.year}">${award.year}</h3><span><img src="./assets/trophy.svg" alt="" aria-hidden="true">Game of the Year</span></div>${card(award.game).replace('</article>',awardDetails+'</article>')}</section>`;
  }).join('');
  $('goty-content').innerHTML=`<section class="goty-pending" id="goty-${pendingAward.year}" aria-labelledby="goty-pending-title"><img src="./assets/trophy.svg" alt="" aria-hidden="true"><div><h2 id="goty-pending-title">2026 · Aguardando resultado</h2><p>A cerimônia está anunciada para <a href="${pendingAward.source}" target="_blank" rel="noopener noreferrer">10 de dezembro de 2026 ↗</a>. O vencedor será incluído após o anúncio.</p></div><a class="pending-link" href="#catalogo" id="goty-explore-current">Explorar jogos de 2026 →</a></section><section class="goty-feature" id="goty-${latest.year}" aria-labelledby="goty-feature-title"><div class="goty-feature-art"><span class="cover-fallback" aria-hidden="true">${escape(game.title)}</span><img src="${game.cover}" data-fallbacks="${escape(JSON.stringify(game.coverFallbacks||[]))}" alt="Capa de ${escape(game.title)}"></div><div class="goty-feature-copy"><span class="goty-eyebrow"><img src="./assets/trophy.svg" alt="" aria-hidden="true">JOGO DO ANO ${latest.year}</span><h2 id="goty-feature-title">${escape(game.title)}</h2><p>${escape(game.description)}</p><div class="goty-feature-bottom"><a class="feature-score ${scoreBand(game.score)}" href="${game.source}" target="_blank" rel="noopener noreferrer"><b>${game.score}</b><span>Metascore<br>${game.scorePlatform} ↗</span></a><span>${game.genre} · ${game.platforms.join(' / ')}</span></div><a class="goty-source" href="${latest.awardSource}" target="_blank" rel="noopener noreferrer">Vencedor do The Game Awards ${latest.year} ↗</a>${socialActions(game)}</div></section><div class="goty-archive-heading"><h2>Conquistas que marcaram época<span>.</span></h2><p>De volta aos grandes vencedores.</p></div><div class="goty-grid">${archive}</div><p class="goty-footnote">Esta seleção reúne os vencedores da categoria Game of the Year do The Game Awards nos anos disponíveis no catálogo. As notas são Metascores da crítica nas plataformas indicadas. As fontes de cada prêmio estão nos cartões. Situação de 2026 conferida em 10/11/2026.</p>`;
  $('goty-explore-current').onclick=()=>{resetFilters();state.year=2026;renderCatalog();};
  handleImages($('goty-content'));
}

function route(){
  const isQuiz=location.hash==='#descobrir';
  const isAwards=location.hash==='#jogos-do-ano'||/^#goty-\d{4}$/.test(location.hash);
  const isPersonal=location.hash==='#minha-lista';
  const isAccount=location.hash==='#entrar';
  $('catalog-view').hidden=isQuiz||isAwards||isPersonal||isAccount;$('quiz-view').hidden=!isQuiz;$('goty-view').hidden=!isAwards;$('personal-view').hidden=!isPersonal;$('account-view').hidden=!isAccount;
  for(const [id,active] of [['nav-catalog',!isQuiz&&!isAwards&&!isPersonal&&!isAccount],['nav-quiz',isQuiz],['nav-awards',isAwards],['nav-personal',isPersonal],['account-link',isAccount]]){if(active)$(id).setAttribute('aria-current','page');else $(id).removeAttribute('aria-current');}
  document.title=isAccount?'Entrar ou criar conta — Checkpoint':isPersonal?'Minha lista — Checkpoint':isQuiz?'Encontre seu jogo — Checkpoint':isAwards?'Jogos do Ano — Checkpoint':'Checkpoint — grandes jogos, novas descobertas';
  if(isAccount){renderAccount();window.scrollTo({top:0,behavior:'instant'});}
  if(isPersonal){renderPersonal();window.scrollTo({top:0,behavior:'instant'});}
  if(isQuiz){renderQuiz();window.scrollTo({top:0,behavior:'instant'});}
  if(isAwards){renderAwards();if(location.hash.startsWith('#goty-'))document.getElementById(location.hash.slice(1))?.scrollIntoView({block:'start',behavior:'instant'});else window.scrollTo({top:0,behavior:'instant'});}
}

$('years').innerHTML=[['all','Todos'],...[...new Set(games.map(game=>game.year))].sort((a,b)=>b-a).map(year=>[year,year])].map(([value,label])=>`<button class="year-btn" data-year="${value}" aria-pressed="false">${label}</button>`).join('');
$('years').addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;state.year=button.dataset.year==='all'?'all':Number(button.dataset.year);renderCatalog();});
[...new Set(games.map(game=>game.genre))].sort((a,b)=>a.localeCompare(b,'pt-BR')).forEach(genre=>$('genre').add(new Option(genre,genre)));
$('search').oninput=event=>{state.search=event.target.value;renderCatalog();};
$('genre').onchange=event=>{state.genre=event.target.value;renderCatalog();};
$('sort').onchange=event=>{state.sort=event.target.value;renderCatalog();};
$('release-status').onchange=event=>{state.status=event.target.value;renderCatalog();};
$('clear-filters').onclick=resetFilters;$('empty-reset').onclick=resetFilters;
window.addEventListener('hashchange',route);
renderCatalog();route();handleImages(document.querySelector('.hero-art'));
initSocial({games:[...games,...gameOfYear.map(award=>award.game)],card,handleImages});
