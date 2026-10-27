import fs from 'fs';
const f = 'C:/Users/TPC/Documents/Projet par défaut/sneaker-store-3d/src/data/store.js';
let c = fs.readFileSync(f, 'utf8');
c = c.replace("const storeBaseUrl = import.meta.env.BASE_URL || '/';\n", '');
c = c.replace("const assetPath = (path) => `${storeBaseUrl}${path.replace(/^\\/+/, '')}`;\n", '');
c = c.replace(/assetPath\(/g, 'asset(');
fs.writeFileSync(f, c);
console.log('done');
