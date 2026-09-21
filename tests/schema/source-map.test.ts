import { describe, expect, it } from 'vitest';
import { createAjv, getValidator } from '../../scripts/validate/schemas.ts';

const ajv = createAjv();

describe('sections schema', () => {
  const validate = getValidator(ajv, 'sections');

  it('accepts an empty list', () => {
    expect(validate([])).toBe(true);
  });

  it('accepts a minimal section', () => {
    expect(
      validate([
        {
          id: 'section.game_basics',
          title: 'Game Basics',
          kind: 'chapter',
          printed_start_page: 17,
        },
      ]),
    ).toBe(true);
  });

  it('accepts a section whose pages are not yet known', () => {
    expect(
      validate([
        {
          id: 'section.combat',
          title: 'Combat',
          kind: 'chapter',
          printed_start_page: null,
          pdf_start_page: null,
        },
      ]),
    ).toBe(true);
  });

  it('accepts cross-references in both resolved and unresolved form', () => {
    expect(
      validate([
        {
          id: 'section.equipment',
          title: 'Equipment',
          kind: 'chapter',
          see_also: ['section.appendix_iii_equipment'],
          unresolved_references: ['the Furniture Treasure Table in Appendix III'],
        },
      ]),
    ).toBe(true);
  });

  it('rejects an id outside the section namespace', () => {
    expect(validate([{ id: 'chapter.game_basics', title: 'Game Basics', kind: 'chapter' }])).toBe(
      false,
    );
  });

  it('rejects a section without a title', () => {
    expect(validate([{ id: 'section.game_basics', kind: 'chapter' }])).toBe(false);
  });

  it('rejects a section without a kind', () => {
    expect(validate([{ id: 'section.game_basics', title: 'Game Basics' }])).toBe(false);
  });

  it('rejects an unknown kind', () => {
    expect(validate([{ id: 'section.game_basics', title: 'Game Basics', kind: 'sidebar' }])).toBe(
      false,
    );
  });

  it('rejects a see_also target outside the section namespace', () => {
    expect(
      validate([
        { id: 'section.combat', title: 'Combat', kind: 'chapter', see_also: ['page.107'] },
      ]),
    ).toBe(false);
  });

  it('rejects unknown properties', () => {
    expect(
      validate([{ id: 'section.game_basics', title: 'Game Basics', kind: 'chapter', page: 17 }]),
    ).toBe(false);
  });
});

describe('pages schema', () => {
  const validate = getValidator(ajv, 'pages');

  it('accepts an empty list', () => {
    expect(validate([])).toBe(true);
  });

  it('accepts a pdf page whose printed label is unknown', () => {
    expect(validate([{ pdf_page: 1, printed_page: null }])).toBe(true);
  });

  it('rejects a page without a pdf page index', () => {
    expect(validate([{ printed_page: 17 }])).toBe(false);
  });
});

describe('coverage schema', () => {
  const validate = getValidator(ajv, 'coverage');

  it('accepts an empty section list', () => {
    expect(validate({ sections: [] })).toBe(true);
  });

  it('accepts component statuses including not_applicable', () => {
    expect(
      validate({
        sections: [
          {
            id: 'section.game_basics',
            status: 'extracting',
            components: { glossary: 'reviewed', tables: 'not_applicable' },
          },
        ],
      }),
    ).toBe(true);
  });

  it('rejects an unknown coverage status', () => {
    expect(validate({ sections: [{ id: 'section.combat', status: 'done' }] })).toBe(false);
  });

  it('rejects not_applicable as a section-level status', () => {
    expect(validate({ sections: [{ id: 'section.combat', status: 'not_applicable' }] })).toBe(
      false,
    );
  });
});
