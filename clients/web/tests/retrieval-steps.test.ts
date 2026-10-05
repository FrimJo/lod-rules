import assert from 'node:assert/strict';
import { test } from 'node:test';
import { describeRetrieval } from '../src/lib/retrieval-steps.ts';

test('retrieval steps read as plain language, once each', () => {
  assert.deepEqual(describeRetrieval(['entity:rule', 'entity:rule']), [
    'A rule of an entry the question names',
  ]);
  assert.deepEqual(describeRetrieval(['systems:equipment', 'search', 'systems:magic+equipment']), [
    'Keyword search in the equipment and magic chapters',
    'Keyword search across the rulebook',
  ]);
  assert.deepEqual(describeRetrieval(['heading:section.combat.wounded', 'expand:uses_table']), [
    'The question names its rulebook heading',
    'Linked: a table another found record uses',
  ]);
  assert.deepEqual(describeRetrieval(['something:new']), ['something:new']);
});
