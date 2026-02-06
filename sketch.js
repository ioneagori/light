let particles = [];
let ripples = [];
const N = 220;

let currentColor;

// 블러 컨트롤
let baseBlur = 1.5;        // 평소 기본 블러(px)
let blurFromSpeed = 0;     // 속도로 쌓이는 블러(px)
let blurBurst = 0;         // 클릭/탭 순간 폭발 블러(px)

// 렌즈(중앙 선명/바깥 흐림)용 레이어
let gSharp; // 선명 레이어(입자만 그림)
let gEdge;  // 블러 + 엣지 마스크 레이어

function setup() {
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
  // 0) 화면 잔상(빛의 길이) — 마지막 숫자 더 낮추면 더 길어짐
  drawingContext.filter = 'none';
  background(7, 7, 10, 6);

  // 매 프레임 선명 레이어는 깨끗하게(현재 프레임만 그림)
  gSharp.clear();

  const mx = touches.length ? touches[0].x : mouseX;
  const my = touches.length ? touches[0].y : mouseY;

  // 1) ripple 업데이트 + 그리기(선명 레이어에)
  for (let i = ripples.length - 1; i >= 0; i--) {
    const rp = ripples[i];
    rp.radius += rp.speed;
    rp.alpha *= 0.97;

    gSharp.noFill();
    gSharp.stroke(255, rp.alpha);
    gSharp.strokeWeight(1.2);
    gSharp.circle(rp.x, rp.y, rp.radius * 2);

    if (rp.alpha < 2) ripples.splice(i, 1);
  }

  // 2) 입자 업데이트 + 선명 레이어에 그리기
  gSharp.noStroke();

  let maxSpeedSeen = 0;

  for (const p of particles) {
    // 미세 바람(노이즈)
    const n = noise(p.seed, frameCount * 0.004);
    const wind = map(n, 0, 1, -0.25, 0.25);
    p.vx += wind * 0.02;
    p.vy += -wind * 0.01;

    // 드래그/터치 끌어당김
    const dragging = touches.length > 0 || mouseIsPressed;
    if (dragging) {
      const dx = mx - p.x;
      const dy = my - p.y;
      const d2 = dx * dx + dy * dy;
      const pull = 1600 / (d2 + 1200);
      p.vx += dx * pull * 0.01;
      p.vy += dy * pull * 0.01;
    }

    // 마찰
    p.vx *= 0.985;
    p.vy *= 0.985;

    // 속도 제한
    const sp = sqrt(p.vx * p.vx + p.vy * p.vy);
    const maxSp = 2.2;
    if (sp > maxSp) {
      p.vx = (p.vx / sp) * maxSp;
      p.vy = (p.vy / sp) * maxSp;
    }

    maxSpeedSeen = max(maxSpeedSeen, sp);

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

    // 크기/글로우(좀 더 크게)
    const glow = map(sp, 0, maxSp, 70, 220);

    // 중심(선명)
    gSharp.fill(cr, cg, cb, glow);
    gSharp.circle(p.x, p.y, p.r * 4.0);

    // 큰 글로우(번짐)
    gSharp.fill(cr, cg, cb, 38);
    gSharp.circle(p.x, p.y, p.r * 12.0);
  }

  // 3) 속도 기반 블러(빠를수록 블러↑)
  const targetBlurFromSpeed = map(maxSpeedSeen, 0, 2.2, 0, 7);
  blurFromSpeed = lerp(blurFromSpeed, targetBlurFromSpeed, 0.12);

  // 4) 클릭 블러 폭발(시간 지나며 감소)
  blurBurst *= 0.82;

  // 최종 블러 강도
  const blurPx = constrain(baseBlur + blurFromSpeed + blurBurst, 0, 20);

  // 5) 렌즈 효과: 중앙은 선명, 바깥만 블러가 덮이게
  // 5-1) 엣지 레이어 만들기: 선명 레이어를 "블러"로 복사
  gEdge.clear();
  gEdge.drawingContext.filter = `blur(${blurPx.toFixed(2)}px)`;
  gEdge.image(gSharp, 0, 0);
  gEdge.drawingContext.filter = 'none';

  // 5-2) 엣지 마스크(중앙 투명, 바깥 불투명)
  applyEdgeMask(gEdge);

  // 6) 메인 캔버스에 합성
  // (1) 선명 레이어 먼저
  image(gSharp, 0, 0);
  // (2) 바깥 블러 레이어를 위에 덮기(렌즈 느낌)
  image(gEdge, 0, 0);

  // 끌어당기는 링은 선명하게
  if (touches.length > 0 || mouseIsPressed) {
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

  // 중앙 선명 영역(이 값이 커질수록 중앙이 선명한 범위가 커짐)
  const innerR = min(width, height) * 0.22;
  // 바깥 흐림 시작~끝
  const outerR = min(width, height) * 0.68;

  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';

  const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
  grad.addColorStop(0.00, 'rgba(0,0,0,0)');   // 중앙 투명(=블러 안 보임)
  grad.addColorStop(0.55, 'rgba(0,0,0,0.25)');
  grad.addColorStop(1.00, 'rgba(0,0,0,1)');   // 바깥 불투명(=블러 보임)

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}

function mousePressed() {
  currentColor = randomPastel();
  blurBurst = 12; // 클릭 폭발 강도(8~16 추천)
  addRipple(mouseX, mouseY);
}

function touchStarted() {
  currentColor = randomPastel();
  blurBurst = 12;
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

  // 레이어 캔버스도 같이 리사이즈
  gSharp = createGraphics(windowWidth, windowHeight);
  gEdge = createGraphics(windowWidth, windowHeight);
}

function randomPastel() {
  // 파스텔인데 너무 하얗게만 안 나오도록
  const r = random(150, 255);
  const g = random(150, 255);
  const b = random(150, 255);
  return color(r, g, b);
}
