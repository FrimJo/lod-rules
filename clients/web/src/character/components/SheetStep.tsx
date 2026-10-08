import { STEPS } from '../engine.ts';
import { CITES, QUOTES, STAT_KEYS, STAT_NAMES, LEVEL_1_SPELLS, LEVEL_1_PRAYERS, ARCANE_PERKS, PERKS } from '../rules.ts';
import { CiteChip, modifierLabel, Note, Quote, Section, signed, useCreator } from './common.tsx';

/** Everything to copy onto the printed character sheet, in the sheet's own groupings. */
export function SheetStep() {
  const { state, derived, dispatch } = useCreator();
  const missing = STEPS.filter((s) => s.id !== 'sheet' && !derived.complete[s.id]);
  const species = derived.species;
  const profession = derived.profession;
  return (
    <>
      {missing.length > 0 && (
        <Note tone="warn">
          Still open:{' '}
          {missing.map((s, i) => (
            <span key={s.id}>
              {i > 0 && ', '}
              <button type="button" className="cc-link" onClick={() => dispatch({ type: 'set_step', step: s.id })}>
                {s.label}
              </button>
            </span>
          ))}
          . The sheet shows what is known so far.
        </Note>
      )}
      {derived.warnings.length > 0 && (
        <Section title="Check before you write" tone="warn">
          <ul className="cc-list">
            {derived.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Final touches" cite={CITES.finalTouches} tone={derived.complete.sheet ? 'done' : undefined}>
        <div className="cc-sheet">
          <dl className="cc-sheet-grid">
            <div>
              <dt>Name</dt>
              <dd>{state.name || <span className="muted">—</span>}</dd>
            </div>
            <div>
              <dt>Species</dt>
              <dd>{species?.name ?? '—'}</dd>
            </div>
            <div>
              <dt>Profession</dt>
              <dd>{profession?.name ?? '—'}</dd>
            </div>
            <div>
              <dt>
                Level / XP <CiteChip cite={CITES.level} />
              </dt>
              <dd>
                {derived.level} / {derived.experience}
              </dd>
            </div>
          </dl>

          <h3>Basic stats</h3>
          <table className="cc-table cc-sheet-stats">
            <thead>
              <tr>
                {STAT_KEYS.map((key) => (
                  <th key={key} scope="col">
                    <abbr title={STAT_NAMES[key].name}>{STAT_NAMES[key].abbr}</abbr>
                  </th>
                ))}
                <th scope="col">HP</th>
                <th scope="col">
                  M <CiteChip cite={CITES.movement} />
                </th>
                <th scope="col">DB</th>
                <th scope="col">NA</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {STAT_KEYS.map((key) => (
                  <td key={key} className="cc-num cc-strong">
                    {derived.stats[key] ?? '—'}
                    {derived.statBonuses[key] && <span className="cc-small block muted">{derived.statBonuses[key]!.map((b) => `${signed(b.amount)} ${b.source}`).join(', ')}</span>}
                  </td>
                ))}
                <td className="cc-num cc-strong">
                  {derived.hitPoints ?? '—'}
                  {derived.hitPoints !== null && (
                    <span className="cc-small block muted">
                      {derived.hitPointsParts.base}+{derived.hitPointsParts.die}
                      {derived.hitPointsParts.profession ? ` ${signed(derived.hitPointsParts.profession)} ${profession?.name}` : ''}
                      {derived.hitPointsParts.talents ? ` ${signed(derived.hitPointsParts.talents)} talent` : ''}
                    </span>
                  )}
                </td>
                <td className="cc-num cc-strong">{derived.movement}</td>
                <td className="cc-num cc-strong">{derived.damageBonus === null ? '—' : `+${derived.damageBonus}`}</td>
                <td className="cc-num cc-strong">{derived.naturalArmour === null ? '—' : `+${derived.naturalArmour}`}</td>
              </tr>
            </tbody>
          </table>

          <h3>Pools</h3>
          <dl className="cc-sheet-grid">
            <div>
              <dt>
                Energy <CiteChip cite={CITES.energy} />
              </dt>
              <dd>{derived.energy}</dd>
            </div>
            <div>
              <dt>
                Luck <CiteChip cite={CITES.finalTouches} />
              </dt>
              <dd>{derived.luck}</dd>
            </div>
            <div>
              <dt>
                Sanity <CiteChip cite={CITES.sanity} />
              </dt>
              <dd>{derived.sanity}</dd>
            </div>
            {derived.mana !== null && (
              <div>
                <dt>
                  Mana <CiteChip cite={CITES.mana} />
                </dt>
                <dd>{derived.mana}</dd>
              </div>
            )}
            <div>
              <dt>
                Party Morale contribution <CiteChip cite={CITES.partyMorale} />
              </dt>
              <dd>
                {derived.partyMoraleContribution ?? '—'}
                {derived.partyMoraleNotes.length > 0 && <span className="cc-small block muted">{derived.partyMoraleNotes.map((n) => `${signed(n.amount)} ${n.source}`).join(', ')}</span>}
              </dd>
            </div>
          </dl>
          <Quote text={QUOTES.partyMorale} cite={CITES.partyMorale} />

          <h3>Skills</h3>
          <table className="cc-table cc-sheet-skills">
            <tbody>
              {derived.skills.map((skill) => (
                <tr key={skill.id} className={skill.modifier === null ? 'na' : ''}>
                  <th scope="row">{skill.name}</th>
                  <td className="cc-num cc-strong">{skill.value === null ? (skill.modifier === null ? 'N/A' : '—') : skill.value}</td>
                  <td className="muted cc-small">
                    {skill.base !== null && skill.modifier !== null
                      ? `${STAT_NAMES[skill.stat].abbr} ${skill.base} ${modifierLabel(skill.modifier)}${skill.freeSkill ? ` +${skill.freeSkill} free` : ''}${skill.talentBonus ? ` ${signed(skill.talentBonus)} talent` : ''}`
                      : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Talents</h3>
          {derived.talents.length === 0 ? (
            <p className="muted">—</p>
          ) : (
            <ul className="cc-list">
              {derived.talents.map((line, i) => (
                <li key={`${line.talent.id}-${i}`}>
                  <strong>
                    {line.talent.name}
                    {line.qualifier ? `: ${line.qualifier}` : ''}
                  </strong>{' '}
                  <span className="muted">({line.source})</span>
                </li>
              ))}
            </ul>
          )}
          {derived.background?.hate && (
            <p>
              <strong>Hate: {derived.background.hate}</strong> <span className="muted">({derived.background.name})</span>
            </p>
          )}

          <h3>Perks</h3>
          <ul className="cc-list">
            {profession?.perks.map((grant) => {
              const perk = PERKS.find((p) => p.id === grant.perkId);
              return (
                <li key={grant.perkId}>
                  <strong>{grant.label}</strong> {perk && <CiteChip cite={perk.cite} />}
                </li>
              );
            })}
            {state.arcanePerk && (
              <li>
                <strong>{ARCANE_PERKS.find((p) => p.id === state.arcanePerk)?.name}</strong> <span className="muted">(Arcane perk)</span>
              </li>
            )}
          </ul>

          {(state.spells.length > 0 || state.prayers.length > 0) && (
            <>
              <h3>{state.spells.length ? 'Spells' : 'Prayers'}</h3>
              <ul className="cc-list">
                {state.spells.map((id) => {
                  const spell = LEVEL_1_SPELLS.find((s) => s.id === id);
                  return spell ? (
                    <li key={id}>
                      <strong>{spell.name}</strong> <span className="muted">CV {spell.cv} · Mana {spell.mana} · Upkeep {spell.upkeep} · {spell.school}</span>
                    </li>
                  ) : null;
                })}
                {state.prayers.map((id) => {
                  const prayer = LEVEL_1_PRAYERS.find((p) => p.id === id);
                  return prayer ? (
                    <li key={id}>
                      <strong>{prayer.name}</strong>
                    </li>
                  ) : null;
                })}
              </ul>
            </>
          )}

          <h3>Equipment</h3>
          <table className="cc-table cc-sheet-gear">
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">ENC</th>
                <th scope="col">DUR</th>
              </tr>
            </thead>
            <tbody>
              {derived.equipment.map((line) => (
                <tr key={line.key}>
                  <th scope="row">
                    {line.label}
                    {line.pending && <span className="muted"> (to choose)</span>}
                  </th>
                  <td className="cc-num">{line.enc ?? '—'}</td>
                  <td className="cc-num">{line.durabilityMax === null ? '—' : line.durabilityLeft === null ? `? / ${line.durabilityMax}` : `${line.durabilityLeft} / ${line.durabilityMax}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="cc-sheet-grid">
            <div>
              <dt>Coins</dt>
              <dd>{derived.coins.left} c</dd>
            </div>
            <div>
              <dt>Encumbrance</dt>
              <dd>
                {derived.encumbrance.carried} / {derived.encumbrance.limit ?? '—'}
              </dd>
            </div>
            {derived.background && (
              <div>
                <dt>Background</dt>
                <dd>
                  {derived.background.number}. {derived.background.name} <CiteChip cite={derived.background.cite} />
                </dd>
              </div>
            )}
          </dl>
        </div>
      </Section>

      <Section title="Start playing or make more characters" cite={{ page: 31, pdf: 33, heading: 'Start Playing or Make More Characters', recordId: 'character.creation.repeat_until_party' }}>
        <Quote text="If you have enough characters, you are now ready to start playing. If so, head to the ‘Embarking on your First Quest’ chapter on page 86. If you want to create more characters, repeat the process until you are satisfied with your party." cite={{ page: 31, pdf: 33, heading: 'Start Playing or Make More Characters', recordId: 'character.creation.repeat_until_party' }} />
        <div className="cc-actions">
          <button type="button" className="cc-secondary" onClick={() => window.print()}>
            Print this sheet
          </button>
          <button
            type="button"
            className="cc-primary"
            onClick={() => {
              if (window.confirm('Start the next hero? This sheet is cleared.')) dispatch({ type: 'reset' });
            }}
          >
            Make another character
          </button>
        </div>
      </Section>
    </>
  );
}
