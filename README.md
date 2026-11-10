# Checkpoint ✳

Catálogo em português com 300 grandes jogos de 2015 a 2026, organizados por ano de lançamento original. Inclui capas, descrições, notas da crítica do Metacritic e um questionário de seis perguntas para encontrar sua próxima aventura. O visual usa fundo creme, verdes, amarelo, formas orgânicas e uma ilustração vetorial de controle, inspirado na imagem de referência fornecida pelo usuário.

## Recursos

- 25 jogos por ano, com opção de ver todos os 300 jogos.
- Aba Jogos do Ano com os vencedores do The Game Awards de 2015 a 2025, destaque para a edição mais recente e situação de 2026.
- Busca por título, filtros de gênero e status de lançamento e ordenação dentro de cada ano.
- Metascore com plataforma avaliada e link direto à fonte.
- Quiz por plataforma, companhia, estilo, desafio, tempo e universo.
- Recomendação principal, explicação e até duas alternativas.
- Layout adaptável, navegação por teclado, campos com rótulos e preferência por movimento reduzido.
- Catálogo e quiz livres para visitantes, sem anúncios ou chaves de API.
- Em teste local: cadastro, login, favoritos privados e recomendações entre usuários com SQLite.

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

## Contas e listas — teste local

O backend está disponível no repositório para execução e testes locais; ainda não foi configurado para hospedagem. Execute `npm start` ou `node scripts/serve.mjs` na pasta do projeto. No Windows, também é possível abrir `iniciar-local.cmd`. Mantenha o terminal aberto e acesse **http://127.0.0.1:4173/#minha-lista**. Para encerrar, pressione Ctrl+C no terminal.

1. Em **Minha lista → Criar conta**, escolha um nome público (3–24 letras, números ou `_`) e uma senha de 8–128 caracteres. Não é necessário e-mail.
2. No catálogo, nos Jogos do Ano ou no resultado principal do quiz, use **Favoritar**. Os jogos ficam em **Minha lista → Favoritos**; tocar novamente remove o favorito.
3. Para testar recomendações, crie uma segunda conta. Use **Recomendar**, busque o nome da outra pessoa (mínimo 2 caracteres), selecione-a e envie uma mensagem opcional de até 500 caracteres.
4. Confira **Enviadas** na conta de origem e **Recebidas** na destinatária. A destinatária pode favoritar o jogo. Remover uma recomendação a exclui das duas caixas; favoritos são independentes.
5. Recarregue a página ou reinicie o servidor: contas, favoritos, recomendações e sessões válidas continuam salvos. **Sair da conta** invalida a sessão.

O arquivo **`storage/checkpoint.sqlite`** é criado automaticamente. Ele guarda usuários, hashes e salts de senhas, sessões, favoritos e recomendações. `storage/` e arquivos SQLite são ignorados pelo Git e ficam fora dos arquivos públicos. Não envie o banco ou seus arquivos auxiliares para o repositório. Para backup, encerre o servidor antes de copiar a pasta `storage/`.

O backend usa o SQLite integrado ao **Node.js 24+**, sem instalação de pacotes. Senhas são derivadas com scrypt (salt aleatório, N=131072, r=8, p=1). Sessões aleatórias duram sete dias, são armazenadas como hashes no banco e usam cookie HttpOnly/SameSite=Strict. Há validação de entrada, consultas parametrizadas, limite de tentativas de login e proteção contra solicitações de outras origens. O servidor escuta somente em `127.0.0.1`; não aceita acesso de outras máquinas. Favoritos são privados; somente remetente e destinatário acessam cada recomendação. Nenhuma conta de demonstração é criada automaticamente.

`tests/backend.test.mjs` testa cadastro, login, isolamento, duplicidade, autorização, logout, expiração, persistência após reinício e bloqueio de arquivos privados. Os testes usam um banco temporário separado e não alteram suas contas locais.

**Limite de hospedagem:** `npm run build` continua gerando apenas o catálogo estático. Cloudflare Pages ou GitHub Pages, sozinhos, não executam este servidor Node.js nem mantêm o banco SQLite local. Nessa versão estática, catálogo e quiz continuam funcionando e Minha lista informa a necessidade do servidor. Antes de publicar o backend, será necessário escolher hospedagem com armazenamento persistente e HTTPS (cookies Secure), ou adaptar a API e o banco para a plataforma escolhida. Recuperação de senha e verificação por e-mail ainda não fazem parte deste teste local.

## Cloudflare Pages

No projeto conectado ao repositório, configure:

- **Framework preset:** None.
- **Build command:** `npm run build`.
- **Build output directory:** `dist`.
- **Root directory:** deixe vazio (raiz do repositório).

O comando prepara `dist/` com HTML, CSS, JavaScript, dados e imagens locais, sem dependências adicionais nem backend. É compatível com o Node.js 22 do ambiente do Cloudflare. Depois de salvar essas configurações, tente novamente o deploy usando o commit mais recente. O aviso de ausência de Wrangler não é um erro: este projeto não precisa desse arquivo.

Para verificar a preparação localmente, execute `npm run build`. A pasta gerada é ignorada pelo Git. O script apenas prepara os arquivos; não publica por conta própria. Um projeto Cloudflare já conectado com deploy automático pode publicar ao receber novos commits.

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

## Jogos do Ano

A aba reúne os vencedores da categoria **Game of the Year do The Game Awards** em cada ano disponível. `data/awards.js` registra os vencedores, as fontes dos prêmios e os dados dos títulos que aparecem exclusivamente nessa seleção. A lista editorial principal continua com 25 jogos por ano. Vencedores que já estão no catálogo também recebem um selo de destaque.

Para 2026, a página informa que o resultado está pendente e aponta o anúncio oficial da cerimônia de 10/12/2026. Não há vencedor atribuído antecipadamente. As notas são Metascores da crítica na plataforma indicada, e não representam a votação do prêmio. O registro de Overwatch refere-se à edição original de 2016.

As fontes são os arquivos do The Game Awards e os registros de cada edição, incluindo anúncios dos estúdios e cobertura histórica. Capas adicionais usam imagens do evento e reproduções das artes de seus respectivos titulares.

## Capas e botões

As notas da crítica usam vermelho de 0 a 50, amarelo de 51 a 80 e verde de 81 a 100, tanto no catálogo quanto nas sugestões do questionário. Jogos ainda sem nota permanecem neutros. `score.js` centraliza essas faixas. O arquivo `finishes.css` aplica as cores e os detalhes discretos de símbolos “+” arredondados e conjuntos de botões circulares no fundo do site, nas respostas e nas sugestões alternativas do quiz.

Os botões usam um asset SVG transparente com gradientes verdes e curvas amarelas, sem moldura branca nem controle lateral. O texto permanece no HTML para leitura por tecnologias assistivas; os botões de ação têm uma seta em um círculo verde. O asset também é usado na seleção ativa dos anos.

Se uma capa falhar, o site tenta outras URLs de imagem do mesmo jogo antes de mostrar o título no espaço reservado. Essa alternativa depende da disponibilidade das imagens externas. As alternativas não garantem que todos os servidores externos estejam disponíveis a qualquer momento.

O script opcional `node scripts/check-covers.mjs --write` pode verificar capas e registrar URLs corrigidas em `data/cover-overrides.js`. Ele acessa servidores públicos e deve ser executado somente com acesso autorizado. O relatório local `cover-audit.json` é ignorado pelo Git.

## Calendário de 2026

O ano de 2026 tem 25 títulos, separados entre já lançados e futuros lançamentos. A situação e as previsões são um retrato consultado em 10/11/2026, com links para fontes. Datas anunciadas podem mudar. Jogos futuros e títulos ainda sem Metascore mostram um traço, sem nota inventada. O questionário sugere apenas jogos já lançados. Para atualizar esse calendário, edite data/year-2026.js e confira novamente as fontes oficiais.
