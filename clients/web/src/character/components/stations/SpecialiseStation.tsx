import {
  CITES,
  CREATION,
  DAMAGE_BONUS,
  GAPS,
  NATURAL_ARMOUR,
  QUOTES,
  STAT_KEYS,
  STAT_NAMES,
  WEAPON_CLASSES,
  type StatKey,
} from '../../rules.ts';
import { Block, CiteChip, Note, Pips, Quote, StatName, Term, useCreator } from '../common.tsx';

/** What the next points on a stat would unlock, read off the book's threshold tables. */
function nextUnlock(stat: StatKey, value: number | undefined, isWizard: boolean): string | null {
  if (value === undefined) return null;
  const until = (threshold: number) => threshold - value;
  if (stat === 'str') {
    const db = DAMAGE_BONUS.find((row) => row.stat > value);
    const twoHands = WEAPON_CLASSES.find((row) => row.twoHands > value);
    const oneHand = WEAPON_CLASSES.filter((row) => row.oneHand !== null && row.oneHand > value)[0];
    const parts = [
      db ? `+${until(db.stat)} → DB +${db.bonus}` : 'DB +3 reached',
      oneHand ? `+${until(oneHand.oneHand!)} → Class ${oneHand.weaponClass} in one hand` : null,
      twoHands ? `+${until(twoHands.twoHands)} → Class ${twoHands.weaponClass} two-handed` : null,
    ].filter(Boolean);
    return parts.join(' · ');
  }
  if (stat === 'con') {
    const na = NATURAL_ARMOUR.find((row) => row.stat > value);
    return na ? `+${until(na.stat)} → NA +${na.bonus}` : 'NA +5 reached';
  }
  if (stat === 'dex')
    return value < 60 ? `+${until(60)} → Dual Wield talent allowed (DEX 60)` : 'Dual Wield allowed';
  if (stat === 'wis')
    return isWizard
      ? `Mana ${value * CREATION.manaPerWisdom}`
      : 'Base for AA, Barter, Heal, Alchemy, PER';
  if (stat === 'res') return `+${10 - (value % 10)} → Party Morale +${Math.floor(value / 10) + 1}`;
  return null;
}

export function SpecialiseStation() {
  const { state, derived, dispatch } = useCreator();
  const left = derived.specialisationLeft;
  const species = derived.species;
  const isWizard = derived.profession?.id === 'wizard';
  return (
    <div className="cc-body">
      <Quote text={QUOTES.specialisation} cite={CITES.specialisation} />
      {!species && (
        <Note tone="warn">
          Choose a species and roll the stats first; the points go on top of the rolled values.
        </Note>
      )}

      <div className="cc-pool-row" id="todo:specialise">
        <span className="cc-pool-label">Points to place</span>
        <span
          className="cc-pool-coins"
          aria-label={`${left} of ${CREATION.specialisationPoints} points left`}
        >
          {Array.from({ length: CREATION.specialisationPoints }, (_, i) => (
            <span key={i} className={`cc-coin${i < left ? '' : ' spent'}`} aria-hidden="true" />
          ))}
        </span>
        <span className={`cc-pool-count${left === 0 ? ' done' : ''}`}>
          {left === 0 ? 'all placed' : `${left} left`}
        </span>
      </div>

      <div className="cc-spec" role="group" aria-label="Specialisation">
        {STAT_KEYS.map((key) => {
          const points = state.specialisation[key];
          const others = CREATION.specialisationPoints - left - points;
          const maxHere = Math.min(
            CREATION.specialisationMaxPerStat,
            CREATION.specialisationPoints - others,
          );
          const rolled = derived.rolled[key];
          const result = rolled !== undefined ? rolled + points : null;
          const total = derived.stats[key];
          const bonuses = derived.statBonuses[key];
          const max = species?.maxima[key];
          const over = result !== null && max !== undefined && result > max;
          return (
            <div key={key} className="cc-spec-row" id={`stat:${key}`}>
              <span className="cc-spec-k">
                <StatName stat={key} />
                <small>{rolled ?? '—'} rolled</small>
              </span>
              <div className="cc-spec-track">
                <button
                  type="button"
                  className="cc-mini"
                  aria-label={`Fewer points on ${STAT_NAMES[key].abbr}`}
                  disabled={points <= 0}
                  onClick={() =>
                    dispatch({ type: 'set_specialisation', stat: key, points: points - 1 })
                  }
                >
                  −
                </button>
                <button
                  type="button"
                  className="cc-spec-pips"
                  aria-label={`${points} points on ${STAT_NAMES[key].abbr}, tap to add one`}
                  disabled={points >= maxHere}
                  onClick={() =>
                    dispatch({ type: 'set_specialisation', stat: key, points: points + 1 })
                  }
                >
                  <Pips value={points} max={CREATION.specialisationMaxPerStat} />
                </button>
                <button
                  type="button"
                  className="cc-mini"
                  aria-label={`More points on ${STAT_NAMES[key].abbr}`}
                  disabled={points >= maxHere}
                  onClick={() =>
                    dispatch({ type: 'set_specialisation', stat: key, points: points + 1 })
                  }
                >
                  +
                </button>
              </div>
              <span className={`cc-spec-v${over ? ' over' : ''}`}>
                <b>{total ?? '—'}</b>
                <small>
                  {points > 0 && `+${points}`}
                  {bonuses
                    ?.map((b) => ` ${b.amount > 0 ? '+' : ''}${b.amount} ${b.source}`)
                    .join('')}
                </small>
              </span>
              <span className="cc-spec-next">{nextUnlock(key, total, isWizard)}</span>
            </div>
          );
        })}
      </div>
      {species &&
        STAT_KEYS.some(
          (key) =>
            derived.rolled[key] !== undefined &&
            derived.rolled[key]! + state.specialisation[key] > species.maxima[key],
        ) && (
          <Note tone="warn">
            A result is above the species maximum in the Levelling Up table{' '}
            <CiteChip cite={CITES.statMaxima} />. {GAPS.statMaxima}
          </Note>
        )}

      <Block
        title="Damage Bonus and Natural Armour"
        cite={CITES.damageBonus}
        quote={QUOTES.damageBonus}
        id="bonus"
      >
        <Quote text={QUOTES.damageBonus} cite={CITES.damageBonus} />
        <div className="cc-two-up">
          <div className="cc-threshold">
            <span className="cc-threshold-head">
              <Term abbr="DB" /> from <StatName stat="str" /> {derived.stats.str ?? '—'}
              <b>{derived.damageBonus === null ? '—' : `+${derived.damageBonus}`}</b>
            </span>
            <ol className="cc-rows">
              {DAMAGE_BONUS.map((row) => (
                <li
                  key={row.stat}
                  className={`cc-row${derived.stats.str !== undefined && derived.damageBonus === row.bonus && derived.stats.str >= row.stat ? ' hit' : ''}${derived.stats.str !== undefined && derived.stats.str < row.stat ? ' ahead' : ''}`}
                >
                  <span className="cc-row-roll">{row.stat}</span>
                  <span className="cc-row-text">STR {row.stat} and above</span>
                  <span className="cc-row-delta">+{row.bonus}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="cc-threshold">
            <span className="cc-threshold-head">
              <Term abbr="NA" /> from <StatName stat="con" /> {derived.stats.con ?? '—'}
              <b>{derived.naturalArmour === null ? '—' : `+${derived.naturalArmour}`}</b>
            </span>
            <ol className="cc-rows">
              {NATURAL_ARMOUR.map((row) => (
                <li
                  key={row.stat}
                  className={`cc-row${derived.naturalArmour === row.bonus ? ' hit' : ''}${derived.stats.con !== undefined && derived.stats.con < row.stat ? ' ahead' : ''}`}
                >
                  <span className="cc-row-roll">{row.stat}</span>
                  <span className="cc-row-text">CON {row.stat} and above</span>
                  <span className="cc-row-delta">+{row.bonus}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <Note tone="gap">{GAPS.thresholds}</Note>
      </Block>

      <Block
        title="Strength and Weapon Class"
        cite={CITES.strengthWeaponClass}
        quote="As mentioned before, strength will govern the weight of the weapons that your hero can use. Weapons come in classes ranging from 1-6. Generally, the higher the class, the heavier the weapon."
      >
        <p className="cc-small muted">
          With <StatName stat="str" /> {derived.weaponClassStrength ?? '—'}
          {derived.weaponClassStrength !== null && derived.weaponClassStrength !== derived.stats.str
            ? ' (Tight Grip counted)'
            : ''}{' '}
          the hero can wield <CiteChip cite={CITES.weaponClassTable} label="Class table" />
        </p>
        <ol className="cc-classes" aria-label="Weapon classes">
          {WEAPON_CLASSES.map((row) => {
            const use = derived.weaponClasses.find((c) => c.weaponClass === row.weaponClass)!;
            return (
              <li
                key={row.weaponClass}
                className={`cc-class${use.oneHand ? ' one' : use.twoHands ? ' two' : ' no'}`}
              >
                <span className="cc-class-n">{row.weaponClass}</span>
                <span className="cc-class-t">
                  {derived.weaponClassStrength === null
                    ? '—'
                    : use.oneHand
                      ? 'one hand'
                      : use.twoHands
                        ? 'two hands'
                        : 'too heavy'}
                </span>
                <small>
                  2H {row.twoHands} · 1H {row.oneHand ?? 'N/A'}
                </small>
              </li>
            );
          })}
        </ol>
      </Block>
    </div>
  );
}
