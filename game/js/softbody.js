const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function createBlob(x, y, r, n = 16) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, px: x + Math.cos(a) * r, py: y + Math.sin(a) * r });
  }
  return {
    pts, n,
    cx: x, cy: y, cpx: x, cpy: y,
    nx: x, ny: y, npx: x, npy: y,
    r, restN: 2 * r * Math.sin(Math.PI / n),
    restArea: polyArea(pts),
    pulse: 0,
    vx() { return this.cx - this.cpx; },
    vy() { return this.cy - this.cpy; },
  };
}

function polyArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    a += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a) / 2;
}

export function stepBlob(b, dt, o) {
  const { fx = 0, fy = 0, accel = 0, damp = 0.985, W = 4000, H = 4000 } = o || {};
  const ax = fx * accel, ay = fy * accel;
  const t = o.t || 0;

  for (const p of b.pts) {
    const vx = (p.x - p.px) * damp;
    const vy = (p.y - p.py) * damp;
    p.px = p.x; p.py = p.y;
    let ex = ax, ey = ay;
    if ((ex || ey) && accel > 0) {
      const len = Math.hypot(ex, ey) || 1;
      const dxn = (p.x - b.cx), dyn = (p.y - b.cy);
      const dl = Math.hypot(dxn, dyn) || 1;
      const facing = (dxn / dl) * (ex / len) + (dyn / dl) * (ey / len);
      if (facing > 0.45) { ex *= 3.2; ey *= 3.2; }
      else if (facing < -0.45) { ex *= 0.4; ey *= 0.4; }
      const lag = facing > 0.5 ? -0.85 : facing < -0.5 ? 0.55 : 0;
      p.x += (ex / len) * lag; p.y += (ey / len) * lag;
    }
    p.x += vx + ex * dt * dt;
    p.y += vy + ey * dt * dt;
  }

  const cvx = (b.cx - b.cpx) * damp, cvy = (b.cy - b.cpy) * damp;
  b.cpx = b.cx; b.cpy = b.cy;
  b.cx += cvx + ax * dt * dt;
  b.cy += cvy + ay * dt * dt;

  const nvx = (b.nx - b.npx) * 0.94, nvy = (b.ny - b.npy) * 0.94;
  b.npx = b.nx; b.npy = b.ny;
  b.nx += nvx + (b.cx - b.nx) * 26 * dt * dt * 60;
  b.ny += nvy + (b.cy - b.ny) * 26 * dt * dt * 60;

  if (b.pulse > 0) b.pulse = Math.max(0, b.pulse - dt / 0.4);

  const iter = 3;
  const wobble = 1 + Math.sin(t * 2.3) * 0.03 + Math.sin(t * 5.1 + 1.7) * 0.014;
  const targetArea = b.restArea * wobble * (1 - 0.22 * Math.sin(b.pulse * Math.PI));

  const solvePasses = (count) => {
    for (let k = 0; k < count; k++) {
      for (let i = 0; i < b.n; i++) {
        const p = b.pts[i], q = b.pts[(i + 1) % b.n];
        solveDist(p, q, b.restN, 0.38);
      }
      for (const p of b.pts) {
        const dx = b.cx - p.x, dy = b.cy - p.y;
        const d = Math.hypot(dx, dy) || 1;
        const diff = (d - b.r) / d * 0.12;
        p.x += dx * diff; p.y += dy * diff;
      }
      const A = polyArea(b.pts);
      const dA = (targetArea - A);
      const gcx = b.pts.reduce((s, p) => s + p.x, 0) / b.n;
      const gcy = b.pts.reduce((s, p) => s + p.y, 0) / b.n;
      const push = clamp(dA * 0.0018, -1.4, 1.4);
      for (const p of b.pts) {
        const dx = p.x - gcx, dy = p.y - gcy;
        const d = Math.hypot(dx, dy) || 1;
        p.x += (dx / d) * push * d * 0.13;
        p.y += (dy / d) * push * d * 0.13;
      }
    }
  };

  const walls = (killVelocity) => {
    const m = b.r * 0.25;
    for (const p of b.pts) {
      let hit = false;
      if (p.x < m) { p.x = m; hit = true; }
      else if (p.x > W - m) { p.x = W - m; hit = true; }
      if (p.y < m) { p.y = m; hit = true; }
      else if (p.y > H - m) { p.y = H - m; hit = true; }
      if (hit && killVelocity) {
        p.px += (p.x - p.px) * 0.75;
        p.py += (p.y - p.py) * 0.75;
      }
    }
    b.cx = clamp(b.cx, m, W - m); b.cy = clamp(b.cy, m, H - m);
    b.nx = clamp(b.nx, m, W - m); b.ny = clamp(b.ny, m, H - m);
  };

  solvePasses(iter);
  walls(false);
  solvePasses(2);
  walls(true);
}

function solveDist(p, q, rest, stiff) {
  const dx = q.x - p.x, dy = q.y - p.y;
  const d = Math.hypot(dx, dy) || 0.001;
  const diff = (d - rest) / d * stiff * 0.5;
  p.x += dx * diff; p.y += dy * diff;
  q.x -= dx * diff; q.y -= dy * diff;
}

export function deformMetric(b) {
  let s = 0, min = 1e9, max = 0;
  for (const p of b.pts) {
    const d = Math.hypot(p.x - b.cx, p.y - b.cy);
    s += d; min = Math.min(min, d); max = Math.max(max, d);
  }
  const avg = s / b.n;
  return {
    strain: Math.abs(avg - b.r) / b.r,
    asym: (max - min) / (avg || 1),
  };
}
