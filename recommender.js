export const questions = [
  {key:'platform',title:'Onde você quer jogar?',help:'Vamos recomendar apenas jogos disponíveis nessa família de plataformas. Confira o modelo na loja antes de comprar.',options:[['PC','PC','Computador, teclado ou controle.'],['PlayStation','PlayStation','PS4 ou PS5, conforme o jogo.'],['Xbox','Xbox','Xbox One ou Series, conforme o jogo.'],['Nintendo','Nintendo Switch','Switch ou Switch 2, conforme o jogo.'],['any','Tenho mais de uma opção','Pode explorar todo o catálogo.']]},
  {key:'mode',title:'Qual é a sua companhia ideal?',help:'Algumas aventuras foram feitas para compartilhar.',options:[['solo','Só eu e uma boa aventura','Quero jogar sozinho.'],['coop','Uma pessoa ao meu lado','Quero uma experiência cooperativa.'],['any','Tanto faz','A boa experiência vem primeiro.']]},
  {key:'taste',title:'O que faz você apertar o play?',help:'Escolha o ingrediente que mais importa para você.',options:[['story','Uma história que fica comigo','Personagens, diálogos e escolhas.'],['action','Ação que faz o coração acelerar','Combate, movimento e reflexos.'],['exploration','Um mundo para me perder','Exploração, descobertas e segredos.'],['strategy','A satisfação de um bom plano','Estratégia, combinações e decisões.'],['cozy','Desacelerar e curtir o caminho','Criar, cuidar e jogar no meu ritmo.'],['racing','Velocidade e liberdade','Carros, provas e estrada aberta.']]},
  {key:'difficulty',title:'Como você lida com desafios?',help:'Pense na experiência que está procurando agora.',options:[['easy','Quero relaxar','Prefiro uma experiência mais acessível.'],['medium','Um desafio na medida','Gosto de aprender, sem pressão constante.'],['hard','Pode vir o próximo chefe','Repetir, melhorar e superar faz parte.']]},
  {key:'length',title:'Quanto tempo cabe na sua rotina?',help:'Aqui falamos do formato das sessões, não de uma duração exata para terminar.',options:[['short','Pequenas doses','Partidas curtas ou atividades livres.'],['medium','Uma aventura com começo e fim','Uma campanha mais concentrada.'],['long','Quero uma longa jornada','Muitas horas em um mesmo universo.']]},
  {key:'world',title:'Qual universo chama você?',help:'Última escolha antes da sua próxima descoberta.',options:[['fantasy','Fantasia e mundos impossíveis','Magia, mitos e grandes aventuras.'],['scifi','Ficção científica','Tecnologia, futuros e outras realidades.'],['history','Um pé no mundo real','História, vida cotidiana e lugares familiares.'],['horror','Um bom arrepio','Tensão, mistério e sobrevivência.'],['any','Pode me surpreender','O cenário não é o mais importante.']]}
];

export function recommend(catalog, answers) {
  // Plataforma e modo são restrições: nunca recomenda um jogo incompatível.
  return catalog.filter(game =>
    game.status !== 'upcoming' &&
    (answers.platform === 'any' || game.platforms.includes(answers.platform)) &&
    (answers.mode === 'any' || (answers.mode === 'solo' ? ['solo','both'].includes(game.mode) : ['coop','both'].includes(game.mode)))
  ).map(game => {
    const reasons=[];
    let points=0;
    if(game.tags.includes(answers.taste)){points+=5;reasons.push('Tem o estilo de experiência que você procura.');}
    if(game.difficulty===answers.difficulty){points+=3;reasons.push('Combina com sua preferência de desafio.');}
    if(game.length===answers.length){points+=3;reasons.push('O formato combina com o tempo que você quer dedicar.');}
    if(answers.world!=='any' && game.tags.includes(answers.world)){points+=2;reasons.push('Explora o universo que chamou sua atenção.');}
    return {game,points,reasons};
  }).sort((a,b)=>b.points-a.points || (b.game.score??-1)-(a.game.score??-1) || a.game.title.localeCompare(b.game.title,'pt-BR')).slice(0,3);
}
