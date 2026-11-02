const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8'};
const server=http.createServer((req,res)=>{
  let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end('無效路徑');}
  const target=path.resolve(root,'.'+name+(name.endsWith('/')?'index.html':''));
  if(!target.startsWith(root+path.sep)||name.split('/').some(p=>p.startsWith('.')||p==='node_modules')){res.writeHead(403);return res.end('無法存取');}
  fs.readFile(target,(err,data)=>{if(err){res.writeHead(404);return res.end('找不到檔案');}res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data);});
});
server.listen(Number(process.env.PORT)||4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+server.address().port+'/Game/'));
