import { supabase } from './supabase.js';

// Shared Shop Camzon application helpers.
export const App = {
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async requireAuth({ redirect = 'login.html' } = {}) {
    const session = await this.getSession();
    if (!session) {
      window.location.replace(redirect);
      return null;
    }
    return session;
  },

  async signOut({ redirect = 'login.html' } = {}) {
    await supabase.auth.signOut();
    window.location.replace(redirect);
  },

  formatCurrency(value, currency = 'USD') {
    const locales = { USD: 'en-US', NGN: 'en-NG', XAF: 'fr-CM' };
    return new Intl.NumberFormat(locales[currency] || 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2
    }).format(Number(value) || 0);
  },

  toast(message, type = 'info', duration = 3500) {
    let root = document.getElementById('sc-toast-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'sc-toast-root';
      root.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:99999;display:flex;flex-direction:column;gap:10px;width:min(360px,calc(100vw - 30px));pointer-events:none';
      document.body.appendChild(root);
    }
    const toast = document.createElement('div');
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    toast.style.cssText = `pointer-events:auto;padding:13px 16px;border-radius:10px;background:${type === 'error' ? '#b9151b' : type === 'success' ? '#137333' : '#171717'};color:#fff;font:600 13px Arial,sans-serif;box-shadow:0 10px 30px #0003;opacity:0;transform:translateY(12px);transition:.25s ease`;
    root.appendChild(toast);
    requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; });
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  },

  protectPage() {
    // These are deterrents, not security controls. Database/RLS rules remain the real protection.
    document.addEventListener('contextmenu', event => event.preventDefault());
    document.addEventListener('keydown', event => {
      const key = event.key.toLowerCase();
      if (event.key === 'F12' ||
          (event.ctrlKey && key === 'u') ||
          (event.ctrlKey && event.shiftKey && ['i', 'j', 'c'].includes(key)) ||
          (event.metaKey && event.altKey && key === 'i')) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);
  },

  initMobileMenu(buttonSelector = '#menu', sidebarSelector = '#sidebar') {
    const button = document.querySelector(buttonSelector);
    const sidebar = document.querySelector(sidebarSelector);
    if (!button || !sidebar) return;
    button.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', event => {
      if (window.innerWidth <= 700 && sidebar.classList.contains('open') &&
          !sidebar.contains(event.target) && event.target !== button) {
        sidebar.classList.remove('open');
      }
    });
  },

  initImageLoading() {
    document.querySelectorAll('img[data-src]').forEach(img => {
      img.loading = 'lazy';
      img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
      img.src = img.dataset.src;
    });
  }
};

// Enable the lightweight UI protections on every page that imports app.js.
App.protectPage();
