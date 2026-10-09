/**
 * Hands finished heroes to the Game Master's table (/gm) so nobody types the names and RES
 * twice. The table keeps its own state; this only adds or updates heroes by name.
 */
import { dispatch as gmDispatch, peekState } from '../gm/store.ts';
import { derive, heroName, type PartyState } from './engine.ts';

export interface HandoffResult {
  added: string[];
  updated: string[];
}

export function sendPartyToTable(party: PartyState): HandoffResult {
  const result: HandoffResult = { added: [], updated: [] };
  for (const hero of party.heroes) {
    const derived = derive(hero);
    const resolve = derived.stats.res;
    if (resolve === undefined) continue;
    const name = heroName(hero, party);
    const nightVision = derived.talents.some((t) => t.talent.id === 'night_vision');
    const existing = peekState().heroes.find((h) => h.name === name);
    if (existing) {
      gmDispatch({
        type: 'hero_update',
        id: existing.id,
        patch: {
          resolve,
          nightVision,
          sanityMax: derived.sanity,
          sanity: Math.min(existing.sanity, derived.sanity),
        },
      });
      result.updated.push(name);
    } else {
      gmDispatch({ type: 'hero_add', name, resolve, nightVision });
      const added = peekState().heroes.find((h) => h.name === name);
      if (added && derived.sanity !== added.sanityMax)
        gmDispatch({
          type: 'hero_update',
          id: added.id,
          patch: { sanity: derived.sanity, sanityMax: derived.sanity },
        });
      result.added.push(name);
    }
  }
  return result;
}
