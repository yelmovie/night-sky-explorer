const base='/assets/map-encounters/';
const story = [
  [
    "망원경에 덮개를 씌웠지!",
    "이제 달은 안 보이지!",
    "lens"
  ],
  [
    "달빛 기록판의 날짜를 가렸어!",
    "가린 날짜는 못 읽겠지!",
    "dial"
  ],
  [
    "행성 표찰 하나를 슬쩍 뒤집었어!",
    "어느 행성 표찰을 뒤집을까?",
    "flip"
  ],
  [
    "가짜 별을 렌즈 앞에 달았지!",
    "이 별은 내가 붙였어!",
    "light"
  ],
  [
    "북쪽 표지의 방향을 가렸지!",
    "어느 쪽이 북쪽일까?",
    "arrow"
  ]
];
const hit = ["앗, 내 렌즈 덮개!", "투사기 빛이 흔들리잖아!"], finish = "덮개가 빠졌어. 별빛이 다시 보여!";
export const encounterLook = {palette:'#ffdb82', effect:'starlight', art:{left:base+'villain-left.png',frames:6}};
export function encounterStage(index,id,name,point){
  const [one,two,prop]=story[index];
  return {id:String(id),name,x:point.x,y:point.y,lines:[one,two],prop,hit,finish};
}
export function loadEncounterActor(name){const image=new Image();image.src=base+name+'.png';return image;}
export function drawEncounterActor(context,image,point,size,pose,{native=1}={}){
  if(!pose||!image.complete||!image.naturalWidth)return false;
  const cell=image.naturalHeight;
  const index=pose.kind==='attack'?4+Number(pose.frame>0):Math.min(3,pose.frame);
  context.save();
  context.translate(point.x+pose.dx,point.y);
  context.scale(pose.direction*native,1);
  const side=size/.84;
  context.drawImage(image,index*cell,0,cell,cell,-side/2,-side*.935,side,side);
  context.restore();
  return true;
}
