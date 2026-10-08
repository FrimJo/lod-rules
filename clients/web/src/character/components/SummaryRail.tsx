import { STAT_KEYS, STAT_NAMES } from '../rules.ts';
import { useCreator } from './common.tsx';

/** The live sheet beside the steps: every derived number, updated as the player chooses and rolls. */
export function SummaryRail() {
  const { state, derived, dispatch } = useCreator();
  return (
    <aside className="cc-rail" aria-label="Hero so far">
      <h2 className="cc-rail-title">{state.name || 'Unnamed hero'}</h2>
      <p className="cc-rail-sub">
        {derived.species?.name ?? 'Species?'} · {derived.profession?.name ?? 'Profession?'}
      </p>
      <table className="cc-rail-stats">
        <tbody>
          {STAT_KEYS.map((key) => (
            <tr key={key}>
              <th scope="row">
                <abbr title={STAT_NAMES[key].name}>{STAT_NAMES[key].abbr}</abbr>
              </th>
              <td className="cc-num">{derived.stats[key] ?? '—'}</td>
            </tr>
          ))}
          <tr>
            <th scope="row">HP</th>
            <td className="cc-num">{derived.hitPoints ?? '—'}</td>
          </tr>
          <tr>
            <th scope="row">DB / NA</th>
            <td className="cc-num">
              {derived.damageBonus === null ? '—' : `+${derived.damageBonus}`} / {derived.naturalArmour === null ? '—' : `+${derived.naturalArmour}`}
            </td>
          </tr>
          <tr>
            <th scope="row">E / L / San</th>
            <td className="cc-num">
              {derived.energy} / {derived.luck} / {derived.sanity}
            </td>
          </tr>
          {derived.mana !== null && (
            <tr>
              <th scope="row">Mana</th>
              <td className="cc-num">{derived.mana}</td>
            </tr>
          )}
          <tr>
            <th scope="row">Coins</th>
            <td className="cc-num">{derived.coins.left} c</td>
          </tr>
        </tbody>
      </table>
      {derived.profession && (
        <ul className="cc-rail-skills">
          {derived.skills
            .filter((s) => s.modifier !== null)
            .map((s) => (
              <li key={s.id}>
                <span>{s.abbr}</span>
                <span className="cc-num">{s.value ?? '—'}</span>
              </li>
            ))}
        </ul>
      )}
      {derived.warnings.length > 0 && (
        <button type="button" className="cc-rail-warn" onClick={() => dispatch({ type: 'set_step', step: 'sheet' })}>
          {derived.warnings.length} thing{derived.warnings.length === 1 ? '' : 's'} to check
        </button>
      )}
    </aside>
  );
}
