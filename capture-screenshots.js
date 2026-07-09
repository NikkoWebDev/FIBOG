import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });

// Capture UNAL site
console.log('Capturing unal.edu.co...');
const unalPage = await browser.newPage();
await unalPage.setViewportSize({ width: 1440, height: 900 });
await unalPage.goto('https://unal.edu.co', { waitUntil: 'networkidle', timeout: 60000 });
await unalPage.waitForTimeout(3000);

// Capture header area
await unalPage.screenshot({ 
  path: '/home/niko/Proyectos/Semilleros/screenshots/unal-header.png',
  clip: { x: 0, y: 0, width: 1440, height: 300 }
});

// Capture full page
await unalPage.screenshot({ 
  path: '/home/niko/Proyectos/Semilleros/screenshots/unal-full.png',
  fullPage: true
});

console.log('UNAL captured');

// Capture our site (Vercel deployment)
console.log('Capturing our site (Vercel)...');
const ourPage = await browser.newPage();
await ourPage.setViewportSize({ width: 1440, height: 900 });
await ourPage.goto('https://semilleros-fibog.vercel.app', { waitUntil: 'networkidle', timeout: 60000 });
await ourPage.waitForTimeout(3000);

// Capture header area
await ourPage.screenshot({ 
  path: '/home/niko/Proyectos/Semilleros/screenshots/our-header.png',
  clip: { x: 0, y: 0, width: 1440, height: 300 }
});

// Capture full page
await ourPage.screenshot({ 
  path: '/home/niko/Proyectos/Semilleros/screenshots/our-full.png',
  fullPage: true
});

console.log('Our site captured');

await browser.close();
console.log('Done! Screenshots saved to /home/niko/Proyectos/Semilleros/screenshots/');
