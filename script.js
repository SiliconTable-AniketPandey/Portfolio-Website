(() => {
  const toggle = document.getElementById('theme-toggle');
  let theme = 'dark';
  try { theme = localStorage.getItem('theme') || 'dark'; } catch (_) {}
  const applyTheme = () => {
    document.body.classList.toggle('dark-mode', theme !== 'light');
    if (toggle) {
      toggle.textContent = theme === 'light' ? 'Dark theme' : 'Light theme';
      toggle.setAttribute('aria-label', `Switch to ${theme === 'light' ? 'dark' : 'light'} theme`);
    }
  };
  applyTheme();
  toggle?.addEventListener('click', () => {
    theme = theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('theme', theme); } catch (_) {}
    applyTheme();
  });
})();
