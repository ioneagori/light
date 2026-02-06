let particles = [];
let ripples = [];
const N = 120;

let currentColor;

function setup() {
  pixelDensity(1); // 성능 안정
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
      vx: random(-0.6, 0.6),
      vy: random(-0.6, 0.6),
      r: random(1.2, 2.6),
      seed: random(1000)
    });
  }
  ripples = [];
}

function draw() {
  // ✅ 블러 없음, 잔상만 유지
  background(7, 7, 10, 18);

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

  noStroke();

  for (const p of particles) {
    // 미세한 바람
    const n = noise(p.seed, frameCount * 0.004);
    const wind = map(n, 0, 1, -0.25, 0.25);
    p.vx += wind * 0.02;
    p.vy += -wind * 0.01;

    // 마우스/터치 끌림
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
