import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { ask } from '../../../scripts/ask/index.ts';
import { Retrieval } from '../../../scripts/retrieve/index.ts';
import { citedPages, rulingCitations, rulingSourceUrl, targetFor } from '../src/lib/citations.ts';
import { rulingSource } from '../src/server/ruling-sources.ts';

let retrieval: Retrieval;
before(() => {
  retrieval = Retrieval.fromCorpus();
});
after(() => retrieval.close());

test('ruling citations open their own source and cannot enter the rulebook viewer', async () => {
  const result = await ask(
    retrieval,
    'How much party morale do we regain by taking a short rest?',
    { model: null },
  );
  const rule = result.evidence.find((item) => item.id === 'character.morale.event.short_rest')!;
  assert.deepEqual(
    citedPages(rule).map((page) => page.pdf),
    [58, 100],
  );
  assert.equal(targetFor(rule)?.pdf, 58);
  const table = result.evidence.find((item) => item.id === 'table.psychology.morale_adjustments')!;
  const ruling = rulingCitations(table)[0]!;
  assert.equal(rulingSourceUrl(ruling), '/api/sources/vonbraus.changelog_2_2x#page=4');
});

test('registered ruling sources serve PDF and download HTML; arbitrary paths are rejected', async () => {
  const pdf = rulingSource('vonbraus.changelog_2_2x');
  assert.equal(pdf.headers.get('content-type'), 'application/pdf');
  assert.equal(new TextDecoder().decode((await pdf.arrayBuffer()).slice(0, 5)), '%PDF-');
  const faq = rulingSource('vonbraus.faq_gamefound');
  assert.ok(faq.headers.get('content-disposition')?.includes('attachment'));
  assert.ok((await faq.text()).includes('You may take a shortbow instead'));
  assert.equal(rulingSource('../manifest.yaml').status, 404);
  assert.equal(rulingSource('rulebook.second_printing.eng').status, 404);
});
