const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
let DPR = window.devicePixelRatio || 1;

function resize() {
  DPR = window.devicePixelRatio || 1;
  canvas.width = Math.floor(canvas.clientWidth * DPR);
  canvas.height = Math.floor(canvas.clientHeight * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener("resize", resize);
resize();

const W = () => canvas.clientWidth;
const H = () => canvas.clientHeight;
const groundY = () => H() * 0.78;
const plateRadius = 140;

const LAYER_COUNT = 4;
const LAYER_WIDTH = 420;
const LAYER_HEIGHT = 54;
const LAYER_COLORS = ["#ff9eb5", "#ffcb85", "#a7d0f9", "#c5e8a7"];

let layers = [];
let placed = [];
let animationId = null;
let lastTime = 0;
let candleOn = false;
let confettiParticles = [];
let isComplete = false;

// Física Ajustada (Mais fluida e elástica)
const GRAVITY = 1100; // Gravidade um pouco mais leve
const BOUNCE = 0.25; // Quique mais perceptível

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

class Layer {
  constructor(idx) {
    this.idx = idx;
    this.width = LAYER_WIDTH - idx * 28;
    this.height = LAYER_HEIGHT;
    this.x = W() / 2 - this.width / 2;
    this.settled = false;
    this.startedDrop = false;
    this.y = -100; // Começa bem fora da tela
    this.vx = rand(-20, 20); // Menos espalhamento horizontal
    this.vy = 0;
    this.angle = 0;
    this.angularV = 0;
    this.color = LAYER_COLORS[idx % LAYER_COLORS.length];
    this.r = 12;
  }

  update(dt) {
    if (this.settled || !this.startedDrop) return;

    this.vy += GRAVITY * dt;
    this.vx *= 0.99;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.angle += this.angularV * dt;

    const margin = 20;
    if (this.x < margin) {
      this.x = margin;
      this.vx *= -0.4;
    }
    if (this.x + this.width > W() - margin) {
      this.x = W() - margin - this.width;
      this.vx *= -0.4;
    }

    let targetY = groundY() - this.height;
    if (placed.length > 0) {
      targetY = placed[placed.length - 1].y - this.height + 2;
    }

    if (this.y + this.height >= targetY && this.vy > 0) {
      this.y = targetY;
      if (Math.abs(this.vy) > 120) {
        this.vy = -this.vy * BOUNCE;
        this.angularV *= 0.5;
      } else {
        this.vx = 0;
        this.vy = 0;
        this.angularV = 0;
        this.settled = true;
        const targetX = W() / 2 - this.width / 2;
        smoothTo(this, { x: targetX, angle: 0 }, 0.2); // Anima o X e corrige a rotação

        setTimeout(() => {
          placed.push(this);
          checkComplete();
        }, 50);
      }
    }
  }

  draw(ctx) {
    if (!this.startedDrop && !this.settled) return; // Não desenha se não começou a cair

    const shadowY = this.y + this.height + 8;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    const sw = this.width * 0.9;
    const sx = this.x + (this.width - sw) / 2;
    ctx.beginPath();
    ctx.ellipse(sx + sw / 2, shadowY, sw / 2, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.angle);
    ctx.translate(-this.width / 2, -this.height / 2);

    roundRect(ctx, 0, 0, this.width, this.height, this.r);
    ctx.fillStyle = this.color;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(8, 4);
    ctx.bezierCurveTo(
      this.width * 0.25,
      -4,
      this.width * 0.75,
      8,
      this.width - 8,
      6,
    );
    ctx.lineTo(this.width - 12, this.height * 0.45);
    ctx.bezierCurveTo(
      this.width * 0.68,
      this.height * 0.6,
      this.width * 0.32,
      this.height * 0.6,
      12,
      this.height * 0.45,
    );
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, 0, this.height * 0.9);
    g.addColorStop(0, "rgba(255,255,255,0.85)");
    g.addColorStop(1, "rgba(255,255,255,0.06)");
    ctx.fillStyle = g;
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(0, this.height * 0.5 - 6, this.width, 12);

    ctx.fillStyle = this.color;
    for (let i = 0; i < 5; i++) {
      const xPos = 20 + (i * (this.width - 40)) / 4;
      ctx.beginPath();
      ctx.ellipse(xPos, -5, 8, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

class Confetti {
  constructor() {
    this.x = Math.random() * W();
    this.y = -20;
    this.size = rand(6, 12);
    this.vy = rand(2, 5); // Velocidade vertical inicial
    this.vx = rand(-3, 3); // Velocidade horizontal
    this.angle = rand(0, Math.PI * 2);
    this.spin = rand(-0.2, 0.2);
    this.color = `hsl(${rand(0, 360)}, 100%, 65%)`;
    this.shape = Math.random() > 0.5 ? "circle" : "rect";
  }

  update() {
    this.vy += 0.05; // Adicionado um pouco de gravidade aos confetes
    this.y += this.vy;
    this.x += this.vx + Math.sin(this.angle) * 1; // Movimento sinuoso
    this.angle += this.spin;

    if (this.y > H()) return false;
    return true;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = this.color;

    if (this.shape === "circle") {
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    }
    ctx.restore();
  }
}

function smoothTo(obj, props, duration) {
  const start = performance.now();
  const from = {};
  for (const k in props) from[k] = obj[k];
  function step(t) {
    const p = Math.min(1, (t - start) / (duration * 1000));
    for (const k in props)
      obj[k] = from[k] + (props[k] - from[k]) * easeOutCubic(p);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawPlate(ctx) {
  const cx = W() / 2;
  const cy = groundY() + 28;
  const rX = plateRadius;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy + 6, rX * 1.02, 22, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx, cy, rX, 18, 0, 0, Math.PI * 2);
  const g = ctx.createLinearGradient(cx, cy - 20, cx, cy + 20);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.5, "#f4f7fb");
  g.addColorStop(1, "#e4e8f1");
  ctx.fillStyle = g;
  ctx.fill();

  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(0,0,0,0.06)";
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(cx, cy - 5, rX * 0.7, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fill();
  ctx.restore();
}

function drawCandle(ctx, baseX, baseY) {
  ctx.save();
  const candleW = 16;
  const candleH = 72;
  const x = baseX - candleW / 2;
  const y = baseY - candleH;

  ctx.beginPath();
  roundRect(ctx, x, y, candleW, candleH, 4);
  const bodyGrad = ctx.createLinearGradient(x, y, x, y + candleH);
  bodyGrad.addColorStop(0, "#fff6bf");
  bodyGrad.addColorStop(1, "#ffd966");
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  ctx.fillStyle = "rgba(255,140,110,0.2)";
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(x + 3, y + 8 + i * 12, candleW - 6, 6);
  }

  ctx.fillStyle = "#222";
  ctx.fillRect(baseX - 1, y - 6, 2, 10);

  if (candleOn) drawFlame(ctx, baseX, y - 6);
  else {
    ctx.beginPath();
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.ellipse(baseX, y - 4, 3, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFlame(ctx, fx, fy) {
  const t = performance.now() / 1000;
  const sway = Math.sin(t * 6) * 3;
  const pulse = 1 + 0.08 * Math.sin(t * 18);
  const flameHeight = 28 * pulse;

  ctx.save();
  ctx.translate(sway, -Math.abs(Math.sin(t * 12)) * 1.6);

  const glow = ctx.createRadialGradient(
    fx,
    fy - flameHeight * 0.45,
    2,
    fx,
    fy - flameHeight * 0.45,
    36,
  );
  glow.addColorStop(0, "rgba(255,200,80,0.28)");
  glow.addColorStop(1, "rgba(255,180,60,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(
    fx,
    fy - flameHeight * 0.45,
    18 * pulse,
    flameHeight * 0.65,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.quadraticCurveTo(
    fx + 18 * pulse,
    fy - flameHeight * 0.35,
    fx,
    fy - flameHeight,
  );
  ctx.quadraticCurveTo(fx - 18 * pulse, fy - flameHeight * 0.35, fx, fy);
  const g = ctx.createLinearGradient(fx, fy - flameHeight, fx, fy);
  g.addColorStop(0, "#fffc9a");
  g.addColorStop(0.45, "#ffb24d");
  g.addColorStop(1, "#ff6b3a");
  ctx.fillStyle = g;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(fx, fy - flameHeight * 0.18);
  ctx.quadraticCurveTo(
    fx + 8 * pulse,
    fy - flameHeight * 0.5,
    fx,
    fy - flameHeight * 0.9,
  );
  ctx.quadraticCurveTo(
    fx - 8 * pulse,
    fy - flameHeight * 0.5,
    fx,
    fy - flameHeight * 0.18,
  );
  ctx.fillStyle = "rgba(255,255,220,0.96)";
  ctx.fill();
  ctx.restore();
}

function resetScene() {
  cancelAnimationFrame(animationId);
  layers = [];
  placed = [];
  candleOn = false;
  isComplete = false;
  confettiParticles = [];

  for (let i = 0; i < LAYER_COUNT; i++) {
    layers.push(new Layer(i));
  }
  lastTime = performance.now();

  // Reseta botão visualmente
  const dropBtn = document.getElementById("dropOneBtn");
  dropBtn.innerText = "Soltar próxima camada";
  dropBtn.disabled = false;
  dropBtn.style.opacity = "1";

  loop(lastTime);
}

function dropNextLayer() {
  const nextLayer = layers.find((l) => !l.startedDrop && !l.settled);
  if (nextLayer) {
    nextLayer.startedDrop = true;
    nextLayer.y = -80;
    nextLayer.vy = rand(80, 150); // Força inicial para baixo
  }
}

function checkComplete() {
  if (placed.length === LAYER_COUNT && !isComplete) {
    isComplete = true;
    setTimeout(() => {
      candleOn = true;
    }, 600);
    startConfetti();

    // Desativa botão de soltar ao terminar
    const dropBtn = document.getElementById("dropOneBtn");
    dropBtn.innerText = "Bolo Completo!";
    dropBtn.disabled = true;
    dropBtn.style.opacity = "0.5";
  }
}

function startConfetti() {
  for (let i = 0; i < 150; i++) {
    setTimeout(() => {
      confettiParticles.push(new Confetti());
    }, i * 30);
  }
}

function updateConfetti() {
  for (let i = confettiParticles.length - 1; i >= 0; i--) {
    if (!confettiParticles[i].update()) {
      confettiParticles.splice(i, 1);
    }
  }
  if (isComplete && Math.random() < 0.1) {
    confettiParticles.push(new Confetti());
  }
}

function drawConfetti(ctx) {
  for (const confetti of confettiParticles) confetti.draw(ctx);
}

function loop(now) {
  const dt = Math.min(0.04, (now - lastTime) / 1000 || 0.016);
  lastTime = now;
  update(dt);
  render();
  animationId = requestAnimationFrame(loop);
}

function update(dt) {
  for (const l of layers) l.update(dt);
  if (isComplete) updateConfetti();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bgGrad = ctx.createLinearGradient(0, 0, 0, H());
  bgGrad.addColorStop(0, "rgba(255,255,255,0.02)");
  bgGrad.addColorStop(1, "rgba(0,0,0,0.04)");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W(), H());

  const cx = W() / 2;
  const cy = groundY() - 80;
  const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 260);
  glow.addColorStop(0, "rgba(255,200,120,0.06)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W(), H());

  drawPlate(ctx);

  for (const l of placed) l.draw(ctx);

  const active = layers
    .filter((l) => !placed.includes(l) && l.startedDrop)
    .sort((a, b) => a.y - b.y);
  for (const l of active) l.draw(ctx);

  if (placed.length > 0 && candleOn) {
    const top = placed[placed.length - 1];
    drawCandle(ctx, W() / 2, top.y);
  }

  drawConfetti(ctx);

  // Texto de camadas minimalista no canto
  ctx.save();
  ctx.font = "12px Inter, system-ui, Arial";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText("Camadas: " + placed.length + " / " + LAYER_COUNT, 12, 24);
  ctx.restore();
}

resetScene();

document.getElementById("restartBtn").addEventListener("click", resetScene);
document.getElementById("dropOneBtn").addEventListener("click", dropNextLayer);
