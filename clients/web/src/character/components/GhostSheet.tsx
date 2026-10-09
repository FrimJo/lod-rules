import { heroName } from '../engine.ts';
import { STAT_KEYS, STAT_NAMES } from '../rules.ts';
import { Term, useCreator } from './common.tsx';

/**
 * A ghost of the printed character sheet beside the stage: every number that is known so far,
 * in the sheet's own groupings, so the player watches it fill in as the dice land. Each number
 * is a tap away from the station that decides it.
 */
export function GhostSheet() {
  const { party, state, derived, goTo } = useCreator();
  const dash = <span className="cc-ghost-dash">—</span>;
  return (
    <aside className="cc-sheetghost" aria-label="Sheet so far">
      <button type="button" className="cc-ghost-name" onClick={() => goTo('species', 'name')}>
        <span className="cc-ghost-title">{heroName(state, party)}</span>
        <span className="cc-ghost-sub">
          {derived.species?.name ?? 'Species?'} · {derived.profession?.name ?? 'Profession?'}
          {derived.background ? ` · ${derived.background.name}` : ''}
        </span>
      </button>

      <div className="cc-ghost-stats" role="group" aria-label="Basic stats">
        {STAT_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className="cc-ghost-stat"
            onClick={() =>
              goTo(derived.rolled[key] === undefined ? 'dice' : 'specialise', `stat:${key}`)
            }
          >
            <span className="cc-ghost-k">{STAT_NAMES[key].abbr}</span>
            <span className="cc-ghost-v">{derived.stats[key] ?? dash}</span>
          </button>
        ))}
      </div>

      <div className="cc-ghost-row">
        <button type="button" className="cc-ghost-cell" onClick={() => goTo('dice', 'hp')}>
          <Term abbr="HP" />
          <b>{derived.hitPoints ?? dash}</b>
        </button>
        <button type="button" className="cc-ghost-cell" onClick={() => goTo('specialise', 'bonus')}>
          <Term abbr="DB" />
          <b>{derived.damageBonus === null ? dash : `+${derived.damageBonus}`}</b>
        </button>
        <button type="button" className="cc-ghost-cell" onClick={() => goTo('specialise', 'bonus')}>
          <Term abbr="NA" />
          <b>{derived.naturalArmour === null ? dash : `+${derived.naturalArmour}`}</b>
        </button>
        <button type="button" className="cc-ghost-cell" onClick={() => goTo('sheet')}>
          <Term abbr="M" />
          <b>{derived.movement}</b>
        </button>
      </div>
      <div className="cc-ghost-row">
        <button type="button" className="cc-ghost-cell" onClick={() => goTo('sheet')}>
          <Term abbr="E">Energy</Term>
          <b>{derived.energy}</b>
        </button>
        <button type="button" className="cc-ghost-cell" onClick={() => goTo('sheet')}>
          <Term abbr="L">Luck</Term>
          <b>{derived.luck}</b>
        </button>
        <button type="button" className="cc-ghost-cell" onClick={() => goTo('sheet')}>
          <Term abbr="Sanity" />
          <b>{derived.sanity}</b>
        </button>
        {derived.mana !== null && (
          <button type="button" className="cc-ghost-cell" onClick={() => goTo('powers', 'mana')}>
            <Term abbr="Mana" />
            <b>{derived.mana}</b>
          </button>
        )}
      </div>

      {derived.profession && (
        <ul className="cc-ghost-skills" aria-label="Skills">
          {derived.skills
            .filter((s) => s.modifier !== null)
            .map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => goTo('profession', `skill:${s.id}`)}>
                  <Term abbr={s.abbr}>{s.abbr}</Term>
                  <span className="cc-ghost-v">{s.value ?? dash}</span>
                </button>
              </li>
            ))}
        </ul>
      )}

      {derived.talents.length > 0 && (
        <button type="button" className="cc-ghost-list" onClick={() => goTo('powers')}>
          <span className="cc-ghost-k">Talents</span>
          <span>
            {derived.talents
              .map((t) => (t.qualifier ? `${t.talent.name}: ${t.qualifier}` : t.talent.name))
              .join(' · ')}
          </span>
        </button>
      )}

      {derived.profession && (
        <button type="button" className="cc-ghost-list" onClick={() => goTo('loadout')}>
          <span className="cc-ghost-k">Carrying</span>
          <span className="cc-ghost-nums">
            <Term abbr="ENC" /> <b>{derived.encumbrance.carried}</b>
            {derived.encumbrance.limit !== null ? ` / ${derived.encumbrance.limit}` : ''} ·{' '}
            <b>{derived.coins.left}</b> c
          </span>
          <span>
            {derived.equipment
              .filter((l) => !l.pending)
              .map((l) => l.label)
              .join(' · ') || 'Nothing yet'}
          </span>
        </button>
      )}

      {derived.warnings.length > 0 && (
        <button type="button" className="cc-ghost-warn" onClick={() => goTo('sheet')}>
          {derived.warnings.length} thing{derived.warnings.length === 1 ? '' : 's'} to check
        </button>
      )}
    </aside>
  );
}
