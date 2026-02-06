let particles = [];
let ripples = [];

// 성능 최우선
const N = 45;

let currentColor;

function setup() {
  pixelDensity(1);
  createCanvas(windowWidth, windowHeight);
  initParticles();
  noStroke();
  currentColor = randomPastel();
}

function initParticles() {
  particles = [];
  for (let i = 0; i < N; i++) {
    particles.push({
      x: random(width),
      y: random(height),
      vx: random(-0.45, 0.45),
      vy: random(-0.45, 0.45),
      r: random(1.6, 3.2),
      seed: random(1000)
    });
  }
  ripples = [];
}

function draw() {
  // 잔상(너무 길면 누적 부담 ↑라 적당히)
  background(7, 7, 10, 22);

  const mx = touches.length ? touches[0].x : mouseX;
  const my = touches.length ? touches[0].y : mouseY;

  // 렌즈 가중치: 중앙(선명) / 바깥(흐림) 느낌을 "크기/알파"로 흉내냄
  const cx = width * 0.5;
  const cy = height * 0.5;
  const innerR = min(width, height) * 0.22;
  const outerR = min(width, height) * 0.68;

  // ripples (가벼운 선)
  for (let i = ripples.length - 1; i >= 0; i--) {
    const rp = ripples[i];
    rp.radius += rp.speed;
    rp.alpha *= 0.94;

    noFill();
    stroke(255, rp.alpha);
    strokeWeight(1);
    circle(rp.x, rp.y, rp.radius * 2);

    if (rp.alpha < 2) ripples.splice(i, 1);
  }

  noStroke();

  for (const p of particles) {
    // 미세 바람(노이즈)
    const n = noise(p.seed, frameCount * 0.004);
    const wind = map(n, 0, 1, -0.22, 0.22);
    p.vx += wind * 0.016;
    p.vy += -wind * 0.01;

    // 드래그/터치 끌어당김(부담 줄이려고 강도 낮춤)
    const dragging = touches.length > 0 || mouseIsPressed;
    if (dragging) {
      const dx = mx - p.x;
      const dy = my - p.y;
      const d2 = dx * dx + dy * dy;
      const pull = 900 / (d2 + 1800);
      p.vx += dx * pull * 0.01;
      p.vy += dy * pull * 0.01;
    }

    // 마찰
    p.vx *= 0.985;
    p.vy *= 0.985;

    // 속도 제한
    const sp = sqrt(p.vx * p.vx + p.vy * p.vy);
    const maxSp = 1.6;
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

    // 중앙/바깥 렌즈 가중치 계산(0=중앙, 1=바깥)
    const dxC = p.x - cx;
    const dyC = p.y - cy;
    const d = sqrt(dxC * dxC + dyC * dyC);
    const t = constrain((d - innerR) / (outerR - innerR), 0, 1);

    // 렌즈 느낌:
    // - 중앙은 선명: 작은 글로우, 알파 높음
    // - 바깥은 흐릿: 큰 글로우, 알파 낮음
    const edgeGlowMult = lerp(1.0, 2.2, t);
    const edgeAlphaMult = lerp(1.0, 0.55, t);

    const cr = red(currentColor);
    const cg = green(currentColor);
    const cb = blue(currentColor);

    // 속도 → "가짜 블러" (필터 없이 글로우 원을 더 크게)
    const speedGlow = map(sp, 0, maxSp, 1.0, 1.8);

    // 중심 점(선명)
    fill(cr, cg, cb, 180 * edgeAlphaMult);
    circle(p.x, p.y, p.r * 2.6);

    // 글로우 1 (부드러운 번짐)
    fill(cr, cg, cb, 45 * edgeAlphaMult);
    circle(p.x, p.y, p.r * 6.0 * edgeGlowMult * speedGlow);

    // 글로우 2 (더 큰 번짐 — 필터 대신 이게 블러 역할)
    fill(cr, cg, cb, 18 * edgeAlphaMult);
    circle(p.x, p.y, p.r * 11.0 * edgeGlowMult * speedGlow);
  }

  // 끌어당기는 링(선명)
  if (touches.length > 0 || mouseIsPressed) {
    noFill();
    stroke(255, 18);
    strokeWeight(1);
    circle(mx, my, 70);
  }
}

function mousePressed() {
  currentColor = randomPastel();
  // "클릭 블러 폭발"을 필터 대신 글로우 폭발로 구현:
  // 파동을 하나 더 크게 추가해서 순간적으로 번짐이 확 커지는 느낌
  addRipple(mouseX, mouseY, 4.2, 110); // 빠르고 밝게
  addRipple(mouseX, mouseY, 2.8, 80);  // 기본
}

function touchStarted() {
  currentColor = randomPastel();
  if (touches.length) {
    addRipple(touches[0].x, touches[0].y, 4.2, 110);
    addRipple(touches[0].x, touches[0].y, 2.8, 80);
  }
  return false;
}

function addRipple(x, y, speed = 3.2, alpha = 85) {
  ripples.push({ x, y, radius: 0, speed, alpha });
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
