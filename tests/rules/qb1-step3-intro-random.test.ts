import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';

const corpus = readPilot();
const rule = (id: string) => {
  const found = corpus.rules.find((x) => x.id === id);
  if (!found) throw new Error(`missing ${id}`);
  return found;
};
const procedure = (id: string) => {
  const found = corpus.procedures.find((x) => x.id === id);
  if (!found) throw new Error(`missing ${id}`);
  return found;
};

// Verbatim passages from rendered PDF 222 (printed 220), 223 (221) and 243 (241).
const page222 = [
  'Welcome to Quest Book I. In this book, there are two campaigns and several individual quests grouped together based on which objective room is used. In Quest Book II, there are more campaigns and individual quests, and most importantly, tables to randomize which individual quest to play.',
  'Within each quest there are border lines dividing the information. Do not read further than the first border line, or you will encounter spoilers. Once you reach the Quest Room, you may read until the second line and, once the quest is complete, you can read the last part. In some cases, the aftermath includes some findings, such as treasure chests found by the party. These may be in excess of those drawn on the tiles, and everything found in the aftermath can be looted ‘off table’, with no traps or locks. Individual quests can generally be played several times with the same party.',
  'Some quests will say that when the Threat Level reaches ‘XX’, a Wandering Monster appears. This happens every time the Threat Level is increased to XX and the Threat Level is not decreased when the Wandering Monster is placed.',
  'Ex: Quest 1 dictates a Wandering Monster appears when the Threat Level reaches 12. The Wandering Monster is placed, and later the Threat Level is increased more and then reduced back to 12 again. This time no monster is placed since the Threat Level was decreased to 12. If the Threat Level decreases below 12 and then increases again back up to 12, a Wandering Monster will appear.',
].join(' ');
const page223 = [
  'The heroes have travelled for days and are finally nearing their destination in the village. After so long on the road, the idea of sleeping in a real bed at the inn is alluring. However, with the sun setting you realise you must spend one more night out in the open. You find a suitable spot and make camp. You take turns keeping watch, and as usual, nothing much happens during the night. Just before dawn though, the hero on watch suddenly snaps to high alert at the faint sound of stealthy footsteps. Realising the potential peril, they quickly try to wake the rest of the party. As they fumble to rise, a gang of bandits charges out of the darkness.',
  'The party has been attacked by three bandits and one bandit leader. The bandit leader is equipped with a longsword, a shield, and has armour 1. Two bandits are armed with shortswords and have armour 0. One bandit is armed with a shortbow, dagger, and has armour 0. Locate the corresponding monster cards and monster equipment cards and combine them to represent the above-mentioned adversaries. Use four wilderness outdoor tiles (open ground tiles) and place the heroes in the centre, adjacent to each other. Then randomise which board edge each bandit approaches from, placing them 1d10 squares from the edge.',
  'The bandits gain +2 initiative tokens on the first turn as they surprise the sleeping heroes. Due to the darkness, no one can see or shoot further than 10 squares. The Scenario die is not used.',
  'With the bandits dead, the party decides to gather their gear and continue their travel. They arrive at the settlement without further issues. Head to the settlement chapter and start by rolling for a settlement event. Then decide where this adventure will take your heroes!',
].join(' ');
const page243 =
  'To embark on a Random Quest, you must first roll on the table below to determine the Objective Room. Once that is determined, consult the corresponding chapter and roll which quest to embark upon. These quests can be played over and over as the layout of the dungeons shifts and the difficulty increases as the heroes gain levels. 1d6 Objective room 1 The Lava River 2 The Bandits’ Hideout 3 The Fountain Room 4 The Great Crypt 5 The Chamber of Reverence 6 Roll Again';

const pageText: Record<number, string> = { 222: page222, 223: page223, 243: page243 };
const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
const expectVerbatim = (text: string | undefined, page: number) => {
  expect(text).toBeDefined();
  for (const part of norm(text ?? '').split(' ... ')) expect(pageText[page]).toContain(part);
};

const ruleIds = corpus.rules
  .filter((x) => x.id.startsWith('core.quest_book.') || x.id.startsWith('core.quest.first_blood.'))
  .map((x) => x.id);

describe('Quest Book I introduction, First Blood and Random Quests — verbatim quotations', () => {
  it.each(ruleIds)('%s quotes its page verbatim under a printed heading', (id) => {
    const r = rule(id);
    const page = r.source[0]?.pdf_page ?? 0;
    expectVerbatim(r.source_text, page);
    const printed = [
      'Introduction',
      'Reading the Quests',
      'Triggering Wandering Monsters',
      'Setup',
      'Special rules',
      'Aftermath',
      'Random Quests',
    ];
    expect(printed).toContain(r.source[0]?.heading);
  });

  it.each([
    ['procedure.quest_reading_and_events', 222],
    ['procedure.first_blood', 223],
    ['procedure.random_quest_selection', 243],
  ] as const)('%s quotes the page at procedure and step level', (id, page) => {
    const p = procedure(id);
    expectVerbatim(p.source_text, page);
    const steps = p.steps.flatMap((s) => [s, ...(s.substeps ?? [])]);
    for (const step of steps) expectVerbatim(step.source_text, page);
  });

  it('cites the Triggering Wandering Monsters subheading under Reading the Quests', () => {
    for (const id of [
      'core.quest_book.threat_threshold_monster',
      'core.quest_book.threat_threshold_monster_otherwise',
    ]) {
      expect(rule(id).section_id).toBe('section.quest_book_i.introduction.reading_the_quests');
      expect(rule(id).source[0]).toMatchObject({
        pdf_page: 222,
        heading: 'Triggering Wandering Monsters',
      });
    }
    const examples = corpus.testCases.filter((x) => x.id.startsWith('test.quest_book.threat_'));
    expect(examples).toHaveLength(3);
    for (const ex of examples) {
      expect(ex.section_id).toBe('section.quest_book_i.introduction.reading_the_quests');
      expectVerbatim(ex.source_text, 222);
    }
  });

  it('keeps the Random Quests selector header and Roll Again on 6', () => {
    const t = corpus.tables.find((x) => x.id === 'table.quest.random_quests.objective_room');
    expect(t).toMatchObject({ source_text: '1d6 Objective room' });
    expect(t?.rows.at(-1)?.cells.objective_room?.printed).toBe('Roll Again');
  });

  it('keeps the First Blood quest entity quoting its opening', () => {
    const quest = corpus.entities.find((x) => x.id === 'quest.first_blood');
    expect(quest?.source[0]?.heading).toBe('First Blood – Introductory quest');
    expectVerbatim(quest?.source_text, 223);
  });
});
