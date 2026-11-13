const base='/assets/map-encounters/';
const story = [
  ["lens", "달 표면이 또렷해졌어? 망원경 덮개를 꽉 닫아 놨는데!", "달의 움푹 팬 곳에 내 이름이나 붙일까!", "앗, 렌즈 덮개가 들렸어!", "내가 흐린 달 사진이 선명해졌잖아!", "쳇, 달 관측대는 열어 둘게!"],
  ["dial", "날짜별 달빛 기록을 맞췄어? 한 장을 뒤집어 놨는데!", "다음 달력은 전부 날짜를 내 생일로 바꿀 거야!", "앗, 가려 둔 날짜가 보여!", "뒤죽박죽 달 사진이 순서대로 돌아왔어!", "흥, 관측 날짜는 원래대로 써 둘게!"],
  ["flip", "행성의 특징으로 표찰을 맞췄어? 목성을 내 맘대로 분류했는데!", "나도 새 행성으로 등록해. 이름은 ‘악당성’!", "앗, 행성 표가 제자리로!", "내가 바꿔 둔 이름표가 떨어졌어!", "쳇, 행성 목록에 내 이름은 빼 줘!"],
  ["light", "별과 행성의 빛을 구별했어? 내가 붙인 가짜 별이 들통이잖아!", "내 가짜 별도 반짝이는 건 진짜라고!", "앗, 가짜 별 조명이 깜빡여!", "관측 데크에 진짜 별빛이 들어오잖아!", "흥, 렌즈에 붙인 별은 떼어 갈게!"],
  ["arrow", "북극성으로 방향을 찾았어? 내가 돌려 둔 북쪽 화살표는 어쩌고!", "다음엔 모든 화살표를 내 기지로 돌려야지!", "앗, 북쪽 표지가 돌아갔어!", "내가 가린 별자리 그림이 다 보인다!", "쳇, 북쪽은 그대로 둘게. 난 반대편으로 퇴장!"],
];
export const encounterLook = {palette:'#ffdb82', effect:'starlight', art:{left:base+'villain-redraw.png',frames:6}};
export function encounterStage(index,id,name,point){
  const [prop,one,two,hitOne,hitTwo,finish]=story[index];
  return {id:String(id),name,speaker:"별빛 가림이",x:point.x,y:point.y,lines:[one,two],prop,hit:[hitOne,hitTwo],finish};
}
export function loadEncounterActor(name){const image=new Image();image.src=base+name+'-redraw.png';return image;}
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
