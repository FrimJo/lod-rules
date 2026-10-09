import { useState } from 'react';
import { DicePad } from '../../../gm/components/DicePad.tsx';
import { rollDie } from '../../../gm/dice.ts';
import type { PlacedLine, Placed } from '../../engine.ts';
import { BODY_AREAS, CARRY, CITES, CREATION, GAPS, QUOTES } from '../../rules.ts';
import {
  Badge,
  Block,
  CiteChip,
  Note,
  Quote,
  Specials,
  StatName,
  Term,
  useCreator,
} from '../common.tsx';

const PLACE_LABEL: Record<Placed, string> = {
  hands: 'In hand',
  worn: 'Worn',
  quick: 'Quick Slot',
  backpack: 'Backpack',
};

function nextPlace(current: Placed, options: Placed[]): Placed | null {
  if (options.length < 2) return null;
  const i = options.indexOf(current);
  return options[(i + 1) % options.length] ?? null;
}

/** A carried item as a chip: tap to move it to the next place the rules allow. */
function ItemChip({ placed }: { placed: PlacedLine }) {
  const { dispatch } = useCreator();
  const { line, place, options, suggested } = placed;
  const next = nextPlace(place, options);
  const moved = place !== suggested;
  return (
    <button
      type="button"
      className={`cc-itemchip${moved ? ' moved' : ''}${line.pending ? ' pending' : ''}`}
      disabled={next === null}
      onClick={() => {
        if (next === null) return;
        dispatch({
          type: 'set_placement',
          key: line.key,
          place: next === suggested ? null : (next as 'hands' | 'quick' | 'backpack'),
        });
      }}
      title={next ? `Tap to move to ${PLACE_LABEL[next].toLowerCase()}` : undefined}
      aria-label={`${line.label}, ${PLACE_LABEL[place].toLowerCase()}${next ? `. Tap to move to ${PLACE_LABEL[next].toLowerCase()}` : ''}`}
    >
      <span className="cc-itemchip-name">{line.label}</span>
      <span className="cc-itemchip-meta">
        {line.enc !== null && line.enc > 0 ? `ENC ${line.enc * line.quantity}` : ''}
        {placed.takes > 0 && place === 'quick'
          ? ` · ${placed.takes} slot${placed.takes === 1 ? '' : 's'}`
          : ''}
        {placed.takes > 0 && place === 'hands'
          ? ` · ${placed.takes} hand${placed.takes === 1 ? '' : 's'}`
          : ''}
        {line.durabilityLeft !== null ? ` · DUR ${line.durabilityLeft}/${line.durabilityMax}` : ''}
      </span>
    </button>
  );
}

export function LoadoutStation() {
  const { derived, dispatch } = useCreator();
  const [open, setOpen] = useState<string | null>(null);
  const profession = derived.profession;
  if (!profession) {
    return (
      <div className="cc-body">
        <Note tone="warn">Choose a profession first.</Note>
      </div>
    );
  }
  const { loadout, encumbrance } = derived;
  const damageable = derived.equipment.filter((line) => line.damageable && !line.pending);
  const optional = derived.equipment.filter(
    (line) =>
      !line.damageable &&
      line.origin === 'bought' &&
      line.durabilityMax !== null &&
      line.durabilityMax > 1,
  );
  const encPct = encumbrance.limit
    ? Math.min(100, (encumbrance.carried / encumbrance.limit) * 100)
    : 0;

  return (
    <div className="cc-body">
      <Block
        title="Wear: roll 1d4 for each piece"
        cite={CITES.wear}
        quote={QUOTES.wear}
        id="todo:wear"
        aside={
          <button
            type="button"
            className="btn-ghost small"
            onClick={() => {
              for (const line of damageable)
                if (line.wear === null)
                  dispatch({ type: 'set_wear', key: line.key, value: rollDie(CREATION.wearDie) });
            }}
          >
            Roll the rest for me
          </button>
        }
      >
        <Quote text={QUOTES.wear} cite={CITES.wear} />
        <ul className="cc-wear" aria-label="Wear rolls">
          {damageable.map((line) => (
            <li key={line.key} className={`cc-wear-row${line.wear === null ? ' todo' : ''}`}>
              <button
                type="button"
                className="cc-wear-die"
                aria-expanded={open === line.key}
                onClick={() => setOpen(open === line.key ? null : line.key)}
                aria-label={
                  line.wear === null
                    ? `Roll 1d4 wear for ${line.label}`
                    : `${line.label} wear ${line.wear}; tap to change`
                }
              >
                <span className={`cc-face${line.wear === null ? ' empty' : ''}`}>
                  {line.wear ?? 'd4'}
                </span>
              </button>
              <span className="cc-wear-label">
                {line.label}
                <small>
                  {line.weapon && (
                    <>
                      {line.weapon.damage} · Class {line.weapon.weaponClass ?? '—'}{' '}
                      <Specials printed={line.weapon.special} />
                    </>
                  )}
                  {line.armour && (
                    <>
                      <Term abbr="DEF" /> {line.armour.def} · {line.armour.covers}{' '}
                      <Specials printed={line.armour.special} />
                    </>
                  )}
                  {line.shield && (
                    <>
                      <Term abbr="DEF" /> {line.shield.def} · Class {line.shield.shieldClass}{' '}
                      <Specials printed={line.shield.special} />
                    </>
                  )}
                  {line.gear && !line.weapon && !line.armour && !line.shield && (
                    <>
                      <Term abbr="DUR" /> {line.gear.durPrinted}
                      {line.origin === 'bought' && (
                        <button
                          type="button"
                          className="link small"
                          onClick={() =>
                            dispatch({
                              type: 'set_purchase_damageable',
                              key: line.key,
                              damageable: false,
                            })
                          }
                        >
                          skip wear
                        </button>
                      )}
                    </>
                  )}
                </small>
              </span>
              <span className="cc-wear-dur">
                <Term abbr="DUR" /> <b>{line.durabilityLeft ?? '?'}</b> / {line.durabilityMax}
              </span>
              {open === line.key && (
                <div className="cc-padwell inrow">
                  <DicePad
                    dice="1d4"
                    compact
                    label={`Wear for ${line.label}`}
                    onCommit={(value) => {
                      dispatch({ type: 'set_wear', key: line.key, value });
                      setOpen(null);
                    }}
                  />
                </div>
              )}
            </li>
          ))}
          {damageable.length === 0 && (
            <li className="cc-small muted">Nothing to roll wear for yet.</li>
          )}
        </ul>
        {optional.length > 0 && (
          <p className="hint">
            Wear skipped for:{' '}
            {optional.map((line, i) => (
              <span key={line.key}>
                {i > 0 && ', '}
                {line.label}{' '}
                <button
                  type="button"
                  className="link small"
                  onClick={() =>
                    dispatch({ type: 'set_purchase_damageable', key: line.key, damageable: true })
                  }
                >
                  roll it
                </button>
              </span>
            ))}
          </p>
        )}
        <Note>
          {QUOTES.durability} <CiteChip cite={CITES.durability} quote={QUOTES.durability} /> A
          Defensive weapon can only take 4 Points of Damage before it breaks.
        </Note>
        <Note tone="gap">{GAPS.wearScope}</Note>
      </Block>

      <Block
        title="Where it is carried"
        cite={CITES.carrying}
        quote={CARRY.quickSlotsText}
        id="todo:loadout"
      >
        <Note tone="gap">{GAPS.loadout}</Note>
        <div className="cc-loadout">
          <div className="cc-figure" role="group" aria-label="Armour by Hit Area">
            <svg viewBox="0 0 120 240" className="cc-figure-svg" aria-hidden="true">
              <ellipse
                cx="60"
                cy="28"
                rx="18"
                ry="22"
                className={`cc-area${loadout.areas.head.def ? ' armoured' : ''}`}
              />
              <rect
                x="34"
                y="56"
                width="52"
                height="74"
                rx="10"
                className={`cc-area${loadout.areas.torso.def ? ' armoured' : ''}`}
              />
              <rect
                x="8"
                y="60"
                width="20"
                height="70"
                rx="9"
                className={`cc-area${loadout.areas.arms.def ? ' armoured' : ''}`}
              />
              <rect
                x="92"
                y="60"
                width="20"
                height="70"
                rx="9"
                className={`cc-area${loadout.areas.arms.def ? ' armoured' : ''}`}
              />
              <rect
                x="36"
                y="136"
                width="21"
                height="92"
                rx="9"
                className={`cc-area${loadout.areas.legs.def ? ' armoured' : ''}`}
              />
              <rect
                x="63"
                y="136"
                width="21"
                height="92"
                rx="9"
                className={`cc-area${loadout.areas.legs.def ? ' armoured' : ''}`}
              />
              <text x="60" y="30" className="cc-area-def">
                {loadout.areas.head.def || ''}
              </text>
              <text x="60" y="96" className="cc-area-def">
                {loadout.areas.torso.def || ''}
              </text>
              <text x="18" y="98" className="cc-area-def">
                {loadout.areas.arms.def || ''}
              </text>
              <text x="102" y="98" className="cc-area-def">
                {loadout.areas.arms.def || ''}
              </text>
              <text x="60" y="186" className="cc-area-def">
                {loadout.areas.legs.def || ''}
              </text>
            </svg>
            <ul className="cc-areas">
              {BODY_AREAS.map((area) => (
                <li key={area.id}>
                  <span className="cc-area-k">
                    <span className="cc-row-roll">{area.roll}</span> {area.label}
                  </span>
                  <span className="cc-area-v">
                    {loadout.areas[area.id].pieces.length
                      ? loadout.areas[area.id].pieces
                          .map((p) => `${p.armour.name} (${p.armour.def})`)
                          .join(' + ')
                      : 'bare'}
                    {loadout.areas[area.id].def > 0 && (
                      <b>
                        {' '}
                        <Term abbr="DEF" /> {loadout.areas[area.id].def}
                      </b>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <p className="hint">
              Hit Area, 1d6 <CiteChip cite={CITES.hitLocation} /> · <Term abbr="NA" />{' '}
              {derived.naturalArmour === null ? '—' : `+${derived.naturalArmour}`} comes on top
              everywhere. Stacking{' '}
              <CiteChip cite={CITES.stackedArmour} quote={CARRY.stackedArmourText} />
            </p>
          </div>

          <div className="cc-slots">
            <section className="cc-slotgroup">
              <h4>
                Hands{' '}
                <Badge tone={loadout.hands.used > 2 ? 'spent' : 'plain'}>
                  {loadout.hands.used} of 2
                </Badge>
                <CiteChip cite={CITES.carrying} quote={CARRY.handsText} label="p. 50" />
              </h4>
              <div className="cc-chips">
                {loadout.hands.lines.map((p) => (
                  <ItemChip key={p.line.key} placed={p} />
                ))}
                {loadout.hands.lines.length === 0 && (
                  <span className="cc-small muted">Empty hands</span>
                )}
              </div>
            </section>
            <section className="cc-slotgroup">
              <h4>
                <Term abbr="Quick Slot">Quick Slots</Term>{' '}
                <Badge tone={loadout.quick.used > loadout.quick.capacity ? 'spent' : 'plain'}>
                  {loadout.quick.used} of {loadout.quick.capacity}
                </Badge>
                <CiteChip cite={CITES.carrying} quote={CARRY.quickSlotsText} />
              </h4>
              <span className="cc-sockets" aria-hidden="true">
                {Array.from(
                  { length: Math.max(loadout.quick.capacity, loadout.quick.used) },
                  (_, i) => (
                    <span
                      key={i}
                      className={`cc-socket${i < loadout.quick.used ? ' full' : ''}${i >= loadout.quick.capacity ? ' over' : ''}`}
                    />
                  ),
                )}
              </span>
              <div className="cc-chips">
                {loadout.quick.lines.map((p) => (
                  <ItemChip key={p.line.key} placed={p} />
                ))}
                {loadout.quick.lines.length === 0 && (
                  <span className="cc-small muted">Nothing at hand</span>
                )}
              </div>
              <p className="hint">
                {CARRY.quickAccessText}
                {loadout.quick.extraFrom.length
                  ? ` Extra slots from ${loadout.quick.extraFrom.join(' and ')}.`
                  : ''}
              </p>
            </section>
            <section className="cc-slotgroup">
              <h4>
                Backpack <CiteChip cite={CITES.backpackRule} quote={CARRY.backpackText} />
              </h4>
              <div className="cc-chips">
                {loadout.backpack.map((p) => (
                  <ItemChip key={p.line.key} placed={p} />
                ))}
                {loadout.backpack.length === 0 && <span className="cc-small muted">Empty</span>}
              </div>
            </section>
            <section className="cc-slotgroup">
              <h4>Worn</h4>
              <div className="cc-chips">
                {loadout.items
                  .filter((p) => p.place === 'worn')
                  .map((p) => (
                    <ItemChip key={p.line.key} placed={p} />
                  ))}
              </div>
            </section>
          </div>
        </div>
        {loadout.warnings.map((w) => (
          <Note key={w} tone="warn">
            {w}
          </Note>
        ))}
      </Block>

      <Block title="Encumbrance" cite={CITES.encumbrance} quote={QUOTES.encumbrance}>
        <div className="cc-encrow">
          <span className="cc-enc-big">
            <Term abbr="ENC" />{' '}
            <b
              className={
                encumbrance.limit !== null && encumbrance.carried > encumbrance.limit ? 'bad' : ''
              }
            >
              {encumbrance.carried}
            </b>
            <small>
              of <StatName stat="str" /> {encumbrance.limit ?? '—'}
              {encumbrance.extra.map((e) => ` (+${e.amount} ${e.source})`).join('')}
            </small>
          </span>
          <span className="cc-enc-bar" aria-hidden="true">
            <span
              className={`cc-enc-fill${encPct >= 100 ? ' over' : ''}`}
              style={{ width: `${encPct}%` }}
            />
          </span>
          <span className="cc-small muted">hard cap STR+15 = {encumbrance.hardCap ?? '—'}</span>
        </div>
        <Quote text={QUOTES.encumbrance} cite={CITES.encPenalty} />
        {derived.effects.length > 0 && (
          <ul className="cc-effects" aria-label="Standing effects">
            {derived.effects.map((effect) => (
              <li key={effect.id} className={`cc-effect ${effect.tone}`}>
                <span>{effect.label}</span>
                <CiteChip cite={effect.cite} quote={effect.detail} />
              </li>
            ))}
          </ul>
        )}
      </Block>
    </div>
  );
}

export { PLACE_LABEL };
