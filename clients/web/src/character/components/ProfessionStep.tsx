import { useId } from 'react';
import { randomTalentFrom } from '../engine.ts';
import {
  ARCANE_PERKS,
  CITES,
  LEVEL_1_PRAYERS,
  LEVEL_1_SPELLS,
  PERKS,
  PROFESSIONS,
  QUOTES,
  RELICS,
  SKILLS,
  STAT_NAMES,
  TALENTS,
  TALENT_BY_ID,
  TALENT_CATEGORIES,
  type TalentCategory,
} from '../rules.ts';
import { CiteChip, modifierLabel, Note, Quote, Section, signed, useCreator } from './common.tsx';

export function ProfessionStep() {
  const { state, derived, dispatch } = useCreator();
  const profession = derived.profession;
  return (
    <>
      <Section title="Choose a profession" cite={CITES.professionTalents}>
        <Quote text="The next task is to choose one of the professions which are described from page 32 on. Once you have found a profession that suits you and your character, you should start to choose between the Talents noted in the Profession Description." cite={CITES.professionTalents} />
        <div className="cc-cards compact" role="radiogroup" aria-label="Profession">
          {PROFESSIONS.map((p) => {
            const selected = state.profession === p.id;
            return (
              <div
                key={p.id}
                role="radio"
                tabIndex={0}
                aria-checked={selected}
                className={`cc-card${selected ? ' selected' : ''}`}
                onClick={() => dispatch({ type: 'set_profession', profession: p.id })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    dispatch({ type: 'set_profession', profession: p.id });
                  }
                }}
              >
                <span className="cc-card-head">
                  <span className="cc-card-title">{p.name}</span>
                  <CiteChip cite={p.cite} />
                </span>
                <span className="cc-card-line">
                  HP {p.hitPointsPrinted} · CS {modifierLabel(p.modifiers.combat_skill)} · RS {modifierLabel(p.modifiers.ranged_skill)} · Dodge {modifierLabel(p.modifiers.dodge)}
                </span>
                <span className="cc-card-line muted">{p.limitations[0] ?? 'No armour or weapon limitation printed.'}</span>
              </div>
            );
          })}
        </div>
      </Section>

      {profession && (
        <>
          <SkillsTable />
          <TalentsAndPerks />
          {derived.species?.randomTalent && <RandomTalent />}
          {profession.spells && <SpellPicker />}
          {profession.prayers && <PrayerPicker />}
          {profession.id === 'warrior_priest' && <RelicPicker />}
          <ProfessionNotes />
        </>
      )}
    </>
  );
}

function SkillsTable() {
  const { state, derived, dispatch } = useCreator();
  const profession = derived.profession!;
  const negatives = SKILLS.filter((s) => {
    const m = profession.modifiers[s.id];
    return m !== null && m < 0;
  });
  return (
    <Section title={`${profession.name} skills`} cite={CITES.skills}>
      <Quote text={QUOTES.skills} cite={CITES.skills} />
      <table className="cc-table cc-skills">
        <thead>
          <tr>
            <th scope="col">Skill</th>
            <th scope="col">Stat</th>
            <th scope="col">Modifier</th>
            <th scope="col">Free Skill</th>
            <th scope="col">Talents</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {derived.skills.map((skill) => (
            <tr key={skill.id} className={skill.modifier === null ? 'na' : ''}>
              <th scope="row">{skill.name}</th>
              <td className="muted">
                {STAT_NAMES[skill.stat].abbr} {skill.base ?? '—'}
              </td>
              <td className="cc-num">{modifierLabel(skill.modifier)}</td>
              <td className="cc-num">{skill.freeSkill ? `+${skill.freeSkill}` : ''}</td>
              <td className="cc-num">{skill.talentBonus ? signed(skill.talentBonus) : ''}</td>
              <td className="cc-num cc-strong">{skill.value === null ? (skill.modifier === null ? 'N/A' : '—') : skill.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="cc-field">
        <label htmlFor="cc-free-skill">Free Skill: one skill with a negative modifier gains +10</label>
        <select id="cc-free-skill" value={state.freeSkill ?? ''} onChange={(event) => dispatch({ type: 'set_free_skill', skill: event.target.value === '' ? null : (event.target.value as (typeof SKILLS)[number]['id']) })}>
          <option value="">Not used</option>
          {negatives.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({modifierLabel(profession.modifiers[s.id])} → {modifierLabel(profession.modifiers[s.id]! + 10)})
            </option>
          ))}
        </select>
        <span className="cc-hint">
          {QUOTES.freeSkill} <CiteChip cite={CITES.freeSkill} />
        </span>
      </div>
      <Note>
        {QUOTES.talentSkills} <CiteChip cite={CITES.skillProcedure} />
      </Note>
    </Section>
  );
}

function TalentsAndPerks() {
  const { state, derived, dispatch } = useCreator();
  const profession = derived.profession!;
  const groupId = useId();
  return (
    <Section title="Talents and perks" cite={profession.cite}>
      <h3>Talents</h3>
      {profession.talents.length === 0 && !profession.talentChoice && <p className="muted">Talents: None.</p>}
      <ul className="cc-list">
        {profession.talents.map((grant) => {
          const talent = TALENT_BY_ID.get(grant.talentId);
          return (
            <li key={grant.talentId}>
              <strong>{grant.label}</strong> <span className="muted">({talent?.category} talent)</span>
              {talent && <p className="cc-small">{talent.text}</p>}
            </li>
          );
        })}
      </ul>
      {profession.talentChoice && (
        <fieldset className="cc-radios">
          <legend>Choose one</legend>
          {profession.talentChoice.map((option) => {
            const talent = TALENT_BY_ID.get(option.talentId);
            return (
              <label key={option.talentId} className="cc-check block">
                <input type="radio" name={groupId} checked={state.talentChoice === option.talentId} onChange={() => dispatch({ type: 'set_talent_choice', talentId: option.talentId })} />
                <span>
                  <strong>{option.label}</strong> <span className="muted">({talent?.category} talent)</span>
                  {talent && <span className="cc-small block">{talent.text}</span>}
                </span>
              </label>
            );
          })}
        </fieldset>
      )}

      <h3>Perks</h3>
      <ul className="cc-list">
        {profession.perks.map((grant) => {
          const perk = PERKS.find((p) => p.id === grant.perkId);
          return (
            <li key={grant.perkId}>
              <strong>{grant.label}</strong> {perk && <CiteChip cite={perk.cite} />}
              {perk && <p className="cc-small">{perk.text}</p>}
            </li>
          );
        })}
      </ul>
      {profession.arcanePerkChoice && (
        <fieldset className="cc-radios">
          <legend>
            One Arcane perk of choice <CiteChip cite={CITES.arcanePerks} />
          </legend>
          {ARCANE_PERKS.map((perk) => (
            <label key={perk.id} className="cc-check block">
              <input type="radio" name={`${groupId}-arcane`} checked={state.arcanePerk === perk.id} onChange={() => dispatch({ type: 'set_arcane_perk', perkId: perk.id })} />
              <span>
                <strong>{perk.name}</strong>
                <span className="cc-small block">
                  {perk.effect} {perk.comment}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
      )}
    </Section>
  );
}

function RandomTalent() {
  const { state, derived, dispatch } = useCreator();
  const chosen = state.randomTalent.talentId ? TALENT_BY_ID.get(state.randomTalent.talentId) : undefined;
  const category = state.randomTalent.category;
  const catId = useId();
  const pool = category ? TALENTS.filter((talent) => talent.category === category) : [];
  return (
    <Section title="Jack of all trades" cite={CITES.human}>
      <Quote text={QUOTES.jackOfAllTrades} cite={CITES.human} />
      <Note tone="gap">The book names no die for the random talent. The app picks one entry of the chosen category at random; rolling your own die over the printed table is just as good.</Note>
      <div className="cc-field">
        <label htmlFor={catId}>Category</label>
        <select id={catId} value={category ?? ''} onChange={(event) => dispatch({ type: 'set_random_talent_category', category: (event.target.value || null) as TalentCategory | null })}>
          <option value="">Choose a category</option>
          {(Object.keys(TALENT_CATEGORIES) as TalentCategory[]).map((id) => (
            <option key={id} value={id}>
              {TALENT_CATEGORIES[id].label} talents
            </option>
          ))}
        </select>
      </div>
      {category && (
        <div className="cc-actions">
          <button type="button" className="cc-primary" onClick={() => dispatch({ type: 'set_random_talent', talentId: randomTalentFrom(category, TALENTS).id })}>
            {chosen ? 'Roll again' : 'Roll a random talent'}
          </button>
          <CiteChip cite={TALENT_CATEGORIES[category].cite} />
          <label className="cc-field inline">
            <span className="cc-visually-hidden">Or pick the talent your own die gave</span>
            <select value={chosen?.id ?? ''} onChange={(event) => dispatch({ type: 'set_random_talent', talentId: event.target.value || null })} aria-label="Talent your own die gave">
              <option value="">Or enter your own result…</option>
              {pool.map((talent, i) => (
                <option key={talent.id} value={talent.id}>
                  {i + 1}. {talent.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {chosen && (
        <div className="cc-detail">
          <h3>{chosen.name}</h3>
          <p className="cc-small">{chosen.text}</p>
          {chosen.namesEnemy && (
            <div className="cc-field">
              <label htmlFor={`${catId}-hate`}>Enemy hated</label>
              <input id={`${catId}-hate`} type="text" value={state.randomTalent.hateTarget} placeholder="e.g. Goblins" onChange={(event) => dispatch({ type: 'set_hate_target', target: event.target.value })} />
            </div>
          )}
          {derived.warnings
            .filter((w) => w.startsWith(`${chosen.name}:`))
            .map((w) => (
              <Note key={w} tone="warn">
                {w}
              </Note>
            ))}
        </div>
      )}
    </Section>
  );
}

function SpellPicker() {
  const { state, derived, dispatch } = useCreator();
  const quantity = derived.profession!.spells!.quantity;
  return (
    <Section title={`Spells: ${quantity} from Level 1 Magic`} cite={CITES.spellsLevel1} aside={<span className={`cc-badge${state.spells.length === quantity ? ' done' : ''}`}>{state.spells.length} of {quantity}</span>}>
      <Quote text={QUOTES.mana} cite={CITES.mana} />
      {derived.mana !== null && (
        <p>
          Starting Mana: <span className="cc-big">{derived.mana}</span>
          {!Number.isInteger(derived.mana) && (
            <Note tone="gap">WIS × 1.5 is not a whole number here. The book does not say how to round it.</Note>
          )}
        </p>
      )}
      <ul className="cc-pick-list">
        {LEVEL_1_SPELLS.map((spell) => {
          const picked = state.spells.includes(spell.id);
          const full = !picked && state.spells.length >= quantity;
          return (
            <li key={spell.id}>
              <label className={`cc-check block${full ? ' disabled' : ''}`}>
                <input type="checkbox" checked={picked} disabled={full} onChange={() => dispatch({ type: 'toggle_spell', spellId: spell.id })} />
                <span>
                  <strong>{spell.name}</strong> <span className="muted">
                    CV {spell.cv} · Mana {spell.mana} · Upkeep {spell.upkeep}
                    {spell.special ? ` · ${spell.special}` : ''} · {spell.school}
                  </span>
                  <span className="cc-small block">{spell.effect}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function PrayerPicker() {
  const { state, derived, dispatch } = useCreator();
  const quantity = derived.profession!.prayers!.quantity;
  return (
    <Section title={`Prayers: ${quantity} level 1 prayers`} cite={CITES.prayers} aside={<span className={`cc-badge${state.prayers.length === quantity ? ' done' : ''}`}>{state.prayers.length} of {quantity}</span>}>
      <Quote text="The Warrior Priest may choose two level 1 prayers at the start of the game." cite={CITES.warriorPriest} />
      <ul className="cc-pick-list">
        {LEVEL_1_PRAYERS.map((prayer) => {
          const picked = state.prayers.includes(prayer.id);
          const full = !picked && state.prayers.length >= quantity;
          return (
            <li key={prayer.id}>
              <label className={`cc-check block${full ? ' disabled' : ''}`}>
                <input type="checkbox" checked={picked} disabled={full} onChange={() => dispatch({ type: 'toggle_prayer', prayerId: prayer.id })} />
                <span>
                  <strong>{prayer.name}</strong> <CiteChip cite={prayer.cite} />
                  <span className="cc-small block">{prayer.text}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function RelicPicker() {
  const { state, dispatch } = useCreator();
  const id = useId();
  return (
    <Section title="Religious Relic of choice" cite={CITES.relics}>
      <Quote text="One Religious Relic of choice (Choose God and ring or amulet, page 194)." cite={CITES.warriorPriest} />
      <div className="cc-form">
        <div className="cc-field">
          <label htmlFor={`${id}-god`}>God</label>
          <select id={`${id}-god`} value={state.relic.god ?? ''} onChange={(event) => dispatch({ type: 'set_relic', god: event.target.value || null })}>
            <option value="">Choose</option>
            {RELICS.map((relic) => (
              <option key={relic.rowId} value={relic.name}>
                {relic.name}: {relic.effect}
              </option>
            ))}
          </select>
        </div>
        <div className="cc-field">
          <label htmlFor={`${id}-form`}>Form</label>
          <select id={`${id}-form`} value={state.relic.form ?? ''} onChange={(event) => dispatch({ type: 'set_relic', form: (event.target.value || null) as 'ring' | 'amulet' | null })}>
            <option value="">Choose</option>
            <option value="ring">Ring</option>
            <option value="amulet">Amulet</option>
          </select>
        </div>
      </div>
      <Note>Only Warrior Priests can use relics. Only two at a time unless the Warrior Priest has Reliquary. Count towards the maximum number of magic items that can be worn.</Note>
    </Section>
  );
}

function ProfessionNotes() {
  const { derived } = useCreator();
  const profession = derived.profession!;
  return (
    <Section title={`${profession.name} limitations and specials`} cite={profession.cite}>
      {profession.limitations.length === 0 && !profession.special && <p className="muted">Nothing printed.</p>}
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
            {QUOTES.warriorPriestEnergy} <CiteChip cite={CITES.warriorPriestEnergy} />
          </li>
        )}
      </ul>
      {(profession.spells || profession.prayers) && (
        <Note>
          {'If you choose a profession that allows you to choose spells or prayers, now may be a good time to jump to those chapters to make your choices.'} <CiteChip cite={CITES.spellsAndPrayers} />
        </Note>
      )}
    </Section>
  );
}
