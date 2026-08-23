import test from 'node:test';
import assert from 'node:assert/strict';
import {
  wikilinkRegex,
  extractWikilinks,
  buildBacklinkIndex,
  findBrokenWikilinks,
} from '../src/lib/wikilinks.mjs';

test('wikilinkRegex returns a fresh regex each call', () => {
  const a = wikilinkRegex();
  a.exec('[[one]] [[two]]');
  assert.equal(a.lastIndex > 0, true);
  assert.equal(wikilinkRegex().lastIndex, 0);
});

test('wikilinkRegex captures the target and optional label', () => {
  const match = wikilinkRegex().exec('see [[my-slug|Nice Label]] here');
  assert.equal(match[1], 'my-slug');
  assert.equal(match[2], 'Nice Label');
});

test('extractWikilinks finds plain links', () => {
  assert.deepEqual(extractWikilinks('a [[one]] b [[two]] c'), ['one', 'two']);
});

test('extractWikilinks strips labels and whitespace', () => {
  assert.deepEqual(extractWikilinks('[[ one | Label ]]'), ['one']);
});

test('extractWikilinks deduplicates repeated targets', () => {
  assert.deepEqual(extractWikilinks('[[one]] and [[one]] again'), ['one']);
});

test('extractWikilinks returns empty for no links', () => {
  assert.deepEqual(extractWikilinks('nothing here'), []);
});

test('buildBacklinkIndex maps targets to linking posts', () => {
  const posts = [
    { id: 'a', title: 'A', body: 'links to [[b]]' },
    { id: 'c', title: 'C', body: 'also links to [[b]]' },
    { id: 'b', title: 'B', body: 'no links' },
  ];
  const index = buildBacklinkIndex(posts);
  assert.deepEqual(index.get('b'), [
    { id: 'a', title: 'A' },
    { id: 'c', title: 'C' },
  ]);
  assert.equal(index.has('a'), false);
});

test('buildBacklinkIndex ignores self-links', () => {
  const index = buildBacklinkIndex([{ id: 'a', title: 'A', body: 'see [[a]]' }]);
  assert.equal(index.has('a'), false);
});

test('findBrokenWikilinks reports unknown targets', () => {
  const posts = [
    { id: 'a', body: 'to [[b]] and [[nope]]' },
    { id: 'b', body: '' },
  ];
  assert.deepEqual(findBrokenWikilinks(posts), [{ from: 'a', to: 'nope' }]);
});

test('findBrokenWikilinks returns empty when all targets exist', () => {
  const posts = [
    { id: 'a', body: 'to [[b]]' },
    { id: 'b', body: '' },
  ];
  assert.deepEqual(findBrokenWikilinks(posts), []);
});
