# Checkpoint ✳

Catálogo em português com 300 grandes jogos de 2015 a 2026, organizados por ano de lançamento original. Inclui capas, descrições, notas da crítica do Metacritic e um questionário de seis perguntas para encontrar sua próxima aventura. O visual usa fundo creme, verdes, amarelo, formas orgânicas e uma ilustração vetorial de controle, inspirado na imagem de referência fornecida pelo usuário.

## Recursos

- 25 jogos por ano, com opção de ver todos os 300 jogos.
- Busca por título, filtros de gênero e status de lançamento e ordenação dentro de cada ano.
- Metascore com plataforma avaliada e link direto à fonte.
- Quiz por plataforma, companhia, estilo, desafio, tempo e universo.
- Recomendação principal, explicação e até duas alternativas.
- Layout adaptável, navegação por teclado, campos com rótulos e preferência por movimento reduzido.
- Sem cadastro, anúncios, chaves de API ou dependências de execução.

## Executar

Requer Node.js 24 ou superior. Não é necessário instalar pacotes.

```sh
npm start
```

Abra http://127.0.0.1:4173. Use um servidor HTTP; abrir o HTML diretamente como arquivo não carrega os módulos JavaScript em todos os navegadores.

```sh
npm test
```

Os testes verificam a integridade do catálogo, a influência dos gostos e todas as 4.050 combinações de respostas, incluindo restrições de plataforma e modo.

## Publicação no GitHub Pages

Enviar arquivos para `main` apenas atualiza o repositório e não publica o site. O fluxo `.github/workflows/pages.yml` só pode publicar por execução manual, com a opção de confirmação de publicação marcada. Não execute esse fluxo até decidir colocar o site no ar.

Quando quiser publicar, primeiro ative **Settings → Pages → Build and deployment → Source → GitHub Actions**. Depois execute manualmente o fluxo e confirme a publicação. O endereço esperado após uma publicação bem-sucedida é https://slactos7.github.io/Games/. O arquivo de fluxo sozinho não confirma que o site já foi publicado.

## Organização

```text
index.html             Estrutura das duas abas
styles.css             Estrutura e layouts responsivos
theme.css              Tema creme, verde e amarelo
buttons.css            Botões com o acabamento verde e amarelo da referência
app.js                 Catálogo, filtros e navegação do questionário
recommender.js         Perguntas e classificação das recomendações
data/games.js          Catálogo agregado e fontes
data/extra-*.js        Seleções adicionais por período
assets/controller.svg  Ilustração do controle e órbita
assets/button-surface.svg  Superfície escalável dos botões, sem texto fixo
favicon.svg            Ícone do projeto
scripts/serve.mjs      Servidor local sem dependências
tests/                 Verificação do catálogo e das recomendações
.github/workflows/     Publicação no GitHub Pages
```

## Dados e critérios

A seleção é editorial e não exaustiva: não representa um ranking oficial de melhores jogos. Inclui jogos lançados e previstos para 2026. O ano corresponde à primeira versão completa do jogo, excluindo acesso antecipado; ports posteriores não alteram esse ano. Por isso uma nota de Switch pode aparecer em um jogo lançado originalmente antes em outra plataforma. Resident Evil 4 é o remake de 2023, God of War é o jogo de 2018 e DOOM é o jogo de 2016.

As notas são **Metascores da crítica**, de 0 a 100, na plataforma indicada, consultadas em **10/11/2026**. Não são notas dos usuários nem médias entre plataformas. Os valores são estáticos e podem mudar no Metacritic. Cada jogo tem seu link específico de avaliações. As descrições em português são textos editoriais próprios.

As capas e artes promocionais vêm da CDN pública do Steam e de páginas oficiais das editoras, e pertencem aos respectivos titulares. Fontes tipográficas vêm do Google Fonts, com alternativas locais. É necessária conexão para esses recursos; falhas nas capas exibem o título em seu lugar. As famílias de plataformas são um filtro geral, não uma promessa de compatibilidade com todos os modelos: confira a edição e o console na loja. A imagem de uma edição Steam pode diferir da edição avaliada.

O questionário usa regras locais, sem envio de respostas a servidores. Plataforma e modo são restrições; os demais gostos dão pontos. A nota da crítica serve apenas para desempatar. As sugestões vêm exclusivamente deste catálogo e não são uma garantia de preferência pessoal. Recarregar a página reinicia as respostas.

## Atualizar o catálogo

Edite `data/games.js` ou os arquivos `data/extra-*.js`, usando o mesmo formato de linhas. Confira a nota e a plataforma no Metacritic, mantenha o link específico e atualize a data da consulta. Os totais da página são calculados a partir do catálogo. Para ampliar o período, atualize os textos e os testes de integridade.

## Direitos

Projeto independente, sem afiliação ao Metacritic, Valve ou aos estúdios citados. Nomes, marcas, personagens e capas são de seus respectivos titulares.

## Capas e botões

As notas da crítica usam vermelho de 0 a 50, amarelo de 51 a 80 e verde de 81 a 100, tanto no catálogo quanto nas sugestões do questionário. Jogos ainda sem nota permanecem neutros. `score.js` centraliza essas faixas. O arquivo `finishes.css` aplica as cores e os detalhes discretos de símbolos “+” arredondados e conjuntos de botões circulares no fundo do site, nas respostas e nas sugestões alternativas do quiz.

Os botões usam um asset SVG transparente com gradientes verdes e curvas amarelas, sem moldura branca nem controle lateral. O texto permanece no HTML para leitura por tecnologias assistivas; os botões de ação têm uma seta em um círculo verde. O asset também é usado na seleção ativa dos anos.

Se uma capa falhar, o site tenta outras URLs de imagem do mesmo jogo antes de mostrar o título no espaço reservado. Essa alternativa depende da disponibilidade das imagens externas. As alternativas não garantem que todos os servidores externos estejam disponíveis a qualquer momento.

O script opcional `node scripts/check-covers.mjs --write` pode verificar capas e registrar URLs corrigidas em `data/cover-overrides.js`. Ele acessa servidores públicos e deve ser executado somente com acesso autorizado. O relatório local `cover-audit.json` é ignorado pelo Git.

## Calendário de 2026

O ano de 2026 tem 25 títulos, separados entre já lançados e futuros lançamentos. A situação e as previsões são um retrato consultado em 10/11/2026, com links para fontes. Datas anunciadas podem mudar. Jogos futuros e títulos ainda sem Metascore mostram um traço, sem nota inventada. O questionário sugere apenas jogos já lançados. Para atualizar esse calendário, edite data/year-2026.js e confira novamente as fontes oficiais.
