/** Types mirror the strict pilot schemas. Read YAML only after schema validation. */
export type Scalar = string | number | boolean;
export interface Dice {
  count: number;
  sides: number;
  modifier?: number;
}
export type State = Record<string, Scalar>;
export interface PilotSource {
  document: string;
  file: string;
  pdf_page: number;
  printed_page: number | null;
  heading: string;
}
export interface Metadata {
  id: string;
  name: string;
  section_id: string;
  source: PilotSource[];
  status: 'extracted' | 'reviewed';
  confidence: 'high' | 'medium' | 'low';
  source_text: string;
  see_also?: string[];
  unresolved_references?: string[];
  issues?: string[];
}
export type Operand =
  | { type: 'literal'; value: Scalar }
  | { type: 'field'; name: string }
  | { type: 'sum'; values: Operand[] }
  | {
      type: 'arithmetic';
      operator: 'subtract' | 'multiply' | 'divide' | 'floor' | 'ceil' | 'abs' | 'min' | 'max';
      values: Operand[];
    };
export type Condition =
  | {
      type: 'compare';
      operator: 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte';
      left: Operand;
      right: Operand;
    }
  | { type: 'all' | 'any'; conditions: Condition[] }
  | { type: 'not'; condition: Condition };
export interface Range {
  min: number;
  max: number;
}
export type Effect =
  | { type: 'set'; target: string; value: Operand }
  | {
      type: 'add';
      target: string;
      value: Operand;
      duration:
        | 'permanent'
        | 'check'
        | 'immediate'
        | 'first_round_of_battle'
        | 'turn'
        | 'battle'
        | 'quest'
        | 'until_dungeon_exit'
        | 'while_condition';
    }
  | { type: 'require'; condition: Condition }
  | {
      type: 'lookup';
      table_id: string;
      key_column: string;
      key: Operand;
      value_column: string;
      target: string;
      on_missing_issue: string;
    }
  | { type: 'unresolved'; issue_id: string }
  | { type: 'invoke' | 'ignore'; dependency: string }
  | { type: 'replace_range'; dependency: string; range: Range }
  | { type: 'draw_cards'; pool: 'current_tier' | 'higher_tier'; count: number }
  | { type: 'select_card'; choice: Operand; options: Operand[]; keep: 1 }
  | {
      type: 'choice';
      selection: string;
      options: Array<{ id: string; when?: Condition; effects: Effect[] }>;
    };
export type Fields = Record<
  string,
  {
    type: 'number' | 'boolean' | 'string';
    role: 'input' | 'output' | 'state';
    description: string;
    integer?: true;
    minimum?: number;
    maximum?: number;
    dice?: Dice;
  }
>;
export interface Dependency {
  key: string;
  label: string;
  section_id?: string;
  object_id?: string;
  external_document?: string;
}
export interface Rule extends Metadata {
  type: string;
  scope: string;
  entity_id?: string;
  quest_id?: string;
  applies_to?: 'all_heroes';
  fields: Fields;
  when?: Condition;
  effects: Effect[];
  dependencies?: Dependency[];
  overrides?: string[];
  alternatives?: Array<{ label: string; effects: Effect[] }>;
  uses_tables?: string[];
  term_refs?: string[];
  timing_refs?: string[];
  duration?: 'current_quest' | 'until_dungeon_exit' | 'while_condition';
  optional_system?:
    'encumbrance' | 'party_morale' | 'durability' | 'sanity' | 'scenario_and_threat';
  usage_limits?: Array<{
    count: number;
    window: 'between_settlement_visits';
    subject: string;
    aggregation_issue?: string;
  }>;
}
export type Cell =
  | { type: 'text'; printed: string }
  | {
      type: 'number';
      printed: string;
      value: number;
      meaning: 'value' | 'increase' | 'modifier' | 'initial';
    }
  | {
      type: 'dice';
      printed: string;
      dice: Dice;
      meaning: 'increase' | 'loss' | 'roll' | 'initial' | 'value';
    }
  | { type: 'range'; printed: string; min: number; max: number }
  | { type: 'blank'; printed: '' }
  | { type: 'marker'; printed: '-' | 'N/A'; meaning: 'no_increase' | 'unavailable' };
export interface Table extends Metadata {
  type: string;
  completeness: 'complete' | 'partial';
  selection?: string[];
  columns: Array<{ id: string; label: string; cell_types: Cell['type'][] }>;
  rows: Array<{
    id: string;
    source_row: string;
    cells: Record<string, Cell>;
    rule_refs?: string[];
    source?: PilotSource[];
  }>;
  roll_domain?: Range;
  footnotes: string[];
}
export interface Entity extends Metadata {
  type: 'profession' | 'talent' | 'condition' | 'species' | 'background' | 'quest' | 'perk';
  rules: string[];
  tables: string[];
  background_number?: number;
  quest_id?: string;
  table_rows?: Array<{ table_id: string; row_id: string }>;
  initial_hit_points?: { printed: string; dice: Dice };
  talent_selection?: { selection: 'random'; category_selection: 'choice'; quantity: 1 };
  grant_choices?: Array<{ quantity: number; options: NonNullable<Entity['grants']> }>;
  starting_abilities?: Array<{
    kind: 'spell' | 'prayer' | 'perk';
    selection: 'choice';
    quantity: number;
    level?: number;
    category?: string;
    section_id: string;
    printed_reference: string;
  }>;
  grants?: Array<{
    kind: 'talent' | 'perk';
    label: string;
    object_id?: string;
    section_id?: string;
    printed_reference: string;
    qualifier?: string;
  }>;
  starting_equipment?: Array<{
    label: string;
    quantity: number;
    selection: 'fixed' | 'choice' | 'random';
    qualifier?: string;
    object_id?: string;
    section_id?: string;
    options?: Array<{ label: string; object_id?: string }>;
  }>;
  category?: string;
  activation?: 'passive' | 'active';
  activation_cost?: {
    energy: number;
    action_points: number;
    energy_selection?: 'fixed' | 'variable';
  };
}
export interface Step {
  id: string;
  source_text: string;
  source?: PilotSource[];
  when?: Condition;
  effects: Effect[];
  substeps?: Step[];
  rule_refs?: string[];
}
export interface Procedure extends Metadata {
  fields: Fields;
  dependencies: Dependency[];
  steps: Step[];
  entry_step: string;
  exit_step: string;
}
export interface StateMachineEnter {
  label: string;
  section_id?: string;
  object_id?: string;
  source_text?: string;
}
export interface StateMachineTransition {
  event: string;
  to: string;
  source_text: string;
  source?: PilotSource[];
}
export interface StateMachineState {
  id: string;
  source_text?: string;
  terminal?: boolean;
  enter?: StateMachineEnter[];
  transitions?: StateMachineTransition[];
}
export interface StateMachine extends Metadata {
  initial: string;
  states: StateMachineState[];
}
export type Event =
  | { type: 'require'; satisfied: boolean }
  | { type: 'invoke' | 'ignore'; dependency: string }
  | { type: 'replace_range'; dependency: string; range: Range }
  | { type: 'draw_cards'; pool: 'current_tier' | 'higher_tier'; count: number }
  | { type: 'select_card'; choice: Scalar; keep: 1 };
export interface Result {
  state: State;
  events: Event[];
  trace: string[];
  unresolved: string[];
  steps: string[];
}
export interface TestCase extends Metadata {
  kind: 'source_example' | 'derived_case';
  rule_ids?: string[];
  procedure_id?: string;
  inputs: State;
  expected: Result;
}
export interface Pilot {
  rules: Rule[];
  entities: Entity[];
  tables: Table[];
  procedures: Procedure[];
  stateMachines: StateMachine[];
  testCases: TestCase[];
}
