/* ============================================================
   main.js — Đọc CONTENT từ content.js, dựng DOM, xử lý:
   · Ngôn ngữ (EN/VI) + lưu localStorage
   · Menu active theo scroll (IntersectionObserver)
   · Fade-in section khi cuộn vào
   · Bottom nav trên mobile (clone từ main nav)
   ============================================================ */

(function () {
  'use strict';

  /* --- State --- */
  let currentLang = localStorage.getItem('lang') || 'en';

  /* --- Helpers --- */
  function t(obj) {
    if (typeof obj === 'string') return obj;
    return obj[currentLang] || obj['en'] || '';
  }

  function el(tag, attrs, ...children) {
    attrs = attrs || {};
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'className') e.className = v;
      else if (k === 'innerHTML') e.innerHTML = v;
      else e.setAttribute(k, v);
    });
    children.forEach(c => {
      if (typeof c === 'string') e.appendChild(document.createTextNode(c));
      else if (c) e.appendChild(c);
    });
    return e;
  }

  /* --- SVG Icons --- */
  const ICONS = {
    github:   '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    email:    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>'
  };

  /* ============================================================
     BUILD FUNCTIONS — mỗi section độc lập, bọc try/catch
     ============================================================ */

  function buildMeta() {
    try {
      document.getElementById('site-name').textContent    = CONTENT.name;
      document.getElementById('site-title').textContent   = t(CONTENT.title);
      document.getElementById('site-tagline').textContent = t(CONTENT.tagline);

      const cvLabel = document.getElementById('cv-label');
      if (cvLabel && CONTENT.cv) {
        cvLabel.textContent = t(CONTENT.cv.label);
      }
      const cvBtn = document.getElementById('cv-btn');
      if (cvBtn && CONTENT.cv && CONTENT.cv.url) {
        cvBtn.href = CONTENT.cv.url;
      }
    } catch (e) { console.warn('[main] buildMeta:', e); }
  }

  function buildNav() {
    try {
      document.querySelectorAll('.nav-link').forEach(link => {
        const key = link.dataset.section;
        if (CONTENT.nav[key]) link.textContent = t(CONTENT.nav[key]);
      });
    } catch (e) { console.warn('[main] buildNav:', e); }
  }

  function buildContact() {
    try {
      const container = document.getElementById('contact-icons');
      container.innerHTML = '';
      CONTENT.contact.forEach(item => {
        if (!item.url || item.url === '#') return;

        /* Xử lý riêng cho icon Email: hiện popover bên phải khi bấm */
        if (item.icon === 'email') {
          const wrap = el('div', { className: 'email-wrap' });

          const trigger = el('button', {
            id: 'email-trigger',
            type: 'button',
            className: 'contact-icon-btn',
            'aria-label': 'Email: ' + (item.email || item.url),
            title: 'Email: ' + (item.email || item.url),
            innerHTML: ICONS.email || ''
          });

          const popover = el('div', { id: 'email-popover', className: 'email-popover hidden', role: 'dialog' });
          const popHeader = el('div', { className: 'popover-header' });
          popHeader.appendChild(el('span', { className: 'popover-title' }, '✉️ Email'));

          const closeBtn = el('button', { type: 'button', className: 'popover-close', 'aria-label': 'Close' }, '×');
          closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            popover.classList.add('hidden');
          });
          popHeader.appendChild(closeBtn);

          const mailRow = el('div', { className: 'popover-email-row' });
          const emailValue = item.email || item.url.replace('mailto:', '');
          mailRow.appendChild(el('span', { className: 'popover-email-text' }, emailValue));

          const actions = el('div', { className: 'popover-actions' });
          const copyBtn = el('button', { type: 'button', className: 'popover-btn copy-btn' },
            currentLang === 'vi' ? '📋 Sao chép' : '📋 Copy');

          copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const onSuccess = () => {
              copyBtn.textContent = currentLang === 'vi' ? '✓ Đã chép' : '✓ Copied';
              copyBtn.classList.add('copied');
              setTimeout(() => {
                copyBtn.textContent = currentLang === 'vi' ? '📋 Sao chép' : '📋 Copy';
                copyBtn.classList.remove('copied');
              }, 2000);
            };

            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(emailValue).then(onSuccess).catch(() => {
                const temp = document.createElement('textarea');
                temp.value = emailValue;
                document.body.appendChild(temp);
                temp.select();
                document.execCommand('copy');
                document.body.removeChild(temp);
                onSuccess();
              });
            } else {
              const temp = document.createElement('textarea');
              temp.value = emailValue;
              document.body.appendChild(temp);
              temp.select();
              document.execCommand('copy');
              document.body.removeChild(temp);
              onSuccess();
            }
          });

          actions.appendChild(copyBtn);

          popover.appendChild(popHeader);
          popover.appendChild(mailRow);
          popover.appendChild(actions);

          /* Click icon Email: bật / tắt popover */
          trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            popover.classList.toggle('hidden');
          });

          /* Click trong popover không làm ẩn hộp */
          popover.addEventListener('click', (e) => {
            e.stopPropagation();
          });

          wrap.appendChild(trigger);
          wrap.appendChild(popover);
          container.appendChild(wrap);
          return;
        }

        /* Các icon liên hệ thông thường (GitHub, Facebook, LinkedIn...) */
        const a = el('a', {
          href: item.url, target: '_blank',
          rel: 'noopener noreferrer',
          'aria-label': item.label, title: item.label,
          innerHTML: ICONS[item.icon] || ''
        });
        container.appendChild(a);
      });
    } catch (e) { console.warn('[main] buildContact:', e); }
  }

  function buildAbout() {
    try {
      const section = document.getElementById('about');
      section.innerHTML = '';
      section.appendChild(el('h2', { className: 'section-title' }, t(CONTENT.nav.about)));
      const wrapper = el('div', { className: 'about-text' });
      const paragraphs = CONTENT.about[currentLang] || CONTENT.about['en'];
      paragraphs.forEach(p => wrapper.appendChild(el('p', {}, p)));
      section.appendChild(wrapper);
    } catch (e) {
      console.warn('[main] buildAbout:', e);
      document.getElementById('about').textContent = 'About section unavailable.';
    }
  }

  function buildAchievements() {
    try {
      const section = document.getElementById('achievements');
      section.innerHTML = '';
      section.appendChild(el('h2', { className: 'section-title' }, t(CONTENT.nav.achievements)));
      const data = CONTENT.achievements;
      /* Competitions */
      const compGroup = el('div', { className: 'achieve-group' });
      compGroup.appendChild(el('h3', { className: 'achieve-group-title' },
        '\uD83C\uDFC6 ' + (currentLang === 'vi' ? 'Cuộc thi' : 'Competitions')));
      data.competitions.forEach(item => {
        const row = el('div', { className: 'achieve-item' });
        const nameEl = item.link
          ? el('a', { href: item.link, target: '_blank', rel: 'noopener noreferrer', className: 'achieve-name' }, t(item.name))
          : el('span', { className: 'achieve-name' }, t(item.name));
        row.appendChild(nameEl);
        row.appendChild(el('span', { className: 'achieve-detail' }, t(item.detail)));
        row.appendChild(el('span', { className: 'achieve-year' }, item.year));
        compGroup.appendChild(row);
      });
      section.appendChild(compGroup);
      /* Certifications */
      const certGroup = el('div', { className: 'achieve-group' });
      certGroup.appendChild(el('h3', { className: 'achieve-group-title' },
        '\uD83D\uDCDC ' + (currentLang === 'vi' ? 'Chứng chỉ' : 'Certifications')));
      data.certifications.forEach(item => {
        const row = el('div', { className: 'achieve-item' });
        const nameEl = item.link
          ? el('a', { href: item.link, target: '_blank', rel: 'noopener noreferrer', className: 'achieve-name' }, item.name)
          : el('span', { className: 'achieve-name' }, item.name);
        row.appendChild(nameEl);
        row.appendChild(el('span', { className: 'achieve-detail' }, item.issuer));
        row.appendChild(el('span', { className: 'achieve-year' }, item.date));
        certGroup.appendChild(row);
      });
      section.appendChild(certGroup);
      /* Modules expand/collapse */
      const modGroup = el('div', { className: 'achieve-group' });
      const modLabel = currentLang === 'vi' ? 'Module liên quan' : 'Related Modules';
      const modToggle = el('button', { className: 'modules-toggle', 'aria-expanded': 'false' },
        '\uD83D\uDCDA ' + modLabel + ' (' + data.modules.length + ') \u2014 ' + data.modulesDate);
      const modList = el('ul', { className: 'modules-list hidden' });
      data.modules.forEach(m => modList.appendChild(el('li', {}, m)));
      modToggle.addEventListener('click', () => {
        const open = modToggle.getAttribute('aria-expanded') === 'true';
        modToggle.setAttribute('aria-expanded', String(!open));
        modList.classList.toggle('hidden');
      });
      modGroup.appendChild(modToggle);
      modGroup.appendChild(modList);
      section.appendChild(modGroup);
    } catch (e) {
      console.warn('[main] buildAchievements:', e);
      document.getElementById('achievements').textContent = 'Achievements section unavailable.';
    }
  }

  function buildProjects() {
    try {
      const section = document.getElementById('projects');
      section.innerHTML = '';
      section.appendChild(el('h2', { className: 'section-title' }, t(CONTENT.nav.projects)));
      CONTENT.projects.forEach(project => {
        const card = el('div', { className: 'project-card' });
        const nameEl = project.link
          ? el('a', { href: project.link, target: '_blank', rel: 'noopener noreferrer', className: 'project-name' }, project.name)
          : el('span', { className: 'project-name' }, project.name);
        const meta = el('div', { className: 'project-meta' });
        meta.appendChild(el('span', { className: 'project-type' }, t(project.type)));
        meta.appendChild(el('span', { className: 'project-role' }, t(project.role)));
        const desc = el('p', { className: 'project-desc' }, t(project.description));
        const stackEl = el('div', { className: 'project-stack' });
        project.stack.forEach(s => stackEl.appendChild(el('span', { className: 'stack-tag' }, s)));
        card.appendChild(nameEl);
        card.appendChild(meta);
        card.appendChild(desc);
        card.appendChild(stackEl);
        section.appendChild(card);
      });
    } catch (e) {
      console.warn('[main] buildProjects:', e);
      document.getElementById('projects').textContent = 'Projects section unavailable.';
    }
  }

  function buildNotes() {
    try {
      const section = document.getElementById('notes');
      section.innerHTML = '';
      section.appendChild(el('h2', { className: 'section-title' }, t(CONTENT.nav.notes)));
      if (!CONTENT.notes || CONTENT.notes.length === 0) {
        section.appendChild(el('p', { className: 'notes-placeholder' },
          currentLang === 'vi'
            ? 'Đang chuẩn bị — writeup và ghi chú kỹ thuật sẽ được thêm vào sớm.'
            : 'Coming soon — writeups and technical notes will be added here.'));
        return;
      }
      CONTENT.notes.forEach(note => {
        const card = el('div', { className: 'note-card' });
        card.appendChild(el('a', { href: note.url, target: '_blank', rel: 'noopener noreferrer', className: 'note-title' }, note.title));
        const noteMeta = el('div', { className: 'note-meta' });
        noteMeta.appendChild(el('span', { className: 'note-platform' }, note.platform));
        noteMeta.appendChild(el('span', { className: 'note-date' }, note.date));
        const tagEl = el('div', { className: 'note-tags' });
        note.tags.forEach(tag => tagEl.appendChild(el('span', { className: 'note-tag' }, '#' + tag)));
        card.appendChild(noteMeta);
        card.appendChild(tagEl);
        section.appendChild(card);
      });
    } catch (e) {
      console.warn('[main] buildNotes:', e);
      document.getElementById('notes').textContent = 'Notes section unavailable.';
    }
  }

  function buildAll() {
    buildMeta(); buildNav(); buildContact();
    buildAbout(); buildAchievements(); buildProjects(); buildNotes();
  }

  /* LANGUAGE TOGGLE */
  function updateLangButton(btn) {
    btn.innerHTML =
      '<span class="lang-tag' + (currentLang === 'en' ? ' active' : '') + '">EN</span>' +
      '<span class="lang-sep">/</span>' +
      '<span class="lang-tag' + (currentLang === 'vi' ? ' active' : '') + '">VI</span>';
    document.documentElement.lang = currentLang;
  }

  function initLangToggle() {
    const btn = document.getElementById('lang-toggle');
    if (!btn) return;
    updateLangButton(btn);
    btn.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'vi' : 'en';
      localStorage.setItem('lang', currentLang);
      updateLangButton(btn);
      buildAll();
      requestAnimationFrame(initScrollObserver);
    });
  }

  /* SCROLL OBSERVER */
  let _fadeObs   = null;
  let _activeObs = null;
  let _scrollLock = false;   /* khóa observer khi đang scroll do click nav */
  let _scrollTimer = null;

  function setActive(id) {
    document.querySelectorAll('.nav-link').forEach(link =>
      link.classList.toggle('active', link.dataset.section === id)
    );
  }

  function initScrollObserver() {
    if (_fadeObs)   { _fadeObs.disconnect();   _fadeObs   = null; }
    if (_activeObs) { _activeObs.disconnect(); _activeObs = null; }

    const sections = document.querySelectorAll('.section');

    /* Fade-in: không liên quan đến scrollLock */
    _fadeObs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.08 });

    /* Active nav: chỉ cập nhật khi KHÔNG đang scroll do click */
    _activeObs = new IntersectionObserver(entries => {
      if (_scrollLock) return;   /* đang scroll do click → bỏ qua */
      entries.forEach(e => {
        if (e.isIntersecting) setActive(e.target.id);
      });
    }, {
      threshold: 0,
      rootMargin: '-40% 0px -55% 0px'  /* chỉ active khi section ở giữa màn hình */
    });

    sections.forEach(s => { _fadeObs.observe(s); _activeObs.observe(s); });

    /* Section đầu luôn visible khi load */
    const first = document.querySelector('.section');
    if (first) {
      first.classList.add('visible');
      setActive(first.id);
    }
  }

  /* Gắn click vào tất cả nav links (cả sidebar + bottom nav) — CHỈ GẮN 1 LẦN */
  function bindNavClicks() {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        const targetId = link.dataset.section;
        if (!targetId) return;

        /* Set active ngay khi click — không đợi observer */
        setActive(targetId);

        /* Khóa observer trong 800ms (đủ để smooth scroll xong) */
        _scrollLock = true;
        clearTimeout(_scrollTimer);
        _scrollTimer = setTimeout(() => { _scrollLock = false; }, 800);
      });
    });
  }

  /* MOBILE BOTTOM NAV */
  function initBottomNav() {
    const old = document.getElementById('bottom-nav');
    if (old) old.remove();
    const nav = el('nav', { id: 'bottom-nav', 'aria-label': 'Mobile navigation' });
    Object.entries(CONTENT.nav).forEach(([key, label]) => {
      nav.appendChild(el('a', { href: '#' + key, className: 'nav-link', 'data-section': key }, t(label)));
    });
    document.body.appendChild(nav);
  }

  /* MODE TOGGLE */
  function initModeToggle() {
    const btn = document.getElementById('mode-toggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (typeof window.toggleEventMode === 'function') window.toggleEventMode();
    });
  }

  /* INIT */
  function init() {
    initBottomNav();     /* Dựng bottom nav trước để gom đủ tất cả .nav-link */
    buildAll();          /* Đổ dữ liệu từ content.js vào DOM */
    initLangToggle();
    initModeToggle();
    bindNavClicks();     /* Gắn click duy nhất 1 lần, không bị duplicate khi đổi ngôn ngữ */

    /* Luôn scroll về đầu trang khi load/F5
       — tránh browser nhớ scroll position cũ làm active sai */
    if (history.scrollRestoration) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, behavior: 'instant' });

    /* Click ra ngoài ẩn email popover */
    document.addEventListener('click', (e) => {
      const popover = document.getElementById('email-popover');
      const trigger = document.getElementById('email-trigger');
      if (!popover || popover.classList.contains('hidden')) return;
      if (!popover.contains(e.target) && (!trigger || !trigger.contains(e.target))) {
        popover.classList.add('hidden');
      }
    });

    requestAnimationFrame(initScrollObserver);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

