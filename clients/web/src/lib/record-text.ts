export type Block = { kind: 'text'; lines: string[] } | { kind: 'table'; rows: string[][] };

/**
 * Splits record text into prose and tables. Table records are serialized one row per line
 * with ` | ` between cells (scripts/retrieve/documents.ts), header row first.
 */
export function textBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  for (const line of text.split('\n')) {
    const last = blocks.at(-1);
    if (line.includes(' | ')) {
      const cells = line.split(' | ').map((cell) => cell.trim());
      if (last?.kind === 'table' && last.rows[0]!.length === cells.length) last.rows.push(cells);
      else blocks.push({ kind: 'table', rows: [cells] });
    } else if (last?.kind === 'text') last.lines.push(line);
    else blocks.push({ kind: 'text', lines: [line] });
  }
  // A lone pipe line is prose that happens to contain ` | `, not a table.
  return blocks.map((block) =>
    block.kind === 'table' && block.rows.length < 2
      ? { kind: 'text', lines: [block.rows[0]!.join(' | ')] }
      : block,
  );
}
