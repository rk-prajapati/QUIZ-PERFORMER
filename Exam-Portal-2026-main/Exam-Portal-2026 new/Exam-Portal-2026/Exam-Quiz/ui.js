/* UI helpers: toast, spinner, theme */
function toast(message, type = 'info', duration = 2800) {
  let wrap = document.querySelector('.toast-container');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'toast-container';
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info'}"></i> ${message}`;
  wrap.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(120%)'; }, duration - 300);
  setTimeout(() => el.remove(), duration);
}

const Theme = {
  init() {
    const saved = localStorage.getItem(DB_KEYS.THEME) || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.innerHTML = saved === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
      btn.onclick = () => this.toggle();
    }
  },
  toggle() {
    const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', cur);
    localStorage.setItem(DB_KEYS.THEME, cur);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.innerHTML = cur === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
  }
};

function renderNavbar(activeRole = null) {
  const session = Session.current();
  const nav = document.getElementById('navbar');
  if (!nav) return;
  const links = [];
  if (session) {
    if (session.role === 'admin') {
      links.push('<a href="admin.html"><i class="fa-solid fa-gauge"></i> <span>Admin</span></a>');
    } else {
      links.push('<a href="dashboard.html"><i class="fa-solid fa-house"></i> <span>Dashboard</span></a>');
      links.push('<a href="leaderboard.html"><i class="fa-solid fa-trophy"></i> <span>Leaderboard</span></a>');
    }
    links.push(`<span style="opacity:.85"><i class="fa-solid fa-user"></i> ${session.name}</span>`);
    links.push('<a href="#" onclick="if(window.handleLogout){handleLogout()}else{Session.logout();location.href=\'home.html\'};return false;"><i class="fa-solid fa-right-from-bracket"></i> <span>Logout</span></a>');
  } else {
    links.push('<a href="home.html">Home</a>');
    links.push('<a href="login.html">Login</a>');
    links.push('<a href="register.html">Register</a>');
  }
  nav.innerHTML = `
    <div class="brand"><i class="fa-solid fa-graduation-cap"></i> Exam Portal</div>
    <div class="nav-links">
      ${links.join('')}
      <button id="themeToggle" class="btn btn-ghost" title="Toggle theme" style="padding:8px 12px;"><i class="fa-solid fa-moon"></i></button>
    </div>
  `;
  Theme.init();
}

function renderFooter() {
  if (document.querySelector('.site-footer')) return;
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `&copy; ${new Date().getFullYear()} <strong>Prathmesh Dake</strong>. All rights reserved.`;
  document.body.appendChild(footer);
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  renderFooter();
});

function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  button.innerHTML = `<i class="fa-solid ${show ? 'fa-eye-slash' : 'fa-eye'}"></i>`;
  button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
}
