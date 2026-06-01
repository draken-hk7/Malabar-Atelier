const fs = require('fs');
const path = require('path');

const framesDir = path.join(__dirname, 'public', 'frames');

if (!fs.existsSync(framesDir)) {
    fs.mkdirSync(framesDir, { recursive: true });
}

console.log('Generating 30 placeholder frames...');

// Create simple SVG files to use as frames
for (let i = 1; i <= 30; i++) {
    const frameNum = i.toString().padStart(3, '0');
    // Animate a simple spinning and scaling effect with the brand colors
    const rotation = (i / 30) * 360;
    const scale = 0.5 + (i / 30) * 0.5;
    
    const svg = `
    <svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#1A0A00" />
        <g transform="translate(400, 400) scale(${scale}) rotate(${rotation})">
            <rect x="-150" y="-150" width="300" height="300" fill="#C9A84C" rx="20" />
            <circle cx="0" cy="0" r="100" fill="#8B0000" />
            <text x="0" y="20" font-family="sans-serif" font-size="60" font-weight="bold" fill="#FAF3E0" text-anchor="middle">Frame ${frameNum}</text>
            <text x="0" y="80" font-family="sans-serif" font-size="20" fill="#FAF3E0" text-anchor="middle">Malabar Atelier</text>
        </g>
        <circle cx="400" cy="400" r="${100 + (i/30)*200}" fill="none" stroke="#C9A84C" stroke-width="2" stroke-dasharray="10 20" />
    </svg>
    `;

    fs.writeFileSync(path.join(framesDir, `frame_${frameNum}.svg`), svg);
}

console.log('Done!');
