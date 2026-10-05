import assert from 'node:assert/strict';
import { test } from 'node:test';
import { textBlocks } from '../src/lib/record-text.ts';

test('table records split into prose and a table with a header row', () => {
  const text = [
    '1d10 Door/chest Difficulty',
    '1d10 | Door/chest | Difficulty',
    '1-6 | Open | -',
    '7 | Locked | ',
    'A footnote.',
  ].join('\n');
  assert.deepEqual(textBlocks(text), [
    { kind: 'text', lines: ['1d10 Door/chest Difficulty'] },
    {
      kind: 'table',
      rows: [
        ['1d10', 'Door/chest', 'Difficulty'],
        ['1-6', 'Open', '-'],
        ['7', 'Locked', ''],
      ],
    },
    { kind: 'text', lines: ['A footnote.'] },
  ]);
});

test('a lone line containing a pipe stays prose', () => {
  assert.deepEqual(textBlocks('Sneaky Talents\nPick | lock now takes 1 AP.'), [
    { kind: 'text', lines: ['Sneaky Talents'] },
    { kind: 'text', lines: ['Pick | lock now takes 1 AP.'] },
  ]);
});
