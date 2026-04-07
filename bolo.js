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
const groundY = () => H() * 0.75;

const LAYER_COUNT = 4;
const LAYER_HEIGHT = 65;
const LAYER_COLORS = ["#f4d4b1", "#f0c79b", "#eab986", "#e0a770"];
const CAKE_SHADE = "rgba(100,60,30,0.12)";

let layers = [];
let placed = [];
let animationId = null;
let lastTime = 0;
let candlesOn = false;
let confettiParticles = [];
let isComplete = false;

const GRAVITY = 1200;
const BOUNCE = 0.25;

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

class Layer {
  constructor(idx) {
    this.idx = idx;

    // RESPONSIVIDADE: O bolo se adapta ao tamanho da tela!
    const maxCakeWidth = Math.min(420, W() * 0.85); // Pega no máximo 85% da tela
    const shrinkPerLayer = maxCakeWidth * 0.07; // Cada camada diminui 7%

    this.width = maxCakeWidth - idx * shrinkPerLayer;
    this.height = LAYER_HEIGHT;
    this.x = W() / 2 - this.width / 2;
    this.settled = false;
    this.startedDrop = false;
    this.y = -150;
    this.vx = rand(-15, 15);
    this.vy = 0;
    this.angle = 0;
    this.angularV = 0;
    this.color = LAYER_COLORS[idx % LAYER_COLORS.length];
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
      if (Math.abs(this.vy) > 130) {
        this.vy = -this.vy * BOUNCE;
        this.angularV *= 0.5;
      } else {
        this.vx = 0;
        this.vy = 0;
        this.angularV = 0;
        this.settled = true;
        const targetX = W() / 2 - this.width / 2;
        smoothTo(this, { x: targetX, angle: 0 }, 0.22);

        setTimeout(() => {
          placed.push(this);
          checkComplete();
        }, 60);
      }
    }
  }

  draw(ctx) {
    if (!this.startedDrop && !this.settled) return;

    const shadowY = this.y + this.height + 6;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    const sw = this.width * 0.9;
    const sx = this.x + (this.width - sw) / 2;
    ctx.beginPath();
    ctx.ellipse(sx + sw / 2, shadowY, sw / 2, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.angle);
    ctx.translate(-this.width / 2, -this.height / 2);

    ctx.fillStyle = this.color;
    roundRect(ctx, 0, 0, this.width, this.height, 6);
    ctx.fill();

    const gradMassa = ctx.createLinearGradient(0, 0, 0, this.height);
    gradMassa.addColorStop(0, "rgba(255,255,255,0.3)");
    gradMassa.addColorStop(0.8, "rgba(0,0,0,0)");
    gradMassa.addColorStop(1, "rgba(0,0,0,0.15)");
    ctx.fillStyle = gradMassa;
    roundRect(ctx, 0, 0, this.width, this.height, 6);
    ctx.fill();

    ctx.fillStyle = CAKE_SHADE;
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      const px = rand(6, this.width - 6);
      const py = rand(6, this.height - 6);
      ctx.arc(px, py, rand(0.5, 1.5), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#4a2613";
    ctx.beginPath();
    const recheioY = this.height - 18;
    ctx.moveTo(0, recheioY);
    for (let x = 0; x <= this.width; x += 10) {
      const onda = Math.sin(x * 0.08 + this.idx * 5) * 2;
      ctx.lineTo(x, recheioY + onda);
    }
    ctx.lineTo(this.width, this.height - 6);
    ctx.lineTo(0, this.height - 6);
    ctx.fill();

    if (this.settled || this.startedDrop) {
      ctx.fillStyle = "#fff5f7";
      ctx.beginPath();
      ctx.moveTo(0, 0);

      for (let x = 0; x <= this.width; x += 8) {
        let gota = 8 + Math.sin(x * 0.2 + this.idx) * 4;
        if (x % 30 < 10) gota += 8 + Math.random() * 4;
        if (x < 10 || x > this.width - 10) gota = 6;
        ctx.lineTo(x, gota);
      }

      ctx.lineTo(this.width, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillRect(4, 2, this.width - 8, 3);
    }

    ctx.restore();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

class Confetti {
  constructor() {
    this.x = Math.random() * W();
    this.y = -20;
    this.size = rand(6, 12);
    this.vy = rand(2, 5);
    this.vx = rand(-3, 3);
    this.angle = rand(0, Math.PI * 2);
    this.spin = rand(-0.2, 0.2);
    this.color = `hsl(${rand(0, 360)}, 100%, 65%)`;
    this.shape = Math.random() > 0.5 ? "circle" : "rect";
  }

  update() {
    this.vy += 0.05;
    this.y += this.vy;
    this.x += this.vx + Math.sin(this.angle) * 1;
    this.angle += this.spin;
    return this.y <= H();
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

function drawPlate(ctx) {
  const cx = W() / 2;
  const cy = groundY() + 15;
  // Prato responsivo (nunca maior que a tela)
  const rX = Math.min(150, W() * 0.4);

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy + 12, rX * 1.05, 20, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx, cy, rX, 22, 0, 0, Math.PI * 2);
  const g = ctx.createLinearGradient(cx, cy - 20, cx, cy + 20);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.5, "#f4f7fb");
  g.addColorStop(1, "#d0d6e0");
  ctx.fillStyle = g;
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx, cy - 2, rX * 0.75, 14, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.04)";
  ctx.fill();
  ctx.restore();
}

// CORREÇÃO VISUAL: Velas organizadas lado a lado e bonitas
function drawCandles(ctx, topLayer) {
  const cx = W() / 2;
  const numCandles = 5;
  const t = performance.now() / 1000;

  // As velas ocupam 60% da largura da camada do topo
  const spread = topLayer.width * 0.6;
  const startX = cx - spread / 2;
  const step = spread / (numCandles - 1);

  for (let i = 0; i < numCandles; i++) {
    const vx = startX + i * step;

    // Curva 3D: as velas das pontas ficam um pouquinho mais altas que as do centro
    const distFromCenter = Math.abs(2 - i); // 2, 1, 0, 1, 2
    const vy = topLayer.y + distFromCenter * 2 - 4;

    drawSingleCandle(ctx, vx, vy, t + i);
  }
}

function drawSingleCandle(ctx, x, y, time) {
  ctx.save();
  const candleW = 8;
  const candleH = 35;
  const topX = x - candleW / 2;
  const topY = y - candleH;

  // Sombreado na base da vela interagindo com o glacê
  ctx.fillStyle = "rgba(0,0,0,0.1)";
  ctx.beginPath();
  ctx.ellipse(x, y, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `hsl(${(time * 40) % 360}, 80%, 75%)`;
  roundRect(ctx, topX, topY, candleW, candleH, 3);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillRect(topX, topY + candleH * 0.2, candleW, 4);
  ctx.fillRect(topX, topY + candleH * 0.5, candleW, 4);
  ctx.fillRect(topX, topY + candleH * 0.8, candleW, 4);

  ctx.fillStyle = "#333";
  ctx.fillRect(x - 1, topY - 6, 2, 7);

  if (candlesOn) drawFlame(ctx, x, topY - 6, time);

  ctx.restore();
}

function drawFlame(ctx, fx, fy, t) {
  const sway = Math.sin(t * 8) * 1.5;
  const pulse = 1 + 0.1 * Math.sin(t * 20);
  const flameHeight = 20 * pulse;

  ctx.save();
  ctx.translate(sway, -Math.abs(Math.sin(t * 15)) * 1);

  const glow = ctx.createRadialGradient(
    fx,
    fy - flameHeight * 0.4,
    1,
    fx,
    fy - flameHeight * 0.4,
    30,
  );
  glow.addColorStop(0, "rgba(255,180,50,0.4)");
  glow.addColorStop(1, "rgba(255,100,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(
    fx,
    fy - flameHeight * 0.4,
    15 * pulse,
    flameHeight * 0.7,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.quadraticCurveTo(
    fx + 10 * pulse,
    fy - flameHeight * 0.4,
    fx,
    fy - flameHeight,
  );
  ctx.quadraticCurveTo(fx - 10 * pulse, fy - flameHeight * 0.4, fx, fy);
  const g = ctx.createLinearGradient(fx, fy - flameHeight, fx, fy);
  g.addColorStop(0, "#fffbcc");
  g.addColorStop(0.4, "#ffc233");
  g.addColorStop(1, "#ff5500");
  ctx.fillStyle = g;
  ctx.fill();

  ctx.restore();
}

function resetScene() {
  cancelAnimationFrame(animationId);
  layers = [];
  placed = [];
  candlesOn = false;
  isComplete = false;
  confettiParticles = [];

  for (let i = 0; i < LAYER_COUNT; i++) {
    layers.push(new Layer(i));
  }
  lastTime = performance.now();

  const dropBtn = document.getElementById("dropOneBtn");
  dropBtn.innerText = "Soltar próxima camada";
  dropBtn.disabled = false;

  loop(lastTime);
}

function dropNextLayer() {
  const nextLayer = layers.find((l) => !l.startedDrop && !l.settled);
  if (nextLayer) {
    nextLayer.startedDrop = true;
    nextLayer.y = -100;
    nextLayer.vy = rand(100, 200);
  }
}

function checkComplete() {
  if (placed.length === LAYER_COUNT && !isComplete) {
    isComplete = true;
    setTimeout(() => {
      candlesOn = true;
    }, 800);
    startConfetti();

    const dropBtn = document.getElementById("dropOneBtn");
    dropBtn.innerText = "Bolo Completo! 🎂";
    dropBtn.disabled = true;
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
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  const bgGrad = ctx.createLinearGradient(0, 0, 0, H());
  bgGrad.addColorStop(0, "rgba(255,255,255,0.01)");
  bgGrad.addColorStop(1, "rgba(0,0,0,0.04)");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W(), H());

  if (candlesOn) {
    const t = performance.now() / 1000;
    const pulse = 0.05 + Math.sin(t * 15) * 0.02;
    const cx = W() / 2;
    const cy = groundY() - 150;
    const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 400);
    glow.addColorStop(0, `rgba(255,210,120,${pulse})`);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W(), H());
  }

  drawPlate(ctx);

  for (const l of placed) l.draw(ctx);

  const active = layers
    .filter((l) => !placed.includes(l) && l.startedDrop)
    .sort((a, b) => a.y - b.y);
  for (const l of active) l.draw(ctx);

  if (isComplete && placed.length === LAYER_COUNT) {
    const topLayer = placed[placed.length - 1];
    // Passamos a camada inteira para a função das velas calcular a largura
    if (topLayer.settled) drawCandles(ctx, topLayer);
  }

  drawConfetti(ctx);

  ctx.save();
  ctx.font = "12px Inter, system-ui, Arial";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillText("Andares: " + placed.length + " / " + LAYER_COUNT, 12, 24);
  ctx.restore();
}

resetScene();

document.getElementById("restartBtn").addEventListener("click", resetScene);
document.getElementById("dropOneBtn").addEventListener("click", dropNextLayer);
