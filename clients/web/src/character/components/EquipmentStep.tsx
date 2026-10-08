import { useId, useState } from 'react';
import { rollDie } from '../../gm/dice.ts';
import { ARMOUR, CITES, CREATION, QUOTES, WEAPONS, WEAPON_CLASSES } from '../rules.ts';
import { CiteChip, DieField, Note, Quote, Section, useCreator } from './common.tsx';

export function EquipmentStep() {
  const { state, derived, dispatch } = useCreator();
  const profession = derived.profession;
  if (!profession) {
    return (
      <Section title="Starting equipment" cite={CITES.startingEquipment}>
        <Note tone="warn">Choose a profession first: the starting gear is printed with each profession.</Note>
      </Section>
    );
  }
  const weaponItem = profession.equipment.find((item) => item.anyWeapon);
  const optionItem = profession.equipment.find((item) => item.options);
  return (
    <>
      <Section title={`${profession.name} starting equipment`} cite={profession.cite}>
        <Quote text={QUOTES.backpack} cite={CITES.backpack} />
        {weaponItem && <WeaponChoice label={weaponItem.label} />}
        {optionItem && (
          <fieldset className="cc-radios">
            <legend>{optionItem.label}</legend>
            {optionItem.options!.map((option) => {
              const weapon = WEAPONS.find((w) => w.id === option.id);
              return (
                <label key={option.id} className="cc-check">
                  <input type="radio" name="cc-option" checked={state.optionChoice === option.id} onChange={() => dispatch({ type: 'set_option_choice', id: option.id })} />
                  {weapon?.name ?? option.id}
                  {weapon && (
                    <span className="muted">
                      {' '}
                      · {weapon.damage} · Class {weapon.weaponClass} · {weapon.special}
                    </span>
                  )}
                </label>
              );
            })}
          </fieldset>
        )}
        {derived.species?.id === 'halfling' && (
          <label className="cc-check">
            <input type="checkbox" checked={state.cookingGear} onChange={(event) => dispatch({ type: 'set_cooking_gear', enabled: event.target.checked })} />
            Buy Cooking gear for 50 c (Halfling special) <CiteChip cite={CITES.halflingCookingGear} />
          </label>
        )}
      </Section>

      <Section title="Coins and purchases" cite={CITES.startingEquipment} aside={<span className={`cc-badge${derived.coins.left < 0 ? ' spent' : ''}`}>{derived.coins.left} c left of {derived.coins.start}</span>}>
        <Quote text={QUOTES.coins} cite={CITES.startingEquipment} />
        <Quote text={QUOTES.buyBefore} cite={CITES.buyBeforeGame} />
        {derived.coins.start !== CREATION.startingCoins && <Note>{derived.coins.source}: starting coins are {derived.coins.start} c.</Note>}
        <PurchaseForm />
        {state.purchases.length > 0 && (
          <ul className="cc-list">
            {state.purchases.map((p) => (
              <li key={p.key} className="cc-row">
                <span>
                  {p.quantity > 1 ? `${p.quantity} × ` : ''}
                  {p.label} <span className="muted">{p.cost * p.quantity} c{p.enc ? ` · ENC ${p.enc * p.quantity}` : ''}</span>
                </span>
                <button type="button" className="cc-link" onClick={() => dispatch({ type: 'remove_purchase', key: p.key })}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <Note tone="gap">The purchase list covers the Weapons and Armour tables. Other gear (rations, torches, bandages, backpacks) is entered as a free-form item with its printed cost and ENC.</Note>
      </Section>

      <Section title="Wear: roll 1d4 per piece" cite={CITES.wear}>
        <Quote text={QUOTES.wear} cite={CITES.wear} />
        <Note>
          {QUOTES.durability} <CiteChip cite={CITES.durability} /> A Defensive weapon (the Staff) can only take 4 Points of Damage before it breaks.
        </Note>
        <table className="cc-table cc-gear">
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">ENC</th>
              <th scope="col">DUR</th>
              <th scope="col">Wear (1d4)</th>
              <th scope="col">DUR left</th>
            </tr>
          </thead>
          <tbody>
            {derived.equipment.map((line) => (
              <tr key={line.key} className={line.pending ? 'pending' : ''}>
                <th scope="row">
                  {line.label}
                  {line.pending && <span className="cc-badge spent"> choose above</span>}
                  {line.weapon && (
                    <span className="cc-small block muted">
                      {line.weapon.damage} · Class {line.weapon.weaponClass ?? '—'}
                      {line.weapon.special ? ` · ${line.weapon.special}` : ''}
                    </span>
                  )}
                  {line.armour && (
                    <span className="cc-small block muted">
                      Def {line.armour.def} · Tier {line.armour.tier} · {line.armour.covers}
                      {line.armour.special ? ` · ${line.armour.special}` : ''}
                    </span>
                  )}
                  {line.note && <span className="cc-small block muted">{line.note}</span>}
                </th>
                <td className="cc-num">{line.enc ?? <span className="muted">—</span>}</td>
                <td className="cc-num">{line.durabilityMax ?? <span className="muted">—</span>}</td>
                <td>
                  {line.damageable ? (
                    <div className="cc-wear">
                      <span className="cc-die-face small" aria-label={line.wear === null ? 'Not rolled' : `Wear ${line.wear}`}>
                        {line.wear ?? '?'}
                      </span>
                      <DieField sides={CREATION.wearDie} label={`Wear for ${line.label}`} value={line.wear} onCommit={(value) => dispatch({ type: 'set_wear', key: line.key, value })} compact />
                    </div>
                  ) : (
                    <span className="muted">not rolled</span>
                  )}
                </td>
                <td className="cc-num cc-strong">{line.durabilityLeft ?? <span className="muted">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="cc-actions">
          <button
            type="button"
            className="cc-secondary"
            onClick={() => {
              for (const line of derived.equipment) if (line.damageable && line.wear === null) dispatch({ type: 'set_wear', key: line.key, value: rollDie(CREATION.wearDie) });
            }}
          >
            Roll the rest for me
          </button>
        </div>
        <Note tone="gap">Only weapons and armour get a wear roll here: they are the items whose durability the corpus pins. The book says “all things that could potentially be damaged”; roll for any other such item at the table.</Note>
      </Section>

      <Section title="Encumbrance" cite={CITES.encumbrance}>
        <Quote text={QUOTES.encumbrance} cite={CITES.encumbrance} />
        <p>
          Carried (weapons and armour): <strong>{derived.encumbrance.carried}</strong> · limit <strong>{derived.encumbrance.limit ?? '—'}</strong>
          {derived.encumbrance.extra.map((e) => ` (STR +${e.amount} ${e.source})`).join('')} · hard cap STR+15 = <strong>{derived.encumbrance.hardCap ?? '—'}</strong>
        </p>
        <h3>
          Weapon Class with STR {derived.weaponClassStrength ?? '—'} <CiteChip cite={CITES.weaponClassTable} />
        </h3>
        <table className="cc-mini-table">
          <thead>
            <tr>
              <th>Class</th>
              <th>2H STR req</th>
              <th>1H STR req</th>
              <th>Usable</th>
            </tr>
          </thead>
          <tbody>
            {WEAPON_CLASSES.map((row) => {
              const use = derived.weaponClasses.find((c) => c.weaponClass === row.weaponClass)!;
              return (
                <tr key={row.weaponClass} className={use.twoHands ? 'hit' : ''}>
                  <td>{row.weaponClass}</td>
                  <td>{row.twoHands}</td>
                  <td>{row.oneHand ?? 'N/A'}</td>
                  <td>{derived.weaponClassStrength === null ? '—' : use.oneHand ? 'one or two hands' : use.twoHands ? 'two hands' : 'no'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>
    </>
  );
}

function WeaponChoice({ label }: { label: string }) {
  const { state, derived, dispatch } = useCreator();
  const id = useId();
  const profession = derived.profession!;
  return (
    <div className="cc-field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={state.weaponChoice ?? ''} onChange={(event) => dispatch({ type: 'set_weapon_choice', weaponId: event.target.value || null })}>
        <option value="">Choose a weapon from the Weapons table</option>
        {WEAPONS.filter((w) => w.weaponClass !== null).map((w) => {
          const use = derived.weaponClasses.find((c) => c.weaponClass === w.weaponClass);
          const tooHeavy = use ? !use.twoHands : false;
          const overClass = profession.maxWeaponClass !== undefined && w.weaponClass! > profession.maxWeaponClass;
          const bow = (derived.species?.id === 'dwarf' || derived.species?.id === 'halfling') && (w.id === 'longbow' || w.id === 'elven_bow');
          return (
            <option key={w.id} value={w.id}>
              {w.name} · {w.damage} · Class {w.weaponClass} · ENC {w.enc}
              {w.special ? ` · ${w.special}` : ''}
              {tooHeavy ? ' · STR too low' : ''}
              {overClass ? ' · above the profession’s Class limit' : ''}
              {bow ? ' · not usable by this species' : ''}
            </option>
          );
        })}
      </select>
      <span className="cc-hint">
        {QUOTES.rangerBow.startsWith('Designer') && profession.id === 'ranger' ? QUOTES.rangerBow : 'The list is the printed Weapons table. Warnings are shown, not enforced: the book does not forbid buying a weapon you cannot yet wield.'}{' '}
        <CiteChip cite={CITES.weapons} />
      </span>
    </div>
  );
}

function PurchaseForm() {
  const { derived, dispatch } = useCreator();
  const id = useId();
  const [kind, setKind] = useState<'weapon' | 'armour' | 'other'>('weapon');
  const [itemId, setItemId] = useState('');
  const [label, setLabel] = useState('');
  const [cost, setCost] = useState('');
  const [enc, setEnc] = useState('');
  const [damageable, setDamageable] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const profession = derived.profession!;

  const submit = () => {
    if (kind === 'weapon') {
      const weapon = WEAPONS.find((w) => w.id === itemId);
      if (!weapon || weapon.cost === null) return;
      dispatch({ type: 'add_purchase', purchase: { kind, id: weapon.id, label: weapon.name, cost: weapon.cost, enc: weapon.enc ?? 0, quantity, damageable: weapon.weaponClass !== null } });
    } else if (kind === 'armour') {
      const piece = ARMOUR.find((p) => p.id === itemId);
      if (!piece) return;
      dispatch({ type: 'add_purchase', purchase: { kind, id: piece.id, label: piece.name, cost: piece.cost, enc: piece.enc, quantity, damageable: true } });
    } else {
      const c = Number(cost);
      const e = Number(enc || 0);
      if (!label.trim() || !Number.isFinite(c) || c < 0 || !Number.isFinite(e) || e < 0) return;
      dispatch({ type: 'add_purchase', purchase: { kind, label: label.trim(), cost: c, enc: e, quantity, damageable } });
      setLabel('');
      setCost('');
      setEnc('');
    }
    setItemId('');
    setQuantity(1);
  };

  return (
    <form
      className="cc-form"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="cc-field">
        <label htmlFor={`${id}-kind`}>Buy</label>
        <select
          id={`${id}-kind`}
          value={kind}
          onChange={(event) => {
            setKind(event.target.value as typeof kind);
            setItemId('');
          }}
        >
          <option value="weapon">Weapon</option>
          <option value="armour">Armour</option>
          <option value="other">Other item</option>
        </select>
      </div>
      {kind === 'weapon' && (
        <div className="cc-field grow">
          <label htmlFor={`${id}-item`}>
            Weapons table <CiteChip cite={CITES.weapons} />
          </label>
          <select id={`${id}-item`} value={itemId} onChange={(event) => setItemId(event.target.value)}>
            <option value="">Choose</option>
            {WEAPONS.filter((w) => w.cost !== null).map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} · {w.costPrinted} · {w.damage} · Class {w.weaponClass ?? '—'} · ENC {w.enc ?? '—'}
                {profession.maxWeaponClass !== undefined && w.weaponClass !== null && w.weaponClass > profession.maxWeaponClass ? ' · above Class limit' : ''}
              </option>
            ))}
          </select>
        </div>
      )}
      {kind === 'armour' && (
        <div className="cc-field grow">
          <label htmlFor={`${id}-item`}>
            Armour table <CiteChip cite={CITES.armour} />
          </label>
          <select id={`${id}-item`} value={itemId} onChange={(event) => setItemId(event.target.value)}>
            <option value="">Choose</option>
            {ARMOUR.map((p) => (
              <option key={p.id} value={p.id}>
                Tier {p.tier}: {p.name} · {p.costPrinted} · Def {p.def} · ENC {p.enc} · {p.covers}
                {profession.maxArmourTier !== undefined && p.tier > profession.maxArmourTier ? ' · above Tier limit' : ''}
              </option>
            ))}
          </select>
        </div>
      )}
      {kind === 'other' && (
        <>
          <div className="cc-field grow">
            <label htmlFor={`${id}-label`}>Item</label>
            <input id={`${id}-label`} type="text" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="e.g. Ration" />
          </div>
          <div className="cc-field narrow">
            <label htmlFor={`${id}-cost`}>Cost (c)</label>
            <input id={`${id}-cost`} type="number" inputMode="numeric" min={0} value={cost} onChange={(event) => setCost(event.target.value)} />
          </div>
          <div className="cc-field narrow">
            <label htmlFor={`${id}-enc`}>ENC</label>
            <input id={`${id}-enc`} type="number" inputMode="numeric" min={0} value={enc} onChange={(event) => setEnc(event.target.value)} />
          </div>
          <label className="cc-check">
            <input type="checkbox" checked={damageable} onChange={(event) => setDamageable(event.target.checked)} />
            Can be damaged (gets a wear roll)
          </label>
        </>
      )}
      <div className="cc-field narrow">
        <label htmlFor={`${id}-qty`}>Qty</label>
        <input id={`${id}-qty`} type="number" inputMode="numeric" min={1} max={99} value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.round(Number(event.target.value) || 1)))} />
      </div>
      <button type="submit" className="cc-secondary">
        Add
      </button>
    </form>
  );
}
