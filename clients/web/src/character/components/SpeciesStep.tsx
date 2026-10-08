import { useId } from 'react';
import { CITES, QUOTES, SPECIES, STAT_KEYS, STAT_NAMES, TALENT_BY_ID } from '../rules.ts';
import { CiteChip, Note, Quote, Section, useCreator } from './common.tsx';

export function SpeciesStep() {
  const { state, dispatch } = useCreator();
  const nameId = useId();
  return (
    <>
      <Section title="Name" className="cc-name">
        <div className="cc-field">
          <label htmlFor={nameId}>Hero’s name</label>
          <input
            id={nameId}
            type="text"
            value={state.name}
            placeholder="Optional; the sheet shows it"
            onChange={(event) => dispatch({ type: 'set_name', name: event.target.value })}
          />
        </div>
      </Section>

      <Section title="Choose your species" cite={CITES.speciesFirst}>
        <Quote text="The first step in creating your character is to choose your species. The four species and their corresponding stats can be seen on the following pages." cite={CITES.speciesFirst} />
        <div className="cc-cards" role="radiogroup" aria-label="Species">
          {SPECIES.map((species) => {
            const selected = state.species === species.id;
            return (
              <div
                key={species.id}
                role="radio"
                tabIndex={0}
                aria-checked={selected}
                className={`cc-card${selected ? ' selected' : ''}`}
                onClick={() => dispatch({ type: 'set_species', species: species.id })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    dispatch({ type: 'set_species', species: species.id });
                  }
                }}
              >
                <span className="cc-card-head">
                  <span className="cc-card-title">{species.name}</span>
                  <CiteChip cite={species.cite} />
                </span>
                <table className="cc-mini-table">
                  <thead>
                    <tr>
                      {STAT_KEYS.map((key) => (
                        <th key={key} scope="col">
                          {STAT_NAMES[key].abbr}
                        </th>
                      ))}
                      <th scope="col">HP</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {STAT_KEYS.map((key) => (
                        <td key={key}>{species.base[key]}+1d10</td>
                      ))}
                      <td>{species.hitPointsPrinted}</td>
                    </tr>
                  </tbody>
                </table>
                <span className="cc-card-line">
                  <strong>Traits:</strong>{' '}
                  {species.traits.length ? species.traits.map((trait) => trait.label).join('; ') : QUOTES.jackOfAllTrades}
                </span>
                {species.limitations.map((line) => (
                  <span key={line} className="cc-card-line muted">
                    {line}
                  </span>
                ))}
                {species.special && <span className="cc-card-line muted">{species.special}</span>}
              </div>
            );
          })}
        </div>
        {state.species && <SpeciesDetail />}
      </Section>
    </>
  );
}

function SpeciesDetail() {
  const { derived } = useCreator();
  const species = derived.species!;
  return (
    <div className="cc-detail">
      <h3>
        {species.name} traits <CiteChip cite={CITES.traitsAreTalents} />
      </h3>
      <Note>Traits are basically talents, but they are tied to a species. Mark them down under Talents on the character sheet.</Note>
      {species.traits.length === 0 && (
        <Note tone="gap">
          Jack of all trades: the random talent is rolled in the Profession step, once the profession is known, so that “Rangers only” and similar restrictions can be checked.
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
                  <span className="muted">({talent.category} talent)</span>
                  <p className="cc-small">{talent.text}</p>
                </>
              )}
            </li>
          );
        })}
      </ul>
      <p className="cc-small">
        Stat maxima for a {species.name}: {STAT_KEYS.map((key) => `${STAT_NAMES[key].abbr} ${species.maxima[key]}`).join(', ')}{' '}
        <CiteChip cite={CITES.statMaxima} />
      </p>
    </div>
  );
}
