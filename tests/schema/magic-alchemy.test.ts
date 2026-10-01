import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import { checkPilotIntegrity } from '../../scripts/validate/pilot.ts';
import { createAjv, getValidator } from '../../scripts/validate/schemas.ts';
import { phaseFourContext } from '../support/phase-four-context.ts';
const pilot = readPilot();
const context = phaseFourContext();
const validate = getValidator(createAjv(), 'entities');
const spell = pilot.entities.find((e) => e.id === 'spell.flare')!;
const recipe = pilot.entities.find((e) => e.id === 'recipe.firebomb')!;
describe('typed spell, prayer and alchemy catalogue', () => {
  it.each([0, 7, 1.5])('rejects spell level %s', (level) =>
    expect(validate([{ ...spell, level }])).toBe(false),
  );
  it('rejects invalid schools, kinds, prayer levels, qualities and recipe quantities', () => {
    for (const entity of [
      { ...spell, school: 'Evocation' },
      { ...spell, type: 'potion' },
      { ...spell, type: 'prayer', level: 5 },
      { ...recipe, quality: 'exquisite' },
      { ...recipe, components: [{ ...recipe.components![0], quantity: 0 }] },
    ])
      expect(validate([entity])).toBe(false);
  });
  it('does not allow recipe or spell fields on unrelated entities', () => {
    const part = pilot.entities.find((e) => e.type === 'part')!;
    expect(validate([{ ...part, level: 1 }])).toBe(false);
    expect(validate([{ ...part, result: { printed: 'invented' } }])).toBe(false);
  });
  it('rejects inappropriate component and result entities', () => {
    const p = structuredClone(pilot),
      r = p.entities.find((e) => e.id === recipe.id)!;
    r.components![0]!.entity_id = 'spell.flare';
    r.result!.entity_id = 'equipment.weapon.dagger';
    const errors = checkPilotIntegrity(p, context).join('\n');
    expect(errors).toContain('recipe component must be ingredient or part');
    expect(errors).toContain('recipe result must be alchemy equipment');
  });
  it('rejects unknown components and namespaces', () => {
    const p = structuredClone(pilot),
      r = p.entities.find((e) => e.id === recipe.id)!;
    r.components![0]!.entity_id = 'part.invented';
    p.entities.find((e) => e.id === spell.id)!.id = 'ingredient.flare';
    const errors = checkPilotIntegrity(p, context).join('\n');
    expect(errors).toContain('part.invented');
    expect(errors).toContain('invalid entity namespace');
  });
  it('requires reciprocal links in both directions beyond equipment', () => {
    const p = structuredClone(pilot),
      e = p.entities.find((e) => e.id === spell.id)!;
    const ref = e.table_rows![0]!;
    p.tables
      .find((t) => t.id === ref.table_id)!
      .rows.find((r) => r.id === ref.row_id)!.entity_refs = [];
    expect(checkPilotIntegrity(p, context).join('\n')).toContain(
      'spell table-row link is not reciprocal',
    );
    const q = structuredClone(pilot);
    q.entities.find((e) => e.id === spell.id)!.table_rows = [];
    expect(checkPilotIntegrity(q, context).join('\n')).toContain('entity link is not reciprocal');
  });
  it('rejects entity links on structural reroll rows', () => {
    const p = structuredClone(pilot),
      row = p.tables.find((t) => t.id === 'table.alchemy.standard')!.rows.at(-1)!;
    row.entity_refs = ['equipment.alchemy.firebomb'];
    expect(checkPilotIntegrity(p, context).join('\n')).toContain(
      'structural row must not have entities',
    );
  });
  it('keeps source naming conflicts and unknown spell values visible', () => {
    expect(pilot.entities.find((e) => e.id === 'recipe.potion_of_experience')!.result).toEqual({
      printed: 'Potion of Experience',
    });
    expect(pilot.entities.find((e) => e.id === 'spell.healing')!.issues).toContain(
      'issue.spell.healing',
    );
    expect(
      pilot.tables.find((t) => t.id === 'table.alchemy.standard')!.roll_domain,
    ).toBeUndefined();
  });
});
