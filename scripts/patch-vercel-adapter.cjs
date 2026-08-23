// Parchea @astrojs/vercel@7.8.2 para que reconozca Node 22 y 24
// El adapter tiene un mapa hardcoded de versiones soportadas que solo incluye 18 y 20.
// Node 18 fue eliminado de Vercel (early 2025), y Node 22/24 no están en el mapa.
const fs = require('fs');
const path = require('path');

const adapterPath = path.join(
  __dirname, '..', 'node_modules', '@astrojs', 'vercel', 'dist', 'serverless', 'adapter.js'
);

if (!fs.existsSync(adapterPath)) {
  console.log('patch-vercel-adapter: adapter no encontrado, saltando');
  process.exit(0);
}

let code = fs.readFileSync(adapterPath, 'utf8');

const oldMap = `const SUPPORTED_NODE_VERSIONS = {
    18: { status: 'retiring', removal: 'Early 2025', warnDate: new Date('October 1 2024') },
    20: { status: 'default' },
};`;

const newMap = `const SUPPORTED_NODE_VERSIONS = {
    18: { status: 'retiring', removal: 'Early 2025', warnDate: new Date('October 1 2024') },
    20: { status: 'default' },
    22: { status: 'default' },
    24: { status: 'default' },
};`;

if (code.includes(oldMap)) {
  code = code.replace(oldMap, newMap);
  fs.writeFileSync(adapterPath, code, 'utf8');
  console.log('patch-vercel-adapter: Node 22/24 agregados al mapa de versiones');
} else if (code.includes('22: { status:')) {
  console.log('patch-vercel-adapter: ya parcheado');
} else {
  console.log('patch-vercel-adapter: estructura inesperada, revisar manualmente');
  process.exit(1);
}
