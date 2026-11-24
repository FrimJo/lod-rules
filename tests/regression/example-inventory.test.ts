import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadReviewSnapshot } from '../../scripts/validate/independent-review.ts';
import { repoRoot } from '../../scripts/validate/schemas.ts';
import {
  checkExampleInventory,
  inventoryContext,
  type ExampleInventory,
  type InventoryContext,
  type InventoryEntry,
} from '../support/example-inventory.ts';

const fixture = JSON.parse(
  readFileSync(join(repoRoot, 'tests/fixtures/example-inventory.json'), 'utf8'),
) as ExampleInventory;

let context: InventoryContext;
beforeAll(() => {
  context = inventoryContext(loadReviewSnapshot());
}, 60_000);

/** A copy of the fixture with one entry changed, so each rule is shown to fire on its own. */
function withEntry(id: string, change: (entry: InventoryEntry) => void): ExampleInventory {
  const copy = structuredClone(fixture);
  const entry = copy.entries.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`fixture has no entry ${id}`);
  change(entry);
  return copy;
}
const executableId = 'example.combat.shove_dex_35';
const descriptiveId = 'example.game_basics.check_kinds';

describe('example inventory (issues #13, #14)', () => {
  it('agrees with the pilot test cases, the source map and review/', () => {
    expect(checkExampleInventory(fixture, context)).toEqual([]);
  });

  it('claims every source_example case exactly once', () => {
    const claimed = fixture.entries.flatMap((entry) => entry.cases ?? []).sort();
    const sourceExamples = [...context.caseKinds]
      .filter(([, kind]) => kind === 'source_example')
      .map(([id]) => id)
      .sort();
    expect(claimed).toEqual(sourceExamples);
  });

  it('allowlists only live sections', () => {
    const live = new Set(
      [...context.sections].filter(([, redirected]) => !redirected).map(([id]) => id),
    );
    expect(fixture.unswept_sections.filter((id) => !live.has(id))).toEqual([]);
  });

  it('the Travel, Settlements, Guilds, Inner Sanctum, Estate and Appendices sweep (#19) leaves none of its sections allowlisted', () => {
    const swept = [
      'travel_and_settlements',
      'travelling_and_skirmishes',
      'settlements',
      'the_dark_guild',
      'fighters_guild',
      'wizards_guild',
      'alchemists_guild',
      'rangers_guild',
      'the_inner_sanctum',
      'buying_an_estate',
      'appendices',
      'appendix_i_perks',
      'appendix_ii_talents',
      'appendix_iii_equipment',
      'appendix_iv_spells',
      'appendix_v_treasures',
      'adding_a_third_dimension',
      'back_matter',
    ];
    const inScope = (id: string): boolean =>
      swept.some((chapter) => id === `section.${chapter}` || id.startsWith(`section.${chapter}.`));
    expect(fixture.unswept_sections.filter(inScope)).toEqual([]);
  });

  describe('fails on a minimal broken copy', () => {
    const fires = (inventory: ExampleInventory, pattern: RegExp): void => {
      const problems = checkExampleInventory(inventory, context);
      expect(
        problems.some((problem) => pattern.test(problem)),
        problems.join('\n'),
      ).toBe(true);
    };

    it('an entry with no disposition', () => {
      fires(
        withEntry(descriptiveId, (entry) => {
          delete (entry as Partial<InventoryEntry>).disposition;
        }),
        /disposition/,
      );
    });

    it('an entry with an empty reason', () => {
      fires(
        withEntry(descriptiveId, (entry) => (entry.reason = '  ')),
        /empty reason/,
      );
    });

    it('an unresolved section', () => {
      fires(
        withEntry(descriptiveId, (entry) => (entry.section_id = 'section.gone')),
        /section/,
      );
    });

    it('a redirected section', () => {
      const redirected = [...context.sections].find(([, isRedirect]) => isRedirect)?.[0];
      if (!redirected) throw new Error('source map has no redirected section to test with');
      fires(
        withEntry(descriptiveId, (entry) => (entry.section_id = redirected)),
        /redirect/,
      );
    });

    it('a printed page that disagrees with the page map', () => {
      fires(
        withEntry(descriptiveId, (entry) => (entry.printed_page = 999)),
        /printed_page/,
      );
    });

    it('an unresolved case', () => {
      fires(
        withEntry(executableId, (entry) => entry.cases?.push('test.gone')),
        /test\.gone/,
      );
    });

    it('an unresolved issue', () => {
      fires(
        withEntry(descriptiveId, (entry) => (entry.issues = ['issue.gone'])),
        /issue\.gone/,
      );
    });

    it('an executable entry, not pending, with no cases', () => {
      fires(
        withEntry(executableId, (entry) => (entry.cases = [])),
        /no cases/,
      );
    });

    it('an executable entry with a derived case', () => {
      fires(
        withEntry(executableId, (entry) => entry.cases?.push('test.check.equal')),
        /not a source_example/,
      );
    });

    it('a source_example case that no entry claims', () => {
      fires(
        withEntry(executableId, (entry) => entry.cases?.pop()),
        /claimed by no entry/,
      );
    });

    it('a source_example case claimed twice', () => {
      const claimed = fixture.entries.find((entry) => entry.id === executableId)!.cases![0]!;
      fires(
        withEntry(descriptiveId, (entry) => (entry.cases = [claimed])),
        /claimed by 2/,
      );
    });

    it('a source_conflicted entry without an issue', () => {
      fires(
        withEntry(descriptiveId, (entry) => {
          entry.disposition = 'source_conflicted';
          delete entry.issues;
        }),
        /names no issue/,
      );
    });

    it('an inventoried section whose examples coverage is not_applicable', () => {
      fires(
        withEntry(descriptiveId, (entry) => {
          entry.section_id = 'section.front_matter';
          entry.pdf_page = 1;
          entry.printed_page = null;
        }),
        /not_applicable/,
      );
    });

    it('an allowlisted section that no longer exists', () => {
      const copy = structuredClone(fixture);
      copy.unswept_sections.push('section.gone');
      fires(copy, /allowlisted section section\.gone/);
    });

    it('a pending flag on an entry that is not executable', () => {
      fires(
        withEntry(descriptiveId, (entry) => (entry.pending = true)),
        /pending/,
      );
    });

    it('a pending entry or allowlisted section once Phase 8 is closed', () => {
      const problems = checkExampleInventory(fixture, context, { closed: true });
      expect(problems.some((problem) => /still pending/.test(problem))).toBe(true);
      expect(problems.some((problem) => /still unswept/.test(problem))).toBe(true);
    });
  });
});
