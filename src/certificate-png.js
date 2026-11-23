import {finishCertificateWax} from './certificate-wax.js';
const LONG_SIDE = 2400;
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
function lines(node) {
  const out = [];
  const range = document.createRange();
  const value = node.data;
  let cur = "", top = NaN, left = 0, right = 0, bottom = 0, ctop = 0;
  for (let i = 0; i < value.length; i++) {
    range.setStart(node, i);
    range.setEnd(node, i + 1);
    const r = range.getClientRects()[0];
    if (!r) continue;
    if (!Number.isNaN(top) && Math.abs(r.top - top) > r.height / 2) {
      out.push({ text: cur, rect: new DOMRect(left, ctop, right - left, bottom - ctop) });
      cur = "";
      top = NaN;
    }
    if (Number.isNaN(top)) {
      top = r.top;
      ctop = r.top;
      left = r.left;
      bottom = r.bottom;
    }
    cur += value[i];
    right = r.right;
    bottom = Math.max(bottom, r.bottom);
  }
  if (cur.trim()) out.push({ text: cur, rect: new DOMRect(left, ctop, right - left, bottom - ctop) });
  return out.filter((l) => l.text.trim());
}
async function drawCertificate(paper) {
  finishCertificateWax(paper);
  await document.fonts?.ready;
  for (const animation of paper.getAnimations({ subtree: true })) animation.finish();
  const box = paper.getBoundingClientRect();
  const scale = LONG_SIDE / box.width;
  const canvas = document.createElement("canvas");
  canvas.width = LONG_SIDE;
  canvas.height = Math.round(box.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fffdf6";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const X = (v) => (v - box.left) * scale, Y = (v) => (v - box.top) * scale;
  const frame = paper.querySelector(".cert-background");
  if (frame?.src) {
    const img = await loadImage(frame.src);
    const r = frame.getBoundingClientRect();
    ctx.drawImage(img, X(r.left), Y(r.top), r.width * scale, r.height * scale);
  }
  for (const el of paper.querySelectorAll(".cert-content *")) {
    if(el.closest('[data-cert-export-ignore]'))continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const radius = (cs.borderTopLeftRadius.endsWith("%") ? Math.min(r.width, r.height) * parseFloat(cs.borderTopLeftRadius) / 100 : parseFloat(cs.borderTopLeftRadius)) * scale || 0;
    const bg = cs.backgroundColor;
    if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
      ctx.fillStyle = bg;
      roundRect(ctx, X(r.left), Y(r.top), r.width * scale, r.height * scale, radius);
      ctx.fill();
    }
    const sides=['Top','Right','Bottom','Left'], widths=sides.map(side=>parseFloat(cs['border'+side+'Width'])||0);
    if(widths[0] && widths.every(width=>width===widths[0]) && sides.every(side=>cs['border'+side+'Style']===cs.borderTopStyle)){
      const bw=widths[0];ctx.strokeStyle=cs.borderTopColor;ctx.lineWidth=bw*scale;
      roundRect(ctx,X(r.left)+bw*scale/2,Y(r.top)+bw*scale/2,(r.width-bw)*scale,(r.height-bw)*scale,radius);ctx.stroke();
    }else{
      const coords=[[r.left,r.top,r.right,r.top],[r.right,r.top,r.right,r.bottom],[r.left,r.bottom,r.right,r.bottom],[r.left,r.top,r.left,r.bottom]];
      sides.forEach((side,index)=>{const width=widths[index],style=cs['border'+side+'Style'];if(!width||style==='none')return;ctx.strokeStyle=cs['border'+side+'Color'];ctx.lineWidth=width*scale;ctx.setLineDash(style==='dashed'?[3*width*scale,3*width*scale]:[]);const [x1,y1,x2,y2]=coords[index];ctx.beginPath();ctx.moveTo(X(x1),Y(y1));ctx.lineTo(X(x2),Y(y2));ctx.stroke();ctx.setLineDash([]);});
    }
  }
  for (const art of paper.querySelectorAll('.cert-wax-art')) { await art.decode();const r=art.getBoundingClientRect();ctx.drawImage(art,X(r.left),Y(r.top),r.width*scale,r.height*scale); }
  const walker = document.createTreeWalker(paper.querySelector(".cert-content"), NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    if(el.closest('[data-cert-export-ignore]'))continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${parseFloat(cs.fontSize) * scale}px ${cs.fontFamily}`;
    ctx.fillStyle = cs.color;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    const spacing = parseFloat(cs.letterSpacing) || 0;
    for (const line of lines(n)) {
      const y = Y(line.rect.top + line.rect.height / 2);
      if (spacing) {
        let x = X(line.rect.left);
        for (const ch of line.text) {
          ctx.fillText(ch, x, y);
          x += ctx.measureText(ch).width + spacing * scale;
        }
      } else {
        const stroke = parseFloat(cs.getPropertyValue("-webkit-text-stroke-width")) || 0;
        if (stroke) {
          ctx.lineWidth = stroke * scale;
          ctx.strokeStyle = cs.color;
          ctx.lineJoin = "round";
          ctx.strokeText(line.text, X(line.rect.left), y, line.rect.width * scale + 2);
        }
        ctx.fillText(line.text, X(line.rect.left), y, line.rect.width * scale + 2);
      }
    }
  }
  return canvas;
}
async function saveCertificatePng(paper, filename) {
  const canvas = await drawCertificate(paper);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("png");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4e3);
}
export {
  drawCertificate,
  saveCertificatePng
};
