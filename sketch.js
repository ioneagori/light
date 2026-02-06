let particles = [];
let ripples = [];

// 성능: 입자 수 줄임
const N = 80;

let currentColor;

// 블러 컨트롤
let baseBlur = 1.2;
let blurFromSpeed = 0;
let blurBurst = 0;

// 성능: 렌즈 토글(기본 OFF)
let lensOn = false;

// 렌즈 레이어(ON일 때만 사용)
let gSharp, gEdge;

// 성능: 블러 값 캐시(2프레임에 1번만 갱신)
let cachedBlurPx = 0;

function setup() {
  // 성능 핵심: 고DPI 비용 줄이기
  pixelDensity(1);

  createCanvas(windowWidth, windowHeight);

  gSharp = createGraphics(windowWidth, windowHeight);
  gEdge = createGraphics(windowWidth, windowHeight);

  initParticles();
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
  // 잔상(빛 길이)
  drawingContext.filter = 'none';
  background(7, 7, 10, 8); // 조금 덜 무겁게(잔상 살짝 줄임)

  const mx = touches.length ? touches[0].x : mouseX;
  const my = touches.length ? touches[0].y : mouseY;

  // 렌즈 ON이면 레이어에 그리고, OFF면 메인에 바로 그림
  const pg = lensOn ? gSharp : this;

  if (lensOn) pg.clear();

  // ripples
  for (let i = ripples.length - 1; i >= 0; i--) {
    const rp = ripples[i];
    rp.radius += rp.speed;
    rp.alpha *= 0.97;

    pg.noFill();
    pg.stroke(255, rp.alpha);
    pg.strokeWeight(1.1);
    pg.circle(rp.x, rp.y, rp.radius * 2);

    if (rp.alpha < 2) ripples.splice(i, 1);
  }

  pg.noStroke();

  let maxSpeedSeen = 0;

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
    const maxSp = 2.0; // 살짝 낮춰서 더 안정적
    if (sp > maxSp) {
      p.vx = (p.vx / sp) * maxSp;
      p.vy = (p.vy / sp) * maxSp;
    }

    maxSpeedSeen = max(maxSpeedSeen, sp);

    p.x += p.vx;
    p.y += p.vy;

    if (p.x < -10) p.x = width + 10;
    if (p.x > width + 10) p.x = -10;
    if (p.y < -10) p.y = height + 10;
    if (p.y > height + 10) p.y = -10;

    const cr = red(currentColor);
    const cg = green(currentColor);
    const cb = blue(currentColor);

    const glow = map(sp, 0, maxSp, 60, 200);

    // 성능: 글로우 크기 줄임
    pg.fill(cr, cg, cb, glow);
    pg.circle(p.x, p.y, p.r * 3.2);

    pg.fill(cr, cg, cb, 34);
    pg.circle(p.x, p.y, p.r * 8.0);
  }

  // 속도 블러
  const targetBlurFromSpeed = map(maxSpeedSeen, 0, 2.0, 0, 6);
  blurFromSpeed = lerp(blurFromSpeed, targetBlurFromSpeed, 0.12);

  // 클릭 폭발 감쇠
  blurBurst *= 0.82;

  // 성능: 블러 계산/적용을 2프레임에 1번만 갱신
  if (frameCount % 2 === 0) {
    cachedBlurPx = constrain(baseBlur + blurFromSpeed + blurBurst, 0, 16);
  }
  const blurPx = cachedBlurPx;

  if (!lensOn) {
    // 렌즈 OFF: 그냥 전체 블러(가벼움)
    drawingContext.filter = `blur(${blurPx.toFixed(2)}px)`;
  } else {
    // 렌즈 ON: 바깥만 블러(무거우니 필요할 때만)
    gEdge.clear();
    gEdge.drawingContext.filter = `blur(${blurPx.toFixed(2)}px)`;
    gEdge.image(gSharp, 0, 0);
    gEdge.drawingContext.filter = 'none';

    applyEdgeMask(gEdge);

    image(gSharp, 0, 0);
    image(gEdge, 0, 0);
  }

  // 링은 선명
  if (touches.length > 0 || mouseIsPressed) {
    drawingContext.filter = 'none';
    noFill();
    stroke(255, 22);
    strokeWeight(1);
    circle(mx, my, 80);
  }
}

function applyEdgeMask(pg) {
  const ctx = pg.drawingContext;
  const cx = width * 0.5;
  const cy = height * 0.5;

  const innerR = min(width, height) * 0.24;
  const outerR = min(width, height) * 0.70;

  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';

  const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
  grad.addColorStop(0.00, 'rgba(0,0,0,0)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.25)');
  grad.addColorStop(1.00, 'rgba(0,0,0,1)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}

function mousePressed() {
  currentColor = randomPastel();
  blurBurst = 12; // 클릭 폭발
  addRipple(mouseX, mouseY);
}

function touchStarted() {
  currentColor = randomPastel();
  blurBurst = 12;
  if (touches.length) addRipple(touches[0].x, touches[0].y);
  return false;
}

function addRipple(x, y) {
  ripples.push({ x, y, radius: 0, speed: 3.6, alpha: 90 });
}

function keyPressed() {
  if (key === 'r' || key === 'R') initParticles();
  if (key === 'l' || key === 'L') lensOn = !lensOn; // 렌즈 토글
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  gSharp = createGraphics(windowWidth, windowHeight);
  gEdge = createGraphics(windowWidth, windowHeight);
}

function randomPastel() {
  const r = random(150, 255);
  const g = random(150, 255);
  const b = random(150, 255);
  return color(r, g, b);
}
