let particles = [];
let ripples = [];
let sparks = [];

const N = 120;

let currentColor;
let targetColor;

function setup() {
  pixelDensity(1);
  createCanvas(windowWidth, windowHeight);
  initParticles();
  noStroke();

  currentColor = randomPastel();
  targetColor = randomPastel();
}

function initParticles() {
  particles = [];
  for (let i = 0; i < N; i++) {
    particles.push({
      x: random(width),
      y: random(height),
      vx: random(-0.6, 0.6),
      vy: random(-0.6, 0.6),
      r: random(1.2, 2.6),
      seed: random(1000)
    });
  }
  ripples = [];
  sparks = [];
}

function draw() {
  background(7, 7, 10, 18);

  // ✅ 색 변화 더 빠르게
  currentColor = lerpColor(currentColor, targetColor, 0.12);

  const mx = touches.length ? touches[0].x : mouseX;
  const my = touches.length ? touches[0].y : mouseY;

  // ripple (속도 ↑)
  for (let i = ripples.length - 1; i >= 0; i--) {
    const rp = ripples[i];
    rp.radius += rp.speed;
    rp.alpha *= 0.94;

    noFill();
    stroke(255, rp.alpha);
    strokeWeight(1.3);
    circle(rp.x, rp.y, rp.radius * 2);

    if (rp.alpha < 2) ripples.splice(i, 1);
  }

  // sparks (속도 ↑)
  noStroke();
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.vx *= 0.96;
    s.vy *= 0.96;
    s.vy += 0.02;
    s.x += s.vx;
    s.y += s.vy;

    s.life *= 0.90;

    fill(255, 255 * s.life);
    circle(s.x, s.y, s.size);

    fill(255, 30 * s.life);
    circle(s.x, s.y, s.size * 3.5);

    if (s.life < 0.05) sparks.splice(i, 1);
  }

  const cr = red(currentColor);
  const cg = green(currentColor);
  const cb = blue(currentColor);

  // particles
  for (const p of particles) {
    const n = noise(p.seed, frameCount * 0.004);
    const wind = map(n, 0, 1, -0.25, 0.25);
    p.vx += wind * 0.02;
    p.vy += -wind * 0.01;

    // ✅ 끌림 반응 더 빠르게
    const dragging = touches.length > 0 || mouseIsPressed;
    if (dragging) {
      const dx = mx - p.x;
      const dy = my - p.y;
      const d2 = dx * dx + dy * dy;
      const pull = 2600 / (d2 + 900); // ← 여기 핵심
      p.vx += dx * pull * 0.015;
      p.vy += dy * pull * 0.015;
    }

    p.vx *= 0.98;
    p.vy *= 0.98;

    const sp = sqrt(p.vx * p.vx + p.vy * p.vy);
    const maxSp = 2.6;
    if (sp > maxSp) {
      p.vx = (p.vx / sp) * maxSp;
      p.vy = (p.vy / sp) * maxSp;
    }

    p.x += p.vx;
    p.y += p.vy;

    if (p.x < -10) p.x = width + 10;
    if (p.x > width + 10) p.x = -10;
    if (p.y < -10) p.y = height + 10;
    if (p.y > height + 10) p.y = -10;

    const glow = map(sp, 0, maxSp, 90, 230);

    fill(cr, cg, cb, glow);
    circle(p.x, p.y, p.r * 4.2);

    fill(cr, cg, cb, 34);
    circle(p.x, p.y, p.r * 10.5);
  }

  // 중심 가이드
  if (touches.length > 0 || mouseIsPressed) {
    noFill();
    stroke(255, 26);
    strokeWeight(1.2);
    circle(mx, my, 85);
  }
}

function mousePressed() {
  targetColor = randomPastel();
  addRipple(mouseX, mouseY);
  addSparks(mouseX, mouseY);
}

function touchStarted() {
  targetColor = randomPastel();
  if (touches.length) {
    addRipple(touches[0].x, touches[0].y);
    addSparks(touches[0].x, touches[0].y);
  }
  return false;
}

function addRipple(x, y) {
  ripples.push({
    x, y,
    radius: 0,
    speed: 5.0, // ✅ 파동 속도 ↑
    alpha: 95
  });
}

function addSparks(x, y) {
  const count = 12;
  for (let i = 0; i < count; i++) {
    const a = random(TWO_PI);
    const sp = random(1.2, 3.2); // ✅ 스파클 속도 ↑
    sparks.push({
      x: x,
      y: y,
      vx: cos(a) * sp,
      vy: sin(a) * sp,
      life: random(0.7, 1.0),
      size: random(1.2, 2.4)
    });
  }
}

function keyPressed() {
  if (key === 'r' || key === 'R') initParticles();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function randomPastel() {
  const r = random(150, 255);
  const g = random(150, 255);
  const b = random(150, 255);
  return color(r, g, b);
}
