import fs from 'fs';
const p = 'C:/Users/TPC/Documents/Projet par défaut/sneaker-store-3d/dist/assets/index-B7wkSg2U.js';
const c = fs.readFileSync(p,'utf8');
console.log((c.match(/\/models\/shoe\.glb/g)||[]).length);
