import { CITES, CREATION, QUOTES, STAT_KEYS, STAT_NAMES } from '../rules.ts';
import { CiteChip, Note, Quote, Section, useCreator } from './common.tsx';

export function SpecialiseStep() {
  const { state, derived, dispatch } = useCreator();
  const left = derived.specialisationLeft;
  const species = derived.species;
  return (
    <>
      <Section
        title="Specialisation"
        cite={CITES.specialisation}
        aside={
          <span className={`cc-badge${left === 0 ? ' done' : ''}`} aria-live="polite">
            {left} of {CREATION.specialisationPoints} points left
          </span>
        }
      >
        <Quote text={QUOTES.specialisation} cite={CITES.specialisation} />
        {!species && <Note tone="warn">Choose a species and roll the stats first; the points go on top of the rolled values.</Note>}
        <table className="cc-table cc-specialise">
          <thead>
            <tr>
              <th scope="col">Stat</th>
              <th scope="col">Rolled</th>
              <th scope="col">Points (max {CREATION.specialisationMaxPerStat})</th>
              <th scope="col">Result</th>
              <th scope="col">Species max</th>
            </tr>
          </thead>
          <tbody>
            {STAT_KEYS.map((key) => {
              const points = state.specialisation[key];
              const others = CREATION.specialisationPoints - left + 0 - points;
              const maxHere = Math.min(CREATION.specialisationMaxPerStat, CREATION.specialisationPoints - others);
              const result = derived.rolled[key] !== undefined ? derived.rolled[key]! + points : null;
              const max = species?.maxima[key];
              return (
                <tr key={key}>
                  <th scope="row">
                    <abbr title={STAT_NAMES[key].name}>{STAT_NAMES[key].abbr}</abbr>
                  </th>
                  <td className="cc-num">{derived.rolled[key] ?? <span className="muted">—</span>}</td>
                  <td>
                    <div className="cc-stepper" role="group" aria-label={`${STAT_NAMES[key].name} specialisation points`}>
                      <button type="button" className="cc-mini" aria-label={`Fewer points on ${STAT_NAMES[key].abbr}`} disabled={points <= 0} onClick={() => dispatch({ type: 'set_specialisation', stat: key, points: points - 1 })}>
                        −
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={maxHere}
                        value={points}
                        aria-label={`Points on ${STAT_NAMES[key].abbr}`}
                        onChange={(event) => {
                          const n = Number(event.target.value);
                          if (Number.isFinite(n)) dispatch({ type: 'set_specialisation', stat: key, points: n });
                        }}
                      />
                      <button type="button" className="cc-mini" aria-label={`More points on ${STAT_NAMES[key].abbr}`} disabled={points >= maxHere} onClick={() => dispatch({ type: 'set_specialisation', stat: key, points: points + 1 })}>
                        +
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={CREATION.specialisationMaxPerStat}
                        value={points}
                        aria-label={`${STAT_NAMES[key].name} points slider`}
                        onChange={(event) => dispatch({ type: 'set_specialisation', stat: key, points: Number(event.target.value) })}
                      />
                    </div>
                  </td>
                  <td className="cc-num">
                    {result ?? <span className="muted">—</span>}
                    {points > 0 && <span className="cc-delta"> (+{points})</span>}
                  </td>
                  <td className={`cc-num muted${result !== null && max !== undefined && result > max ? ' over' : ''}`}>{max ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {left > 0 && <Note>All 15 points must be placed; no stat may take more than 10 of them.</Note>}
        {species && STAT_KEYS.some((key) => derived.rolled[key] !== undefined && derived.rolled[key]! + state.specialisation[key] > species.maxima[key]) && (
          <Note tone="warn">
            A result is above the species maximum in the Levelling Up table <CiteChip cite={CITES.statMaxima} />. The book states that table for advancement; it does not say creation is capped. Recorded here, not enforced.
          </Note>
        )}
      </Section>

      <Section title="Damage Bonus and Natural Armour" cite={CITES.damageBonus}>
        <Quote text={QUOTES.damageBonus} cite={CITES.damageBonus} />
        <div className="cc-two-up">
          <div>
            <p>
              <strong>Damage Bonus</strong> from STR {derived.stats.str ?? '—'}: <span className="cc-big">{derived.damageBonus === null ? '—' : `+${derived.damageBonus}`}</span>
            </p>
            <table className="cc-mini-table">
              <thead>
                <tr>
                  <th>STR</th>
                  <th>DB</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [50, 1],
                  [60, 2],
                  [70, 3],
                ].map(([stat, bonus]) => (
                  <tr key={stat} className={derived.stats.str !== undefined && derived.stats.str >= stat! && derived.damageBonus === bonus ? 'hit' : ''}>
                    <td>{stat}</td>
                    <td>+{bonus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <p>
              <strong>Natural Armour</strong> from CON {derived.stats.con ?? '—'}: <span className="cc-big">{derived.naturalArmour === null ? '—' : `+${derived.naturalArmour}`}</span>
            </p>
            <table className="cc-mini-table">
              <thead>
                <tr>
                  <th>CON</th>
                  <th>NA</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [50, 1],
                  [55, 2],
                  [60, 3],
                  [65, 4],
                  [70, 5],
                ].map(([stat, bonus]) => (
                  <tr key={stat} className={derived.naturalArmour === bonus ? 'hit' : ''}>
                    <td>{stat}</td>
                    <td>+{bonus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Note tone="gap">The tables print thresholds only; this helper reads each row as “at or above”. The book does not spell that out.</Note>
      </Section>
    </>
  );
}
