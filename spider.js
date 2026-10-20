/* ============================================================
   spider.js — Con nhện bò mô phỏng Procedural Inverse Kinematics (IK)
   Kế thừa hệ thống chân IK từ halloween_login.
   Được điều chỉnh để bò tuần tra & tương tác quanh khu vực mạng nhện (corner web).
   ============================================================ */
(() => {
  'use strict';

  const canvas = document.getElementById('halloween-spider');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer   = matchMedia('(any-pointer: fine)');

  const spider = {
    x: 100, y: 90,
    tx: 100, ty: 90,
    angle: Math.PI * 0.25,
    speed: 0,
    vx: 0, vy: 0
  };

  let dimensions = { w: window.innerWidth, h: window.innerHeight };
  let legs = [];
  let simTime = 0;
  let stepGroup = 0;
  let stepCooldown = 0;
  let active = false;
  let animationFrame = 0;
  let previous = 0;

  const getWebMaxRadius = () => Math.min(dimensions.w * 0.32, window.innerWidth < 640 ? 190 : 260);
  const WEB_MIN_RADIUS = 36;

  const patrolWaypoints = [
    { r: 85,  a: 0.25 },
    { r: 145, a: 0.55 },
    { r: 210, a: 0.78 },
    { r: 160, a: 1.15 },
    { r: 95,  a: 1.35 },
    { r: 125, a: 0.85 },
    { r: 185, a: 0.38 },
    { r: 175, a: 1.05 }
  ];

  let currentWaypoint = 0;
  let nextPatrolTime = 0;
  let spookedUntil = 0;
  let mouseNearby = false;
  let lastMouseTime = 0;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const mix   = (a, b, t) => a + (b - a) * t;
  const smooth = value => {
    const t = clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
  };

  const layout = [-1, -1, -1, -1, 1, 1, 1, 1];
  const bodyScale = () => (window.innerWidth < 640 ? 0.32 : 0.40);

  const localPoint = (x, y) => {
    const c = Math.cos(spider.angle);
    const s = Math.sin(spider.angle);
    const z = bodyScale();
    return {
      x: spider.x + (x * c - y * s) * z,
      y: spider.y + (x * s + y * c) * z,
    };
  };

  const restFoot = i => {
    const side = layout[i];
    const [spread, forward] = [[58, -65], [76, -34], [78, 24], [61, 66]][i % 4];
    return localPoint(side * spread, forward);
  };

  const hipPoint = i => {
    const side = layout[i];
    return localPoint(side * 12, [-23, -16, -8, 0][i % 4]);
  };

  function initializeFeet() {
    legs = layout.map((_, i) => {
      const p = restFoot(i);
      return {
        x: p.x,
        y: p.y,
        from: p,
        to: p,
        swing: 0,
        moving: false,
        lift: 0,
        group: (i % 4 + (i > 3 ? 1 : 0)) % 2,
        duration: 0.18
      };
    });
  }

  function resize() {
    dimensions = { w: window.innerWidth, h: window.innerHeight };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = dimensions.w * dpr;
    canvas.height = dimensions.h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const maxR = getWebMaxRadius();
    spider.x  = clamp(spider.x, 35, maxR);
    spider.y  = clamp(spider.y, 35, maxR);
    spider.tx = clamp(spider.tx, 35, maxR);
    spider.ty = clamp(spider.ty, 35, maxR);

    initializeFeet();
    if (active && reducedMotion.matches) render();
  }
  function updateFeet(dt, moving) {
    if (!legs.length) initializeFeet();
    stepCooldown -= dt;

    for (const foot of legs) {
      if (!foot.moving) continue;
      foot.swing += dt / foot.duration;
      const t = clamp(foot.swing, 0, 1);
      const e = smooth(t);
      foot.x = mix(foot.from.x, foot.to.x, e);
      foot.y = mix(foot.from.y, foot.to.y, e);
      foot.lift = Math.sin(t * Math.PI) * 3.5 * bodyScale();
      if (t >= 1) {
        foot.moving = false;
        foot.lift = 0;
      }
    }

    if (stepCooldown > 0 || legs.some(foot => foot.moving)) return;

    for (let attempt = 0; attempt < 2; attempt++) {
      let changed = false;
      legs.forEach((foot, i) => {
        if (foot.group !== stepGroup) return;
        const desired = restFoot(i);
        const deviation = Math.hypot(foot.x - desired.x, foot.y - desired.y);
        if (deviation > (moving ? 14 : 9) * bodyScale()) {
          const lead = moving ? 0.12 : 0;
          foot.from = { x: foot.x, y: foot.y };
          foot.to   = { x: desired.x + spider.vx * lead, y: desired.y + spider.vy * lead };
          foot.swing = -((i % 4) * 0.035);
          foot.duration = moving ? 0.14 : 0.2;
          foot.moving = true;
          changed = true;
        }
      });
      stepGroup = 1 - stepGroup;
      if (changed) {
        stepCooldown = 0.02;
        break;
      }
    }
  }

  function legKnee(i, tip, lift) {
    const side = layout[i];
    const [spread, y] = [[36, -54], [55, -40], [58, 12], [45, 45]][i % 4];
    const bend = localPoint(side * spread, y);
    const rest = restFoot(i);
    return {
      x: bend.x + (tip.x - rest.x) * 0.25,
      y: bend.y + (tip.y - rest.y) * 0.25 - lift
    };
  }

  function drawLeg(i) {
    const foot = legs[i];
    const hip  = hipPoint(i);
    const z    = bodyScale();
    const tip  = { x: foot.x, y: foot.y - foot.lift * 0.25 };
    const knee = legKnee(i, tip, foot.lift);
    const dx   = tip.x - knee.x;
    const dy   = tip.y - knee.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    const ankle = {
      x: mix(knee.x, tip.x, 0.76) - dy / length * z * 2,
      y: mix(knee.y, tip.y, 0.76) + dx / length * z * 2
    };

    function segment(a, b, rootRadius, endRadius) {
      const vx = b.x - a.x;
      const vy = b.y - a.y;
      const len = Math.max(1, Math.hypot(vx, vy));
      const nx = -vy / len;
      const ny =  vx / len;
      const r1 = rootRadius * z * 0.8;
      const r2 = endRadius  * z * 0.8;

      const skin = ctx.createLinearGradient(a.x + nx * r1, a.y + ny * r1, a.x - nx * r1, a.y - ny * r1);
      skin.addColorStop(0,    '#f0b67c');
      skin.addColorStop(0.45, '#b57852');
      skin.addColorStop(1,    '#654052');

      ctx.beginPath();
      ctx.moveTo(a.x + nx * r1, a.y + ny * r1);
      ctx.lineTo(b.x + nx * r2, b.y + ny * r2);
      ctx.quadraticCurveTo(b.x + vx / len * r2, b.y + vy / len * r2, b.x - nx * r2, b.y - ny * r2);
      ctx.lineTo(a.x - nx * r1, a.y - ny * r1);
      ctx.quadraticCurveTo(a.x - vx / len * r1, a.y - vy / len * r1, a.x + nx * r1, a.y + ny * r1);
      ctx.fillStyle = skin;
      ctx.shadowColor = '#ffad59';
      ctx.shadowBlur = 1.6;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = 'rgba(255, 207, 150, 0.56)';
      ctx.lineWidth = 0.55;
      ctx.beginPath();
      ctx.moveTo(a.x + nx * r1 * 0.45, a.y + ny * r1 * 0.45);
      ctx.lineTo(b.x + nx * r2 * 0.45, b.y + ny * r2 * 0.45);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(219, 172, 129, 0.5)';
      ctx.lineWidth = 0.45;
      for (let j = 1; j <= 5; j++) {
        const t = j / 7;
        const r = mix(r1, r2, t);
        const hair = (1.6 + (j + i) % 3 * 0.6) * z;
        for (const s of [-1, 1]) {
          const x = mix(a.x, b.x, t) + nx * r * s;
          const y = mix(a.y, b.y, t) + ny * r * s;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + nx * hair * s - vx / len * z, y + ny * hair * s - vy / len * z);
          ctx.stroke();
        }
      }
    }

    segment(hip, knee, 4.6, 3.2);
    segment(knee, ankle, 2.8, 1.4);
    segment(ankle, tip, 1.3, 0.12);

    for (const [joint, next, r] of [[knee, ankle, 2.4], [ankle, tip, 1.25]]) {
      const angle = Math.atan2(next.y - joint.y, next.x - joint.x);
      ctx.fillStyle = '#4b2d30';
      ctx.beginPath();
      ctx.ellipse(joint.x, joint.y, r * z * 0.8, r * 0.62 * z * 0.8, angle + Math.PI / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(234, 177, 122, 0.44)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(joint.x, joint.y, r * z * 0.8, angle + Math.PI * 0.6, angle + Math.PI * 1.25);
      ctx.stroke();
    }
  }

  function drawBody() {
    const breath = reducedMotion.matches ? 0 : Math.sin(simTime * 2.5) * 0.45;
    ctx.save();
    ctx.translate(spider.x, spider.y);
    ctx.rotate(spider.angle);
    ctx.scale(bodyScale(), bodyScale());
    ctx.translate(0, breath);

    ctx.shadowColor = '#ffac56';
    ctx.shadowBlur = 7;
    ctx.shadowOffsetY = 0;

    function segment(x, y, rx, ry) {
      const skin = ctx.createRadialGradient(x - rx * 0.35, y - ry * 0.3, 2, x, y, ry * 1.1);
      skin.addColorStop(0,   '#d5a078');
      skin.addColorStop(0.4, '#a76850');
      skin.addColorStop(1,   '#49324b');
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      ctx.strokeStyle = 'rgba(247, 183, 118, 0.62)';
      ctx.lineWidth = 0.6;
      for (let i = 0; i < 76; i++) {
        const a = i * Math.PI * 2 / 76;
        const variation = Math.sin(i * 7.31);
        const px = x + Math.cos(a) * rx * 0.94;
        const py = y + Math.sin(a) * ry * 0.94;
        const length = 1.6 + (variation + 1) * 1.1;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(a + 0.16) * length, py + Math.sin(a + 0.16) * length);
        ctx.stroke();
      }
    }

    segment(0, 15, 25, 27);
    segment(0, -15, 12.5, 14);

    const glow = reducedMotion.matches ? 1 : 0.88 + Math.sin(simTime * 2.1) * 0.12;
    ctx.save();
    ctx.globalAlpha = glow;
    ctx.shadowColor = '#ffbe62';
    ctx.shadowBlur = 10;
    const markings = ctx.createLinearGradient(0, -6, 0, 39);
    markings.addColorStop(0,    '#fff1b6');
    markings.addColorStop(0.55, '#ffd17c');
    markings.addColorStop(1,    '#ff9b53');
    ctx.fillStyle = markings;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.bezierCurveTo(-4, -1, -3, 5, -7, 8);
    ctx.quadraticCurveTo(-4, 11, -6, 15);
    ctx.quadraticCurveTo(-2, 19, -4, 23);
    ctx.quadraticCurveTo(-1, 28, 0, 36);
    ctx.quadraticCurveTo(1, 28, 4, 23);
    ctx.quadraticCurveTo(2, 19, 6, 15);
    ctx.quadraticCurveTo(4, 11, 7, 8);
    ctx.bezierCurveTo(3, 5, 4, -1, 0, -6);
    ctx.closePath();
    ctx.fill();

    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const y = 1 + i * 8;
        const spread = 16 - Math.abs(i - 1) * 2;
        ctx.beginPath();
        ctx.moveTo(side * 4, y + 5);
        ctx.bezierCurveTo(side * 8, y + 2, side * (spread - 3), y + 4, side * spread, y - 1);
        ctx.quadraticCurveTo(side * (spread + 1), y + 3, side * (spread - 4), y + 7);
        ctx.quadraticCurveTo(side * 8, y + 7, side * 4, y + 5);
        ctx.closePath();
        ctx.fill();
      }
      ctx.beginPath();
      ctx.ellipse(side * 18, 15, 1.2, 2.2, side * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 3;
    ctx.strokeStyle = '#fff5cb';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.bezierCurveTo(-1, 8, 1, 20, 0, 32);
    ctx.stroke();
    ctx.restore();

    for (const [x, y, r] of [
      [-4, -24, 1.8], [4, -24, 1.8],
      [-9, -21, 1.1], [9, -21, 1.1],
      [-6, -27, 1.0], [6, -27, 1.0]
    ]) {
      ctx.fillStyle = '#ffc079';
      ctx.shadowColor = '#ffad59';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(224, 195, 166, 0.85)';
      ctx.beginPath();
      ctx.arc(x - 0.4, y - 0.5, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#80533d';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 3, -26);
      ctx.quadraticCurveTo(side * 10, -28, side * 7, -35);
      ctx.quadraticCurveTo(side * 3, -33, side * 2, -29);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#dba16b';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(side * 10, -23);
      ctx.quadraticCurveTo(side * 17, -29, side * 13, -32);
      ctx.stroke();
    }

    ctx.restore();
  }

  function render() {
    ctx.clearRect(0, 0, dimensions.w, dimensions.h);
    for (let i = 0; i < legs.length; i++) {
      drawLeg(i);
    }
    drawBody();
  }

  function updateWebTarget(now) {
    const maxR = getWebMaxRadius();

    if (now < spookedUntil) {
      spider.tx = 45;
      spider.ty = 45;
      return;
    }

    if (mouseNearby && now - lastMouseTime < 2800) {
      return;
    }

    if (now >= nextPatrolTime) {
      currentWaypoint = (currentWaypoint + 1) % patrolWaypoints.length;
      const wp = patrolWaypoints[currentWaypoint];
      const r = clamp(wp.r, WEB_MIN_RADIUS, maxR - 25);
      spider.tx = Math.cos(wp.a) * r;
      spider.ty = Math.sin(wp.a) * r;
      nextPatrolTime = now + (3200 + Math.random() * 2300);
    }
  }

  function tick(now) {
    if (!active) return;
    const dt = Math.min((now - previous) / 1000, 0.04);
    previous = now;
    simTime += dt;

    updateWebTarget(now);

    const dx = spider.tx - spider.x;
    const dy = spider.ty - spider.y;
    const distance = Math.hypot(dx, dy);

    const facing = Math.atan2(dy, dx) + Math.PI / 2;
    const turn = Math.atan2(Math.sin(facing - spider.angle), Math.cos(facing - spider.angle));

    if (distance > 22) {
      spider.angle += clamp(turn, -dt * 4.0, dt * 4.0);
    }

    const alignment = Math.max(0, Math.cos(turn));
    const desiredSpeed = distance > 22 ? Math.min(180, (distance - 20) * 5) * alignment * alignment : 0;
    spider.speed = mix(spider.speed, desiredSpeed, 1 - Math.exp(-dt * 9));

    const travel = Math.min(spider.speed * dt, Math.max(0, distance - 20));
    const previousX = spider.x;
    const previousY = spider.y;

    if (travel > 0) {
      spider.x += Math.sin(spider.angle) * travel;
      spider.y -= Math.cos(spider.angle) * travel;
    }

    spider.vx = (spider.x - previousX) / Math.max(dt, 0.001);
    spider.vy = (spider.y - previousY) / Math.max(dt, 0.001);

    updateFeet(dt, travel > 0.06);
    render();

    animationFrame = requestAnimationFrame(tick);
  }

  function syncMode() {
    const isHalloween = document.body.classList.contains('theme-halloween');
    const enabled = isHalloween && finePointer.matches;

    if (enabled === active) return;
    active = enabled;
    cancelAnimationFrame(animationFrame);

    canvas.classList.toggle('is-active', active);

    if (!active) {
      ctx.clearRect(0, 0, dimensions.w, dimensions.h);
      return;
    }

    spider.x  = spider.tx = 100;
    spider.y  = spider.ty = 85;
    spider.angle = Math.PI * 0.25;
    spider.speed = 0;
    spider.vx = 0;
    spider.vy = 0;
    stepGroup = 0;
    stepCooldown = 0;
    nextPatrolTime = performance.now() + 2000;

    initializeFeet();
    previous = performance.now();
    render();

    if (!reducedMotion.matches) {
      animationFrame = requestAnimationFrame(tick);
    }
  }

  document.addEventListener('pointermove', event => {
    if (!active || event.pointerType === 'touch' || reducedMotion.matches) return;

    const mx = event.clientX;
    const my = event.clientY;
    const distFromOrigin = Math.hypot(mx, my);
    const maxR = getWebMaxRadius();

    const distToSpider = Math.hypot(mx - spider.x, my - spider.y);
    if (distToSpider < 38) {
      spookedUntil = performance.now() + 1600;
      return;
    }

    if (distFromOrigin < maxR + 110) {
      mouseNearby = true;
      lastMouseTime = performance.now();

      const angle = Math.atan2(Math.max(15, my), Math.max(15, mx));
      const targetR = clamp(distFromOrigin, WEB_MIN_RADIUS, maxR - 20);

      spider.tx = Math.cos(angle) * targetR;
      spider.ty = Math.sin(angle) * targetR;
    } else {
      mouseNearby = false;
    }
  }, { passive: true });

  window.addEventListener('resize', resize);

  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(animationFrame);
    previous = performance.now();
    if (active && !document.hidden && !reducedMotion.matches) {
      animationFrame = requestAnimationFrame(tick);
    }
  });

  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      cancelAnimationFrame(animationFrame);
      render();
    } else if (active) {
      previous = performance.now();
      animationFrame = requestAnimationFrame(tick);
    }
  });

  const observer = new MutationObserver(() => syncMode());
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  window.syncSpiderMode = syncMode;

  resize();
  syncMode();
})();
