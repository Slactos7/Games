import {games} from './games.js';

// Categoria Game of the Year do The Game Awards. Fontes consultadas em 10/11/2026.
// Os quatro registros exclusivos desta aba preservam o catálogo editorial de 25 jogos por ano.
const additionalGames = {
  'overwatch-2016':{id:'overwatch-2016',title:'Overwatch (2016)',year:2016,score:91,scorePlatform:'PC',genre:'Tiro',platforms:['PC','PlayStation','Xbox','Nintendo'],mode:'online',status:'released',cover:'https://www.gamespot.com/wp-content/uploads/original/1197/11970954/2976697-812hbc8o%2Bul._sl1500_.jpg?w=296',coverFallbacks:['https://cdn11.bigcommerce.com/s-ymgqt/images/stencil/1280x1280/products/46629/41810/overwtach-ps4__68519.1682360264.jpg'],source:'https://www.metacritic.com/game/overwatch-2016/critic-reviews/?platform=pc',description:'Heróis de habilidades distintas se enfrentam em partidas por objetivos. A combinação de funções e o trabalho em equipe definiram este marco dos jogos de tiro competitivos.',note:'Registro histórico da edição original de 2016.'},
  'the-legend-of-zelda-breath-of-the-wild':{id:'the-legend-of-zelda-breath-of-the-wild',title:'The Legend of Zelda: Breath of the Wild',year:2017,score:97,scorePlatform:'Nintendo Switch',genre:'Aventura',platforms:['Nintendo'],mode:'solo',status:'released',cover:'https://multimedia.bbycastatic.ca/multimedia/products/1500x1500/104/10440/10440780.jpg',coverFallbacks:['https://images.artandgungame.com/products/switch-games/the-legend-of-zelda-breath-of-the-wild-switch.webp'],source:'https://www.metacritic.com/game/the-legend-of-zelda-breath-of-the-wild/critic-reviews/?platform=nintendo-switch',description:'Link desperta em uma Hyrule que você pode explorar com liberdade. Escale montanhas, experimente soluções para enigmas e descubra histórias em um mundo que recompensa a curiosidade.'},
  'the-last-of-us-part-ii':{id:'the-last-of-us-part-ii',title:'The Last of Us Part II',year:2020,score:93,scorePlatform:'PS4',genre:'Aventura',platforms:['PlayStation','PC'],mode:'solo',status:'released',cover:'https://assets.thegameawards.com/2026/07/19babfe7-the_last_of_us_part_ii_1080x1080.jpg',coverFallbacks:[],source:'https://www.metacritic.com/game/the-last-of-us-part-ii/critic-reviews/?platform=playstation-4',description:'Ellie enfrenta as consequências de uma perda em uma jornada por cidades devastadas. Furtividade, sobrevivência e perspectivas que se cruzam acompanham uma história de violência e seus efeitos.'},
  'astro-bot':{id:'astro-bot',title:'Astro Bot',year:2024,score:94,scorePlatform:'PS5',genre:'Plataforma',platforms:['PlayStation'],mode:'solo',status:'released',cover:'https://assets.thegameawards.com/2026/07/32cd9b50-astro-bot.jpg',coverFallbacks:[],source:'https://www.metacritic.com/game/astro-bot/critic-reviews/?platform=playstation-5',description:'Astro viaja por planetas cheios de ideias para resgatar sua tripulação. Habilidades inventivas, segredos e referências à história do PlayStation transformam cada fase em uma nova brincadeira.'}
};

const records = [
  [2025,'clair-obscur-expedition-33','https://thegameawards.com/rewind/year-2025'],
  [2024,'astro-bot','https://thegameawards.com/rewind/year-2024'],
  [2023,'baldurs-gate-3','https://thegameawards.com/rewind/year-2023'],
  [2022,'elden-ring','https://thegameawards.com/rewind/year-2022'],
  [2021,'it-takes-two','https://thegameawards.com/rewind/year-2021'],
  [2020,'the-last-of-us-part-ii','https://thegameawards.com/rewind/year-2020'],
  [2019,'sekiro-shadows-die-twice','https://thegameawards.com/rewind/year-2019'],
  [2018,'god-of-war','https://thegameawards.com/rewind/year-2018'],
  [2017,'the-legend-of-zelda-breath-of-the-wild','https://www.nintendo.com/es-es/Noticias/2017/diciembre/Anunciado-Bayonetta-3-durante-The-Game-Awards-1316327.html'],
  [2016,'overwatch-2016','https://www.gamespot.com/articles/overwatch-wins-game-of-the-year-at-2016-game-award/1100-6445894/'],
  [2015,'the-witcher-3-wild-hunt','https://www.cdprojekt.com/en/media/news/the-witcher-3-wild-hunt-triumphs-at-the-game-awards/']
];

export const gameOfYear = records.map(([year,id,awardSource])=>({year,awardSource,status:'winner',game:games.find(game=>game.id===id)||additionalGames[id]}));
export const pendingAward = {year:2026,status:'pending',game:null,ceremonyDate:'2026-12-10',source:'https://thegameawards.com/news/tga-returns-december-10-2026'};
