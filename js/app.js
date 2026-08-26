import { supabase } from './supabase.js';

const SC_NAV = [
  ['dashboard.html','⌂','Home'],
  ['cart.html','🛒','Cart'],
  ['orders.html','▣','My Orders'],
  ['saved.html','♡','Saved Items'],
  ['profile.html','♟','Profile'],
  ['notifications.html','🔔','Notifications'],
  ['settings.html','⚙','Settings']
];
const SC_SUPPORT = [
  ['help-center.html','❓','Help Center'],
  ['faq.html','?','FAQ'],
  ['customer-care.html','▣','Customer Care'],
  ['report.html','⚠','Report an Issue']
];
const SC_INFO = [
  ['terms.html','▤','Terms & Conditions'],
  ['about.html','ⓘ','About Us']
];

function escHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[c]));
}

function sidebarMarkup(current) {
  const makeLinks = list => list.map(([href, icon, label]) => `<a href="${href}" class="${current === href ? 'active' : ''}"><span class="icon">${icon}</span>${label}</a>`).join('');
  return `
    <div class="slider" aria-hidden="true">
      <div class="slide active" style="background-image:url('images/shop-1.jpg')"></div>
      <div class="slide" style="background-image:url('images/shop-2.jpg')"></div>
      <div class="slide" style="background-image:url('images/shop-3.jpg')"></div>
    </div>
    <div class="shade"></div>
    <div class="dots"><i class="dot active"></i><i class="dot"></i><i class="dot"></i></div>
    <a class="logo" href="dashboard.html"><span>Shop</span> Camzon</a>
    <div class="label">Account</div>
    <nav class="nav">${makeLinks(SC_NAV)}</nav>
    <div class="label">Support</div>
    <nav class="nav">${makeLinks(SC_SUPPORT)}</nav>
    <div class="label">Information</div>
    <nav class="nav">${makeLinks(SC_INFO)}</nav>
    <div class="bottom"><button class="signout" id="sc-signout">🚪 Sign out</button></div>`;
}

function sidebarCss() {
  if (document.getElementById('sc-sidebar-style')) return;
  const style = document.createElement('style');
  style.id = 'sc-sidebar-style';
  style.textContent = `
    .sc-sidebar-generated{position:fixed;inset:0 auto 0 0;width:250px;background:#080808;color:#fff;padding:25px 16px;z-index:10000;overflow-y:auto;overflow-x:hidden;box-shadow:5px 0 25px #0002;font-family:Arial,Helvetica,sans-serif;scrollbar-width:thin}
    .sc-sidebar-generated .slider{position:absolute;inset:0;overflow:hidden;z-index:0}.sc-sidebar-generated .slide{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transition:opacity 1.2s}.sc-sidebar-generated .slide.active{opacity:1}.sc-sidebar-generated .shade{position:absolute;inset:0;background:#000b;z-index:1;pointer-events:none}.sc-sidebar-generated .dots{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);display:flex;gap:6px;z-index:3}.sc-sidebar-generated .dot{display:block;width:6px;height:6px;border-radius:50%;background:#ffffff66}.sc-sidebar-generated .dot.active{background:#d71920;width:18px;border-radius:5px}.sc-sidebar-generated>*:not(.slider):not(.shade):not(.dots){position:relative;z-index:4}.sc-sidebar-generated .logo{display:block;color:#fff;text-decoration:none;font-size:25px;font-weight:800;padding:0 12px 20px}.sc-sidebar-generated .logo span{color:#d71920}.sc-sidebar-generated .label{font-size:9px;color:#fff;text-transform:uppercase;letter-spacing:1.5px;font-weight:800;padding:9px 12px 6px}.sc-sidebar-generated .nav{display:flex;flex-direction:column;gap:3px}.sc-sidebar-generated .nav a{color:#fff;text-shadow:0 1px 3px #000;text-decoration:none;padding:9px 12px;border-radius:8px;font-size:12px;font-weight:600;display:flex;gap:11px;align-items:center}.sc-sidebar-generated .nav a:hover,.sc-sidebar-generated .nav a.active{background:#d71920;text-shadow:none}.sc-sidebar-generated .icon{width:20px;text-align:center;flex:none}.sc-sidebar-generated .bottom{position:sticky;left:0;right:0;bottom:0;margin-top:18px;padding-top:10px;background:linear-gradient(transparent,#080808 28%)}.sc-sidebar-generated .signout{width:100%;padding:11px;border:1px solid #fff8;border-radius:8px;background:#000c;color:#fff;font-size:12px;font-weight:700;cursor:pointer}.sc-main-shift{padding-left:250px;min-height:100vh}.sc-mobile-menu{display:none}
    @media(max-width:700px){.sc-sidebar-generated{transform:translateX(-100%);transition:transform .25s ease}.sc-sidebar-generated.open{transform:translateX(0)}.sc-main-shift{padding-left:0}.sc-mobile-menu{display:block;position:fixed;left:14px;top:14px;z-index:9999;border:1px solid #ddd;background:#fff;border-radius:8px;width:40px;height:40px;font-size:20px;cursor:pointer}.sc-sidebar-generated .bottom{position:sticky}}
  `;
  document.head.appendChild(style);
}

function initSharedSidebar() {
  if (!document.body) return;
  const path = location.pathname.split('/').pop() || 'index.html';
  const excluded = new Set(['index.html','login.html','signup.html','callback.html']);
  if (excluded.has(path)) return;
  sidebarCss();
  let sidebar = document.getElementById('sidebar');
  if (sidebar) {
    const navs = sidebar.querySelectorAll('.nav');
    if (navs.length) {
      const first = navs[0];
      first.innerHTML = SC_NAV.map(([href,icon,label]) => `<a href="${href}" class="${path===href?'active':''}"><span class="icon">${icon}</span>${label}</a>`).join('');
      const labels = sidebar.querySelectorAll('.label');
      if (labels[1]) labels[1].textContent = 'Support';
      if (labels[2]) labels[2].textContent = 'Information';
      if (labels.length < 3) {
        const support = document.createElement('div'); support.className='label'; support.textContent='Support';
        const supportNav=document.createElement('nav'); supportNav.className='nav'; supportNav.innerHTML=SC_SUPPORT.map(([href,icon,label])=>`<a href="${href}" class="${path===href?'active':''}"><span class="icon">${icon}</span>${label}</a>`).join('');
        const info=document.createElement('div'); info.className='label'; info.textContent='Information';
        const infoNav=document.createElement('nav'); infoNav.className='nav'; infoNav.innerHTML=SC_INFO.map(([href,icon,label])=>`<a href="${href}" class="${path===href?'active':''}"><span class="icon">${icon}</span>${label}</a>`).join('');
        sidebar.insertBefore(support, sidebar.querySelector('.bottom')); sidebar.insertBefore(supportNav, sidebar.querySelector('.bottom')); sidebar.insertBefore(info, sidebar.querySelector('.bottom')); sidebar.insertBefore(infoNav, sidebar.querySelector('.bottom'));
      }
    }
    let bottom=sidebar.querySelector('.bottom');
    if(!bottom){bottom=document.createElement('div');bottom.className='bottom';sidebar.appendChild(bottom)}
    bottom.innerHTML='<button class="signout" id="sc-signout">🚪 Sign out</button>';
    const old=sidebar.querySelector('#logout'); if(old) old.remove();
    document.getElementById('sc-signout')?.addEventListener('click',()=>App.signOut());
    return;
  }
  sidebar=document.createElement('aside'); sidebar.id='sidebar'; sidebar.className='sc-sidebar-generated'; sidebar.innerHTML=sidebarMarkup(path); document.body.prepend(sidebar);
  document.body.classList.add('sc-main-shift');
  const menu=document.createElement('button'); menu.className='sc-mobile-menu'; menu.id='sc-menu'; menu.textContent='☰'; document.body.prepend(menu);
  menu.addEventListener('click',()=>sidebar.classList.toggle('open'));
  document.addEventListener('click',e=>{if(window.innerWidth<=700&&sidebar.classList.contains('open')&&!sidebar.contains(e.target)&&e.target!==menu)sidebar.classList.remove('open')});
  document.getElementById('sc-signout')?.addEventListener('click',()=>App.signOut());
  const slides=[...sidebar.querySelectorAll('.slide')],dots=[...sidebar.querySelectorAll('.dot')]; let i=0;
  if(slides.length>1)setInterval(()=>{slides[i].classList.remove('active');dots[i]?.classList.remove('active');i=(i+1)%slides.length;slides[i].classList.add('active');dots[i]?.classList.add('active')},4000);
}

export const App = {
  async getSession() { const { data, error } = await supabase.auth.getSession(); if (error) throw error; return data.session; },
  async requireAuth({ redirect = 'login.html' } = {}) { const session = await this.getSession(); if (!session) { window.location.replace(redirect); return null; } return session; },
  async signOut({ redirect = 'login.html' } = {}) { await supabase.auth.signOut(); window.location.replace(redirect); },
  formatCurrency(value, currency = 'USD') { const locales = { USD:'en-US', NGN:'en-NG', XAF:'fr-CM' }; return new Intl.NumberFormat(locales[currency]||'en-US',{style:'currency',currency:currency==='CFA'?'XAF':currency,maximumFractionDigits:2}).format(Number(value)||0); },
  toast(message,type='info',duration=3500){let root=document.getElementById('sc-toast-root');if(!root){root=document.createElement('div');root.id='sc-toast-root';root.style.cssText='position:fixed;right:20px;bottom:20px;z-index:99999;display:flex;flex-direction:column;gap:10px;width:min(360px,calc(100vw - 30px));pointer-events:none';document.body.appendChild(root)}const toast=document.createElement('div');toast.setAttribute('role','status');toast.textContent=message;toast.style.cssText=`pointer-events:auto;padding:13px 16px;border-radius:10px;background:${type==='error'?'#b9151b':type==='success'?'#137333':'#171717'};color:#fff;font:600 13px Arial,sans-serif;box-shadow:0 10px 30px #0003;opacity:0;transform:translateY(12px);transition:.25s ease`;root.appendChild(toast);requestAnimationFrame(()=>{toast.style.opacity='1';toast.style.transform='translateY(0)'});setTimeout(()=>{toast.style.opacity='0';toast.style.transform='translateY(12px)';setTimeout(()=>toast.remove(),250)},duration)},
  protectPage(){document.addEventListener('contextmenu',e=>e.preventDefault());document.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(e.key==='F12'||(e.ctrlKey&&k==='u')||(e.ctrlKey&&e.shiftKey&&['i','j','c'].includes(k))||(e.metaKey&&e.altKey&&k==='i')){e.preventDefault();e.stopPropagation()}},true)},
  initMobileMenu(buttonSelector='#menu',sidebarSelector='#sidebar'){const b=document.querySelector(buttonSelector),s=document.querySelector(sidebarSelector);if(!b||!s)return;b.addEventListener('click',()=>s.classList.toggle('open'));document.addEventListener('click',e=>{if(innerWidth<=700&&s.classList.contains('open')&&!s.contains(e.target)&&e.target!==b)s.classList.remove('open')})},
  initImageLoading(){document.querySelectorAll('img[data-src]').forEach(img=>{img.loading='lazy';img.addEventListener('load',()=>img.classList.add('loaded'),{once:true});img.src=img.dataset.src})}
};

App.protectPage();
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initSharedSidebar); else initSharedSidebar();
