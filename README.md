# Checkpoint ✳

Catálogo em português com 33 grandes jogos de 2015 a 2025, organizados por ano de lançamento original. Inclui capas, descrições, notas da crítica do Metacritic e um questionário de seis perguntas para encontrar sua próxima aventura.

## Recursos

- Três destaques editoriais por ano, com opção de ver todos os anos.
- Busca por título, filtro de gênero e ordenação dentro de cada ano.
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

O fluxo `.github/workflows/pages.yml` testa e publica os arquivos estáticos a cada envio para `main`. O endereço esperado depois da ativação é https://slactos7.github.io/Games/.

Na primeira publicação, se a configuração automática do Pages for bloqueada pelas permissões do repositório, abra **Settings → Pages → Build and deployment → Source → GitHub Actions** e execute novamente o fluxo. O repositório precisa permitir GitHub Actions e publicação no Pages. O arquivo de fluxo sozinho não confirma que o site já foi publicado.

## Organização

```text
index.html             Estrutura das duas abas
styles.css             Visual e layouts responsivos
app.js                 Catálogo, filtros e navegação do questionário
recommender.js         Perguntas e classificação das recomendações
data/games.js          Conteúdo editorial e fontes
favicon.svg            Ícone do projeto
scripts/serve.mjs      Servidor local sem dependências
tests/                 Verificação do catálogo e das recomendações
.github/workflows/     Publicação no GitHub Pages
```

## Dados e critérios

A seleção é editorial e não exaustiva: não representa um ranking oficial de melhores jogos nem inclui lançamentos de 2026. O ano corresponde à primeira versão completa do jogo, excluindo acesso antecipado; ports posteriores não alteram esse ano. Por isso uma nota de Switch pode aparecer em um jogo lançado originalmente antes em outra plataforma. Resident Evil 4 é o remake de 2023, God of War é o jogo de 2018 e DOOM é o jogo de 2016.

As notas são **Metascores da crítica**, de 0 a 100, na plataforma indicada, consultadas em **10/11/2026**. Não são notas dos usuários nem médias entre plataformas. Os valores são estáticos e podem mudar no Metacritic. Cada jogo tem seu link específico de avaliações. As descrições em português são textos editoriais próprios.

As capas são carregadas da CDN pública do Steam e pertencem aos respectivos titulares. Fontes tipográficas vêm do Google Fonts, com alternativas locais. É necessária conexão para esses recursos; falhas nas capas exibem o título em seu lugar. As famílias de plataformas são um filtro geral, não uma promessa de compatibilidade com todos os modelos: confira a edição e o console na loja. A imagem de uma edição Steam pode diferir da edição avaliada.

O questionário usa regras locais, sem envio de respostas a servidores. Plataforma e modo são restrições; os demais gostos dão pontos. A nota da crítica serve apenas para desempatar. As sugestões vêm exclusivamente deste catálogo e não são uma garantia de preferência pessoal. Recarregar a página reinicia as respostas.

## Atualizar o catálogo

Edite `data/games.js`, usando os campos documentados na primeira linha de `rows`. Confira a nota e a plataforma no Metacritic, mantenha o link específico e atualize a data da consulta. Para ampliar o período, atualize também os textos e contagens da página e os testes de integridade.

## Direitos

Projeto independente, sem afiliação ao Metacritic, Valve ou aos estúdios citados. Nomes, marcas, personagens e capas são de seus respectivos titulares.
