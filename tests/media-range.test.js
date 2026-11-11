import test from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import worker from '../worker/media-range.js';

const url = 'https://example.test/assets/concepts/stage-1.webm';
const bytes = Uint8Array.from({ length: 10 }, (_, index) => index);
const assetHeaders = { 'Content-Type': 'video/webm', ETag: '"clip-v1"', 'Last-Modified': 'Wed, 11 Nov 2026 10:00:00 GMT' };
function environment(status = 200) {
  return { ASSETS: { fetch: async () => new Response(status === 200 ? bytes : null, { status, headers: assetHeaders }) } };
}

test('구간 응답에 사용하는 개념영상은 파일당 2MiB 이하로 제한한다', () => {
  for (let stage = 1; stage <= 5; stage++) {
    for (const extension of ['mp4', 'webm']) {
      assert.ok(statSync(new URL(`../public/assets/concepts/stage-${stage}.${extension}`, import.meta.url)).size < 2 * 1024 * 1024);
    }
  }
});

test('영상 전체와 HEAD 응답은 전체 길이와 구간 지원을 알린다', async () => {
  for (const method of ['GET', 'HEAD']) {
    const response = await worker.fetch(new Request(url, { method }), environment());
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('accept-ranges'), 'bytes');
    assert.equal(response.headers.get('content-length'), '10');
    assert.equal((await response.arrayBuffer()).byteLength, method === 'GET' ? 10 : 0);
  }
});

test('영상 앞·중간·끝 구간과 열린 구간을 정확한 206 응답으로 돌려준다', async () => {
  for (const [range, start, end] of [['bytes=0-1', 0, 1], ['bytes=3-6', 3, 6], ['bytes=7-', 7, 9], ['bytes=-3', 7, 9], ['bytes=8-99999999999999999999', 8, 9], ['bytes=-99', 0, 9]]) {
    const response = await worker.fetch(new Request(url, { headers: { Range: range } }), environment());
    assert.equal(response.status, 206, range);
    assert.equal(response.headers.get('content-range'), `bytes ${start}-${end}/10`);
    assert.equal(response.headers.get('content-length'), String(end - start + 1));
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes.slice(start, end + 1));
  }
});

test('파일 밖의 구간과 역방향·길이0 구간은 416으로 응답한다', async () => {
  for (const range of ['bytes=10-', 'bytes=99999999999999999999-', 'bytes=8-3', 'bytes=-0']) {
    const response = await worker.fetch(new Request(url, { headers: { Range: range } }), environment());
    assert.equal(response.status, 416, range);
    assert.equal(response.headers.get('content-range'), 'bytes */10');
    assert.equal((await response.arrayBuffer()).byteLength, 0);
  }
});

test('지원하지 않는 복수 구간과 잘못된 구간 문법은 전체 파일로 응답한다', async () => {
  for (const range of ['bytes=0-1,4-5', 'bytes=-', 'words=0-1', 'bytes=abc']) {
    const response = await worker.fetch(new Request(url, { headers: { Range: range } }), environment());
    assert.equal(response.status, 200, range);
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes);
  }
});

test('If-Range 검증자가 일치할 때만 구간 응답을 사용한다', async () => {
  for (const [validator, status] of [['"clip-v1"', 206], [assetHeaders['Last-Modified'], 206], ['"old-clip"', 200], ['W/"clip-v1"', 200]]) {
    const response = await worker.fetch(new Request(url, { headers: { Range: 'bytes=2-4', 'If-Range': validator } }), environment());
    assert.equal(response.status, status, validator);
  }
});

test('일반 자산과 304·404 응답은 자산 바인딩의 결과를 사용한다', async () => {
  const request = new Request('https://example.test/assets/logo.webp');
  const response = new Response('logo');
  assert.equal(await worker.fetch(request, { ASSETS: { fetch: async received => { assert.equal(received, request); return response; } } }), response);
  for (const status of [304, 404]) {
    const result = await worker.fetch(new Request(url, { headers: { Range: 'bytes=0-1' } }), environment(status));
    assert.equal(result.status, status);
  }
});
