import { heroName } from '../engine.ts';
import { CITES, PARTY, PROFESSIONS, SPECIES } from '../rules.ts';
import { CiteChip, useCreator } from './common.tsx';

const R = 15;
const C = 2 * Math.PI * R;

/** A hero token: a completeness ring around the species and profession monogram. */
export function HeroMark({
  speciesId,
  professionId,
  done,
  total,
}: {
  speciesId: string | null;
  professionId: string | null;
  done: number;
  total: number;
}) {
  const pct = total === 0 ? 0 : done / total;
  const letters = `${SPECIES.find((s) => s.id === speciesId)?.name.slice(0, 1) ?? '·'}${PROFESSIONS.find((p) => p.id === professionId)?.name.slice(0, 1) ?? ''}`;
  return (
    <svg className="cc-mark" viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="18" r={R} fill="none" stroke="var(--line-strong)" strokeWidth="3" />
      <circle
        cx="18"
        cy="18"
        r={R}
        fill="none"
        stroke={pct >= 1 ? 'var(--jade)' : 'var(--gold)'}
        strokeWidth="3"
        strokeDasharray={`${C * pct} ${C * (1 - pct)}`}
        strokeLinecap="round"
        transform="rotate(-90 18 18)"
      />
      <text x="18" y="18" textAnchor="middle" dominantBaseline="central" className="cc-mark-text">
        {letters}
      </text>
    </svg>
  );
}

/**
 * The party down the side of the stage: one token per hero with how far their sheet has come,
 * the hero being built marked, and the Party Morale the book adds up from their RES.
 */
export function Roster() {
  const { party, partyDerived, state, dispatch } = useCreator();
  const stations = 8;
  return (
    <aside className="cc-roster" aria-label="Party">
      <span className="cc-roster-kicker">
        Party <CiteChip cite={CITES.partySize} quote={PARTY.designedSizeText} />
      </span>
      <ul className="cc-tokens">
        {partyDerived.heroes.map(({ hero, derived }, i) => {
          const done = Object.entries(derived.complete).filter(
            ([id, ok]) => id !== 'sheet' && ok,
          ).length;
          const current = hero.id === state.id;
          return (
            <li key={hero.id}>
              <button
                type="button"
                className={`cc-token${current ? ' current' : ''}${derived.complete.sheet ? ' done' : ''}`}
                aria-current={current ? 'true' : undefined}
                onClick={() => dispatch({ type: 'hero_select', id: hero.id })}
                aria-label={`${heroName(hero, party)}, ${derived.species?.name ?? 'no species'} ${derived.profession?.name ?? ''}, ${done} of ${stations} stations done${current ? ', being built' : ''}`}
              >
                <HeroMark
                  speciesId={hero.species}
                  professionId={hero.profession}
                  done={done}
                  total={stations}
                />
                <span className="cc-token-text">
                  <span className="cc-token-name">{heroName(hero, party)}</span>
                  <span className="cc-token-sub">
                    {derived.species?.name ?? `Hero ${i + 1}`}
                    {derived.profession ? ` ${derived.profession.name}` : ''}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            className="cc-token add"
            onClick={() => dispatch({ type: 'hero_new' })}
          >
            + Another hero
          </button>
        </li>
      </ul>
      <div className="cc-roster-morale">
        <span className="cc-roster-kicker">
          Party Morale{' '}
          <CiteChip
            cite={CITES.partyMorale}
            quote="To calculate the Party Morale (PM) you divide your RES by 10 and then drop the decimal. When all characters have done the same, you add it together to get your PM."
          />
        </span>
        <span className="cc-roster-big">{partyDerived.morale}</span>
        <span className="cc-roster-sub">
          {partyDerived.moraleParts.map((p) => `${p.name} ${p.amount ?? '?'}`).join(' + ') ||
            'Roll RES first'}
          {partyDerived.moraleNotes.length > 0 &&
            ` · ${partyDerived.moraleNotes.map((n) => `${n.amount > 0 ? '+' : ''}${n.amount} ${n.source}`).join(', ')}`}
        </span>
        <span className="cc-roster-sub">
          {partyDerived.heroesComplete} of {party.heroes.length} sheet
          {party.heroes.length === 1 ? '' : 's'} complete · designed for {PARTY.designedSize}
        </span>
      </div>
    </aside>
  );
}
