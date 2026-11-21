/* ChatGPT [Copied] — frontend sem login, com histórico sincronizado no Supabase. */
const CONFIG = {
  SUPABASE_URL: "https://lssxdvcjvczwmdqhoyxg.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable__Q6TUtUdYQurKPNDSBix4Q_zFAapTQd",
  FUNCTION_NAME: "chat"
};
const MODELS = {
  "groq::openai/gpt-oss-120b": "GPT-OSS 120B (Groq)",
  "groq::qwen/qwen3.8-27b": "Qwen 3.8 27B (Groq)",
  "nvidia::nvidia/nemotron-3.5-bolt-e4b": "Nemotron 3.5 Bolt E4B (NVIDIA)",
  "nvidia::nvidia/nemotron-3.5-super-vl-120b-a12b": "Nemotron 3.5 Super VL 120B (NVIDIA)",
  "nvidia::z-ai/glm-5.3": "GLM-5.3 (NVIDIA)",
  "nvidia::z-ai/glm-5.3-flash": "GLM-5.3 Flash (NVIDIA)"
};
const DEFAULT_MODEL = "groq::openai/gpt-oss-120b";
const $ = (s) => document.querySelector(s);
const STORAGE_KEY = "chatgpt-copied-chats-v2";
const OWNER_KEY = "chatgpt-copied-browser-id-v1";
let ownerId = localStorage.getItem(OWNER_KEY);
if (!ownerId) { ownerId = crypto.randomUUID(); localStorage.setItem(OWNER_KEY, ownerId); }
let chats = loadChats();
let activeId = chats[0]?.id || null;
let busy = false;
let lastUsage = null;

function loadChats(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||[]}catch{return []}}
function saveLocal(){localStorage.setItem(STORAGE_KEY,JSON.stringify(chats))}
function currentChat(){return chats.find(c=>c.id===activeId)}
function newChat(){const chat={id:crypto.randomUUID(),title:"Nova conversa",messages:[],updatedAt:Date.now()};chats.unshift(chat);activeId=chat.id;saveLocal();render();syncSave(chat);$('#messageInput').focus()}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function renderText(text){let s=escapeHtml(text);s=s.replace(/```([\s\S]*?)```/g,(_,code)=>`<pre><code>${code.trim()}</code></pre>`);s=s.replace(/`([^`]+)`/g,"<code>$1</code>");s=s.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>");s=s.replace(/\*(.*?)\*/g,"<em>$1</em>");s=s.replace(/\n/g,"<br>");return s}
function render(){
  const list=$('#chatList');list.innerHTML='';
  chats.forEach(chat=>{const b=document.createElement('button');b.className='chat-item'+(chat.id===activeId?' active':'');b.textContent=chat.title;b.title=chat.title;b.onclick=()=>{activeId=chat.id;render();closeSidebar()};b.oncontextmenu=e=>{e.preventDefault();if(confirm('Apagar esta conversa?'))deleteChat(chat.id)};list.appendChild(b)});
  const chat=currentChat(),messages=$('#messages');messages.innerHTML='';$('#welcome').hidden=!!(chat?.messages.length);
  (chat?.messages||[]).forEach(m=>{const el=document.createElement('article');el.className='message '+m.role;const avatar=document.createElement('div');avatar.className='avatar';avatar.textContent=m.role==='user'?'C':'✳';const body=document.createElement('div');body.className='message-body';body.innerHTML=renderText(m.content);el.append(avatar,body);messages.appendChild(el)});
  if(busy){const el=document.createElement('div');el.className='message assistant';el.innerHTML='<div class="avatar">✳</div><div class="message-body typing">A pensar…</div>';messages.appendChild(el)}
  $('#conversation').scrollTop=$('#conversation').scrollHeight;
  const savedModel=localStorage.getItem('chatgpt-copied-model')||DEFAULT_MODEL;
  $('#modelSelect').value=MODELS[savedModel]?savedModel:DEFAULT_MODEL;
}
function toast(message){const t=$('#toast');t.textContent=message;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3000)}
function closeSidebar(){$('#sidebar').classList.remove('open')}
async function api(payload){
  const response=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/${CONFIG.FUNCTION_NAME}`,{method:'POST',headers:{'Content-Type':'application/json','apikey':CONFIG.SUPABASE_ANON_KEY},body:JSON.stringify({...payload,ownerId})});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||`Erro do servidor (${response.status})`);return data;
}
async function syncSave(chat){try{await api({action:'save',conversation:{id:chat.id,title:chat.title,messages:chat.messages,updatedAt:chat.updatedAt}})}catch(e){console.warn('Sincronização falhou:',e.message)}}
async function syncDelete(id){try{await api({action:'delete',conversationId:id})}catch(e){toast('Não foi possível apagar no servidor: '+e.message)}}
async function deleteChat(id){chats=chats.filter(c=>c.id!==id);if(activeId===id)activeId=chats[0]?.id||null;saveLocal();render();await syncDelete(id)}
async function loadCloudHistory(){try{const data=await api({action:'load'});const cloud=Array.isArray(data.conversations)?data.conversations:[];const map=new Map(chats.map(c=>[c.id,c]));for(const c of cloud){const old=map.get(c.id);if(!old||Number(c.updatedAt)>Number(old.updatedAt))map.set(c.id,c)}chats=[...map.values()].sort((a,b)=>Number(b.updatedAt)-Number(a.updatedAt));if(!activeId||!chats.some(c=>c.id===activeId))activeId=chats[0]?.id||null;saveLocal();render()}catch(e){console.warn('Histórico online indisponível:',e.message);toast('Histórico online indisponível. A usar cópia local.')}}
async function askAI(messages,provider,model){return api({action:'chat',messages,provider,model})}
async function sendMessage(text){
  text=text.trim();if(!text||busy)return;if(!currentChat())newChat();const chat=currentChat();chat.messages.push({role:'user',content:text});if(chat.messages.length===1)chat.title=text.slice(0,38)+(text.length>38?'…':'');chat.updatedAt=Date.now();saveLocal();$('#messageInput').value='';autoResize();busy=true;$('#sendBtn').disabled=true;render();
  try{const selected=$('#modelSelect').value;const [provider,model]=selected.split('::');const result=await askAI(chat.messages.slice(-20),provider,model);chat.messages.push({role:'assistant',content:result.reply});lastUsage=result.usage||null;$('#usageInfo').textContent=lastUsage?`Tokens desta chamada: ${lastUsage.prompt_tokens??'?'} entrada + ${lastUsage.completion_tokens??'?'} saída = ${lastUsage.total_tokens??'?'} total`:'Tokens desta chamada: indisponível';}
  catch(err){chat.messages.push({role:'assistant',content:`Não consegui responder: ${err.message}`});}
  finally{busy=false;$('#sendBtn').disabled=false;chat.updatedAt=Date.now();saveLocal();render();syncSave(chat)}
}
function autoResize(){const input=$('#messageInput');input.style.height='auto';input.style.height=Math.min(input.scrollHeight,180)+'px'}
$('#chatForm').addEventListener('submit',e=>{e.preventDefault();sendMessage($('#messageInput').value)});
$('#messageInput').addEventListener('input',autoResize);
$('#messageInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('#chatForm').requestSubmit()}});
$('#newChat').onclick=newChat;
$('#clearChat').onclick=()=>{if(currentChat()){const c=currentChat();c.messages=[];c.title='Nova conversa';c.updatedAt=Date.now();saveLocal();render();syncSave(c)}else newChat()};
$('#openSidebar').onclick=()=>$('#sidebar').classList.add('open');$('#closeSidebar').onclick=closeSidebar;
$('#modelSelect').addEventListener('change',e=>{localStorage.setItem('chatgpt-copied-model',e.target.value);toast('Modelo selecionado: '+(MODELS[e.target.value]||'Modelo'))});
document.querySelectorAll('.suggestion').forEach(b=>b.addEventListener('click',()=>sendMessage(b.dataset.prompt)));
render();loadCloudHistory();
