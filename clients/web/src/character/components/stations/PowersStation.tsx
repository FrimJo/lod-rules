import { useId } from 'react';
import { DicePad } from '../../../gm/components/DicePad.tsx';
import { randomTalentFrom } from '../../engine.ts';
import {
  ARCANE_PERKS,
  CITES,
  GAPS,
  INGREDIENTS,
  LEVEL_1_PRAYERS,
  LEVEL_1_SPELLS,
  PARTS,
  PERKS,
  QUOTES,
  RELICS,
  STANDARD_POTIONS,
  TALENTS,
  TALENT_BY_ID,
  TALENT_CATEGORIES,
  type TalentCategory,
} from '../../rules.ts';
import { Badge, Block, CiteChip, Note, Quote, Term, Tile, useCreator } from '../common.tsx';

export function PowersStation() {
  const { derived } = useCreator();
  const profession = derived.profession;
  if (!profession) {
    return (
      <div className="cc-body">
        <Note tone="warn">
          Choose a profession first: talents, perks, spells and prayers are printed with each
          profession.
        </Note>
      </div>
    );
  }
  return (
    <div className="cc-body">
      <Talents />
      {derived.species?.randomTalent && <RandomTalent />}
      <Perks />
      {profession.spells && <Spells />}
      {profession.prayers && <Prayers />}
      {profession.id === 'warrior_priest' && <Relic />}
      {profession.id === 'alchemist' && <AlchemistBag />}
    </div>
  );
}

function Talents() {
  const { state, derived, dispatch } = useCreator();
  const profession = derived.profession!;
  const species = derived.species;
  return (
    <Block title="Talents" cite={profession.cite} quote={QUOTES.talentSkills}>
      <ul className="cc-powers" aria-label="Talents">
        {species?.traits.map((trait) => {
          const talent = TALENT_BY_ID.get(trait.talentId);
          return (
            <li key={trait.talentId} className="cc-power">
              <span className="cc-power-head">
                <strong>{trait.label}</strong>
                <Badge>{species.name} trait</Badge>
                {talent && (
                  <CiteChip cite={TALENT_CATEGORIES[talent.category].cite} quote={talent.text} />
                )}
              </span>
              {talent && <span className="cc-small">{talent.text}</span>}
            </li>
          );
        })}
        {profession.talents.map((grant) => {
          const talent = TALENT_BY_ID.get(grant.talentId);
          return (
            <li key={grant.talentId} className="cc-power">
              <span className="cc-power-head">
                <strong>{grant.label}</strong>
                <Badge>{profession.name}</Badge>
                {talent && (
                  <CiteChip cite={TALENT_CATEGORIES[talent.category].cite} quote={talent.text} />
                )}
              </span>
              {talent && <span className="cc-small">{talent.text}</span>}
            </li>
          );
        })}
      </ul>
      {profession.talentChoice && (
        <div
          className="cc-choice"
          role="radiogroup"
          aria-label="Choose one talent"
          id="todo:talent_choice"
        >
          <span className="cc-choice-label">Choose one</span>
          <div className="cc-options">
            {profession.talentChoice.map((option) => {
              const talent = TALENT_BY_ID.get(option.talentId);
              return (
                <Tile
                  key={option.talentId}
                  className="cc-option"
                  selected={state.talentChoice === option.talentId}
                  onClick={() => dispatch({ type: 'set_talent_choice', talentId: option.talentId })}
                >
                  <span className="cc-tile-head">
                    <span className="cc-tile-title">{option.label}</span>
                    {talent && <CiteChip cite={TALENT_CATEGORIES[talent.category].cite} />}
                  </span>
                  {talent && <span className="cc-tile-line">{talent.text}</span>}
                </Tile>
              );
            })}
          </div>
        </div>
      )}
      {profession.talents.length === 0 && !profession.talentChoice && !species?.traits.length && (
        <p className="cc-small muted">Talents: None.</p>
      )}
    </Block>
  );
}

function RandomTalent() {
  const { state, derived, dispatch } = useCreator();
  const chosen = state.randomTalent.talentId
    ? TALENT_BY_ID.get(state.randomTalent.talentId)
    : undefined;
  const category = state.randomTalent.category;
  const pool = category ? TALENTS.filter((talent) => talent.category === category) : [];
  const hateId = useId();
  return (
    <Block
      title="Jack of all trades"
      cite={CITES.human}
      quote={QUOTES.jackOfAllTrades}
      id="todo:random_talent"
    >
      <Quote text={QUOTES.jackOfAllTrades} cite={CITES.human} />
      <Note tone="gap">{GAPS.randomTalentDie}</Note>
      <div className="cc-chips" role="radiogroup" aria-label="Talent category">
        {(Object.keys(TALENT_CATEGORIES) as TalentCategory[]).map((id) => (
          <button
            key={id}
            type="button"
            className={`cc-chip${category === id ? ' on' : ''}`}
            aria-pressed={category === id}
            onClick={() => dispatch({ type: 'set_random_talent_category', category: id })}
          >
            {TALENT_CATEGORIES[id].label}
          </button>
        ))}
      </div>
      {category && (
        <div className="cc-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() =>
              dispatch({
                type: 'set_random_talent',
                talentId: randomTalentFrom(category, TALENTS).id,
              })
            }
          >
            {chosen ? 'Roll again' : `Roll a ${TALENT_CATEGORIES[category].label} talent`}
          </button>
          <CiteChip
            cite={TALENT_CATEGORIES[category].cite}
            label={`${TALENT_CATEGORIES[category].label} table`}
          />
          <label className="cc-inline-field">
            <span className="sr-only">Or the talent your own die gave</span>
            <select
              value={chosen?.id ?? ''}
              onChange={(event) =>
                dispatch({ type: 'set_random_talent', talentId: event.target.value || null })
              }
              aria-label="Talent your own die gave"
            >
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
        <div className="cc-result">
          <span className="cc-power-head">
            <strong>{chosen.name}</strong>
            <Badge tone="gold">Jack of all trades</Badge>
          </span>
          <span className="cc-small">{chosen.text}</span>
          {chosen.namesEnemy && (
            <div className="cc-field" id="todo:hate">
              <label htmlFor={hateId}>Enemy hated</label>
              <input
                id={hateId}
                type="text"
                value={state.randomTalent.hateTarget}
                placeholder="e.g. Goblins"
                onChange={(event) =>
                  dispatch({ type: 'set_hate_target', target: event.target.value })
                }
              />
            </div>
          )}
          {derived.warnings
            .filter((w) => w.startsWith(`${chosen.name}`))
            .map((w) => (
              <Note key={w} tone="warn">
                {w}
              </Note>
            ))}
        </div>
      )}
    </Block>
  );
}

function Perks() {
  const { state, derived, dispatch } = useCreator();
  const profession = derived.profession!;
  return (
    <Block
      title="Perks"
      cite={CITES.energyRule}
      quote="Perks can be used at the cost of energy during a hero’s activation."
    >
      <p className="cc-small muted">
        A <Term abbr="Perk" /> costs <Term abbr="E">Energy</Term> to use; the hero starts with{' '}
        {derived.energy}.
      </p>
      <ul className="cc-powers" aria-label="Perks">
        {profession.perks.map((grant) => {
          const perk = PERKS.find((p) => p.id === grant.perkId);
          return (
            <li key={grant.perkId} className="cc-power">
              <span className="cc-power-head">
                <strong>{grant.label}</strong>
                <Badge>{profession.name}</Badge>
                {perk && <CiteChip cite={perk.cite} quote={perk.text} />}
              </span>
              {perk && <span className="cc-small">{perk.text}</span>}
            </li>
          );
        })}
      </ul>
      {profession.arcanePerkChoice && (
        <div
          className="cc-choice"
          role="radiogroup"
          aria-label="One Arcane perk of choice"
          id="todo:arcane"
        >
          <span className="cc-choice-label">
            One Arcane perk of choice <CiteChip cite={CITES.arcanePerks} />
          </span>
          <div className="cc-options">
            {ARCANE_PERKS.map((perk) => (
              <Tile
                key={perk.id}
                className="cc-option"
                selected={state.arcanePerk === perk.id}
                onClick={() => dispatch({ type: 'set_arcane_perk', perkId: perk.id })}
              >
                <span className="cc-tile-title">{perk.name}</span>
                <span className="cc-tile-line">{perk.effect}</span>
                <span className="cc-tile-line muted">{perk.comment}</span>
              </Tile>
            ))}
          </div>
        </div>
      )}
    </Block>
  );
}

function Spells() {
  const { state, derived, dispatch } = useCreator();
  const quantity = derived.profession!.spells!.quantity;
  return (
    <Block
      title={`Spells: ${quantity} from Level 1 Magic`}
      cite={CITES.spellsLevel1}
      id="todo:spells"
      aside={
        <Badge tone={state.spells.length === quantity ? 'done' : 'plain'}>
          {state.spells.length} of {quantity}
        </Badge>
      }
    >
      <p className="cc-small muted" id="mana">
        <Quote text={QUOTES.mana} cite={CITES.mana} />
        Starting <Term abbr="Mana" />: <b className="cc-big">{derived.mana ?? '—'}</b>
      </p>
      {derived.mana !== null && !Number.isInteger(derived.mana) && (
        <Note tone="gap">{GAPS.manaRounding}</Note>
      )}
      <p className="cc-small muted">
        <Term abbr="CV" /> is subtracted from <Term abbr="AA">Arcane Art</Term> when casting;{' '}
        <Term abbr="Q" /> spells take 1 <Term abbr="AP" />, <Term abbr="MM" /> fly at a target in{' '}
        <Term abbr="LOS" />, <Term abbr="T" /> spells need a touch.
      </p>
      <div className="cc-options wide" role="group" aria-label="Level 1 spells">
        {LEVEL_1_SPELLS.map((spell) => {
          const picked = state.spells.includes(spell.id);
          const full = !picked && state.spells.length >= quantity;
          return (
            <Tile
              key={spell.id}
              className="cc-option"
              selected={picked}
              disabled={full}
              onClick={() => dispatch({ type: 'toggle_spell', spellId: spell.id })}
            >
              <span className="cc-tile-head">
                <span className="cc-tile-title">{spell.name}</span>
                <span className="cc-tile-meta">
                  <Term abbr="CV" /> {spell.cv} · <Term abbr="Mana" /> {spell.mana} · Upkeep{' '}
                  {spell.upkeep}
                  {spell.special && (
                    <>
                      {' · '}
                      {spell.special.split(',').map((code, i) => (
                        <span key={code}>
                          {i > 0 && ', '}
                          <Term abbr={code.trim()} />
                        </span>
                      ))}
                    </>
                  )}
                  {' · '}
                  {spell.school}
                </span>
              </span>
              <span className="cc-tile-line">{spell.effect}</span>
            </Tile>
          );
        })}
      </div>
    </Block>
  );
}

function Prayers() {
  const { state, derived, dispatch } = useCreator();
  const quantity = derived.profession!.prayers!.quantity;
  return (
    <Block
      title={`Prayers: ${quantity} level 1 prayers`}
      cite={CITES.prayers}
      id="todo:prayers"
      aside={
        <Badge tone={state.prayers.length === quantity ? 'done' : 'plain'}>
          {state.prayers.length} of {quantity}
        </Badge>
      }
    >
      <Quote
        text="The Warrior Priest may choose two level 1 prayers at the start of the game."
        cite={CITES.warriorPriest}
      />
      <p className="cc-small muted">
        Prayers are rolled on <Term abbr="BP">Battle Prayers</Term> and cost{' '}
        <Term abbr="E">Energy</Term> unless impeccable.
      </p>
      <div className="cc-options wide" role="group" aria-label="Level 1 prayers">
        {LEVEL_1_PRAYERS.map((prayer) => {
          const picked = state.prayers.includes(prayer.id);
          const full = !picked && state.prayers.length >= quantity;
          return (
            <Tile
              key={prayer.id}
              className="cc-option"
              selected={picked}
              disabled={full}
              onClick={() => dispatch({ type: 'toggle_prayer', prayerId: prayer.id })}
            >
              <span className="cc-tile-head">
                <span className="cc-tile-title">{prayer.name}</span>
                <CiteChip cite={prayer.cite} />
              </span>
              <span className="cc-tile-line">{prayer.text}</span>
            </Tile>
          );
        })}
      </div>
    </Block>
  );
}

function Relic() {
  const { state, dispatch } = useCreator();
  return (
    <Block title="Religious Relic of choice" cite={CITES.relics} id="todo:relic">
      <Quote
        text="One Religious Relic of choice (Choose God and ring or amulet, page 194)."
        cite={CITES.warriorPriest}
      />
      <div className="cc-options" role="radiogroup" aria-label="God">
        {RELICS.map((relic) => (
          <Tile
            key={relic.rowId}
            className="cc-option small"
            selected={state.relic.god === relic.name}
            onClick={() => dispatch({ type: 'set_relic', god: relic.name })}
          >
            <span className="cc-tile-title">{relic.name}</span>
            <span className="cc-tile-line">{relic.effect}</span>
          </Tile>
        ))}
      </div>
      <div className="cc-segment" role="radiogroup" aria-label="Ring or amulet">
        {(['ring', 'amulet'] as const).map((form) => (
          <label
            key={form}
            className={`cc-segment-option${state.relic.form === form ? ' on' : ''}`}
          >
            <input
              type="radio"
              name="cc-relic-form"
              checked={state.relic.form === form}
              onChange={() => dispatch({ type: 'set_relic', form })}
            />
            {form === 'ring' ? 'Ring' : 'Amulet'}
          </label>
        ))}
      </div>
      <Note>
        Only Warrior Priests can benefit from relics, and only one ring and one necklace at a time
        (2 relics in total).{' '}
        <CiteChip
          cite={CITES.relicRule}
          quote="Only Warrior Priests can benefit from these symbols, and they can only have one ring and one necklace at a time (2 relics in total at the same time)."
        />
      </Note>
    </Block>
  );
}

function AlchemistBag() {
  const { state, dispatch } = useCreator();
  const { potions, ingredients, parts, recipe } = state.alchemy;
  const recipeId = useId();
  return (
    <Block
      title="The Alchemist’s bag"
      cite={CITES.alchemistKit}
      quote="Small backpack, Alchemist tools, Alchemist belt, Shortsword, 3 potions of choice (standard level), a bag with 3 random ingredients and 3 freely chosen parts. 1 freely chosen recipe for a Weak Potion."
      id="todo:alchemy"
    >
      <Quote
        text="3 potions of choice (standard level), a bag with 3 random ingredients and 3 freely chosen parts. 1 freely chosen recipe for a Weak Potion."
        cite={CITES.alchemistKit}
      />

      <h4 className="subhead">
        Three standard potions of choice <CiteChip cite={CITES.standardPotions} />{' '}
        <Badge tone={potions.length === 3 ? 'done' : 'plain'}>{potions.length} of 3</Badge>
      </h4>
      <div className="cc-chips" role="group" aria-label="Standard potions">
        {STANDARD_POTIONS.map((potion) => (
          <button
            key={potion.rowId}
            type="button"
            className={`cc-chip${potions.includes(potion.rowId) ? ' on' : ''}`}
            aria-pressed={potions.includes(potion.rowId)}
            onClick={() => dispatch({ type: 'toggle_potion', rowId: potion.rowId })}
          >
            {potion.name}
          </button>
        ))}
      </div>
      <p className="hint">A fourth pick replaces the oldest one.</p>

      <h4 className="subhead">
        Three random ingredients: roll 1d20 three times <CiteChip cite={CITES.ingredients} />
      </h4>
      <div className="cc-ingredients">
        {ingredients.map((roll, index) => (
          <IngredientDie
            key={index}
            index={index}
            roll={roll}
            onCommit={(value) => dispatch({ type: 'set_ingredient', index, roll: value })}
          />
        ))}
      </div>

      <h4 className="subhead">
        Three freely chosen parts <CiteChip cite={CITES.parts} />{' '}
        <Badge tone={parts.length === 3 ? 'done' : 'plain'}>{parts.length} of 3</Badge>
      </h4>
      <div className="cc-chips" role="group" aria-label="Parts">
        {PARTS.map((part) => (
          <button
            key={part.rowId}
            type="button"
            className={`cc-chip${parts.includes(part.rowId) ? ' on' : ''}`}
            aria-pressed={parts.includes(part.rowId)}
            onClick={() => dispatch({ type: 'toggle_part', rowId: part.rowId })}
          >
            {part.name}
          </button>
        ))}
      </div>

      <h4 className="subhead">One recipe for a Weak Potion</h4>
      <div className="cc-field">
        <label htmlFor={recipeId}>Which potion the recipe makes</label>
        <input
          id={recipeId}
          type="text"
          list={`${recipeId}-list`}
          value={recipe}
          placeholder="e.g. Potion of Health"
          onChange={(event) => dispatch({ type: 'set_recipe', recipe: event.target.value })}
        />
        <datalist id={`${recipeId}-list`}>
          {STANDARD_POTIONS.map((potion) => (
            <option key={potion.rowId} value={potion.name} />
          ))}
        </datalist>
        <span className="hint">
          A Weak Potion needs 1 part, 1 ingredient and an empty bottle; which components the recipe
          names is the player’s choice at the table.
        </span>
      </div>
    </Block>
  );
}

function IngredientDie({
  index,
  roll,
  onCommit,
}: {
  index: number;
  roll: number | null;
  onCommit: (value: number) => void;
}) {
  const name = roll === null ? null : INGREDIENTS[roll - 1];
  return (
    <details className="cc-ingredient" open={roll === null && index === 0}>
      <summary>
        <span className={`cc-face${roll === null ? ' empty' : ''}`}>{roll ?? 'd20'}</span>
        <span className="cc-ingredient-name">{name ?? `Ingredient ${index + 1}`}</span>
      </summary>
      <DicePad
        sides={20}
        compact
        label={`Roll 1d20 for ingredient ${index + 1}`}
        onCommit={onCommit}
      />
    </details>
  );
}
