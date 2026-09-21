/** Test-only interpreter for the pilot vocabulary. This is not a gameplay runtime. */
import type {
  Condition,
  Dependency,
  Effect,
  Fields,
  Operand,
  Pilot,
  Result,
  Scalar,
  State,
  Step,
  TestCase,
} from '../../scripts/validate/pilot-types.ts';

function number(value: Scalar): number {
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new Error('Expected finite number');
  return value;
}
export function evaluateOperand(operand: Operand, state: State): Scalar {
  switch (operand.type) {
    case 'literal':
      return operand.value;
    case 'field': {
      const value = state[operand.name];
      if (value === undefined) throw new Error(`Missing input ${operand.name}`);
      return value;
    }
    case 'sum':
      return operand.values.reduce((sum, value) => sum + number(evaluateOperand(value, state)), 0);
    case 'arithmetic': {
      const values = operand.values.map((v) => number(evaluateOperand(v, state)));
      const first = values[0];
      if (first === undefined) throw new Error('Arithmetic requires operands');
      const arity = ['floor', 'ceil', 'abs'].includes(operand.operator)
        ? 1
        : ['subtract', 'divide'].includes(operand.operator)
          ? 2
          : undefined;
      if (arity !== undefined && values.length !== arity)
        throw new Error('Arithmetic arity mismatch');
      let result: number;
      switch (operand.operator) {
        case 'subtract':
          result = first - values[1]!;
          break;
        case 'multiply':
          result = values.reduce((a, b) => a * b, 1);
          break;
        case 'divide':
          if (values[1] === 0) throw new Error('Division by zero');
          result = first / values[1]!;
          break;
        case 'floor':
          result = Math.floor(first);
          break;
        case 'ceil':
          result = Math.ceil(first);
          break;
        case 'abs':
          result = Math.abs(first);
          break;
        case 'min':
          result = Math.min(...values);
          break;
        case 'max':
          result = Math.max(...values);
          break;
        default:
          throw new Error('Unsupported arithmetic');
      }
      return number(result);
    }
    default:
      throw new Error('Unsupported operand');
  }
}
export function evaluateCondition(condition: Condition, state: State): boolean {
  switch (condition.type) {
    case 'all':
      return condition.conditions.every((c) => evaluateCondition(c, state));
    case 'any':
      return condition.conditions.some((c) => evaluateCondition(c, state));
    case 'not':
      return !evaluateCondition(condition.condition, state);
    case 'compare': {
      const left = evaluateOperand(condition.left, state);
      const right = evaluateOperand(condition.right, state);
      switch (condition.operator) {
        case 'eq':
          return left === right;
        case 'ne':
          return left !== right;
        case 'lt':
          return number(left) < number(right);
        case 'lte':
          return number(left) <= number(right);
        case 'gt':
          return number(left) > number(right);
        case 'gte':
          return number(left) >= number(right);
        default:
          throw new Error('Unsupported comparison');
      }
    }
    default:
      throw new Error('Unsupported condition');
  }
}
function apply(effects: Effect[], dependencies: Dependency[], result: Result, pilot: Pilot): void {
  const dependency = (key: string): string => {
    const found = dependencies.find((d) => d.key === key);
    if (!found) throw new Error(`Unknown dependency ${key}`);
    return found.object_id ?? found.label;
  };
  for (const effect of effects) {
    switch (effect.type) {
      case 'lookup': {
        const table = pilot.tables.find((t) => t.id === effect.table_id);
        if (!table) throw new Error('Unknown lookup table');
        const key = evaluateOperand(effect.key, result.state);
        const rows = table.rows.filter((row) => {
          const cell = row.cells[effect.key_column];
          return cell?.type === 'range'
            ? typeof key === 'number' && key >= cell.min && key <= cell.max
            : cell?.type === 'number'
              ? key === cell.value
              : cell?.type === 'text' && key === cell.printed;
        });
        if (rows.length === 0) {
          result.unresolved.push(effect.on_missing_issue);
          return;
        }
        if (rows.length !== 1) throw new Error('Ambiguous table lookup');
        const value = rows[0]!.cells[effect.value_column];
        if (value?.type !== 'number' && value?.type !== 'text')
          throw new Error('Unsupported lookup value');
        result.state[effect.target] = value.type === 'number' ? value.value : value.printed;
        break;
      }
      case 'set':
        result.state[effect.target] = evaluateOperand(effect.value, result.state);
        break;
      case 'add':
        result.state[effect.target] =
          number(evaluateOperand({ type: 'field', name: effect.target }, result.state)) +
          number(evaluateOperand(effect.value, result.state));
        break;
      case 'require': {
        const satisfied = evaluateCondition(effect.condition, result.state);
        result.events.push({ type: 'require', satisfied });
        if (!satisfied) return;
        break;
      }
      case 'unresolved':
        result.unresolved.push(effect.issue_id);
        return;
      case 'invoke':
      case 'ignore':
        result.events.push({ type: effect.type, dependency: dependency(effect.dependency) });
        break;
      case 'replace_range':
        result.events.push({
          type: 'replace_range',
          dependency: dependency(effect.dependency),
          range: effect.range,
        });
        break;
      case 'draw_cards':
        result.events.push({ ...effect });
        break;
      case 'select_card': {
        const chosen = evaluateOperand(effect.choice, result.state);
        if (!effect.options.some((option) => evaluateOperand(option, result.state) === chosen)) {
          throw new Error('Chosen card was not drawn');
        }
        result.events.push({ type: 'select_card', choice: chosen, keep: effect.keep });
        break;
      }
      case 'choice': {
        const selected = evaluateOperand({ type: 'field', name: effect.selection }, result.state);
        const option = effect.options.find((o) => o.id === selected);
        if (!option) throw new Error(`Unknown choice ${String(selected)}`);
        if (option.when && !evaluateCondition(option.when, result.state)) {
          result.events.push({ type: 'require', satisfied: false });
          return;
        }
        const unresolvedBefore = result.unresolved.length;
        apply(option.effects, dependencies, result, pilot);
        if (result.unresolved.length > unresolvedBefore) return;
        break;
      }
      default:
        throw new Error('Unsupported effect');
    }
  }
}
function assertInputs(fields: Fields, state: State): void {
  for (const [key, definition] of Object.entries(fields)) {
    const value = state[key];
    if (value !== undefined && typeof value !== definition.type)
      throw new Error(`Wrong input type ${key}`);
    if (
      typeof value === 'number' &&
      (!Number.isFinite(value) ||
        (definition.minimum !== undefined && value < definition.minimum) ||
        (definition.maximum !== undefined && value > definition.maximum) ||
        (definition.integer && !Number.isInteger(value)))
    )
      throw new Error(`Input out of range ${key}`);
  }
}
export function runCase(fixture: TestCase, pilot: Pilot): Result {
  const result: Result = {
    state: { ...fixture.inputs },
    events: [],
    trace: [],
    unresolved: [],
    steps: [],
  };
  function executeRules(ids: string[]): void {
    const rules = ids.map((id) => {
      const rule = pilot.rules.find((r) => r.id === id);
      if (!rule) throw new Error(`Unknown rule ${id}`);
      return rule;
    });
    for (const rule of rules) {
      assertInputs(rule.fields, result.state);
      if (rule.when && !evaluateCondition(rule.when, result.state)) continue;
      if (
        rules.some(
          (other) =>
            other.overrides?.includes(rule.id) &&
            (!other.when || evaluateCondition(other.when, result.state)),
        )
      )
        continue;
      result.trace.push(rule.id);
      const before = { state: { ...result.state }, events: [...result.events] };
      const unresolved = result.unresolved.length;
      apply(rule.effects, rule.dependencies ?? [], result, pilot);
      if (result.unresolved.length > unresolved) {
        result.state = before.state;
        result.events = before.events;
      }
    }
  }
  if (fixture.procedure_id) {
    const procedure = pilot.procedures.find((p) => p.id === fixture.procedure_id);
    if (!procedure) throw new Error('Unknown procedure');
    assertInputs(procedure.fields, result.state);
    result.trace.push(procedure.id);
    function walk(steps: Step[]): void {
      for (const step of steps) {
        if (step.when && !evaluateCondition(step.when, result.state)) continue;
        result.steps.push(step.id);
        executeRules(step.rule_refs ?? []);
        apply(step.effects, procedure?.dependencies ?? [], result, pilot);
        walk(step.substeps ?? []);
      }
    }
    walk(procedure.steps);
  } else executeRules(fixture.rule_ids ?? []);
  return result;
}
