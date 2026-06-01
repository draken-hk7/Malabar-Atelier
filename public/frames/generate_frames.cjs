const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'frames');
const TOTAL_FRAMES = 120;
const WIDTH = 1280;
const HEIGHT = 720;

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Color palette
const GOLD = '#C9A84C';
const GOLD_LIGHT = '#E8C96A';
const GOLD_DARK = '#8B6914';
const CRIMSON = '#8B0000';
const IVORY = '#FAF3E0';
const EBONY = '#1A0A00';

function lerp(a, b, t) { return a + (b - a) * t; }
function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

function generateFrame(frameIndex) {
  const progress = frameIndex / (TOTAL_FRAMES - 1); // 0 to 1
  const angle = progress * Math.PI * 2; // full rotation
  const scaleProgress = easeInOut(Math.min(progress * 2, 1)); // scale up in first half
  const glowIntensity = 0.4 + 0.6 * Math.sin(progress * Math.PI * 4); // pulsing glow
  const opacity = Math.min(progress * 3, 1); // fade in

  // Perspective skew based on rotation angle
  const skewX = Math.sin(angle) * 0.35;
  const scaleX = Math.abs(Math.cos(angle)) * 0.4 + 0.6;
  const scale = 0.3 + scaleProgress * 0.7;

  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;

  // Nettipattam dimensions
  const baseW = 500 * scale * scaleX;
  const baseH = 320 * scale;
  const archH = 200 * scale;
  const petalCount = 9;

  // Glow radius
  const glowR = 280 * scale * (0.8 + glowIntensity * 0.4);

  // Particle positions (floating gold dust)
  const particles = Array.from({ length: 18 }, (_, i) => {
    const t = (progress + i / 18) % 1;
    const px = cx + Math.sin(t * Math.PI * 6 + i) * 320 * scale;
    const py = cy + Math.cos(t * Math.PI * 4 + i * 0.7) * 180 * scale;
    const pr = (2 + Math.sin(i * 1.3 + progress * 5) * 1.5) * scale;
    const po = (0.3 + 0.7 * Math.sin(t * Math.PI)) * opacity;
    return { px, py, pr, po };
  });

  // ---- Build SVG ----
  const defs = `
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#2A1200"/>
      <stop offset="100%" stop-color="${EBONY}"/>
    </radialGradient>
    <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="${0.25 * glowIntensity}"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="centerGem" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFE8A0"/>
      <stop offset="40%" stop-color="${GOLD}"/>
      <stop offset="100%" stop-color="${GOLD_DARK}"/>
    </radialGradient>
    <radialGradient id="petalGrad" cx="50%" cy="30%" r="70%">
      <stop offset="0%" stop-color="${GOLD_LIGHT}"/>
      <stop offset="60%" stop-color="${GOLD}"/>
      <stop offset="100%" stop-color="${GOLD_DARK}"/>
    </radialGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="${8 * glowIntensity}" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <linearGradient id="plateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${GOLD_LIGHT}"/>
      <stop offset="50%" stop-color="${GOLD}"/>
      <stop offset="100%" stop-color="${GOLD_DARK}"/>
    </linearGradient>
  </defs>`;

  // Background
  const bg = `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGrad)"/>`;

  // Ambient glow behind object
  const glowCircle = `<ellipse cx="${cx}" cy="${cy}" rx="${glowR}" ry="${glowR * 0.6}" fill="url(#glowGrad)"/>`;

  // Particles
  const particleSVG = particles.map(p =>
    `<circle cx="${p.px}" cy="${p.py}" r="${p.pr}" fill="${GOLD}" opacity="${p.po}"/>`
  ).join('');

  // ---- Nettipattam body ----
  // Main base plate (trapezoidal arch shape)
  const plateTop = cy - archH;
  const plateBottom = cy + baseH * 0.3;

  // Build the arch path with perspective skew applied
  function skewPt(x, y) {
    const relX = (x - cx) * scaleX;
    const relY = y - cy;
    const skewedX = cx + relX + relY * skewX * 0.5;
    return [skewedX, y];
  }

  // Arch points
  const archPoints = [];
  for (let i = 0; i <= 32; i++) {
    const t = i / 32;
    const ax = cx + Math.cos(Math.PI + t * Math.PI) * baseW * 0.5;
    const ay = plateTop + Math.sin(t * Math.PI) * archH * 0.3;
    const [sx, sy] = skewPt(ax, ay);
    archPoints.push(`${sx},${sy}`);
  }

  // Bottom base points
  const [blx, bly] = skewPt(cx - baseW * 0.5, plateBottom);
  const [brx, bry] = skewPt(cx + baseW * 0.5, plateBottom);

  const platePath = `M ${archPoints[0]} ${archPoints.map(p => `L ${p}`).join(' ')} L ${brx},${bry} L ${blx},${bly} Z`;

  const plate = `<path d="${platePath}" fill="url(#plateGrad)" opacity="${opacity}" filter="url(#softGlow)" stroke="${GOLD_LIGHT}" stroke-width="1.5" stroke-opacity="0.6"/>`;

  // Decorative border line inside arch
  const innerArchPoints = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const ax = cx + Math.cos(Math.PI + t * Math.PI) * baseW * 0.42;
    const ay = plateTop + archH * 0.08 + Math.sin(t * Math.PI) * archH * 0.25;
    const [sx, sy] = skewPt(ax, ay);
    innerArchPoints.push(`${sx},${sy}`);
  }
  const innerArch = `<polyline points="${innerArchPoints.join(' ')}" fill="none" stroke="${GOLD_LIGHT}" stroke-width="1" stroke-opacity="${0.5 * opacity}"/>`;

  // Petals along the top arch
  const petalsSVG = Array.from({ length: petalCount }, (_, i) => {
    const t = (i + 0.5) / petalCount;
    const ax = cx + Math.cos(Math.PI + t * Math.PI) * baseW * 0.46;
    const ay = plateTop + Math.sin(t * Math.PI) * archH * 0.28;
    const [sx, sy] = skewPt(ax, ay);
    const pr = 14 * scale * scaleX;
    const pr2 = 9 * scale;
    return `<ellipse cx="${sx}" cy="${sy}" rx="${pr}" ry="${pr2}" fill="url(#petalGrad)" opacity="${opacity * 0.9}" filter="url(#softGlow)" stroke="${GOLD_LIGHT}" stroke-width="0.8"/>`;
  }).join('');

  // Hanging bells (bottom fringe)
  const bellCount = 11;
  const bellsSVG = Array.from({ length: bellCount }, (_, i) => {
    const t = (i + 0.5) / bellCount;
    const bx_base = cx - baseW * 0.46 + t * baseW * 0.92;
    const [bx, by_base] = skewPt(bx_base, plateBottom);
    const by = by_base;
    const bellH = (22 + Math.sin(i * 1.1 + progress * Math.PI * 2) * 4) * scale;
    const bellW = 10 * scale * scaleX;
    // String
    const stringLen = 18 * scale;
    const swing = Math.sin(progress * Math.PI * 6 + i * 0.8) * 3 * scale;
    return `
      <line x1="${bx}" y1="${by}" x2="${bx + swing}" y2="${by + stringLen}" stroke="${GOLD}" stroke-width="1" opacity="${opacity * 0.7}"/>
      <ellipse cx="${bx + swing}" cy="${by + stringLen + bellH * 0.5}" rx="${bellW}" ry="${bellH * 0.5}" fill="url(#petalGrad)" opacity="${opacity}" filter="url(#softGlow)"/>
      <ellipse cx="${bx + swing}" cy="${by + stringLen + bellH * 0.15}" rx="${bellW * 0.7}" ry="${bellH * 0.1}" fill="${GOLD_LIGHT}" opacity="${opacity * 0.5}"/>
    `;
  }).join('');

  // Center gemstone
  const [gcx, gcy] = skewPt(cx, cy - archH * 0.1);
  const gemR = 32 * scale * scaleX;
  const gemR2 = 28 * scale;
  const centerGem = `
    <ellipse cx="${gcx}" cy="${gcy}" rx="${gemR * 1.6}" ry="${gemR2 * 1.6}" fill="${GOLD}" opacity="${0.15 * glowIntensity * opacity}" filter="url(#glow)"/>
    <ellipse cx="${gcx}" cy="${gcy}" rx="${gemR}" ry="${gemR2}" fill="url(#centerGem)" opacity="${opacity}" filter="url(#glow)" stroke="${GOLD_LIGHT}" stroke-width="2"/>
    <ellipse cx="${gcx - gemR * 0.25}" cy="${gcy - gemR2 * 0.3}" rx="${gemR * 0.25}" ry="${gemR2 * 0.2}" fill="white" opacity="${0.35 * opacity}"/>
  `;

  // Decorative side motifs
  const motifsSVG = [-1, 1].map(side => {
    const mx_base = cx + side * baseW * 0.3;
    const [mx, my] = skewPt(mx_base, cy + 10 * scale);
    const mr = 16 * scale * scaleX;
    return `
      <ellipse cx="${mx}" cy="${my}" rx="${mr}" ry="${mr * 0.85}" fill="none" stroke="${GOLD}" stroke-width="1.5" opacity="${opacity * 0.7}"/>
      <ellipse cx="${mx}" cy="${my}" rx="${mr * 0.55}" ry="${mr * 0.5}" fill="${GOLD}" opacity="${opacity * 0.4}"/>
    `;
  }).join('');

  // Brand text
  const textOpacity = Math.max(0, (progress - 0.7) / 0.3);
  const brandText = `
    <text x="${cx}" y="${cy + baseH * 0.55 + 50 * scale}" 
      text-anchor="middle" 
      font-family="Cormorant Garamond, Georgia, serif" 
      font-size="${Math.round(28 * scale)}" 
      fill="${GOLD}" 
      opacity="${textOpacity}"
      letter-spacing="8">MALABAR ATELIER</text>
  `;

  // Subtle scanline texture overlay
  const scanlines = Array.from({ length: 12 }, (_, i) => {
    const sy = cy - baseH * 0.5 + (i / 12) * baseH * 1.3;
    return `<line x1="${cx - baseW * 0.6}" y1="${sy}" x2="${cx + baseW * 0.6}" y2="${sy}" stroke="${GOLD_LIGHT}" stroke-width="0.3" opacity="${0.06 * opacity}"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  ${defs}
  ${bg}
  ${glowCircle}
  ${particleSVG}
  ${plate}
  ${innerArch}
  ${petalsVG}
  ${bellsSVG}
  ${motifsSVG}
  ${centerGem}
  ${scanlines}
  ${brandText}
</svg>`;
}

// Fix typo in variable name
function generateFrameFixed(frameIndex) {
  const svg = generateFrame(frameIndex);
  return svg.replace('${petalsVG}', ''); // will regenerate properly below
}

// Regenerate with correct variable
function makeFrame(frameIndex) {
  const progress = frameIndex / (TOTAL_FRAMES - 1);
  const angle = progress * Math.PI * 2;
  const scaleProgress = easeInOut(Math.min(progress * 2, 1));
  const glowIntensity = 0.4 + 0.6 * Math.sin(progress * Math.PI * 4);
  const opacity = Math.min(progress * 3, 1);

  const skewX = Math.sin(angle) * 0.35;
  const scaleX = Math.abs(Math.cos(angle)) * 0.4 + 0.6;
  const scale = 0.3 + scaleProgress * 0.7;

  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;

  const baseW = 500 * scale * scaleX;
  const baseH = 320 * scale;
  const archH = 200 * scale;
  const petalCount = 9;
  const glowR = 280 * scale * (0.8 + glowIntensity * 0.4);

  const particles = Array.from({ length: 18 }, (_, i) => {
    const t = (progress + i / 18) % 1;
    const px = cx + Math.sin(t * Math.PI * 6 + i) * 320 * scale;
    const py = cy + Math.cos(t * Math.PI * 4 + i * 0.7) * 180 * scale;
    const pr = (2 + Math.sin(i * 1.3 + progress * 5) * 1.5) * scale;
    const po = (0.3 + 0.7 * Math.sin(t * Math.PI)) * opacity;
    return { px, py, pr, po };
  });

  function skewPt(x, y) {
    const relX = (x - cx) * scaleX;
    const relY = y - cy;
    const skewedX = cx + relX + relY * skewX * 0.5;
    return [skewedX, y];
  }

  const defs = `<defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#2A1200"/>
      <stop offset="100%" stop-color="${EBONY}"/>
    </radialGradient>
    <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="${(0.25 * glowIntensity).toFixed(3)}"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="centerGem" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFE8A0"/>
      <stop offset="40%" stop-color="${GOLD}"/>
      <stop offset="100%" stop-color="${GOLD_DARK}"/>
    </radialGradient>
    <radialGradient id="petalGrad" cx="50%" cy="30%" r="70%">
      <stop offset="0%" stop-color="${GOLD_LIGHT}"/>
      <stop offset="60%" stop-color="${GOLD}"/>
      <stop offset="100%" stop-color="${GOLD_DARK}"/>
    </radialGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="${(8 * glowIntensity).toFixed(2)}" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <linearGradient id="plateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${GOLD_LIGHT}"/>
      <stop offset="50%" stop-color="${GOLD}"/>
      <stop offset="100%" stop-color="${GOLD_DARK}"/>
    </linearGradient>
  </defs>`;

  const bg = `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGrad)"/>`;
  const glowCircle = `<ellipse cx="${cx}" cy="${cy}" rx="${glowR.toFixed(2)}" ry="${(glowR * 0.6).toFixed(2)}" fill="url(#glowGrad)"/>`;
  const particleSVG = particles.map(p =>
    `<circle cx="${p.px.toFixed(2)}" cy="${p.py.toFixed(2)}" r="${p.pr.toFixed(2)}" fill="${GOLD}" opacity="${p.po.toFixed(3)}"/>`
  ).join('');

  const plateTop = cy - archH;
  const plateBottom = cy + baseH * 0.3;

  const archPoints = [];
  for (let i = 0; i <= 32; i++) {
    const t = i / 32;
    const ax = cx + Math.cos(Math.PI + t * Math.PI) * baseW * 0.5;
    const ay = plateTop + Math.sin(t * Math.PI) * archH * 0.3;
    const [sx, sy] = skewPt(ax, ay);
    archPoints.push(`${sx.toFixed(2)},${sy.toFixed(2)}`);
  }
  const [blx, bly] = skewPt(cx - baseW * 0.5, plateBottom);
  const [brx, bry] = skewPt(cx + baseW * 0.5, plateBottom);
  const platePath = `M ${archPoints[0]} ${archPoints.slice(1).map(p => `L ${p}`).join(' ')} L ${brx.toFixed(2)},${bry.toFixed(2)} L ${blx.toFixed(2)},${bly.toFixed(2)} Z`;
  const plate = `<path d="${platePath}" fill="url(#plateGrad)" opacity="${opacity.toFixed(3)}" filter="url(#softGlow)" stroke="${GOLD_LIGHT}" stroke-width="1.5" stroke-opacity="0.6"/>`;

  const innerArchPoints = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const ax = cx + Math.cos(Math.PI + t * Math.PI) * baseW * 0.42;
    const ay = plateTop + archH * 0.08 + Math.sin(t * Math.PI) * archH * 0.25;
    const [sx, sy] = skewPt(ax, ay);
    innerArchPoints.push(`${sx.toFixed(2)},${sy.toFixed(2)}`);
  }
  const innerArch = `<polyline points="${innerArchPoints.join(' ')}" fill="none" stroke="${GOLD_LIGHT}" stroke-width="1" stroke-opacity="${(0.5 * opacity).toFixed(3)}"/>`;

  const petalsSVG = Array.from({ length: petalCount }, (_, i) => {
    const t = (i + 0.5) / petalCount;
    const ax = cx + Math.cos(Math.PI + t * Math.PI) * baseW * 0.46;
    const ay = plateTop + Math.sin(t * Math.PI) * archH * 0.28;
    const [sx, sy] = skewPt(ax, ay);
    const pr = 14 * scale * scaleX;
    const pr2 = 9 * scale;
    return `<ellipse cx="${sx.toFixed(2)}" cy="${sy.toFixed(2)}" rx="${pr.toFixed(2)}" ry="${pr2.toFixed(2)}" fill="url(#petalGrad)" opacity="${(opacity * 0.9).toFixed(3)}" filter="url(#softGlow)" stroke="${GOLD_LIGHT}" stroke-width="0.8"/>`;
  }).join('');

  const bellCount = 11;
  const bellsSVG = Array.from({ length: bellCount }, (_, i) => {
    const t = (i + 0.5) / bellCount;
    const bx_base = cx - baseW * 0.46 + t * baseW * 0.92;
    const [bx, by_base] = skewPt(bx_base, plateBottom);
    const bellH = (22 + Math.sin(i * 1.1 + progress * Math.PI * 2) * 4) * scale;
    const bellW = 10 * scale * scaleX;
    const stringLen = 18 * scale;
    const swing = Math.sin(progress * Math.PI * 6 + i * 0.8) * 3 * scale;
    return `<line x1="${bx.toFixed(2)}" y1="${by_base.toFixed(2)}" x2="${(bx+swing).toFixed(2)}" y2="${(by_base+stringLen).toFixed(2)}" stroke="${GOLD}" stroke-width="1" opacity="${(opacity*0.7).toFixed(3)}"/>
    <ellipse cx="${(bx+swing).toFixed(2)}" cy="${(by_base+stringLen+bellH*0.5).toFixed(2)}" rx="${bellW.toFixed(2)}" ry="${(bellH*0.5).toFixed(2)}" fill="url(#petalGrad)" opacity="${opacity.toFixed(3)}" filter="url(#softGlow)"/>
    <ellipse cx="${(bx+swing).toFixed(2)}" cy="${(by_base+stringLen+bellH*0.15).toFixed(2)}" rx="${(bellW*0.7).toFixed(2)}" ry="${(bellH*0.1).toFixed(2)}" fill="${GOLD_LIGHT}" opacity="${(opacity*0.5).toFixed(3)}"/>`;
  }).join('');

  const [gcx, gcy] = skewPt(cx, cy - archH * 0.1);
  const gemR = 32 * scale * scaleX;
  const gemR2 = 28 * scale;
  const centerGem = `<ellipse cx="${gcx.toFixed(2)}" cy="${gcy.toFixed(2)}" rx="${(gemR*1.6).toFixed(2)}" ry="${(gemR2*1.6).toFixed(2)}" fill="${GOLD}" opacity="${(0.15*glowIntensity*opacity).toFixed(3)}" filter="url(#glow)"/>
    <ellipse cx="${gcx.toFixed(2)}" cy="${gcy.toFixed(2)}" rx="${gemR.toFixed(2)}" ry="${gemR2.toFixed(2)}" fill="url(#centerGem)" opacity="${opacity.toFixed(3)}" filter="url(#glow)" stroke="${GOLD_LIGHT}" stroke-width="2"/>
    <ellipse cx="${(gcx-gemR*0.25).toFixed(2)}" cy="${(gcy-gemR2*0.3).toFixed(2)}" rx="${(gemR*0.25).toFixed(2)}" ry="${(gemR2*0.2).toFixed(2)}" fill="white" opacity="${(0.35*opacity).toFixed(3)}"/>`;

  const motifsSVG = [-1, 1].map(side => {
    const mx_base = cx + side * baseW * 0.3;
    const [mx, my] = skewPt(mx_base, cy + 10 * scale);
    const mr = 16 * scale * scaleX;
    return `<ellipse cx="${mx.toFixed(2)}" cy="${my.toFixed(2)}" rx="${mr.toFixed(2)}" ry="${(mr*0.85).toFixed(2)}" fill="none" stroke="${GOLD}" stroke-width="1.5" opacity="${(opacity*0.7).toFixed(3)}"/>
      <ellipse cx="${mx.toFixed(2)}" cy="${my.toFixed(2)}" rx="${(mr*0.55).toFixed(2)}" ry="${(mr*0.5).toFixed(2)}" fill="${GOLD}" opacity="${(opacity*0.4).toFixed(3)}"/>`;
  }).join('');

  const textOpacity = Math.max(0, (progress - 0.7) / 0.3);
  const brandText = textOpacity > 0 ? `<text x="${cx}" y="${(cy + baseH*0.55 + 50*scale).toFixed(2)}" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="${Math.round(28*scale)}" fill="${GOLD}" opacity="${textOpacity.toFixed(3)}" letter-spacing="8">MALABAR ATELIER</text>` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
${defs}
${bg}
${glowCircle}
${particleSVG}
${plate}
${innerArch}
${petalsSVG}
${bellsSVG}
${motifsSVG}
${centerGem}
${brandText}
</svg>`;
}

console.log(`Generating ${TOTAL_FRAMES} Nettipattam frames...`);
let success = 0;
for (let i = 0; i < TOTAL_FRAMES; i++) {
  try {
    const svg = makeFrame(i);
    const filename = `frame_${String(i + 1).padStart(3, '0')}.svg`;
    fs.writeFileSync(path.join(OUTPUT_DIR, filename), svg, 'utf8');
    success++;
    if (i % 20 === 0) process.stdout.write(`  Frame ${i+1}/${TOTAL_FRAMES}...\n`);
  } catch(e) {
    console.error(`Frame ${i+1} failed:`, e.message);
  }
}
console.log(`✅ Done! ${success}/${TOTAL_FRAMES} frames saved to ./frames/`);
