const fs=require('node:fs');const crypto=require('node:crypto');
const roots=['package.json','package-lock.json','index.html','tsconfig.json','vite.config.ts','vercel.json'];
const files=[...roots,...fs.readdirSync('src').map(n=>'src/'+n),...fs.readdirSync('public').map(n=>'public/'+n)];
const payload=files.filter(file=>fs.statSync(file).isFile()).map(file=>({file,data:fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''),encoding:'utf-8'}));
const hash=crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
process.stdout.write(JSON.stringify({hash,files:payload}));
