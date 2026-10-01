import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import { checkPilotIntegrity } from '../../scripts/validate/pilot.ts';
import { phaseFourContext } from '../support/phase-four-context.ts';
const corpus = readPilot();
const context = phaseFourContext();
describe('equipment reciprocal links and classifications', () => {
  it('accepts the complete catalogue', () =>
    expect(checkPilotIntegrity(corpus, context)).toEqual([]));
  it('rejects an entity without a reciprocal row reference', () => {
    const p = structuredClone(corpus);
    p.tables.find((t) => t.id === 'table.equipment.weapons')!.rows[0]!.entity_refs = [];
    expect(checkPilotIntegrity(p, context).join('\n')).toContain(
      'equipment table-row link is not reciprocal',
    );
  });
  it('rejects a row without a reciprocal entity reference', () => {
    const p = structuredClone(corpus);
    p.entities.find((e) => e.id === 'equipment.weapon.dagger')!.table_rows = [];
    expect(checkPilotIntegrity(p, context).join('\n')).toContain(
      'equipment entity link is not reciprocal',
    );
  });
  it('rejects invalid and absent equipment categories', () => {
    for (const category of ['', 'combat']) {
      const p = structuredClone(corpus);
      p.entities.find((e) => e.id === 'equipment.weapon.dagger')!.category = category;
      expect(checkPilotIntegrity(p, context).join('\n')).toContain(
        category ? 'invalid equipment category' : 'equipment requires a category',
      );
    }
  });
  it('rejects invented entity and rule references', () => {
    const p = structuredClone(corpus);
    const row = p.tables.find((t) => t.id === 'table.equipment.weapons')!.rows[0]!;
    row.entity_refs = ['equipment.weapon.invented'];
    row.rule_refs = ['character.equipment.invented'];
    const errors = checkPilotIntegrity(p, context).join('\n');
    expect(errors).toContain('equipment.weapon.invented');
    expect(errors).toContain('character.equipment.invented');
  });
  it('rejects an armour tier band masquerading as an item', () => {
    const p = structuredClone(corpus);
    p.tables.find((t) => t.id === 'table.equipment.armour')!.rows[0]!.entity_refs = [
      'equipment.armour.padded_cap',
    ];
    expect(checkPilotIntegrity(p, context).join('\n')).toContain(
      'tier-band row must not have item entities',
    );
  });
});
