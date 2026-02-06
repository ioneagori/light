let particles = [];
let ripples = [];
let sparks = [];

const N = 120;

let currentColor;
let targetColor;

// ✅ 클릭/탭 반응을 빠르게 만드는 핵심: "클릭 후 잠깐 유지되는 가상 끌림"
let clickAttractFrames = 0;
let clickX = 0;
let clickY = 0;

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

  // 색 변화 더 빠르게(원하면 0.18까지 올려도 됨)
  currentColor = lerpColor(currentColor, targetColor, 0.14);

  const mx = touches.length ? touches[0].x : mouseX;
  const my = touches.length ? touches[0].y : mouseY;

  // ✅ 클릭 후 몇 프레임 동안은 (마우스 안 눌러도) 끌림 유지
  if (clickAttractFrames > 0) clickAttractFrames--;

  // 어떤 좌표를 끌림 중심으로 쓸지 결정
  const hasClickAttractor = clickAttractFrames > 0;
  const ax = hasClickAttractor ? clickX : mx;
  const ay = hasClickAttractor ? clickY : my;

  // ripple
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

  // sparks
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

    fill(255, 28 * s.life);
    circle(s.x, s.y, s.size * 3.5);

    if (s.life < 0.05) sparks.splice(i, 1);
  }

  const cr = red(currentColor);
  const cg = green(currentColor);
  const cb = blue(currentColor);

  for (const p of particles) {
    const n = noise(p.seed, frameCount * 0.004);
    const wind = map(n, 0, 1, -0.25, 0.25);
    p.vx += wind * 0.02;
    p.vy += -wind * 0.01;

    // ✅ dragging(누르고 드래그) OR 클릭 후 잔상 끌림 OR 터치 중
    const dragging = touches.length > 0 || mouseIsPressed || hasClickAttractor;

    if (dragging) {
      const dx = ax - p.x;
      const dy = ay - p.y;
      const d2 = dx * dx + dy * dy;

      // ✅ 반응 속도/즉각성 핵심: pull 값 강하게 + 분모(완충) 줄이기
      const pull = 5200 / (d2 + 380);  // 더 공격적
      p.vx += dx * pull * 0.020;
      p.vy += dy * pull * 0.020;
    }

    // 마찰(조금 덜 걸어서 더 민첩하게)
    p.vx *= 0.982;
    p.vy *= 0.982;

    const sp = sqrt(p.vx * p.vx + p.vy * p.vy);
    const maxSp = 3.4; // ✅ 속도 상한 ↑ (확 반응)
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

    const glow = map(sp, 0, maxSp, 90, 235);

    fill(cr, cg, cb, glow);
    circle(p.x, p.y, p.r * 4.2);

    fill(cr, cg, cb, 34);
    circle(p.x, p.y, p.r * 10.5);
  }

  // 끌림 가이드(클릭 유지 때도 보이게)
  if (touches.length > 0 || mouseIsPressed || hasClickAttractor) {
    noFill();
    stroke(255, 26);
    strokeWeight(1.2);
    circle(ax, ay, 90);
  }
}

function mousePressed() {
  targetColor = randomPastel();
  addRipple(mouseX, mouseY);
  addSparks(mouseX, mouseY);

  // ✅ 클릭 즉각 반응: 클릭 위치로 끌림 중심을 "잠깐 고정"
  clickX = mouseX;
  clickY = mouseY;
  clickAttractFrames = 18; // 약 0.3초(60fps 기준). 더 빠르면 24로 늘려도 됨.
}

function touchStarted() {
  targetColor = randomPastel();
  if (touches.length) {
    const x = touches[0].x;
    const y = touches[0].y;
    addRipple(x, y);
    addSparks(x, y);

    clickX = x;
    clickY = y;
    clickAttractFrames = 18;
  }
  return false;
}

function addRipple(x, y) {
  ripples.push({
    x, y,
    radius: 0,
    speed: 5.6, // 더 빠르게 퍼짐
    alpha: 98
  });
}

function addSparks(x, y) {
  const count = 12;
  for (let i = 0; i < count; i++) {
    const a = random(TWO_PI);
    const sp = random(1.4, 3.6);
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
