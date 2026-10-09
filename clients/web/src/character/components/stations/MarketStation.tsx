import { useId, useState } from 'react';
import { handsFor } from '../../engine.ts';
import {
  ARMOUR,
  CITES,
  CREATION,
  GEAR,
  GEAR_GROUPS,
  QUOTES,
  SHIELDS,
  WEAPONS,
  type Gear,
  type GearGroup,
  type Weapon,
} from '../../rules.ts';
import {
  Badge,
  Block,
  CiteChip,
  Note,
  Quote,
  Specials,
  Term,
  Tile,
  useCreator,
} from '../common.tsx';

type Shelf = 'weapon' | 'armour' | 'shield' | GearGroup | 'other';
const SHELVES: { id: Shelf; label: string }[] = [
  { id: 'weapon', label: 'Weapons' },
  { id: 'armour', label: 'Armour' },
  { id: 'shield', label: 'Shields' },
  { id: 'light', label: 'Light' },
  { id: 'consumable', label: 'Food & drink' },
  { id: 'tool', label: 'Tools' },
  { id: 'misc', label: 'Misc' },
  { id: 'alchemy', label: 'Alchemy' },
  { id: 'jewellery', label: 'Jewellery' },
  { id: 'other', label: 'Anything else' },
];

/** A fit note for a weapon against this hero: hands, class limits, species and STR. */
function weaponFit(
  weapon: Weapon,
  ui: ReturnType<typeof useCreator>,
): { text: string; tone: 'ok' | 'warn' | 'bad' }[] {
  const { derived } = ui;
  const notes: { text: string; tone: 'ok' | 'warn' | 'bad' }[] = [];
  if (weapon.weaponClass === null) return notes;
  const profession = derived.profession;
  const species = derived.species;
  if (derived.weaponClassStrength !== null) {
    const use = derived.weaponClasses.find((c) => c.weaponClass === weapon.weaponClass);
    if (use && !use.twoHands) notes.push({ text: 'STR too low', tone: 'bad' });
    else
      notes.push({
        text: handsFor(weapon, derived.weaponClasses) === 2 ? 'two hands' : 'one hand',
        tone: 'ok',
      });
  }
  if (profession?.maxWeaponClass !== undefined && weapon.weaponClass > profession.maxWeaponClass)
    notes.push({
      text: `over the ${profession.name}’s Class ${profession.maxWeaponClass} limit`,
      tone: 'bad',
    });
  if (
    species &&
    (species.id === 'dwarf' || species.id === 'halfling') &&
    (weapon.id === 'longbow' || weapon.id === 'elven_bow')
  )
    notes.push({ text: `not usable by a ${species.name}`, tone: 'bad' });
  if (weapon.id === 'arbalest' && derived.stats.str !== undefined && derived.stats.str < 55)
    notes.push({ text: 'requires STR 55', tone: 'bad' });
  return notes;
}

export function MarketStation() {
  const ui = useCreator();
  const { state, derived, dispatch } = ui;
  const profession = derived.profession;
  const [shelf, setShelf] = useState<Shelf>('weapon');
  if (!profession) {
    return (
      <div className="cc-body">
        <Note tone="warn">
          Choose a profession first: the starting gear is printed with each profession.
        </Note>
      </div>
    );
  }
  const weaponItem = profession.equipment.find((item) => item.anyWeapon);
  const optionItem = profession.equipment.find((item) => item.options);
  const purse = derived.coins;
  const pct = purse.start > 0 ? Math.max(0, Math.min(100, (purse.left / purse.start) * 100)) : 0;

  return (
    <div className="cc-body">
      <div className="cc-purse" role="group" aria-label="Purse">
        <span className="cc-purse-kicker">
          Purse <CiteChip cite={CITES.startingEquipment} quote={QUOTES.coins} />
        </span>
        <span className="cc-purse-row">
          <span className={`cc-purse-big${purse.left < 0 ? ' bad' : ''}`}>{purse.left} c</span>
          <span className="cc-purse-bar" aria-hidden="true">
            <span className="cc-purse-fill" style={{ width: `${pct}%` }} />
          </span>
        </span>
        <span className="cc-purse-sub">
          {purse.start} c from {purse.source} · {purse.spent} c spent
          {purse.left < 0 ? ' · over budget' : ''}
        </span>
      </div>

      <Block
        title={`${profession.name} starting kit`}
        cite={profession.cite}
        quote={QUOTES.backpack}
      >
        <ul className="cc-kit" aria-label="Starting equipment">
          {derived.equipment
            .filter((line) => line.origin === 'start')
            .map((line) => (
              <li key={line.key} className={`cc-kit-item${line.pending ? ' pending' : ''}`}>
                <span className="cc-kit-label">
                  {line.label}
                  {line.pending && <Badge tone="warn">to choose</Badge>}
                </span>
                <span className="cc-kit-meta">
                  {line.weapon && (
                    <>
                      {line.weapon.damage} · Class {line.weapon.weaponClass ?? '—'} ·{' '}
                      <Term abbr="ENC" /> {line.weapon.enc ?? '—'}{' '}
                      <Specials printed={line.weapon.special} />
                    </>
                  )}
                  {line.armour && (
                    <>
                      <Term abbr="DEF" /> {line.armour.def} · Tier {line.armour.tier} ·{' '}
                      {line.armour.covers} · <Term abbr="ENC" /> {line.armour.enc}{' '}
                      <Specials printed={line.armour.special} />
                    </>
                  )}
                  {line.gear && !line.weapon && !line.armour && (
                    <>
                      <Term abbr="ENC" /> {line.gear.encPrinted}
                      {line.gear.durability !== null && (
                        <>
                          {' · '}
                          <Term abbr="DUR" /> {line.gear.durPrinted}
                        </>
                      )}
                    </>
                  )}
                  {line.note && <span className="muted"> {line.note}</span>}
                </span>
              </li>
            ))}
        </ul>
        {weaponItem && (
          <div className="cc-choice" id="todo:choose:start:weapon">
            <span className="cc-choice-label">
              {weaponItem.label}: tap one from the Weapons table <CiteChip cite={CITES.weapons} />
            </span>
            <div className="cc-shelf">
              {WEAPONS.filter((w) => w.weaponClass !== null).map((w) => (
                <WeaponTile
                  key={w.id}
                  weapon={w}
                  selected={state.weaponChoice === w.id}
                  onClick={() =>
                    dispatch({
                      type: 'set_weapon_choice',
                      weaponId: state.weaponChoice === w.id ? null : w.id,
                    })
                  }
                />
              ))}
            </div>
            <p className="hint">
              {profession.id === 'ranger'
                ? QUOTES.rangerBow
                : 'Fit notes are shown, not enforced: the book does not forbid buying a weapon you cannot yet wield.'}
            </p>
          </div>
        )}
        {optionItem && (
          <div className="cc-choice" id="todo:choose:start:weapon">
            <span className="cc-choice-label">{optionItem.label}</span>
            <div className="cc-shelf">
              {optionItem.options!.map((option) => {
                const weapon = WEAPONS.find((w) => w.id === option.id);
                return weapon ? (
                  <WeaponTile
                    key={option.id}
                    weapon={weapon}
                    selected={state.optionChoice === option.id}
                    onClick={() => dispatch({ type: 'set_option_choice', id: option.id })}
                  />
                ) : null;
              })}
            </div>
          </div>
        )}
        {derived.species?.id === 'halfling' && (
          <label className="cc-check">
            <input
              type="checkbox"
              checked={state.cookingGear}
              onChange={(event) =>
                dispatch({ type: 'set_cooking_gear', enabled: event.target.checked })
              }
            />
            Buy Cooking gear for {CREATION.cookingGearCost} c (Halfling special){' '}
            <CiteChip cite={CITES.halflingCookingGear} quote={derived.species.special} />
          </label>
        )}
      </Block>

      <Block
        title="Buying equipment before the game"
        cite={CITES.buyBeforeGame}
        quote={QUOTES.buyBefore}
      >
        <Quote text={QUOTES.buyBefore} cite={CITES.buyBeforeGame} />
        <div className="cc-chips shelves" role="tablist" aria-label="Shelves">
          {SHELVES.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={shelf === s.id}
              className={`cc-chip${shelf === s.id ? ' on' : ''}`}
              onClick={() => setShelf(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="cc-shelf-head">
          {shelf === 'weapon' && (
            <span className="hint">
              Weapons table <CiteChip cite={CITES.weapons} /> · all weapons have <Term abbr="DUR" />{' '}
              6 unless noted <CiteChip cite={CITES.durability} quote={QUOTES.durability} />
            </span>
          )}
          {shelf === 'armour' && (
            <span className="hint">
              Armour table <CiteChip cite={CITES.armour} /> ·{' '}
              {profession.maxArmourTier
                ? `a ${profession.name} may never use armour heavier than Tier ${profession.maxArmourTier}`
                : 'no armour limit for this profession'}{' '}
              · Stackable and Clunky <CiteChip cite={CITES.armourSpecials} />
            </span>
          )}
          {shelf === 'shield' && (
            <span className="hint">
              Shield table <CiteChip cite={CITES.shields} /> · a shield takes the off hand
            </span>
          )}
          {shelf !== 'weapon' && shelf !== 'armour' && shelf !== 'shield' && shelf !== 'other' && (
            <span className="hint">
              {GEAR_GROUPS[shelf].label} <CiteChip cite={GEAR_GROUPS[shelf].cite} /> ·{' '}
              <Term abbr="ENC" /> “1/3” means weight 1, three to a <Term abbr="Quick Slot" />{' '}
              <CiteChip cite={CITES.gearEnc} />
            </span>
          )}
          {shelf === 'other' && (
            <span className="hint">
              Anything the tables above do not list: enter it with its printed cost and ENC.
            </span>
          )}
        </div>
        <div className="cc-shelf" role="list">
          {shelf === 'weapon' &&
            WEAPONS.filter((w) => w.cost !== null).map((w) => (
              <WeaponTile
                key={w.id}
                weapon={w}
                onClick={() =>
                  dispatch({
                    type: 'add_purchase',
                    purchase: {
                      kind: 'weapon',
                      id: w.id,
                      label: w.name,
                      cost: w.cost!,
                      enc: w.enc ?? 0,
                      quantity: 1,
                      damageable: w.weaponClass !== null,
                    },
                  })
                }
                buy
              />
            ))}
          {shelf === 'armour' &&
            ARMOUR.map((p) => {
              const over =
                profession.maxArmourTier !== undefined && p.tier > profession.maxArmourTier;
              return (
                <Tile
                  key={p.id}
                  className="cc-item"
                  onClick={() =>
                    dispatch({
                      type: 'add_purchase',
                      purchase: {
                        kind: 'armour',
                        id: p.id,
                        label: p.name,
                        cost: p.cost,
                        enc: p.enc,
                        quantity: 1,
                        damageable: true,
                      },
                    })
                  }
                >
                  <span className="cc-tile-head">
                    <span className="cc-tile-title">{p.name}</span>
                    <span className="cc-item-cost">{p.costPrinted}</span>
                  </span>
                  <span className="cc-tile-meta">
                    Tier {p.tier} · <Term abbr="DEF" /> {p.def} · {p.covers} · <Term abbr="ENC" />{' '}
                    {p.enc}
                  </span>
                  <span className="cc-tile-line">
                    <Specials printed={p.special} />
                    {over && (
                      <Badge tone="spent">over the Tier {profession.maxArmourTier} limit</Badge>
                    )}
                  </span>
                </Tile>
              );
            })}
          {shelf === 'shield' &&
            SHIELDS.map((s) => (
              <Tile
                key={s.id}
                className="cc-item"
                onClick={() =>
                  dispatch({
                    type: 'add_purchase',
                    purchase: {
                      kind: 'shield',
                      id: s.id,
                      label: s.name,
                      cost: s.cost,
                      enc: s.enc,
                      quantity: 1,
                      damageable: true,
                    },
                  })
                }
              >
                <span className="cc-tile-head">
                  <span className="cc-tile-title">{s.name}</span>
                  <span className="cc-item-cost">{s.costPrinted}</span>
                </span>
                <span className="cc-tile-meta">
                  <Term abbr="DEF" /> {s.def} · Class {s.shieldClass} · <Term abbr="ENC" /> {s.enc}
                </span>
                <span className="cc-tile-line">
                  <Specials printed={s.special} />
                </span>
              </Tile>
            ))}
          {shelf !== 'weapon' &&
            shelf !== 'armour' &&
            shelf !== 'shield' &&
            shelf !== 'other' &&
            GEAR.filter((item) => item.group === shelf).map((item) => (
              <GearTile key={item.id} item={item} />
            ))}
          {shelf === 'other' && <OtherForm />}
        </div>
      </Block>

      <Block
        title="In the basket"
        cite={CITES.startingEquipment}
        aside={<Badge tone={purse.left < 0 ? 'spent' : 'plain'}>{purse.spent} c</Badge>}
        id="todo:coins"
      >
        {state.purchases.length === 0 && !state.cookingGear ? (
          <p className="cc-small muted">
            Nothing bought yet. The 150 c can also be saved for the first settlement.
          </p>
        ) : (
          <ul className="cc-basket" aria-label="Purchases">
            {state.purchases.map((p) => (
              <li key={p.key} className="cc-basket-item">
                <span className="cc-basket-label">
                  {p.label}
                  {p.variant ? ` · ${p.variant}` : ''}
                  <small>
                    {p.cost} c each · <Term abbr="ENC" /> {p.enc}
                  </small>
                </span>
                <span className="cc-stepper" role="group" aria-label={`${p.label} quantity`}>
                  <button
                    type="button"
                    className="btn-mini"
                    aria-label="One fewer"
                    onClick={() =>
                      dispatch({
                        type: 'set_purchase_quantity',
                        key: p.key,
                        quantity: p.quantity - 1,
                      })
                    }
                  >
                    −
                  </button>
                  <span className="cc-stepper-v">{p.quantity}</span>
                  <button
                    type="button"
                    className="btn-mini"
                    aria-label="One more"
                    onClick={() =>
                      dispatch({
                        type: 'set_purchase_quantity',
                        key: p.key,
                        quantity: p.quantity + 1,
                      })
                    }
                  >
                    +
                  </button>
                </span>
                <span className="cc-basket-cost">{p.cost * p.quantity} c</span>
                <button
                  type="button"
                  className="btn-x"
                  aria-label={`Remove ${p.label}`}
                  onClick={() => dispatch({ type: 'remove_purchase', key: p.key })}
                >
                  ×
                </button>
              </li>
            ))}
            {state.cookingGear && (
              <li className="cc-basket-item">
                <span className="cc-basket-label">Cooking gear (Halfling special)</span>
                <span />
                <span className="cc-basket-cost">{CREATION.cookingGearCost} c</span>
                <button
                  type="button"
                  className="btn-x"
                  aria-label="Remove cooking gear"
                  onClick={() => dispatch({ type: 'set_cooking_gear', enabled: false })}
                >
                  ×
                </button>
              </li>
            )}
          </ul>
        )}
        {purse.left < 0 && (
          <Note tone="warn">
            The purchases cost more than the starting coins. The book lets heroes lend or pool
            money; agree it at the table.
          </Note>
        )}
      </Block>
    </div>
  );
}

function WeaponTile({
  weapon,
  selected,
  onClick,
  buy = false,
}: {
  weapon: Weapon;
  selected?: boolean;
  onClick: () => void;
  buy?: boolean;
}) {
  const ui = useCreator();
  const fit = weaponFit(weapon, ui);
  return (
    <Tile className="cc-item" selected={selected} onClick={onClick}>
      <span className="cc-tile-head">
        <span className="cc-tile-title">{weapon.name}</span>
        <span className="cc-item-cost">
          {buy ? weapon.costPrinted : `Class ${weapon.weaponClass}`}
        </span>
      </span>
      <span className="cc-tile-meta">
        <Term abbr="DMG" /> {weapon.damage} · Class {weapon.weaponClass ?? '—'} ·{' '}
        <Term abbr="ENC" /> {weapon.enc ?? '—'}
        {weapon.reload && weapon.reload !== '-' ? ` · Reload ${weapon.reload}` : ''}
      </span>
      <span className="cc-tile-line">
        <Specials printed={weapon.special} />
        {fit.map((note) => (
          <Badge
            key={note.text}
            tone={note.tone === 'bad' ? 'spent' : note.tone === 'warn' ? 'warn' : 'plain'}
          >
            {note.text}
          </Badge>
        ))}
      </span>
    </Tile>
  );
}

function GearTile({ item }: { item: Gear }) {
  const { dispatch } = useCreator();
  const buy = (cost: number, variant?: string) => {
    const purchase = {
      kind: 'gear' as const,
      id: item.id,
      label: item.name,
      cost,
      enc: item.enc,
      quantity: 1,
      damageable: item.durability !== null && item.durability > 1,
    };
    dispatch({ type: 'add_purchase', purchase: variant ? { ...purchase, variant } : purchase });
  };
  return (
    <div className={`cc-tile cc-item static${item.costChoices ? ' choices' : ''}`}>
      <span className="cc-tile-head">
        <span className="cc-tile-title">{item.name}</span>
        <span className="cc-item-cost">{item.costPrinted}</span>
      </span>
      <span className="cc-tile-meta">
        <Term abbr="ENC" /> {item.encPrinted} · <Term abbr="DUR" /> {item.durPrinted} · avail.{' '}
        {item.availability}
      </span>
      {item.special && <span className="cc-tile-line">{item.special}</span>}
      <span className="cc-item-buy">
        {item.costChoices ? (
          item.costChoices.map((choice) => (
            <button
              key={choice.label}
              type="button"
              className="btn-ghost small"
              onClick={() => buy(choice.cost, choice.label)}
            >
              {choice.label} · {choice.cost} c
            </button>
          ))
        ) : item.cost !== null ? (
          <button type="button" className="btn-ghost small" onClick={() => buy(item.cost!)}>
            Buy for {item.cost} c
          </button>
        ) : null}
      </span>
    </div>
  );
}

function OtherForm() {
  const { dispatch } = useCreator();
  const id = useId();
  const [label, setLabel] = useState('');
  const [cost, setCost] = useState('');
  const [enc, setEnc] = useState('');
  const [damageable, setDamageable] = useState(false);
  const submit = () => {
    const c = Number(cost);
    const e = Number(enc || 0);
    if (!label.trim() || !Number.isFinite(c) || c < 0 || !Number.isFinite(e) || e < 0) return;
    dispatch({
      type: 'add_purchase',
      purchase: { kind: 'other', label: label.trim(), cost: c, enc: e, quantity: 1, damageable },
    });
    setLabel('');
    setCost('');
    setEnc('');
    setDamageable(false);
  };
  return (
    <form
      className="cc-form"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="cc-field grow">
        <label htmlFor={`${id}-label`}>Item</label>
        <input
          id={`${id}-label`}
          type="text"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="e.g. Dog"
        />
      </div>
      <div className="cc-field narrow">
        <label htmlFor={`${id}-cost`}>Cost (c)</label>
        <input
          id={`${id}-cost`}
          type="number"
          inputMode="numeric"
          min={0}
          value={cost}
          onChange={(event) => setCost(event.target.value)}
        />
      </div>
      <div className="cc-field narrow">
        <label htmlFor={`${id}-enc`}>
          <Term abbr="ENC" />
        </label>
        <input
          id={`${id}-enc`}
          type="number"
          inputMode="numeric"
          min={0}
          value={enc}
          onChange={(event) => setEnc(event.target.value)}
        />
      </div>
      <label className="cc-check">
        <input
          type="checkbox"
          checked={damageable}
          onChange={(event) => setDamageable(event.target.checked)}
        />
        Can be damaged (gets a wear roll)
      </label>
      <button type="submit" className="btn-ghost">
        Add
      </button>
    </form>
  );
}
