import test from 'node:test';
import assert from 'node:assert/strict';
import { joinBase, postHref, tagHref, categoryHref } from '../src/lib/paths.mjs';

test('joinBase joins a base without a trailing slash', () => {
  assert.equal(joinBase('/my-knowldege', 'posts/foo/'), '/my-knowldege/posts/foo/');
});

test('joinBase does not double the slash when base has a trailing slash', () => {
  assert.equal(joinBase('/my-knowldege/', 'posts/foo/'), '/my-knowldege/posts/foo/');
});

test('joinBase tolerates a leading slash on the path', () => {
  assert.equal(joinBase('/my-knowldege', '/posts/foo/'), '/my-knowldege/posts/foo/');
});

test('joinBase handles a root base', () => {
  assert.equal(joinBase('/', 'posts/foo/'), '/posts/foo/');
});

test('joinBase returns the base itself for an empty path', () => {
  assert.equal(joinBase('/my-knowldege', ''), '/my-knowldege/');
});

test('postHref builds a post url', () => {
  assert.equal(postHref('hello-world', '/my-knowldege/'), '/my-knowldege/posts/hello-world/');
});

test('tagHref encodes tags that need escaping', () => {
  assert.equal(tagHref('c++', '/base/'), '/base/tags/c%2B%2B/');
});

test('categoryHref builds a category url', () => {
  assert.equal(categoryHref('meta', '/base/'), '/base/categories/meta/');
});
