import { useId } from 'react';
import {
  CITES,
  GAPS,
  QUOTES,
  SPECIES,
  STAT_KEYS,
  STAT_NAMES,
  TALENT_BY_ID,
  TALENT_CATEGORIES,
  type Species,
} from '../../rules.ts';
import { Block, CiteChip, Note, Quote, StatName, Term, Tile, useCreator } from '../common.tsx';

/** The highest base value printed for any species, so the silhouettes share one scale. */
const SCALE = Math.max(...SPECIES.flatMap((s) => STAT_KEYS.map((k) => s.base[k])));

/** Five bars, one per stat: the shape of a species at a glance. */
function Silhouette({ species }: { species: Species }) {
  return (
    <span className="cc-silhouette" aria-hidden="true">
      {STAT_KEYS.map((key) => (
        <span
          key={key}
          className="cc-silhouette-bar"
          style={{ height: `${(species.base[key] / SCALE) * 100}%` }}
          title={`${STAT_NAMES[key].abbr} ${species.base[key]}+1d10`}
        />
      ))}
    </span>
  );
}

export function SpeciesStation() {
  const { state, derived, dispatch } = useCreator();
  const nameId = useId();
  const species = derived.species;
  return (
    <div className="cc-body">
      <Quote
        text="The first step in creating your character is to choose your species. The four species and their corresponding stats can be seen on the following pages."
        cite={CITES.speciesFirst}
      />

      <div className="cc-species" role="radiogroup" aria-label="Species" id="todo:species">
        {SPECIES.map((s) => (
          <Tile
            key={s.id}
            className="cc-species-tile"
            selected={state.species === s.id}
            onClick={() => dispatch({ type: 'set_species', species: s.id })}
          >
            <span className="cc-tile-head">
              <span className="cc-tile-title">{s.name}</span>
              <CiteChip cite={s.cite} />
            </span>
            <Silhouette species={s} />
            <span className="cc-species-stats">
              {STAT_KEYS.map((key) => (
                <span key={key}>
                  <small>{STAT_NAMES[key].abbr}</small>
                  {s.base[key]}
                </span>
              ))}
              <span>
                <small>HP</small>
                {s.hitPointsPrinted}
              </span>
            </span>
            <span className="cc-tile-line">
              {s.traits.length
                ? s.traits.map((t) => t.label).join(' · ')
                : 'Jack of all trades: a random talent'}
            </span>
            {s.limitations.map((line) => (
              <span key={line} className="cc-tile-line muted">
                {line}
              </span>
            ))}
            {s.special && <span className="cc-tile-line muted">{s.special}</span>}
          </Tile>
        ))}
      </div>
      <p className="hint">
        Each stat is the printed base plus 1d10; the bars compare the bases. Tap a stat name to read
        what it does:{' '}
        {STAT_KEYS.map((key, i) => (
          <span key={key}>
            {i > 0 && ' · '}
            <StatName stat={key} />
          </span>
        ))}
      </p>

      <Block title="Name" id="name" className="cc-block-inline">
        <label htmlFor={nameId} className="sr-only">
          Hero’s name
        </label>
        <input
          id={nameId}
          className="cc-name-input"
          type="text"
          value={state.name}
          placeholder="What are they called? (optional)"
          onChange={(event) => dispatch({ type: 'set_name', name: event.target.value })}
        />
      </Block>

      {species && (
        <Block
          title={`${species.name} traits`}
          cite={CITES.traitsAreTalents}
          quote="Each species is different and starts with different traits. Traits are basically talents, but they are tied to a species. Mark them down under Talents on your Character Sheet."
        >
          <Note>
            <Term abbr="Trait">Traits</Term> are talents tied to the species: write them under
            Talents on the sheet.
          </Note>
          {species.traits.length === 0 && (
            <Note tone="gap">
              {QUOTES.jackOfAllTrades} The random talent is rolled at the Powers station, once the
              profession is known, so that “Rangers only” and similar restrictions can be checked.
            </Note>
          )}
          <ul className="cc-list">
            {species.traits.map((trait) => {
              const talent = TALENT_BY_ID.get(trait.talentId);
              return (
                <li key={trait.talentId}>
                  <strong>{trait.label}</strong>
                  {talent && (
                    <>
                      {' '}
                      <CiteChip
                        cite={TALENT_CATEGORIES[talent.category].cite}
                        quote={talent.text}
                        label={`${TALENT_CATEGORIES[talent.category].label} talent`}
                      />
                      <span className="cc-small block">{talent.text}</span>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="cc-small muted">
            Stat maxima for a {species.name} when levelling up:{' '}
            {STAT_KEYS.map((key) => `${STAT_NAMES[key].abbr} ${species.maxima[key]}`).join(', ')}{' '}
            <CiteChip cite={CITES.statMaxima} />. {GAPS.statMaxima}
          </p>
        </Block>
      )}
    </div>
  );
}
