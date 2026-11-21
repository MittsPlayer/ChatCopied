# ChatGPT [Copied] — versão Supabase + Groq

Projeto baseado nos ficheiros originais. A função `chat` e a tabela de histórico já foram aplicadas no projeto Supabase `lssxdvcjvczwmdqhoyxg` em 21-11-2026.

## Conteúdo
- `index.html`, `styles.css`, `app.js`: site estático para GitHub Pages.
- `supabase/functions/chat/index.ts`: código-fonte da Edge Function publicada (versão 8).
- `supabase/migrations/20261121113307_chat_conversations_history.sql`: migração já aplicada ao projeto remoto.
- `supabase/config.toml`: `verify_jwt = false`, necessário para o site sem login.

## Modelos
- `openai/gpt-oss-120b` — GPT-OSS 120B.
- `qwen/qwen3.8-27b` — Qwen 3.8 27B, da Alibaba.

Os IDs foram confirmados na documentação oficial da Groq: https://console.groq.com/docs/models

## Publicar no GitHub Pages
1. Extrai o ZIP.
2. Envia `index.html`, `app.js`, `styles.css` e `README.md` para a raiz do repositório GitHub que já usas.
3. Mantém também a pasta `supabase` no repositório para teres o código-fonte e a migração guardados.
4. Não alteres os valores `SUPABASE_URL` e `SUPABASE_ANON_KEY` em `app.js`: já correspondem ao projeto configurado.
5. O GitHub Pages publica o site a partir da pasta/branch que já tinhas configurado.

## Estado do Supabase
- Projeto: `ChatCopied` (`lssxdvcjvczwmdqhoyxg`), região `eu-west-1`.
- Tabela `public.chat_conversations`: criada, RLS activado.
- `anon` e `authenticated` não têm permissões directas de leitura/escrita na tabela.
- Edge Function `chat`: activa, versão 8, sem validação JWT no gateway para permitir utilização sem login.
- A função usa a chave secreta do Supabase apenas no servidor e `GROQ_API_KEY` para contactar a Groq.
- O modelo é validado por allowlist; o navegador não pode enviar nomes arbitrários de modelos.

## Histórico sem login — limitação importante
O navegador gera um UUID aleatório e usa-o como identificador de histórico. Não é uma conta nem autenticação forte. Se alguém obtiver esse UUID pode tentar aceder ao histórico associado. O endpoint de chat é público e, sem login, não há uma forma forte de impedir abuso por terceiros. Não guardes dados sensíveis; para um site público será necessário acrescentar protecção contra abuso e rate limiting.

## Gratuito
Não foi configurado qualquer serviço pago nem login. Os planos gratuitos da Groq e do Supabase têm quotas e limites, não utilização ilimitada. `GROQ_API_KEY` já estava configurada no projecto; não a coloques no GitHub, no HTML ou no JavaScript.
