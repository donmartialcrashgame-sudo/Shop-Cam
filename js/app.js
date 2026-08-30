import { supabase } from './supabase.js';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

const sidebarStyle = `
#sc-sidebar{position:fixed;left:0;top:0;bottom:0;width:280px;background:#e3131b;color:#fff;padding:24px 16px 14px;display:flex;flex-direction:column;z-index:9999;box-shadow:8px 0 30px rgba(0,0,0,.12);overflow-y:auto}#sc-sidebar *{box-sizing:border-box}.sc-brand{display:flex;align-items:center;gap:11px;padding:4px 10px 25px;white-space:nowrap}.sc-brand img{width:45px;height:45px;border-radius:10px;background:#fff;object-fit:contain;flex:none}.sc-brand strong{font-size:23px;line-height:1;font-weight:900;letter-spacing:-.5px}.sc-section{font-size:10px;letter-spacing:1.8px;font-weight:900;margin:7px 10px 8px}.sc-nav{display:grid;gap:4px;margin-bottom:12px}.sc-nav a{display:flex;align-items:center;gap:11px;min-height:46px;padding:5px 9px;color:#fff;text-decoration:none;border-radius:11px;font-size:12px;font-weight:800;transition:.2s}.sc-nav a:hover{background:#c90f16;transform:translateX(2px)}.sc-nav a.active{background:#c40f16}.sc-ico{width:34px;height:34px;min-width:34px;border:1px solid rgba(255,255,255,.9);border-radius:11px;display:grid;place-items:center;font-size:15px;line-height:1;background:transparent}.sc-nav a.active .sc-ico{background:rgba(255,255,255,.08)}.sc-signout{margin-top:auto;width:100%;border:1px solid rgba(255,255,255,.9);background:#c9131a;color:#fff;border-radius:10px;padding:12px;font-size:12px;font-weight:900;cursor:pointer}.sc-signout:hover{background:#fff;color:#d71920}.sc-dots{display:flex;justify-content:center;gap:7px;padding:18px 0 0}.sc-dots i{width:7px;height:7px;border-radius:50%;background:#ef7075}.sc-dots i:nth-child(2){width:21px;border-radius:99px;background:#fff}.sc-overlay{display:none}
.sc-with-sidebar{margin-left:280px;min-height:100vh}.sc-menu{display:none}
@media(max-width:760px){#sc-sidebar{width:min(372px,88vw);max-width:372px;transform:translateX(-102%);transition:transform .25s ease;padding:24px 16px 14px}#sc-sidebar.open{transform:translateX(0)}.sc-overlay{position:fixed;inset:0;background:rgba(0,0,0,.34);z-index:9998;display:none}.sc-overlay.show{display:block}.sc-with-sidebar{margin-left:0}.sc-menu{display:grid;width:42px;height:42px;place-items:center;border:1px solid #eee;background:#fff;border-radius:11px;font-size:22px;cursor:pointer}}
@media(min-width:761px) and (max-width:1050px){#sc-sidebar{width:250px}.sc-with-sidebar{margin-left:250px}.sc-brand strong{font-size:19px}.sc-nav a{font-size:11px}.sc-ico{width:32px;height:32px;min-width:32px}}
`;

function ensureSidebarStyle(){
  if(document.getElementById('sc-sidebar-style')) return;
  const style=document.createElement('style'); style.id='sc-sidebar-style'; style.textContent=sidebarStyle; document.head.appendChild(style);
}

function mountSidebar(active='dashboard'){
  ensureSidebarStyle();
  if(document.getElementById('sc-sidebar')) return document.getElementById('sc-sidebar');
  const overlay=document.createElement('div'); overlay.className='sc-overlay'; overlay.id='sc-overlay'; document.body.appendChild(overlay);
  const side=document.createElement('aside'); side.id='sc-sidebar';
  const link=(href,icon,label,key)=>`<a href="${href}" class="${active===key?'active':''}"><span class="sc-ico">${icon}</span><span>${label}</span></a>`;
  side.innerHTML=`<div class="sc-brand"><img src="https://shopcamzon.com/favicon.png" alt="Shop Camzon"><strong>Shop Camzon</strong></div><div class="sc-section">ACCOUNT</div><nav class="sc-nav">${link('dashboard.html','⌂','Home','dashboard')}${link('cart.html','🛒','Cart','cart')}${link('orders.html','▣','My Orders','orders')}${link('saved.html','♡','Saved Items','saved')}${link('profile.html','♟','Profile','profile')}${link('notifications.html','🔔','Notifications','notifications')}${link('settings.html','⚙','Settings','settings')}</nav><div class="sc-section">SUPPORT</div><nav class="sc-nav">${link('help-center.html','?','Help Center','help')}${link('faq.html','?','FAQ','faq')}${link('customer-care.html','▣','Customer Care','care')}${link('report.html','△','Report an Issue','report')}</nav><div class="sc-section">INFORMATION</div><nav class="sc-nav">${link('terms.html','▤','Terms & Conditions','terms')}${link('about.html','ⓘ','About Us','about')}</nav><button class="sc-signout" id="sc-signout">🚪 &nbsp;Sign out</button><div class="sc-dots"><i></i><i></i><i></i></div>`;
  document.body.prepend(side);
  const main=document.querySelector('main'); if(main) main.classList.add('sc-with-sidebar');
  const menu=document.querySelector('.sc-menu'); if(menu){menu.onclick=()=>{side.classList.toggle('open');overlay.classList.toggle('show')}}
  overlay.onclick=()=>{side.classList.remove('open');overlay.classList.remove('show')};
  const out=document.getElementById('sc-signout'); if(out) out.onclick=async()=>{await supabase.auth.signOut();location.href='login.html'};
  return side;
}

async function requireAuth(){
  const {data,error}=await supabase.auth.getSession();
  if(error || !data?.session){location.href='login.html'; return null;}
  return data.session;
}

function toast(message,type='info'){
  let box=document.getElementById('sc-toast');
  if(!box){box=document.createElement('div');box.id='sc-toast';box.style.cssText='position:fixed;left:50%;bottom:25px;transform:translateX(-50%);z-index:10000;padding:12px 17px;border-radius:10px;background:#171717;color:#fff;font:700 11px Arial;box-shadow:0 8px 30px #0003;max-width:90vw;text-align:center';document.body.appendChild(box)}
  box.textContent=message; box.style.background=type==='success'?'#16803c':type==='error'?'#c71920':'#171717'; box.style.display='block'; clearTimeout(box._timer); box._timer=setTimeout(()=>box.style.display='none',2400);
}

export const App={supabase,esc,mountSidebar,requireAuth,toast};
`