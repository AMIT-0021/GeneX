import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';

// Standalone Exact Logo SVG Markup (Priority 2 Spec)
const standaloneSvg = `<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="lensGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D98E3F"/>
      <stop offset="100%" stop-color="#5C8A6B"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="44" fill="none" stroke="url(#lensGrad)" stroke-width="11" stroke-linecap="round"/>
  <path d="M60 16 A44 44 0 0 1 104 60 L 80 60" fill="none" stroke="#FFFFFF" stroke-width="11" stroke-linecap="round"/>
  <circle cx="60" cy="60" r="13" fill="#0F2340"/>
  <circle cx="55" cy="55" r="4" fill="#FFFFFF" opacity="0.55"/>
</svg>`;

// App Icon / PWA Version (inside a 120x120, rx 26 white squircle)
const pwaAppIconSvg = `<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="lensGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D98E3F"/>
      <stop offset="100%" stop-color="#5C8A6B"/>
    </linearGradient>
  </defs>
  <!-- White Squircle Background (120x120, rx 26) -->
  <rect width="120" height="120" rx="26" fill="#FFFFFF"/>
  
  <!-- Centered Exact Lens Mark Logo -->
  <g>
    <circle cx="60" cy="60" r="44" fill="none" stroke="url(#lensGrad)" stroke-width="11" stroke-linecap="round"/>
    <path d="M60 16 A44 44 0 0 1 104 60 L 80 60" fill="none" stroke="#FFFFFF" stroke-width="11" stroke-linecap="round"/>
    <circle cx="60" cy="60" r="13" fill="#0F2340"/>
    <circle cx="55" cy="55" r="4" fill="#FFFFFF" opacity="0.55"/>
  </g>
</svg>`;

const targetDir = path.resolve(process.cwd(), 'public');

async function generate() {
  const sizes = [
    { name: 'icon-512.png', width: 512 },
    { name: 'icon-192.png', width: 192 },
    { name: 'apple-touch-icon.png', width: 180 },
    { name: 'favicon-32x32.png', width: 32 },
    { name: 'favicon-16x16.png', width: 16 }
  ];

  for (const item of sizes) {
    const resvg = new Resvg(pwaAppIconSvg, {
      fitTo: { mode: 'width', value: item.width },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();
    const filePath = path.join(targetDir, item.name);
    fs.writeFileSync(filePath, pngBuffer);
    console.log(`Generated ${item.name} (${item.width}x${item.width})`);
  }

  // Write standalone favicon.svg using exact spec
  fs.writeFileSync(path.join(targetDir, 'favicon.svg'), standaloneSvg);
  console.log('Generated favicon.svg using exact Priority 2 spec');
}

generate().catch(console.error);
