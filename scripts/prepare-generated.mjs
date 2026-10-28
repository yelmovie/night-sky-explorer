import { readFile,writeFile,copyFile,mkdir,stat } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
const root=path.resolve(import.meta.dirname,'..');
const entries=JSON.parse(await readFile(path.join(root,'references/generated/manifest.json'),'utf8'));
const sprites={};
for(const asset of entries){
  const raw=path.join(root,'references/generated',asset.id+'.png');
  try{await stat(raw);}catch{await copyFile(asset.source,raw);}
  const original=await readFile(raw),meta=await sharp(original).metadata();
  const sprite=['student','rabbit-walk'].includes(asset.id);
  await sharp(original).webp(sprite?{lossless:true}:{quality:91,alphaQuality:100}).toFile(path.join(root,asset.target));
  asset.width=meta.width;asset.height=meta.height;asset.hasAlpha=!!meta.hasAlpha;asset.sha256=crypto.createHash('sha256').update(original).digest('hex');asset.raw='references/generated/'+asset.id+'.png';
  if(sprite){
    const frames=[];let unsafe=0;
    for(let row=0;row<4;row++)for(let col=0;col<4;col++){
      const x=Math.floor(col*meta.width/4),y=Math.floor(row*meta.height/4),width=Math.floor((col+1)*meta.width/4)-x,height=Math.floor((row+1)*meta.height/4)-y;
      const {data,info}=await sharp(original).extract({left:x,top:y,width,height}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
      let minX=width,minY=height,maxX=0,maxY=0;
      for(let py=0;py<height;py++)for(let px=0;px<width;px++)if(data[(py*width+px)*info.channels+3]>=128){minX=Math.min(minX,px);minY=Math.min(minY,py);maxX=Math.max(maxX,px);maxY=Math.max(maxY,py);}
      if(minX===0||minY===0||maxX>=width-1||maxY>=height-1)unsafe++;
      frames.push({x,y,width,height,alphaBounds:[minX,minY,maxX,maxY],pivot:[(minX+maxX)/2,maxY]});
    }
    sprites[asset.id]={columns:4,rows:4,frames,unsafeCells:unsafe};
  }
  asset.bytes=(await stat(path.join(root,asset.target))).size;
  console.log(`${asset.id}: ${meta.width}x${meta.height}, ${Math.round(asset.bytes/1024)} KiB${sprite?', unsafe cells='+sprites[asset.id].unsafeCells:''}`);
}
await writeFile(path.join(root,'public/assets/generated/sprites.json'),JSON.stringify(sprites,null,2));
await writeFile(path.join(root,'references/generated/manifest.json'),JSON.stringify(entries,null,2)+'\n');
