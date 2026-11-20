# ChatGPT [Copied]

Primeira versão de uma interface de chat pessoal com histórico guardado localmente.

## Estrutura
- `index.html`, `styles.css`, `app.js`: frontend estático para GitHub Pages.
- `supabase/functions/chat/index.ts`: função backend que chama a OpenAI Responses API.
- `supabase/config.toml`: configuração da Edge Function.

## Configuração

1. Cria um projeto no Supabase.
2. Instala e configura a Supabase CLI.
3. Define os segredos no projeto:
   - `OPENAI_API_KEY`: chave secreta da OpenAI.
   - `OPENAI_MODEL`: identificador de um modelo disponível na tua conta. Confirma o nome no painel/documentação da API.
4. Publica a função:
   ```bash
   supabase link --project-ref O_TEU_PROJECT_REF
   supabase functions deploy chat
   ```
5. No Supabase, abre **Project Settings → API** e copia o Project URL e a chave publishable (ou anon legacy).
6. Em `app.js`, substitui:
   - `COLOCA_AQUI_O_URL_DO_SUPABASE`
   - `COLOCA_AQUI_A_CHAVE_PUBLICA_DO_SUPABASE`
7. Publica a pasta no GitHub Pages.

## Segurança importante
- Nunca coloques `OPENAI_API_KEY` no HTML, JavaScript do navegador, GitHub ou num repositório.
- A chave pública/publishable do Supabase pode estar no frontend; a chave secreta da OpenAI só deve existir nos segredos da Edge Function.
- Este protótipo permite chamadas públicas à função e não inclui autenticação nem limitação robusta de pedidos. Não o partilhes publicamente nem o deixes aberto a tráfego externo antes de acrescentar autenticação, rate limiting e controlo de custos.
- O histórico fica no LocalStorage deste navegador/dispositivo. Limpar os dados do site pode apagar as conversas.

## Nota
O nome do modelo é configurável por `OPENAI_MODEL`. Usa um modelo ao qual a tua conta API tenha acesso e confirma os preços/limites antes de o utilizar.
