import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root = new URL('../', import.meta.url);
test('화면 글꼴은 공식 나눔스퀘어 네오 웹폰트와 라이선스를 함께 제공한다', () => {
  for (const name of ['NanumSquareNeoTTF-bRg.woff2', 'NanumSquareNeoTTF-cBd.woff2']) {
    const font = readFileSync(new URL('public/assets/fonts/' + name, root));
    assert.equal(font.subarray(0, 4).toString(), 'wOF2');
    assert.ok(font.length > 300000);
  }
  const license = readFileSync(new URL('public/assets/fonts/NanumSquareNeo-OFL.txt', root), 'utf8');
  assert.match(license, /NanumSquareNeo/);
  assert.match(license, /SIL OPEN FONT LICENSE/);
  assert.match(license, /DISCLAIMER/);
  assert.match(readFileSync(new URL('src/styles.css', root), 'utf8'), /font-family: "NanumSquareNeo"/);
});
