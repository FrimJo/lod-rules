import { useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { DicePad } from '../../../gm/components/DicePad.tsx';
import { heroName, STATIONS } from '../../engine.ts';
import { sendPartyToTable } from '../../handoff.ts';
import {
  ARCANE_PERKS,
  CITES,
  GAPS,
  LEVEL_1_PRAYERS,
  LEVEL_1_SPELLS,
  PARTY,
  PERKS,
  QUOTES,
  START_SETTLEMENTS,
  STAT_KEYS,
  STAT_NAMES,
  type Cite,
} from '../../rules.ts';
import {
  Badge,
  Block,
  CiteChip,
  Note,
  Quote,
  StatName,
  Term,
  modifierLabel,
  signed,
  useCreator,
} from '../common.tsx';
import { PLACE_LABEL } from './LoadoutStation.tsx';

interface Field {
  id: string;
  label: ReactNode;
  value: ReactNode;
  /** Small print under the value: where the number came from. */
  from?: ReactNode;
  wide?: boolean;
}

/**
 * The sheet to copy: every field the printed character sheet asks for, grouped the way the
 * sheet groups them, as big tiles the player ticks off while writing. The ticks persist per
 * hero so a table can pause and resume.
 */
export function SheetStation() {
  const { party, partyDerived, state, derived, dispatch, goTo } = useCreator();
  const [sent, setSent] = useState<string | null>(null);
  const missing = STATIONS.filter((s) => s.id !== 'sheet' && !derived.complete[s.id]);
  const species = derived.species;
  const profession = derived.profession;
  const dash = '—';

  interface Group {
    title: ReactNode;
    cite?: Cite;
    fields: Field[];
  }
  const groups: Group[] = [
    {
      title: 'Who',
      fields: [
        { id: 'name', label: 'Name', value: heroName(state, party) },
        { id: 'species', label: 'Species', value: species?.name ?? dash },
        { id: 'profession', label: 'Profession', value: profession?.name ?? dash },
        {
          id: 'level',
          label: (
            <>
              Level · <Term abbr="XP" />
            </>
          ),
          value: `${derived.level} · ${derived.experience}`,
          from: (
            <>
              Level 2 at {PARTY.nextLevelXp} XP <CiteChip cite={CITES.levelling} />
            </>
          ),
        },
      ],
    },
    {
      title: 'Basic stats',
      cite: CITES.basicStats,
      fields: STAT_KEYS.map((key) => ({
        id: `stat:${key}`,
        label: <StatName stat={key} />,
        value: derived.stats[key] ?? dash,
        from:
          derived.rolled[key] !== undefined
            ? `${species!.base[key]}+die ${derived.rolled[key]! - species!.base[key]}${state.specialisation[key] ? ` +${state.specialisation[key]}` : ''}${derived.statBonuses[key]?.map((b) => ` ${signed(b.amount)} ${b.source}`).join('') ?? ''}`
            : undefined,
      })),
    },
    {
      title: 'Derived',
      fields: [
        {
          id: 'hp',
          label: <Term abbr="HP" />,
          value: derived.hitPoints ?? dash,
          from:
            derived.hitPoints !== null
              ? `${derived.hitPointsParts.base}+${derived.hitPointsParts.die}${derived.hitPointsParts.profession ? ` ${signed(derived.hitPointsParts.profession)} ${profession?.name}` : ''}${derived.hitPointsParts.talents ? ` ${signed(derived.hitPointsParts.talents)} talent` : ''}`
              : undefined,
        },
        {
          id: 'movement',
          label: <Term abbr="M" />,
          value: derived.movement,
          from: <CiteChip cite={CITES.movement} quote={QUOTES.movement} />,
        },
        {
          id: 'db',
          label: <Term abbr="DB" />,
          value: derived.damageBonus === null ? dash : `+${derived.damageBonus}`,
          from: derived.stats.str !== undefined ? `STR ${derived.stats.str}` : undefined,
        },
        {
          id: 'na',
          label: <Term abbr="NA" />,
          value: derived.naturalArmour === null ? dash : `+${derived.naturalArmour}`,
          from: derived.stats.con !== undefined ? `CON ${derived.stats.con}` : undefined,
        },
      ],
    },
    {
      title: 'Pools',
      cite: CITES.finalTouches,
      fields: [
        {
          id: 'energy',
          label: <Term abbr="E">Energy</Term>,
          value: derived.energy,
          from: <CiteChip cite={CITES.energy} quote={QUOTES.energy} />,
        },
        {
          id: 'luck',
          label: <Term abbr="L">Luck</Term>,
          value: derived.luck,
          from: <CiteChip cite={CITES.finalTouches} quote={QUOTES.luck} />,
        },
        {
          id: 'sanity',
          label: <Term abbr="Sanity" />,
          value: derived.sanity,
          from: <CiteChip cite={CITES.sanity} quote={QUOTES.sanity} />,
        },
        ...(derived.mana !== null
          ? [
              {
                id: 'mana',
                label: <Term abbr="Mana" />,
                value: derived.mana,
                from: <CiteChip cite={CITES.mana} quote={QUOTES.mana} />,
              },
            ]
          : []),
        {
          id: 'pm',
          label: (
            <>
              <Term abbr="PM" /> share
            </>
          ),
          value: derived.partyMoraleContribution ?? dash,
          from: (
            <>
              RES ÷ 10 <CiteChip cite={CITES.partyMorale} quote={QUOTES.partyMorale} />
              {derived.partyMoraleNotes.map((n) => ` · ${signed(n.amount)} ${n.source}`).join('')}
            </>
          ),
        },
      ],
    },
    {
      title: 'Skills',
      cite: CITES.skills,
      fields: derived.skills.map((skill) => ({
        id: `skill:${skill.id}`,
        label: <Term abbr={skill.abbr}>{skill.name}</Term>,
        value: skill.value === null ? (skill.modifier === null ? 'N/A' : dash) : skill.value,
        from:
          skill.base !== null && skill.modifier !== null
            ? `${STAT_NAMES[skill.stat].abbr} ${skill.base} ${modifierLabel(skill.modifier)}${skill.freeSkill ? ' +10 free' : ''}${skill.talentBonus ? ` ${signed(skill.talentBonus)} talent` : ''}`
            : undefined,
      })),
    },
    {
      title: 'Talents and perks',
      fields: [
        ...derived.talents.map((line, i) => ({
          id: `talent:${line.talent.id}:${i}`,
          label: line.source,
          value: line.qualifier ? `${line.talent.name}: ${line.qualifier}` : line.talent.name,
          from: line.talent.text,
          wide: true,
        })),
        ...(derived.background?.hate
          ? [
              {
                id: 'bg:hate',
                label: derived.background.name,
                value: `Hate: ${derived.background.hate}`,
                wide: true,
              },
            ]
          : []),
        ...(profession?.perks ?? []).map((grant) => {
          const perk = PERKS.find((p) => p.id === grant.perkId);
          return {
            id: `perk:${grant.perkId}`,
            label: (
              <>
                Perk <Term abbr="E">E</Term> 1
              </>
            ),
            value: grant.label,
            from: perk ? (
              <>
                {perk.text} <CiteChip cite={perk.cite} />
              </>
            ) : undefined,
            wide: true,
          };
        }),
        ...(state.arcanePerk
          ? [
              {
                id: 'perk:arcane',
                label: 'Arcane perk',
                value:
                  ARCANE_PERKS.find((p) => p.id === state.arcanePerk)?.name ?? state.arcanePerk,
                from: ARCANE_PERKS.find((p) => p.id === state.arcanePerk)?.effect,
                wide: true,
              },
            ]
          : []),
      ],
    },
    ...(state.spells.length || state.prayers.length
      ? [
          {
            title: state.spells.length ? 'Spells' : 'Prayers',
            fields: [
              ...state.spells.map((id) => {
                const spell = LEVEL_1_SPELLS.find((s) => s.id === id);
                return {
                  id: `spell:${id}`,
                  label: spell ? (
                    <>
                      CV {spell.cv} · Mana {spell.mana} · Upkeep {spell.upkeep}
                      {spell.special ? ` · ${spell.special}` : ''}
                    </>
                  ) : (
                    'Spell'
                  ),
                  value: spell?.name ?? id,
                  from: spell?.effect,
                  wide: true,
                };
              }),
              ...state.prayers.map((id) => {
                const prayer = LEVEL_1_PRAYERS.find((p) => p.id === id);
                return {
                  id: `prayer:${id}`,
                  label: 'Level 1 prayer',
                  value: prayer?.name ?? id,
                  from: prayer?.text,
                  wide: true,
                };
              }),
            ],
          },
        ]
      : []),
    {
      title: 'Equipment',
      cite: CITES.carrying,
      fields: [
        ...derived.loadout.items.map((p) => ({
          id: `gear:${p.line.key}`,
          label: (
            <>
              {PLACE_LABEL[p.place]}
              {p.line.durabilityMax !== null ? (
                <>
                  {' '}
                  · <Term abbr="DUR" /> {p.line.durabilityLeft ?? '?'}/{p.line.durabilityMax}
                </>
              ) : null}
            </>
          ),
          value: p.line.label + (p.line.pending ? ' (to choose)' : ''),
          from: p.line.weapon
            ? `${p.line.weapon.damage} · Class ${p.line.weapon.weaponClass ?? '—'} · ENC ${p.line.weapon.enc ?? '—'}${p.line.weapon.special ? ` · ${p.line.weapon.special}` : ''}`
            : p.line.armour
              ? `DEF ${p.line.armour.def} · ${p.line.armour.covers} · ENC ${p.line.armour.enc}${p.line.armour.special ? ` · ${p.line.armour.special}` : ''}`
              : p.line.shield
                ? `DEF ${p.line.shield.def} · Class ${p.line.shield.shieldClass} · ENC ${p.line.shield.enc}`
                : p.line.enc
                  ? `ENC ${p.line.enc * p.line.quantity}`
                  : undefined,
        })),
        { id: 'coins', label: 'Coins', value: `${derived.coins.left} c` },
        {
          id: 'enc',
          label: <Term abbr="ENC" />,
          value: `${derived.encumbrance.carried} / ${derived.encumbrance.limit ?? dash}`,
          from: `hard cap ${derived.encumbrance.hardCap ?? dash}`,
        },
      ],
    },
    ...(derived.effects.length
      ? [
          {
            title: 'Standing modifiers',
            fields: derived.effects.map((e) => ({
              id: `effect:${e.id}`,
              label: 'While worn',
              value: e.label,
              from: <CiteChip cite={e.cite} quote={e.detail} />,
              wide: true,
            })),
          },
        ]
      : []),
    ...(derived.background
      ? [
          {
            title: 'Background',
            cite: derived.background.cite,
            fields: [
              {
                id: 'background',
                label: `${derived.background.number}.`,
                value: derived.background.name,
                from: derived.background.text,
                wide: true,
              },
            ],
          },
        ]
      : []),
  ];

  const allFields = groups.flatMap((g) => g.fields);
  const copied = allFields.filter((f) => state.copied[f.id]).length;

  return (
    <div className="cc-body">
      {missing.length > 0 && derived.todo.length === 0 && (
        <Note tone="warn">
          Still open:{' '}
          {missing.map((s, i) => (
            <span key={s.id}>
              {i > 0 && ', '}
              <button type="button" className="link" onClick={() => goTo(s.id)}>
                {s.label}
              </button>
            </span>
          ))}
          . The sheet shows what is known so far.
        </Note>
      )}
      {derived.warnings.length > 0 && (
        <Block title="Check before you write" className="warn">
          <ul className="cc-list">
            {derived.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </Block>
      )}

      <div className="cc-copybar" role="group" aria-label="Copy progress">
        <span className="cc-copybar-text">
          Tap each field as you write it on the printed sheet. <b>{copied}</b> of {allFields.length}{' '}
          copied.
        </span>
        <span className="cc-copybar-bar" aria-hidden="true">
          <span
            className="cc-copybar-fill"
            style={{ width: `${allFields.length ? (copied / allFields.length) * 100 : 0}%` }}
          />
        </span>
        <button
          type="button"
          className="link"
          onClick={() => dispatch({ type: 'clear_copied' })}
          disabled={copied === 0}
        >
          Clear ticks
        </button>
        <button type="button" className="link" onClick={() => window.print()}>
          Print
        </button>
      </div>

      {groups.map((group, gi) => (
        <section
          key={gi}
          className="cc-sheetgroup"
          aria-label={typeof group.title === 'string' ? group.title : undefined}
        >
          <h3 className="cc-sheetgroup-title">
            {group.title}
            {group.cite && <CiteChip cite={group.cite} />}
          </h3>
          <div className="cc-fields">
            {group.fields.map((field) => {
              const done = Boolean(state.copied[field.id]);
              return (
                <button
                  key={field.id}
                  type="button"
                  className={`cc-field-tile${done ? ' done' : ''}${field.wide ? ' wide' : ''}`}
                  aria-pressed={done}
                  onClick={() => dispatch({ type: 'toggle_copied', field: field.id })}
                >
                  <span className="cc-field-k">{field.label}</span>
                  <span className="cc-field-v">{field.value}</span>
                  {field.from && <span className="cc-field-from">{field.from}</span>}
                  <span className="cc-field-tick" aria-hidden="true">
                    {done ? '✓' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <Block
        title="Start playing or make more characters"
        cite={CITES.startPlaying}
        quote={PARTY.repeatText}
      >
        <Quote text={PARTY.repeatText} cite={CITES.startPlaying} />
        <p className="cc-small muted">
          {partyDerived.heroesComplete} of {party.heroes.length} sheet
          {party.heroes.length === 1 ? '' : 's'} complete; Party Morale so far{' '}
          <b>{partyDerived.morale}</b>. {PARTY.designedSizeText}{' '}
          <CiteChip cite={CITES.partySize} quote={PARTY.designedSizeText} />
        </p>
        <div className="cc-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => dispatch({ type: 'hero_new' })}
          >
            Make another hero
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              const result = sendPartyToTable(party);
              const parts = [
                result.added.length ? `added ${result.added.join(', ')}` : '',
                result.updated.length ? `updated ${result.updated.join(', ')}` : '',
              ].filter(Boolean);
              setSent(
                parts.length
                  ? `Game master’s table: ${parts.join('; ')}.`
                  : 'Nothing to send yet: roll RES first.',
              );
            }}
          >
            Send the party to the Game master’s table
          </button>
          <Link to="/gm" className="link">
            Open the table
          </Link>
        </div>
        {sent && <Note tone="done">{sent}</Note>}
        <p className="hint">
          The table takes each hero’s name, RES, Night Vision and starting Sanity; a hero already
          there by the same name is updated.
        </p>
      </Block>

      <Block
        title="Embarking on your first quest"
        cite={CITES.embarking}
        quote={PARTY.startSettlementText}
      >
        <Quote text={PARTY.startSettlementText} cite={CITES.embarking} />
        <Note tone="gap">{GAPS.startSettlementDie}</Note>
        <div className="cc-two-up">
          <ol className="cc-rows">
            {START_SETTLEMENTS.map((s) => (
              <li key={s.rowId}>
                <button
                  type="button"
                  className={`cc-row tappable${party.startSettlement === s.number ? ' hit' : ''}`}
                  onClick={() =>
                    dispatch({
                      type: 'set_start_settlement',
                      roll: party.startSettlement === s.number ? null : s.number,
                    })
                  }
                >
                  <span className="cc-row-roll">{s.number}</span>
                  <span className="cc-row-text">{s.name}</span>
                  {party.startSettlement === s.number && <Badge tone="gold">start here</Badge>}
                </button>
              </li>
            ))}
          </ol>
          <div>
            <DicePad
              dice="1d8"
              compact
              label="Roll over the list (1d8 matches eight entries)"
              onCommit={(roll) => dispatch({ type: 'set_start_settlement', roll })}
            />
            <p className="cc-small muted">
              {PARTY.firstQuestsText}{' '}
              <CiteChip cite={CITES.firstQuests} quote={PARTY.firstQuestsText} />
            </p>
          </div>
        </div>
      </Block>
    </div>
  );
}
