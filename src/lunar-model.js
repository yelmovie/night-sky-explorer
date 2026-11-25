// The same scope statement is shown and read aloud; existing video/voice assets stay intact.
export const lunarModelVoice = {
  id: 'model-phase-scope', speaker: '달토끼 기록원 루미',
  text: '오른쪽에서 왼쪽으로 보이는 순서는 화면 방향을 고정한 학습 모형의 순서예요.',
  src: '/assets/audio/voices/el-model-phase-scope.mp3',
};

export const lunarPhaseAngle = day => day / 29.53 * Math.PI * 2;
