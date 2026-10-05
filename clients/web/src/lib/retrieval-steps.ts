/**
 * Plain-language names for the retrieval steps recorded in an evidence item's `why`
 * (see scripts/ask/evidence.ts), for people reviewing records rather than reading code.
 */

const RELATIONS: Record<string, string> = {
  uses_table: 'a table another found record uses',
  depends_on: 'a rule another found record depends on',
  see_also: 'a cross-reference from another found record',
  step_rule: 'the rule behind a procedure step',
};

function listOf(items: string[]): string {
  return items.length < 2
    ? (items[0] ?? '')
    : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

function describe(step: string): string {
  const split = step.indexOf(':');
  const kind = split < 0 ? step : step.slice(0, split);
  const detail = split < 0 ? '' : step.slice(split + 1);
  switch (kind) {
    case 'entity':
      if (detail === 'alias') return 'The question names this entry';
      if (detail === 'model') return 'Jev chose this entry as the question’s subject';
      return `A ${detail === 'uses_table' ? 'table' : detail} of an entry the question names`;
    case 'systems':
      return `Keyword search in the ${listOf(detail.split('+').map((d) => d.replace(/_/g, ' ')))} chapters`;
    case 'search':
      return 'Keyword search across the rulebook';
    case 'heading':
      return 'The question names its rulebook heading';
    case 'section':
      return 'Shares a heading with a top search result';
    case 'expand':
      return `Linked: ${RELATIONS[detail] ?? detail.replace(/_/g, ' ')}`;
    case 'quest':
      return 'Search within the quest the question is about';
    case 'intent':
      return detail === 'definition'
        ? 'Glossary search for a definition question'
        : 'Table search for a value question';
    default:
      return step;
  }
}

/**
 * Distinct descriptions in first-seen order. Chapter searches from the two analyses (lexical
 * and Jev) merge into one line naming every chapter searched.
 */
export function describeRetrieval(why: readonly string[]): string[] {
  const chapters = [
    ...new Set(why.filter((w) => w.startsWith('systems:')).flatMap((w) => w.slice(8).split('+'))),
  ];
  const merged = why.map((w) => (w.startsWith('systems:') ? `systems:${chapters.join('+')}` : w));
  return [...new Set(merged.map(describe))];
}
