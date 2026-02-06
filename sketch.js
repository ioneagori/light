let particles = [];
let ripples = [];
const N = 220;

function setup() {
  createCanvas(windowWidth, windowHeight);
  initParticles();
  noStroke();
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
  background(7, 7, 10, 28);

  const mx = touches.length ? touches[0].x : mouseX;
  const my = touches.length ? touches[0].y : mouseY;

  // ripple
  for (let i = ripples.length - 1; i >= 0; i--) {
    const rp = ripples[i];
    rp.radius += rp.speed;
    rp.alpha *= 0.97;

    noFill();
    stroke(255, rp.alpha);
    strokeWeight(1.2);
    circle(rp.x, rp.y, rp.radius * 2);

    if (rp.alpha < 2) ripples.splice(i, 1);
  }

  // particles
  noStroke();
  for (const p of particles) {
    const n = noise(p.seed, frameCount * 0.004);
    const wind = map(n, 0, 1, -0.25, 0.25);
    p.vx += wind * 0.02;
    p.vy += -wind * 0.01;

    const dragging = touches.length > 0 || mouseIsPressed;
    if (dragging) {
      const dx = mx - p.x;
      const dy = my - p.y;
      const d2 = dx * dx + dy * dy;
      const pull = 1600 / (d2 + 1200);
      p.vx += dx * pull * 0.01;
      p.vy += dy * pull * 0.01;
    }

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

    if (p.x < -10) p.x = width + 10;
    if (p.x > width + 10) p.x = -10;
    if (p.y < -10) p.y = height + 10;
    if (p.y > height + 10) p.y = -10;

    const glow = map(sp, 0, maxSp, 70, 220);
    fill(255, glow);
    circle(p.x, p.y, p.r * 2.2);

    fill(255, 35);
    circle(p.x, p.y, p.r * 6.0);
  }

  if (touches.length > 0 || mouseIsPressed) {
    noFill();
    stroke(255, 25);
    strokeWeight(1);
    circle(mx, my, 70);
  }
}

function mousePressed() {
  addRipple(mouseX, mouseY);
}

function touchStarted() {
  if (touches.length) addRipple(touches[0].x, touches[0].y);
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

function keyPressed() {
  if (key === 'r' || key === 'R') initParticles();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
