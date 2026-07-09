import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });

// Capture our site (Vercel deployment)
console.log('Capturing our site (Vercel)...');
const ourPage = await browser.newPage();
await ourPage.setViewportSize({ width: 1440, height: 900 });
await ourPage.goto('https://semilleros-fibog.vercel.app', { waitUntil: 'networkidle', timeout: 60000 });
await ourPage.waitForTimeout(3000);

// Capture header area
await ourPage.screenshot({ 
  path: '/home/niko/Proyectos/Semilleros/screenshots/our-header.png',
  clip: { x: 0, y: 0, width: 1440, height: 400 }
});

// Capture full page
await ourPage.screenshot({ 
  path: '/home/niko/Proyectos/Semilleros/screenshots/our-full.png',
  fullPage: true
});

console.log('Our site captured');

await browser.close();
console.log('Done! Screenshots saved to /home/niko/Proyectos/Semilleros/screenshots/');
