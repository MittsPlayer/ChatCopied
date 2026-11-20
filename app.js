/*
  Configuração: edita CONFIG com o URL do projeto Supabase e a chave publishable/anon.
  Nunca coloques a chave secreta da OpenAI neste ficheiro.
*/
const CONFIG = {
  SUPABASE_URL: "COLOCA_AQUI_O_URL_DO_SUPABASE",
  SUPABASE_ANON_KEY: "COLOCA_AQUI_A_CHAVE_PUBLICA_DO_SUPABASE",
  FUNCTION_NAME: "chat"
};

const $ = (s) => document.querySelector(s);
const STORAGE_KEY = "chatgpt-copied-chats-v1";
let chats = loadChats();
let activeId = chats[0]?.id || null;
let busy = false;

function loadChats(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||[]}catch{return []}}
function saveChats(){localStorage.setItem(STORAGE_KEY,JSON.stringify(chats))}
function currentChat(){return chats.find(c=>c.id===activeId)}
function newChat(){
  const chat={id:crypto.randomUUID(),title:"Nova conversa",messages:[],updatedAt:Date.now()};
  chats.unshift(chat);activeId=chat.id;saveChats();render();$("#messageInput").focus();
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function renderText(text){
  // Renderizador Markdown mínimo e seguro: escapa HTML antes de formatar.
  let s=escapeHtml(text);
  s=s.replace(/```([\s\S]*?)```/g,(_,code)=>`<pre><code>${code.trim()}</code></pre>`);
  s=s.replace(/`([^`]+)`/g,"<code>$1</code>");
  s=s.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>");
  s=s.replace(/\*(.*?)\*/g,"<em>$1</em>");
  s=s.replace(/\n/g,"<br>");
  return s;
}
function render(){
  const list=$("#chatList");list.innerHTML="";
  chats.forEach(chat=>{
    const b=document.createElement("button");b.className="chat-item"+(chat.id===activeId?" active":"");
    b.textContent=chat.title;b.title=chat.title;b.onclick=()=>{activeId=chat.id;render();closeSidebar()};
    b.oncontextmenu=(e)=>{e.preventDefault();if(confirm("Apagar esta conversa?")){chats=chats.filter(c=>c.id!==chat.id);if(activeId===chat.id)activeId=chats[0]?.id||null;saveChats();render()}};
    list.appendChild(b);
  });
  const chat=currentChat();const messages=$("#messages");messages.innerHTML="";
  $("#welcome").hidden=!!(chat?.messages.length);
  (chat?.messages||[]).forEach(m=>{
    const el=document.createElement("article");el.className="message "+m.role;
    const avatar=document.createElement("div");avatar.className="avatar";avatar.textContent=m.role==="user"?"C":"✳";
    const body=document.createElement("div");body.className="message-body";body.innerHTML=renderText(m.content);
    el.append(avatar,body);messages.appendChild(el);
  });
  if(busy){const el=document.createElement("div");el.className="message assistant";el.innerHTML='<div class="avatar">✳</div><div class="message-body typing">A pensar…</div>';messages.appendChild(el)}
  $("#conversation").scrollTop=$("#conversation").scrollHeight;
}
function toast(message){const t=$("#toast");t.textContent=message;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600)}
function closeSidebar(){$("#sidebar").classList.remove("open")}
async function askAI(messages){
  if(CONFIG.SUPABASE_URL.startsWith("COLOCA_")||CONFIG.SUPABASE_ANON_KEY.startsWith("COLOCA_"))throw new Error("Configura primeiro o URL e a chave pública do Supabase no app.js.");
  const response=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/${CONFIG.FUNCTION_NAME}`,{
    method:"POST",headers:{"Content-Type":"application/json","apikey":CONFIG.SUPABASE_ANON_KEY},
    body:JSON.stringify({messages})
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||`Erro do servidor (${response.status})`);
  if(!data.reply)throw new Error("O servidor não devolveu uma resposta.");
  return data.reply;
}
async function sendMessage(text){
  text=text.trim();if(!text||busy)return;
  if(!currentChat())newChat();
  const chat=currentChat();chat.messages.push({role:"user",content:text});
  if(chat.messages.length===1)chat.title=text.slice(0,38)+(text.length>38?"…":"");
  chat.updatedAt=Date.now();saveChats();$("#messageInput").value="";autoResize();busy=true;$("#sendBtn").disabled=true;render();
  try{
    const reply=await askAI(chat.messages.slice(-20));
    chat.messages.push({role:"assistant",content:reply});
  }catch(err){chat.messages.push({role:"assistant",content:`Não consegui responder: ${err.message}`});}
  finally{busy=false;$("#sendBtn").disabled=false;chat.updatedAt=Date.now();saveChats();render()}
}
function autoResize(){const input=$("#messageInput");input.style.height="auto";input.style.height=Math.min(input.scrollHeight,180)+"px"}
$("#chatForm").addEventListener("submit",e=>{e.preventDefault();sendMessage($("#messageInput").value)});
$("#messageInput").addEventListener("input",autoResize);
$("#messageInput").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("#chatForm").requestSubmit()}});
$("#newChat").onclick=newChat;
$("#clearChat").onclick=()=>{if(currentChat()){currentChat().messages=[];currentChat().title="Nova conversa";saveChats();render()}else newChat()};
$("#openSidebar").onclick=()=>$("#sidebar").classList.add("open");
$("#closeSidebar").onclick=closeSidebar;
document.querySelectorAll(".suggestion").forEach(b=>b.addEventListener("click",()=>sendMessage(b.dataset.prompt)));
render();
