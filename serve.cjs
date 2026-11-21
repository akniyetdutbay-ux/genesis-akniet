const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.woff2':'font/woff2','.woff':'font/woff','.png':'image/png','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);res.end();return}
 const file=path.resolve(root,'.'+pathname);if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 let target=file;try{if(fs.statSync(file).isDirectory())target=path.join(file,'index.html')}catch{target=path.join(root,'index.html')}
 fs.readFile(target,(err,data)=>{if(err){res.writeHead(404);res.end('Build missing. Run npm run build first.');return}res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data)})
}).listen(4173,'127.0.0.1',()=>console.log('Museum of Days: http://127.0.0.1:4173\nKeep this window open while visiting. Ctrl+C to stop.'));
