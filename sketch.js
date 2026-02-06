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
  // 잔상 (숫자 ↑ = 더 빨리 지워져 가벼워짐 / 숫자 ↓ = 더 길게 남음)
  background(7, 7, 10, 18);

  // ✅ 색이 서서히 바뀌게(크로스페이드)
  currentColor = lerpColor(currentColor, targetColor, 0.06);

  const mx = touches.length ? touches[0].x : mouseX;
  const my = touches.length ? touches[0].y : mouseY;

  // ripple
  for (let i = ripples.length - 1; i >= 0; i--) {
    const rp = ripples[i];
    rp.radius += rp.speed;
    rp.alpha *= 0.96;

    noFill();
    stroke(255, rp.alpha);
    strokeWeight(1.2);
    circle(rp.x, rp.y, rp.radius * 2);

    if (rp.alpha < 2) ripples.splice(i, 1);
  }

  // ✅ 스파클(별가루)
  noStroke();
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.vx *= 0.98;
    s.vy *= 0.98;
    s.vy += 0.01; // 아주 약한 중력 느낌
    s.x += s.vx;
    s.y += s.vy;

    s.life *= 0.92;

    // 아주 작은 반짝 점
    fill(255, 255 * s.life);
    circle(s.x, s.y, s.size);

    // 미세 글로우
    fill(255, 35 * s.life);
    circle(s.x, s.y, s.size * 3.5);

    if (s.life < 0.05) sparks.splice(i, 1);
  }

  // particles
  noStroke();

  const cr = red(currentColor);
  const cg = green(currentColor);
  const cb = blue(currentColor);

  for (const p of particles) {
    // 미세한 바람
    const n = noise(p.seed, frameCount * 0.004);
    const wind = map(n, 0, 1, -0.25, 0.25);
    p.vx += wind * 0.02;
    p.vy += -wind * 0.01;

    // 끌어당김
    const dragging = touches.length > 0 || mouseIsPressed;
    if (dragging) {
      const dx = mx - p.x;
      const dy = my - p.y;
      const d2 = dx * dx + dy * dy;
      const pull = 1500 / (d2 + 1200);
      p.vx += dx * pull * 0.01;
      p.vy += dy * pull * 0.01;
    }

    // 마찰
    p.vx *= 0.985;
    p.vy *= 0.985;

    const sp = sqrt(p.vx * p.vx + p.vy * p.vy);
    const maxSp = 2.2;
    if (sp > maxSp) {
      p.vx = (p.vx / sp) * maxSp;
      p.vy = (p.vy / sp) * maxSp;
    }

    p.x += p.vx;
    p.y += p.vy;

    // 워프
    if (p.x < -10) p.x = width + 10;
    if (p.x > width + 10) p.x = -10;
    if (p.y < -10) p.y = height + 10;
    if (p.y > height + 10) p.y = -10;

    const glow = map(sp, 0, maxSp, 80, 220);

    // 중심
    fill(cr, cg, cb, glow);
    circle(p.x, p.y, p.r * 4.0);

    // 퍼지는 빛(블러 아님: 큰 원)
    fill(cr, cg, cb, 32);
    circle(p.x, p.y, p.r * 10.0);
  }

  // 중심 가이드
  if (touches.length > 0 || mouseIsPressed) {
    noFill();
    stroke(255, 22);
    strokeWeight(1);
    circle(mx, my, 80);
  }
}

function mousePressed() {
  // 클릭하면 색 목표가 바뀌고(부드럽게 따라감), 파동+별가루
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
    speed: 3.6,
    alpha: 90
  });
}

function addSparks(x, y) {
  // 성능 안전: 10~14개 정도
  const count = 12;
  for (let i = 0; i < count; i++) {
    const a = random(TWO_PI);
    const sp = random(0.4, 1.8);
    sparks.push({
      x: x + random(-2, 2),
      y: y + random(-2, 2),
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
