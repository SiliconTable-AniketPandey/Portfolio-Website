(() => {
  'use strict';
  const article = document.querySelector('.report-article');
  const size = document.getElementById('reading-size');
  try { size.value = localStorage.getItem('report-reading-size') === 'large' ? 'large' : 'standard'; } catch (_) {}
  const applySize = () => article.classList.toggle('large-text', size.value === 'large');
  applySize();
  size.addEventListener('change', () => {
    applySize();
    try { localStorage.setItem('report-reading-size', size.value); } catch (_) {}
    updateProgress();
  });

  const detailElements = [...article.querySelectorAll('details')];
  const expand = document.getElementById('expand-details');
  const syncExpand = () => {
    const allOpen = detailElements.every(detail => detail.open);
    expand.textContent = allOpen ? 'Collapse all details' : 'Expand all details';
    expand.setAttribute('aria-expanded', String(allOpen));
  };
  expand.addEventListener('click', () => {
    const open = !detailElements.every(detail => detail.open);
    detailElements.forEach(detail => { detail.open = open; });
    syncExpand();
  });
  detailElements.forEach(detail => detail.addEventListener('toggle', syncExpand));
  document.getElementById('print-report').addEventListener('click', () => window.print());
  let beforePrintState;
  window.addEventListener('beforeprint', () => {
    beforePrintState = detailElements.map(detail => detail.open);
    detailElements.forEach(detail => { detail.open = true; });
    stopDemo();
  });
  window.addEventListener('afterprint', () => {
    detailElements.forEach((detail, i) => { detail.open = beforePrintState?.[i] ?? false; });
  });

  const sections = [...article.querySelectorAll('.report-section')];
  const navLinks = [...document.querySelectorAll('.report-sidebar nav a')];
  const progress = document.getElementById('reading-progress');
  function updateProgress() {
    const start = article.getBoundingClientRect().top + window.scrollY;
    const distance = Math.max(1, article.offsetHeight - window.innerHeight);
    progress.style.width = `${Math.min(100, Math.max(0, (window.scrollY - start) / distance * 100))}%`;
    const current = [...sections].reverse().find(section => section.getBoundingClientRect().top <= 150) || sections[0];
    navLinks.forEach(link => {
      if (link.hash === `#${current.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  let pending = false;
  window.addEventListener('scroll', () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { updateProgress(); pending = false; });
  }, { passive: true });
  window.addEventListener('resize', updateProgress);
  new ResizeObserver(updateProgress).observe(article);
  updateProgress();

  const dialog = document.getElementById('figure-dialog');
  document.querySelectorAll('[data-enlarge]').forEach(button => {
    button.addEventListener('click', () => {
      const image = button.querySelector('img');
      const enlarged = document.getElementById('enlarged-figure');
      enlarged.src = button.dataset.enlarge;
      enlarged.alt = image.alt;
      document.getElementById('figure-title').textContent = image.alt;
      dialog.showModal();
    });
  });
  document.getElementById('close-figure').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

  const position = document.getElementById('answer-position');
  position?.addEventListener('change', () => {
    const rank = Number(position.value);
    document.getElementById('map-score').textContent = (rank ? 1 / rank : 0).toFixed(4);
    document.getElementById('map-explanation').textContent = rank ? `A correct answer in position ${rank} earns 1/${rank} of a point for this question.` : 'A correct answer outside the top three earns 0 points for this question.';
  });

  const metric = document.getElementById('metric-select');
  const models = [
    { name: 'Scratch BiGRU', map: 0.5590, accuracy: 0.3762, f1: 0.3648 },
    { name: 'DeBERTa-v3-base', map: 0.5131, accuracy: 0.3610, f1: 0.3596 },
    { name: 'Canonical + TF-IDF', map: 0.5311, accuracy: 0.3900, f1: 0.3736 },
    { name: 'Weighted ensemble', map: 0.5226, accuracy: 0.3582, f1: 0.3437 }
  ];
  const renderMetrics = () => {
    if (!metric) return;
    document.getElementById('metric-bars').replaceChildren(...models.map(model => {
      const row = document.createElement('div');
      const label = document.createElement('div');
      label.className = 'metric-label';
      const name = document.createElement('span');
      name.textContent = model.name;
      const value = document.createElement('strong');
      value.textContent = model[metric.value].toFixed(4);
      label.append(name, value);
      const track = document.createElement('div');
      track.className = 'bar-track';
      track.setAttribute('aria-hidden', 'true');
      const bar = document.createElement('span');
      bar.className = 'bar-fill';
      bar.style.width = `${model[metric.value] * 100}%`;
      track.append(bar);
      row.append(label, track);
      return row;
    }));
  };
  metric?.addEventListener('change', renderMetrics);
  renderMetrics();

  const demos = {
    'admin-dashboard': { title: 'Admin dashboard', description: 'An operational overview with platform statistics, trek management, staff assignments, and account controls.', alt: 'EverTrek admin dashboard showing platform statistics and upcoming expeditions', size: '43 MB', width: 1340, height: 757 },
    landing: { title: 'Trek discovery', description: 'Browse routes, search by trek or location, and filter by difficulty, duration, and availability.', alt: 'EverTrek discovery page with search, filters and trekking routes', size: '48 MB', width: 1316, height: 752 },
    'staff-dashboard': { title: 'Staff dashboard', description: 'Review assigned treks, participant lists, available slots, and expedition status in a dedicated staff workspace.', alt: 'EverTrek staff workspace with upcoming assignments and slot controls', size: '36 MB', width: 1346, height: 758 },
    'user-dashboard': { title: 'Trekker dashboard', description: 'Manage upcoming bookings, review trekking history, update a profile, and request a booking-history export.', alt: 'EverTrek trekker dashboard with bookings, profile and history export', size: '36 MB', width: 1324, height: 764 },
    login: { title: 'Sign in and registration', description: 'A dedicated entry point for the application, with registration and access to each role’s workspace.', alt: 'EverTrek sign-in and registration screen', size: '19 MB', width: 1330, height: 726 },
    'celery-email': { title: 'Background email workflow', description: 'An example of the account-verification email delivered as part of the application’s background task workflow.', alt: 'EverTrek account-verification email', size: '21 MB', width: 1166, height: 1158 }
  };
  let selectedDemo = 'admin-dashboard';
  let playing = false;
  const demoImage = document.getElementById('demo-image');
  const play = document.getElementById('demo-play');
  const status = document.getElementById('demo-status');
  function stopDemo() {
    if (!demoImage) return;
    playing = false;
    demoImage.src = `assets/reports/${selectedDemo}-poster.webp`;
    play.textContent = 'Play demo';
    play.setAttribute('aria-pressed', 'false');
    status.textContent = `Still preview. The original recording is approximately ${demos[selectedDemo].size}.`;
  }
  document.querySelectorAll('[data-demo]').forEach(button => {
    button.addEventListener('click', () => {
      selectedDemo = button.dataset.demo;
      const selected = demos[selectedDemo];
      document.getElementById('demo-title').textContent = selected.title;
      document.getElementById('demo-description').textContent = selected.description;
      demoImage.alt = selected.alt;
      demoImage.width = selected.width;
      demoImage.height = selected.height;
      document.querySelectorAll('[data-demo]').forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
      stopDemo();
    });
  });
  play?.addEventListener('click', () => {
    if (playing) return stopDemo();
    playing = true;
    status.textContent = `Loading ${demos[selectedDemo].size} recording. You can stop it at any time.`;
    demoImage.src = `Docs/EverTrek%20Gifs/${selectedDemo}.gif`;
    play.textContent = 'Stop demo';
    play.setAttribute('aria-pressed', 'true');
  });
  demoImage?.addEventListener('load', () => {
    if (playing) status.textContent = 'Playing original recording. Stop returns to the still preview.';
  });
  demoImage?.addEventListener('error', () => {
    if (playing) {
      stopDemo();
      status.textContent = 'The recording could not load. Select Play demo to try again.';
    } else status.textContent = 'The preview could not load. You can still try the recording.';
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) stopDemo(); });

  const search = document.getElementById('api-search');
  const rows = [...document.querySelectorAll('#api-table tbody tr')];
  search?.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase();
    rows.forEach(row => { row.hidden = !row.textContent.toLowerCase().includes(query); });
    const count = rows.filter(row => !row.hidden).length;
    document.getElementById('api-count').textContent = `${count} of ${rows.length} endpoints shown.`;
    document.getElementById('api-empty').hidden = count !== 0;
  });
})();
