const $ = id => document.getElementById(id);
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let user = null, favorites = new Set(), ready = false, available = true;
let renderCard, loadImages, catalog, authMode = 'login', box = 'favorites', revision = 0;
let recommendationGame, selectedRecipient = '', searchRevision = 0;

async function api(path, {method='GET', data} = {}) {
  let response;
  try {
    response = await fetch(`/api/${path}`, {method, credentials:'same-origin', headers:{'Content-Type':'application/json','X-Checkpoint-Request':'1'}, ...(data ? {body:JSON.stringify(data)} : {})});
  } catch {throw new Error('Não foi possível conectar. Verifique se o servidor local está aberto.');}
  let result;
  try {result = await response.json();} catch {throw new Error('Login e listas precisam do servidor local. Execute npm start.');}
  if (!response.ok) {
    if (response.status === 401 && user) {
      user = null; favorites.clear(); refreshButtons();
      $('account-link').textContent = 'Entrar / criar conta';
    }
    throw new Error(result.error || 'Não foi possível concluir. Tente novamente.');
  }
  return result;
}
function notify(message) {
  $('social-toast').textContent = message;
  $('social-toast').hidden = false;
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => {$('social-toast').hidden = true;}, 6000);
}
export function socialActions(game) {
  const saved = favorites.has(game.id);
  return `<div class="game-actions"><button class="favorite-action" data-favorite="${escape(game.id)}" aria-pressed="${saved}" aria-label="${saved ? 'Remover dos' : 'Adicionar aos'} favoritos: ${escape(game.title)}">${saved ? '♥ Favoritado' : '♡ Favoritar'}</button><button data-recommend="${escape(game.id)}" aria-label="Recomendar ${escape(game.title)}">Recomendar ↗</button></div>`;
}
function refreshButtons() {
  document.querySelectorAll('[data-favorite]').forEach(button => {
    const saved = favorites.has(button.dataset.favorite), game = catalog.get(button.dataset.favorite);
    button.setAttribute('aria-pressed', String(saved));
    button.setAttribute('aria-label', `${saved ? 'Remover dos' : 'Adicionar aos'} favoritos: ${game?.title}`);
    button.textContent = saved ? '♥ Favoritado' : '♡ Favoritar';
  });
}
function sessionChanged() {
  $('account-link').textContent = user ? `@${user.username}` : 'Entrar / criar conta';
  refreshButtons();
  if (location.hash === '#minha-lista') renderPersonal();
}
const empty = (title, message) => `<div class="personal-empty"><span aria-hidden="true">✧</span><h2>${title}</h2><p>${message}</p><a class="button primary" href="#catalogo">Explorar jogos →</a></div>`;

export async function renderPersonal() {
  const panel = $('personal-content'), ticket = ++revision;
  if (!ready) {panel.innerHTML = '<p role="status">Carregando sua conta…</p>'; return;}
  if (!available) {panel.innerHTML = empty('Vamos conectar sua conta.', 'Esta função está em teste local. Inicie o servidor com npm start e abra o endereço local.'); return;}
  if (!user) {
    const register = authMode === 'register';
    panel.innerHTML = `<div class="account-layout"><div class="account-story"><span class="eyebrow">SEU ESPAÇO NO CHECKPOINT</span><h2>Boas histórias<br>merecem ser <em>guardadas.</em></h2><p>Monte sua lista de favoritos e compartilhe descobertas com outros jogadores.</p><ul><li>♥ Uma lista pessoal só sua</li><li>↗ Recomendações de pessoa para pessoa</li><li>✧ Seu catálogo sempre por perto</li></ul><small>Seu nome de usuário será público para receber recomendações. Seus favoritos são privados.</small></div><div class="account-panel"><div class="account-switch" role="group" aria-label="Acessar conta"><button data-auth-mode="login" aria-pressed="${!register}">Entrar</button><button data-auth-mode="register" aria-pressed="${register}">Criar conta</button></div><h2>${register ? 'Comece sua coleção.' : 'Bom ter você de volta.'}</h2><form id="auth-form"><label for="auth-username">Nome de usuário</label><input id="auth-username" name="username" required minlength="3" maxlength="24" pattern="[a-zA-Z0-9_]{3,24}" autocomplete="username" autocapitalize="none" spellcheck="false" aria-describedby="username-help"><small id="username-help">3–24 letras, números ou _ . Sem espaços.</small><label for="auth-password">Senha</label><input id="auth-password" name="password" type="password" required minlength="8" maxlength="128" autocomplete="${register ? 'new-password' : 'current-password'}"><small>De 8 a 128 caracteres.</small>${register ? '<label for="auth-confirm">Confirmar senha</label><input id="auth-confirm" type="password" required minlength="8" maxlength="128" autocomplete="new-password">' : ''}<p id="auth-error" class="form-error" role="alert"></p><button class="button primary" type="submit">${register ? 'Criar minha conta' : 'Entrar na minha conta'} →</button></form><p class="account-local">Teste local · contas salvas neste computador.</p></div></div>`;
    panel.querySelectorAll('[data-auth-mode]').forEach(button => button.onclick = () => {authMode=button.dataset.authMode; renderPersonal();});
    $('auth-form').onsubmit = async event => {
      event.preventDefault();
      const submit = event.currentTarget.querySelector('[type=submit]');
      const password = $('auth-password').value;
      if (register && password !== $('auth-confirm').value) {$('auth-error').textContent='As senhas não conferem.'; return;}
      submit.disabled = true;
      $('auth-error').textContent = '';
      try {
        const result = await api(register ? 'register' : 'login', {method:'POST', data:{username:$('auth-username').value.trim(), password}});
        user = result.user;
        favorites = new Set((await api('favorites')).favorites);
        box = 'favorites'; sessionChanged();
        notify(register ? 'Conta criada. Sua coleção começa agora!' : 'Você entrou na sua conta.');
      } catch (error) {if ($('auth-error')) $('auth-error').textContent=error.message;}
      finally {submit.disabled=false;}
    };
    return;
  }
  panel.innerHTML = `<div class="personal-heading"><div><span class="eyebrow">SEU PRÓXIMO FAVORITO TEM UM LUGAR</span><h2>Olá, @${escape(user.username)}<span>.</span></h2><p>Guarde suas descobertas. Compartilhe as melhores.</p></div><button class="text-button" id="logout-button">Sair da conta ↗</button></div><div class="personal-tabs" role="group" aria-label="Sua coleção"><button data-personal-box="favorites" aria-pressed="${box==='favorites'}">♥ Favoritos <span>${favorites.size}</span></button><button data-personal-box="received" aria-pressed="${box==='received'}">Recebidas</button><button data-personal-box="sent" aria-pressed="${box==='sent'}">Enviadas</button></div><div id="personal-games" aria-live="polite"><p>Carregando…</p></div>`;
  $('logout-button').onclick = async event => {
    event.currentTarget.disabled = true;
    try {await api('logout', {method:'POST'}); user=null; favorites.clear(); sessionChanged(); notify('Você saiu da conta.');}
    catch (error) {notify(error.message); if ($('logout-button')) $('logout-button').disabled=false;}
  };
  panel.querySelectorAll('[data-personal-box]').forEach(button => button.onclick = () => {box=button.dataset.personalBox; renderPersonal();});
  try {
    let markup;
    if (box === 'favorites') {
      const result = await api('favorites');
      if (ticket !== revision) return;
      favorites = new Set(result.favorites); refreshButtons();
      markup = favorites.size ? `<div class="grid personal-grid">${[...favorites].map(id => catalog.get(id)).filter(Boolean).map(renderCard).join('')}</div>` : empty('Sua lista começa com um coração.', 'Toque em Favoritar nos jogos que você quer guardar. Eles aparecem aqui.');
      panel.querySelector('[data-personal-box="favorites"] span').textContent=favorites.size;
    } else {
      const sent = box === 'sent';
      const result = await api(`recommendations?box=${sent ? 'sent' : 'received'}`);
      if (ticket !== revision) return;
      markup = result.recommendations.length ? `<p class="personal-hint">${sent ? 'Suas dicas para outros jogadores. Remover também retira a dica da caixa do destinatário.' : 'Descobertas enviadas para você. Favorite as que quiser guardar; remover também retira a dica do histórico de quem enviou.'}</p><div class="grid personal-grid">${result.recommendations.map(rec => {
        const game = catalog.get(rec.gameId);
        if (!game) return '';
        return `<div class="recommendation-entry"><div class="recommendation-meta"><strong>${sent ? 'Para' : 'De'} @${escape(sent ? rec.recipient : rec.sender)}</strong><time datetime="${new Date(rec.createdAt).toISOString()}">${new Date(rec.createdAt).toLocaleDateString('pt-BR')}</time></div>${renderCard(game)}${rec.message ? `<blockquote>${escape(rec.message)}</blockquote>` : ''}<button class="text-button remove-recommendation" data-remove-recommendation="${rec.id}">Remover recomendação</button></div>`;
      }).join('')}</div>` : empty(sent ? 'Compartilhe seu próximo achado.' : 'Uma boa dica pode chegar a qualquer hora.', sent ? 'Use Recomendar em qualquer jogo e escolha outro usuário.' : `Peça para seus amigos procurarem por @${escape(user.username)} ao recomendar um jogo.`);
    }
    if (ticket !== revision) return;
    $('personal-games').innerHTML = markup;
    loadImages($('personal-games'));
  } catch (error) {if (ticket === revision) {if (!user) renderPersonal(); else $('personal-games').textContent=error.message;}}
}

function openRecommendation(game) {
  recommendationGame = game;
  selectedRecipient = ''; searchRevision++;
  $('recommend-title').textContent = `Recomendar ${game.title}`;
  $('recommend-form').reset();
  $('recipient-results').replaceChildren();
  $('recipient-selected').textContent = 'Digite pelo menos 2 caracteres para buscar.';
  $('recommend-error').textContent = '';
  $('recommend-send').disabled = true;
  $('recommend-dialog').showModal();
}
export async function initSocial({games, card, handleImages}) {
  catalog = new Map(games.map(game => [game.id,game])); renderCard=card; loadImages=handleImages;
  document.addEventListener('click', async event => {
    const favorite = event.target.closest('[data-favorite]'), recommend = event.target.closest('[data-recommend]'), remove = event.target.closest('[data-remove-recommendation]');
    if (!favorite && !recommend && !remove) return;
    if (!ready) return notify('Aguarde a conexão com sua conta.');
    if (!user) {location.hash='#minha-lista'; notify('Entre ou crie sua conta para continuar.'); return;}
    if (recommend) return openRecommendation(catalog.get(recommend.dataset.recommend));
    const button = favorite || remove;
    button.disabled = true;
    try {
      if (favorite) {
        const id = favorite.dataset.favorite, saved = favorites.has(id);
        await api(`favorites/${encodeURIComponent(id)}`, {method:saved ? 'DELETE' : 'PUT'});
        if (saved) favorites.delete(id); else favorites.add(id);
        refreshButtons(); notify(saved ? 'Jogo removido da sua lista.' : 'Jogo salvo na sua lista!');
        if (location.hash === '#minha-lista') await renderPersonal();
      } else {
        await api(`recommendations/${remove.dataset.removeRecommendation}`, {method:'DELETE'});
        await renderPersonal(); notify('Recomendação removida.');
      }
    } catch (error) {notify(error.message); if (!user && location.hash === '#minha-lista') renderPersonal();}
    finally {button.disabled=false;}
  });
  $('recommend-close').onclick = () => $('recommend-dialog').close();
  $('recommend-dialog').addEventListener('close', () => {searchRevision++;});
  $('recipient-search').oninput = async event => {
    selectedRecipient=''; $('recommend-send').disabled=true;
    const q=event.target.value.trim(), ticket=++searchRevision;
    $('recipient-selected').textContent='Selecione uma pessoa nos resultados.';
    if (q.length < 2) {$('recipient-results').replaceChildren(); $('recipient-selected').textContent='Digite pelo menos 2 caracteres para buscar.'; return;}
    try {
      const result=await api(`users?q=${encodeURIComponent(q)}`);
      if (ticket!==searchRevision) return;
      $('recipient-results').innerHTML=result.users.map(person => `<button type="button" data-recipient="${escape(person.username)}">@${escape(person.username)} <span>Selecionar →</span></button>`).join('');
      if (!result.users.length) $('recipient-selected').textContent='Nenhum usuário encontrado. Confira o nome ou peça para a pessoa criar uma conta.';
    } catch (error) {if (ticket===searchRevision) $('recipient-selected').textContent=error.message;}
  };
  $('recipient-results').onclick = event => {
    const button=event.target.closest('[data-recipient]');
    if (!button) return;
    selectedRecipient=button.dataset.recipient;
    $('recipient-selected').textContent=`Enviar para @${selectedRecipient}`;
    $('recipient-results').replaceChildren(); $('recommend-send').disabled=false;
  };
  $('recommend-form').onsubmit = async event => {
    event.preventDefault(); if (!selectedRecipient) return;
    $('recommend-send').disabled=true; $('recommend-error').textContent='';
    try {
      await api('recommendations', {method:'POST',data:{gameId:recommendationGame.id,recipient:selectedRecipient,message:$('recommend-message').value}});
      $('recommend-dialog').close(); notify(`Recomendação enviada para @${selectedRecipient}!`);
      if (location.hash==='#minha-lista') renderPersonal();
    } catch (error) {$('recommend-error').textContent=error.message;}
    finally {$('recommend-send').disabled=false;}
  };
  try {user=(await api('me')).user; if (user) favorites=new Set((await api('favorites')).favorites);}
  catch {available=false;}
  finally {ready=true; sessionChanged();}
}
