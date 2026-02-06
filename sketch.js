let particles = [];
let ripples = [];
let sparks = [];

const IS_MOBILE = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const N = IS_MOBILE ? 60 : 120;

let currentColor;
let targetColor;

// 클릭 후 끌림 유지
let clickAttractFrames = 0;
let clickX = 0;
let clickY = 0;

function setup() {
  frameRate(30);
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
    // ✅ 시작 속도부터 더 빠르게
    const a = random(TWO_PI);
    const sp = random(0.8, 2.4);
    particles.push({
      x: random(width),
      y: random(height),
      vx: cos(a) * sp,
      vy: sin(a) * sp,
      r: random(1.2, 2.6),
      seed: random(1000)
    });
  }
  ripples = [];
  sparks = [];
}

function draw() {
  background(7, 7, 10, 18);

  // 색 변화 더 빠르게
  currentColor = lerpColor(currentColor, targetColor, 0.16);

  const mx = touches.length ? touches[0].x : mouseX;
  const my = touches.length ? touches[0].y : mouseY;

  if (clickAttractFrames > 0) clickAttractFrames--;

  const hasClickAttractor = clickAttractFrames > 0;
  const ax = hasClickAttractor ? clickX : mx;
  const ay = hasClickAttractor ? clickY : my;

  // ripple
  for (let i = ripples.length - 1; i >= 0; i--) {
    const rp = ripples[i];
    rp.radius += rp.speed;
    rp.alpha *= 0.93;

    noFill();
    stroke(255, rp.alpha);
    strokeWeight(1.3);
    circle(rp.x, rp.y, rp.radius * 2);

    if (rp.alpha < 2) ripples.splice(i, 1);
  }

  // sparks
  noStroke();
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.vx *= 0.95;
    s.vy *= 0.95;
    s.vy += 0.02;
    s.x += s.vx;
    s.y += s.vy;

    s.life *= 0.89;

    fill(255, 255 * s.life);
    circle(s.x, s.y, s.size);

    fill(255, 28 * s.life);
    circle(s.x, s.y, s.size * 3.5);

    if (s.life < 0.05) sparks.splice(i, 1);
  }

  const cr = red(currentColor);
  const cg = green(currentColor);
  const cb = blue(currentColor);

  for (const p of particles) {
    // 바람(조금 더 강하게)
    const n = noise(p.seed, frameCount * 0.004);
    const wind = map(n, 0, 1, -0.35, 0.35);
    p.vx += wind * 0.03;
    p.vy += -wind * 0.02;

    // 끌림: 멀리서도 반응하도록 완충(분모)을 줄이고 영향 범위 넓힘
    const dragging = touches.length > 0 || mouseIsPressed || hasClickAttractor;
    if (dragging) {
      const dx = ax - p.x;
      const dy = ay - p.y;

      // ✅ 멀리 있는 애들도 빨리 움직이게: 거리 기반 감쇠를 부드럽게
      const d = sqrt(dx * dx + dy * dy);
      const falloff = 1 / (1 + d * 0.006); // d 커져도 0으로 안 떨어짐

      const d2 = dx * dx + dy * dy;
      const pull = 9000 / (d2 + 260); // 강하게
      const k = 0.030 * falloff;

      p.vx += dx * pull * k;
      p.vy += dy * pull * k;
    }

    // ✅ 마찰을 줄여서 덜 느려지게
    p.vx *= 0.993;
    p.vy *= 0.993;

    const sp = sqrt(p.vx * p.vx + p.vy * p.vy);

    // ✅ 속도 상한 크게
    const maxSp = 7.0;
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
