/* ============================================================
   effects.js — Canvas hiệu ứng nền + Event Mode (Halloween Pack)
   Hỗ trợ 2 chế độ:
     1. Default: "Night Snow" — Chùm sáng xanh + Tuyết rơi 3 lớp
     2. Event:   "Halloween"  — Hào quang bí ngô & tàn lửa (embers)
   ============================================================ */

(function () {
  'use strict';

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  /* ============================================================
     HỆ THỐNG EVENT PLUG-IN REGISTRY (MỞ RỘNG ĐƯỢC)
     ============================================================ */
  const EVENT_REGISTRY = {
    halloween: {
      id: 'halloween',
      name: 'Halloween',
      label: '🎃 Halloween',
      bodyClass: 'theme-halloween',
      /* Tự detect ngày: Tháng 10 (1–31/10) (JS month: 9) */
      isSeasonal: () => {
        const d = new Date();
        return d.getMonth() === 9;
      }
    }
  };

  /* Giải quyết mode khởi động:
     · Lần đầu vào luôn là Night Snow
     · Nếu đã lưu event: kiểm tra nếu hết hạn mùa thì tự fallback về Night Snow
     · Nếu có lỗi -> fallback về Night Snow */
  function resolveInitialMode() {
    try {
      const savedMode = localStorage.getItem('portfolioMode');
      if (!savedMode || savedMode === 'default') {
        return 'default';
      }

      const targetId = (savedMode === 'event') ? 'halloween' : savedMode;
      const eventConfig = EVENT_REGISTRY[targetId];

      if (!eventConfig) {
        localStorage.setItem('portfolioMode', 'default');
        return 'default';
      }

      if (!eventConfig.isSeasonal()) {
        console.info(`[EventRegistry] Sự kiện ${eventConfig.name} đã qua mùa. Tự động chuyển về Night Snow.`);
        localStorage.setItem('portfolioMode', 'default');
        return 'default';
      }

      return targetId;
    } catch (e) {
      console.warn('[EventRegistry] Lỗi đọc cấu hình event:', e);
      return 'default';
    }
  }

  function isEventActive() {
    return currentMode === 'halloween' || currentMode === 'event';
  }

  let currentMode  = resolveInitialMode();
  let W = 0, H = 0;
  let paused       = false;
  let glowGradient = null;

  /* Phát hiện mobile (< 768px) để tối ưu số hạt */
  const isMobile = () => window.innerWidth < 768;
  let wasMobile  = window.innerWidth < 768;

  /* --- Resize --- */
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildGlow();

    const nowMobile = isMobile();
    if (nowMobile !== wasMobile) {
      wasMobile = nowMobile;
      initParticles();
    }
  }
  window.addEventListener('resize', resize);

  /* Tạm dừng loop khi tab bị ẩn */
  document.addEventListener('visibilitychange', () => { paused = document.hidden; });

  /* ============================================================
     1. CHÙM HÀO QUANG (RADIAL GLOW)
     ============================================================ */
  function buildGlow() {
    const cx = W * 0.18;
    const cy = H * 0.08;
    const r  = W * 0.65;
    const g  = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);

    if (isEventActive()) {
      /* Halloween: Ánh cam bí ngô pha tím đậm ma mị */
      g.addColorStop(0,    'rgba(249, 115, 22, 0.09)');
      g.addColorStop(0.35, 'rgba(234, 88, 12, 0.045)');
      g.addColorStop(0.7,  'rgba(168, 85, 247, 0.02)');
      g.addColorStop(1,    'rgba(15, 10, 25, 0)');
    } else {
      /* Night Snow: Xanh băng thanh lịch */
      g.addColorStop(0,    'rgba(96, 165, 250, 0.07)');
      g.addColorStop(0.35, 'rgba(96, 165, 250, 0.04)');
      g.addColorStop(0.7,  'rgba(96, 165, 250, 0.015)');
      g.addColorStop(1,    'rgba(96, 165, 250, 0)');
    }
    glowGradient = g;
  }

  function drawGlow() {
    if (!glowGradient) return;
    ctx.save();
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  /* ============================================================
     2. CẤU HÌNH HẠT
     ============================================================ */
  const SNOW_LAYERS = [
    { count: 60, rMin: 0.5, rMax: 1.2, speedMin: 0.3, speedMax: 0.6, opacity: 0.25, wind: 0.08 },
    { count: 40, rMin: 1.2, rMax: 2.2, speedMin: 0.6, speedMax: 1.1, opacity: 0.40, wind: 0.15 },
    { count: 25, rMin: 2.2, rMax: 3.5, speedMin: 1.1, speedMax: 1.8, opacity: 0.55, wind: 0.25 },
  ];

  const EMBER_PALETTE = ['#f97316', '#fb923c', '#fbbf24', '#ef4444', '#c084fc'];

  let particles = [];
  let bats = [];

  function createSnowFlake(layer, randomY) {
    return {
      type:        'snow',
      x:           Math.random() * W,
      y:           randomY ? Math.random() * H : -10,
      r:           layer.rMin + Math.random() * (layer.rMax - layer.rMin),
      speed:       layer.speedMin + Math.random() * (layer.speedMax - layer.speedMin),
      wind:        layer.wind,
      opacity:     layer.opacity * (0.7 + Math.random() * 0.3),
      wobble:      Math.random() * Math.PI * 2,
      wobbleSpeed: 0.005 + Math.random() * 0.015,
    };
  }

  function createEmber(randomY) {
    const color = EMBER_PALETTE[Math.floor(Math.random() * EMBER_PALETTE.length)];
    const r = 0.8 + Math.random() * 2.2;
    return {
      type:        'ember',
      x:           Math.random() * W,
      y:           randomY ? Math.random() * H : H + 12,
      r:           r,
      baseOpacity: 0.3 + Math.random() * 0.5,
      opacity:     0.3 + Math.random() * 0.5,
      color:       color,
      speedY:      0.4 + Math.random() * 0.9,
      driftSpeed:  0.01 + Math.random() * 0.02,
      driftAngle:  Math.random() * Math.PI * 2,
      pulseSpeed:  0.02 + Math.random() * 0.04,
      pulse:       Math.random() * Math.PI * 2,
    };
  }

  function createBat() {
    const fromLeft = Math.random() > 0.5;
    return {
      x:         fromLeft ? -40 : W + 40,
      y:         Math.random() * (H * 0.65),
      vx:        (fromLeft ? 1 : -1) * (1.6 + Math.random() * 1.4),
      vy:        (Math.random() - 0.5) * 0.8,
      size:      14 + Math.random() * 12,
      flap:      0,
      flapSpeed: 0.15 + Math.random() * 0.1,
      opacity:   0.25 + Math.random() * 0.35,
    };
  }

  function initParticles() {
    particles = [];
    bats = [];

    if (isEventActive()) {
      const count = isMobile() ? 40 : 85;
      for (let i = 0; i < count; i++) {
        particles.push(createEmber(true));
      }
      const batCount = isMobile() ? 0 : 1;
      for (let i = 0; i < batCount; i++) {
        const b = createBat();
        b.x = Math.random() * W;
        bats.push(b);
      }
    } else {
      SNOW_LAYERS.forEach(layer => {
        const count = isMobile() ? Math.ceil(layer.count * 0.45) : layer.count;
        for (let i = 0; i < count; i++) {
          particles.push(createSnowFlake(layer, true));
        }
      });
    }
  }

  function updateParticles() {
    if (isEventActive()) {
      particles.forEach((p, i) => {
        p.driftAngle += p.driftSpeed;
        p.pulse      += p.pulseSpeed;
        p.x          += Math.sin(p.driftAngle) * 0.6;
        p.y          -= p.speedY;
        p.opacity     = p.baseOpacity * (0.65 + 0.35 * Math.sin(p.pulse));

        if (p.y < -15) particles[i] = createEmber(false);
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
      });

      bats.forEach((b, i) => {
        b.x    += b.vx;
        b.y    += Math.sin(b.flap) * 0.7 + b.vy;
        b.flap += b.flapSpeed;
        if ((b.vx > 0 && b.x > W + 50) || (b.vx < 0 && b.x < -50)) {
          bats[i] = createBat();
        }
      });
    } else {
      const globalWind = Math.sin(Date.now() * 0.0003) * 0.3;
      particles.forEach((f, i) => {
        f.wobble += f.wobbleSpeed;
        f.x      += Math.sin(f.wobble) * f.wind + globalWind * f.wind;
        f.y      += f.speed;

        if (f.y > H + f.r) {
          const li = f.r < 1.2 ? 0 : f.r < 2.2 ? 1 : 2;
          const newF = createSnowFlake(SNOW_LAYERS[li], false);
          newF.x = Math.random() * W;
          newF.y = -newF.r;
          particles[i] = newF;
        }
        if (f.x > W + f.r) f.x = -f.r;
        if (f.x < -f.r)    f.x = W + f.r;
      });
    }
  }

  function drawBatShape(ctx, b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    if (b.vx < 0) ctx.scale(-1, 1);
    ctx.globalAlpha = b.opacity;
    ctx.fillStyle = '#0f0a17';
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 0.5;

    const s = b.size;
    const wingY = Math.sin(b.flap) * (s * 0.35);

    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.25, s * 0.15, 0, 0, Math.PI * 2);
    ctx.moveTo(-s * 0.1, 0);
    ctx.quadraticCurveTo(-s * 0.6, -s * 0.5 + wingY, -s, -s * 0.2 + wingY);
    ctx.quadraticCurveTo(-s * 0.7, s * 0.2 + wingY, -s * 0.4, 0);
    ctx.quadraticCurveTo(-s * 0.25, s * 0.2, 0, s * 0.1);
    ctx.moveTo(s * 0.1, 0);
    ctx.quadraticCurveTo(s * 0.6, -s * 0.5 + wingY, s, -s * 0.2 + wingY);
    ctx.quadraticCurveTo(s * 0.7, s * 0.2 + wingY, s * 0.4, 0);
    ctx.quadraticCurveTo(s * 0.25, s * 0.2, 0, s * 0.1);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawParticles() {
    if (isEventActive()) {
      particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle   = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur  = p.r * 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      bats.forEach(b => drawBatShape(ctx, b));
    } else {
      particles.forEach(f => {
        ctx.save();
        ctx.globalAlpha = f.opacity;
        ctx.fillStyle   = '#ffffff';
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }
  }

  /* ============================================================
     3. MAIN LOOP
     ============================================================ */
  function loop() {
    requestAnimationFrame(loop);
    if (paused) return;
    ctx.clearRect(0, 0, W, H);
    drawGlow();
    drawParticles();
    updateParticles();
  }

  /* Đồng bộ class body và nhãn nút */
  function applyThemeDOM() {
    Object.values(EVENT_REGISTRY).forEach(cfg => {
      document.body.classList.remove(cfg.bodyClass);
    });

    const activeConfig = EVENT_REGISTRY[currentMode];
    if (activeConfig) {
      document.body.classList.add(activeConfig.bodyClass);
    }

    const label = document.getElementById('mode-label');
    if (label) {
      label.textContent = activeConfig ? activeConfig.label : '🌙 Night Snow';
    }
  }

  /* ============================================================
     4. INIT
     ============================================================ */
  function init() {
    resize();
    applyThemeDOM();
    initParticles();

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReduced) {
      loop();
    } else {
      drawGlow();
    }
  }

  /* ============================================================
     5. API CÔNG KHAI — main.js gọi khi click đổi mode
     ============================================================ */
  window.toggleEventMode = function () {
    currentMode = (currentMode === 'default') ? 'halloween' : 'default';
    try {
      localStorage.setItem('portfolioMode', currentMode);
    } catch (e) {}

    applyThemeDOM();
    buildGlow();
    initParticles();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
