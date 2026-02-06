let particles = [];
let ripples = [];

// 성능: 확 줄임
const N = 50;

let currentColor;

// 클릭 순간만 블러 폭발 (평소엔 거의 0)
let blurBurst = 6;
let cachedBlurPx = 0;

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
      vx: random(-0.5, 0.5),
      vy: random(-0.5, 0.5),
      r: random(1.4, 3.0),
      seed: random(1000)
    });
  }
  ripples = [];
}

function draw() {
  // 잔상: 너무 길면 누적 렌더 부담도 커져서 살짝 올림
  drawingContext.filter = 'none';
  background(7, 7, 10, 14);

  const mx = touches.length ? touches[0].x : mouseX;
  const my = touches.length ? touches[0].y : mouseY;

  // ripple
  for (let i = ripples.length - 1; i >= 0; i--) {
    const rp = ripples[i];
    rp.radius += rp.speed;
    rp.alpha *= 0.95;

    noFill();
    stroke(255, rp.alpha);
    strokeWeight(1.1);
    circle(rp.x, rp.y, rp.radius * 2);

    if (rp.alpha < 2) ripples.splice(i, 1);
  }

  noStroke();

  // 입자
  for (const p of particles) {
    // 미세 바람(노이즈)
    const n = noise(p.seed, frameCount * 0.004);
    const wind = map(n, 0, 1, -0.22, 0.22);
    p.vx += wind * 0.018;
    p.vy += -wind * 0.01;

    // 드래그/터치로 끌어당김(강도 약간 줄임)
    const dragging = touches.length > 0 || mouseIsPressed;
    if (dragging) {
      const dx = mx - p.x;
      const dy = my - p.y;
      const d2 = dx * dx + dy * dy;
      const pull = 1200 / (d2 + 1600);
      p.vx += dx * pull * 0.01;
      p.vy += dy * pull * 0.01;
    }

    // 마찰
    p.vx *= 0.985;
    p.vy *= 0.985;

    // 속도 제한
    const sp = sqrt(p.vx * p.vx + p.vy * p.vy);
    const maxSp = 1.8;
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

    // 색
    const cr = red(currentColor);
    const cg = green(currentColor);
    const cb = blue(currentColor);

    // 성능: 글로우 크기 대폭 감소
    const glow = map(sp, 0, maxSp, 80, 210);

    fill(cr, cg, cb, glow);
    circle(p.x, p.y, p.r * 3.2);

    fill(cr, cg, cb, 26);
    circle(p.x, p.y, p.r * 6.2);
  }

  // 클릭 블러 폭발(아주 짧게)
  blurBurst *= 0.78;

  // 성능: 3프레임에 1번만 블러 갱신
  if (frameCount % 3 === 0) {
    cachedBlurPx = constrain(blurBurst, 0, 12);
  }

  // 블러는 "있을 때만" 적용 (평소엔 0)
  if (cachedBlurPx > 0.2) {
    drawingContext.filter = `blur(${cachedBlurPx.toFixed(2)}px)`;
  } else {
    drawingContext.filter = 'none';
  }

  // 링은 선명
  if (touches.length > 0 || mouseIsPressed) {
    drawingContext.filter = 'none';
    noFill();
    stroke(255, 20);
    strokeWeight(1);
    circle(mx, my, 70);
  }
}

function mousePressed() {
  currentColor = randomPastel();
  blurBurst = 10; // 클릭 때만 폭발
  addRipple(mouseX, mouseY);
}

function touchStarted() {
  currentColor = randomPastel();
  blurBurst = 10;
  if (touches.length) addRipple(touches[0].x, touches[0].y);
  return false;
}

function addRipple(x, y) {
  ripples.push({ x, y, radius: 0, speed: 3.2, alpha: 85 });
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
