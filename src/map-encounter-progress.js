const HITS=3;
export function normalizeMapHits(value,ids) {
  return Object.fromEntries(ids.flatMap(id=>{
    const hits=Object.hasOwn(value??{},id)?value[id]:0;
    return Number.isInteger(hits)&&hits>0?[[id,Math.min(hits,HITS)]]:[];
  }));
}
