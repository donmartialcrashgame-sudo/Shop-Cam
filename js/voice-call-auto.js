import { supabase } from './supabase.js';

const path = location.pathname.toLowerCase();
if (!path.endsWith('/customer-care.html') && !path.endsWith('/admin/support.html') && !path.endsWith('/admin/support')) {
  // Nothing to do on other pages.
} else {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const addStyle = () => { if(document.getElementById('voice-call-auto-style')) return; const s=document.createElement('style'); s.id='voice-call-auto-style'; s.textContent=`.sc-call{display:flex;align-items:center;gap:8px;margin-left:auto;border:0;border-radius:12px;padding:10px 13px;background:#fff;color:#d71920;font-weight:900;font-size:11px;cursor:pointer;box-shadow:0 4px 15px #0002}.sc-call:disabled{opacity:.5;cursor:not-allowed}.sc-call.online{background:#fff;color:#16a34a}.sc-call.offline{background:#fff;color:#888}.sc-callbar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 12px;background:#fff;border-bottom:1px solid #eee;font-size:10px}.sc-callstatus{font-weight:800}.sc-call-dot{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:5px;background:#999}.sc-call-dot.on{background:#16a34a;box-shadow:0 0 0 4px #16a34a22}.sc-incoming{position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:9999;background:#fff;border:1px solid #eee;border-radius:18px;padding:14px 16px;box-shadow:0 18px 60px #0003;font-size:12px;display:none}.sc-incoming.show{display:flex;gap:10px;align-items:center}.sc-incoming button{border:0;border-radius:10px;padding:9px 12px;font-weight:900;cursor:pointer}.sc-answer{background:#16a34a;color:#fff}.sc-reject{background:#eee;color:#222}`;document.head.appendChild(s)};
  const getSession = async()=>{const {data:{session}}=await supabase.auth.getSession();return session};
  const init = async()=>{
    addStyle();
    const session=await getSession(); if(!session)return;
    const isCustomer=path.includes('customer-care');
    const isAdmin=path.includes('/admin/support');
    const {createVoiceCall}=await import('./voice-call.js');
    if(isCustomer){
      let conversationId=null;
      const {data:c}=await supabase.from('support_conversations').select('id').eq('user_id',session.user.id).order('updated_at',{ascending:false}).limit(1).maybeSingle();
      conversationId=c?.id||null;
      const head=document.querySelector('.head'); if(!head)return;
      const btn=document.createElement('button');btn.className='sc-call offline';btn.innerHTML='📞 Voice Call';btn.disabled=true;btn.title='Customer Care availability';
      const bar=document.createElement('div');bar.className='sc-callbar';bar.innerHTML='<span><span id="sc-dot" class="sc-call-dot"></span><span id="sc-presence-text" class="sc-callstatus">Checking availability...</span></span>';
      bar.appendChild(btn);head.parentNode.insertBefore(bar,head.nextSibling);
      const update=on=>{const dot=document.getElementById('sc-dot'),txt=document.getElementById('sc-presence-text');if(!dot||!txt)return;dot.className='sc-call-dot '+(on?'on':'');txt.textContent=on?'Customer Care is online':'Customer Care is offline';btn.disabled=!on||!conversationId;btn.className='sc-call '+(on?'online':'offline');btn.innerHTML=on?'📞 Voice Call':'📞 Offline'};
      const check=async()=>{const {data}=await supabase.from('support_agent_presence').select('is_online').eq('is_online',true).limit(1);update(!!data?.length)};
      await check();
      supabase.channel('customer-care-presence-ui').on('postgres_changes',{event:'*',schema:'public',table:'support_agent_presence'},check).subscribe();
      createVoiceCall({role:'customer',userId:session.user.id,conversationId,callButton:btn,statusEl:document.getElementById('sc-presence-text')});
    } else if(isAdmin){
      const header=document.querySelector('.top'); if(!header)return;
      const btn=document.createElement('button');btn.className='sc-call';btn.innerHTML='📞 Voice Call';btn.title='Incoming customer calls';header.appendChild(btn);
      const status=document.createElement('small');status.className='sc-callstatus';status.style.marginLeft='10px';header.appendChild(status);
      const set=on=>{status.textContent=on?'🟢 Available for calls':'⚪ Calls offline';btn.disabled=!on;btn.className='sc-call '+(on?'online':'offline');btn.innerHTML=on?'📞 Ready':'📞 Offline'};
      const {data:p}=await supabase.from('support_agent_presence').select('is_online').eq('agent_id',session.user.id).maybeSingle();set(!!p?.is_online);
      supabase.channel('admin-call-presence-ui').on('postgres_changes',{event:'UPDATE',schema:'public',table:'support_agent_presence',filter:'agent_id=eq.'+session.user.id},p=>set(!!p.new.is_online)).subscribe();
      createVoiceCall({role:'admin',userId:session.user.id,conversationId:null,callButton:btn,statusEl:status});
    }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>init().catch(console.error));else init().catch(console.error);
}
