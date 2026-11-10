import {games} from './data/games.js';
import {questions,recommend} from './recommender.js';

const $=id=>document.getElementById(id);
const latestYear=Math.max(...games.map(game=>game.year));
const state={year:latestYear,search:'',genre:'all',sort:'score',status:'all'};
const quiz={step:0,answers:{},finished:false};
const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const modeLabel=mode=>({coop:'Cooperativo obrigatório',both:'Solo / cooperativo',online:'Multijogador online',solo:'Um jogador'}[mode]);

function card(game){
  const upcoming=game.status==='upcoming';
  const rated=Number.isFinite(game.score);
  const scoreLabel=rated?`Metascore: ${game.score}/100 · ${game.scorePlatform}`:upcoming?'Ainda não lançado · sem Metascore':'Metascore ainda não disponível';
  const sourceLabel=rated?`Metascore · ${game.scorePlatform} ↗`:'Ver detalhes ↗';
  return `<article class="game-card${upcoming?' upcoming-card':''}"><a class="cover-link" href="${game.source}" target="_blank" rel="noopener noreferrer" aria-label="Ver ${escape(game.title)}. ${escape(scoreLabel)}"><span class="cover-fallback" aria-hidden="true">${escape(game.title)}</span><img src="${game.cover}" data-fallbacks="${escape(JSON.stringify(game.coverFallbacks||[]))}" alt="${upcoming?'Arte promocional':'Capa'} de ${escape(game.title)}" loading="lazy" width="600" height="900"><span class="card-type">${game.genre}</span><span class="score${rated?'':' unrated'}" title="${escape(scoreLabel)}">${rated?game.score:'—'}</span></a><div class="card-title"><h4><a href="${game.source}" target="_blank" rel="noopener noreferrer">${escape(game.title)}</a></h4><span aria-hidden="true">↗</span></div>${game.year===2026?`<a class="release-label${upcoming?' release-upcoming':''}" href="${game.releaseSource||game.source}" target="_blank" rel="noopener noreferrer">${escape(game.releaseLabel)} ↗</a>`:''}<p>${escape(game.description)}</p><div class="card-bottom"><span>${game.genre} · ${modeLabel(game.mode)}</span><a href="${game.source}" target="_blank" rel="noopener noreferrer">${sourceLabel}</a></div><div class="platforms">${game.platforms.join(' · ')}</div></article>`;
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
    panel.innerHTML=best?`<div class="quiz-result"><span class="match-tag">✧ SEU PRÓXIMO CHECKPOINT</span><h2 tabindex="-1">${best.points>=8?'Isso tem a sua cara.':'Uma descoberta para experimentar.'}</h2><p class="quiz-help">Uma sugestão com base nas suas escolhas, entre os jogos do nosso catálogo.</p>${card(best.game)}<div class="reason">${best.reasons.length?best.reasons.map(escape).join('<br>'):'Disponível na plataforma e no modo escolhidos. Vale explorar uma experiência diferente.'}</div>${results.length>1?`<div class="alternatives">Outros caminhos que você pode gostar${results.slice(1).map(({game})=>`<a class="alternative" href="${game.source}" target="_blank" rel="noopener noreferrer">${escape(game.title)} <span>${game.score??'—'} ↗</span></a>`).join('')}</div>`:''}<div class="quiz-actions"><button class="text-button" id="quiz-edit">← Ajustar respostas</button><button class="button primary" id="quiz-reset">Refazer quiz ↺</button></div></div>`:`<h2 tabindex="-1">Ainda não temos essa combinação.</h2><p class="quiz-help">Nosso catálogo é uma seleção limitada. Ajuste a plataforma ou o modo para encontrar outras opções.</p><button class="button primary" id="quiz-reset">Refazer quiz</button>`;
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

function route(){
  const isQuiz=location.hash==='#descobrir';
  $('catalog-view').hidden=isQuiz;$('quiz-view').hidden=!isQuiz;
  $('nav-quiz').toggleAttribute('aria-current',isQuiz);$('nav-catalog').toggleAttribute('aria-current',!isQuiz);
  (isQuiz?$('nav-quiz'):$('nav-catalog')).setAttribute('aria-current','page');
  document.title=isQuiz?'Encontre seu jogo — Checkpoint':'Checkpoint — grandes jogos, novas descobertas';
  if(isQuiz){renderQuiz();window.scrollTo({top:0,behavior:'instant'});}
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
