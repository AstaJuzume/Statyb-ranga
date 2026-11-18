import { cp, mkdir, readdir, rm, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'..');
const html=await readFile(resolve(root,'dist/index.html'),'utf8');
if(html.includes('/src/main.tsx')||!html.includes('./assets/'))throw new Error('Build must reference compiled relative assets.');
await rm(resolve(root,'assets'),{recursive:true,force:true});
await mkdir(resolve(root,'assets'),{recursive:true});
for(const file of await readdir(resolve(root,'dist'))){await cp(resolve(root,'dist',file),resolve(root,file),{recursive:true,force:true});}
console.log('GitHub Pages files prepared in repository root.');
