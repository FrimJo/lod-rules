import { CITES, PROFESSIONS, QUOTES, SKILLS, STAT_NAMES, TALENT_BY_ID } from '../../rules.ts';
import {
  Block,
  CiteChip,
  Note,
  Quote,
  StatName,
  Term,
  Tile,
  modifierLabel,
  signed,
  useCreator,
} from '../common.tsx';

const HEADLINE = ['combat_skill', 'ranged_skill', 'dodge', 'perception'] as const;

export function ProfessionStation() {
  const { state, derived, dispatch } = useCreator();
  const profession = derived.profession;
  return (
    <div className="cc-body">
      <Quote
        text="The next task is to choose one of the professions which are described from page 32 on. Once you have found a profession that suits you and your character, you should start to choose between the Talents noted in the Profession Description."
        cite={CITES.professionTalents}
      />
      <div
        className="cc-professions"
        role="radiogroup"
        aria-label="Profession"
        id="todo:profession"
      >
        {PROFESSIONS.map((p) => (
          <Tile
            key={p.id}
            className="cc-prof-tile"
            selected={state.profession === p.id}
            onClick={() => dispatch({ type: 'set_profession', profession: p.id })}
          >
            <span className="cc-tile-head">
              <span className="cc-tile-title">{p.name}</span>
              <CiteChip cite={p.cite} />
            </span>
            <span className="cc-prof-mods">
              <span>
                <small>HP</small>
                {p.hitPointsPrinted}
              </span>
              {HEADLINE.map((id) => (
                <span
                  key={id}
                  className={
                    p.modifiers[id] === null
                      ? 'na'
                      : (p.modifiers[id] ?? 0) < 0
                        ? 'neg'
                        : (p.modifiers[id] ?? 0) > 0
                          ? 'pos'
                          : ''
                  }
                >
                  <small>{SKILLS.find((s) => s.id === id)!.abbr}</small>
                  {modifierLabel(p.modifiers[id])}
                </span>
              ))}
            </span>
            <span className="cc-tile-line">
              {[
                ...p.talents.map((t) => t.label),
                ...(p.talentChoice ? [p.talentChoice.map((o) => o.label).join(' or ')] : []),
              ].join(' · ') || 'No talents'}
              {p.spells ? ` · ${p.spells.quantity} spells` : ''}
              {p.prayers ? ` · ${p.prayers.quantity} prayers` : ''}
            </span>
            <span className="cc-tile-line muted">
              {p.limitations[0] ?? 'No armour or weapon limitation printed.'}
            </span>
          </Tile>
        ))}
      </div>

      {profession && (
        <>
          <Block
            title={`${profession.name} skills`}
            cite={CITES.skills}
            quote={QUOTES.skills}
            aside={
              <span className="hint">
                Free Skill: tap one red modifier to lift it by +10{' '}
                <CiteChip cite={CITES.freeSkill} quote={QUOTES.freeSkill} />
              </span>
            }
          >
            <Quote text={QUOTES.skills} cite={CITES.skills} />
            <ol className="cc-skills" aria-label="Skills" id="todo:free_skill">
              {derived.skills.map((skill) => {
                const negative = skill.modifier !== null && skill.modifier < 0;
                const free = state.freeSkill === skill.id;
                return (
                  <li
                    key={skill.id}
                    className={`cc-skill${skill.modifier === null ? ' na' : ''}`}
                    id={`skill:${skill.id}`}
                  >
                    <span className="cc-skill-name">
                      <Term abbr={skill.abbr}>{skill.name}</Term>
                      <small>
                        <StatName stat={skill.stat} /> {skill.base ?? '—'}
                      </small>
                    </span>
                    {skill.modifier === null ? (
                      <span className="cc-skill-mod na">N/A</span>
                    ) : negative ? (
                      <button
                        type="button"
                        className={`cc-skill-mod neg${free ? ' free' : ''}`}
                        aria-pressed={free}
                        onClick={() =>
                          dispatch({ type: 'set_free_skill', skill: free ? null : skill.id })
                        }
                        title={
                          free
                            ? 'Free Skill applied here; tap to remove'
                            : 'Make this the Free Skill (+10)'
                        }
                      >
                        {modifierLabel(skill.modifier)}
                        {free && <span className="cc-skill-free">+10 free</span>}
                      </button>
                    ) : (
                      <span className={`cc-skill-mod${skill.modifier > 0 ? ' pos' : ''}`}>
                        {modifierLabel(skill.modifier)}
                      </span>
                    )}
                    <span className="cc-skill-talent">
                      {skill.talentBonus ? `${signed(skill.talentBonus)} talent` : ''}
                    </span>
                    <span className="cc-skill-v">
                      {skill.value === null ? (skill.modifier === null ? '—' : '?') : skill.value}
                    </span>
                  </li>
                );
              })}
            </ol>
            <Note>
              {QUOTES.talentSkills}{' '}
              <CiteChip cite={CITES.skillProcedure} quote={QUOTES.talentSkills} />
            </Note>
          </Block>

          <Block title={`${profession.name} limitations and specials`} cite={profession.cite}>
            {profession.limitations.length === 0 && !profession.special && (
              <p className="cc-small muted">Nothing printed.</p>
            )}
            <ul className="cc-list">
              {profession.limitations.map((line) => (
                <li key={line}>{line}</li>
              ))}
              {profession.special?.map((line) => (
                <li key={line}>
                  <strong>Special:</strong> {line}
                </li>
              ))}
              {profession.startingEnergy && (
                <li>
                  {QUOTES.warriorPriestEnergy}{' '}
                  <CiteChip cite={CITES.warriorPriestEnergy} quote={QUOTES.warriorPriestEnergy} />
                </li>
              )}
              {profession.talents.map((grant) => {
                const talent = TALENT_BY_ID.get(grant.talentId);
                return talent ? (
                  <li key={grant.talentId}>
                    <strong>{talent.name}</strong> ({talent.category} talent): {talent.text}
                  </li>
                ) : null;
              })}
            </ul>
            <p className="cc-small muted">
              Hit Points {profession.hitPointsPrinted}:{' '}
              {derived.hitPoints !== null
                ? `${derived.hitPointsParts.base}+${derived.hitPointsParts.die}${derived.hitPointsParts.profession ? ` ${signed(derived.hitPointsParts.profession)}` : ''}${derived.hitPointsParts.talents ? ` ${signed(derived.hitPointsParts.talents)} talent` : ''} = ${derived.hitPoints}`
                : 'roll the Hit Points die first'}
              {' · '}
              {Object.values(STAT_NAMES).length > 0 &&
                'Talents, perks, spells and prayers wait at the Powers station.'}
            </p>
          </Block>
        </>
      )}
    </div>
  );
}
