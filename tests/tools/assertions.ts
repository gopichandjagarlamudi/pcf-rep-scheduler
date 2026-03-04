import { ScheduleEntry, ScheduleStats } from '../../types';
import { AssertionRule, NumericOperator, RuleEvaluation } from '../cases/types';

export interface RuleContext {
  mapped: {
    reps: any[];
    locations: any[];
    availability: any[];
    timeoff: any[];
  };
  schedule: ScheduleEntry[];
  stats: ScheduleStats;
}

function compareNumeric(actual: number, expected: number, op: NumericOperator): boolean {
  if (op === 'eq') return actual === expected;
  if (op === 'gte') return actual >= expected;
  return actual <= expected;
}

function compareToString(op: NumericOperator, value: number): string {
  if (op === 'eq') return `== ${value}`;
  if (op === 'gte') return `>= ${value}`;
  return `<= ${value}`;
}

function getRepHours(stats: ScheduleStats, repId: string): number {
  const matches = stats.repStats.filter((repStat) => String(repStat.rep_id) === String(repId));
  if (matches.length === 0) {
    return 0;
  }
  return Math.max(...matches.map((repStat) => repStat.totalHours));
}

function evaluateNumericRule(actual: number, rule: AssertionRule, label: string): RuleEvaluation {
  const expected = rule.value ?? 0;
  const op = rule.op ?? 'eq';
  const passed = compareNumeric(actual, expected, op);
  return {
    ruleId: rule.id,
    passed,
    message: `${rule.description} (${label})`,
    expected: compareToString(op, expected),
    actual: String(actual),
  };
}

export function evaluateRule(rule: AssertionRule, ctx: RuleContext): RuleEvaluation {
  switch (rule.kind) {
    case 'mapped_reps_count':
      return evaluateNumericRule(ctx.mapped.reps.length, rule, 'mapped reps');
    case 'mapped_locations_count':
      return evaluateNumericRule(ctx.mapped.locations.length, rule, 'mapped locations');
    case 'mapped_availability_count':
      return evaluateNumericRule(ctx.mapped.availability.length, rule, 'mapped availability');
    case 'mapped_timeoff_count':
      return evaluateNumericRule(ctx.mapped.timeoff.length, rule, 'mapped timeoff');
    case 'schedule_shift_count':
      return evaluateNumericRule(ctx.schedule.length, rule, 'schedule shifts');
    case 'rep_stats_count':
      return evaluateNumericRule(ctx.stats.repStats.length, rule, 'rep stats count');
    case 'stat_overflow_count':
      return evaluateNumericRule(ctx.stats.overflowDays.length, rule, 'overflow day count');
    case 'stat_unassigned_count':
      return evaluateNumericRule(ctx.stats.unassignedDays.length, rule, 'unassigned day count');
    case 'stat_hourgap_count':
      return evaluateNumericRule(ctx.stats.hourGaps.length, rule, 'hour gap count');
    case 'rep_hours_at_least': {
      const repId = rule.repId ?? '';
      const actualHours = getRepHours(ctx.stats, repId);
      return evaluateNumericRule(actualHours, { ...rule, op: 'gte' }, `hours for rep ${repId}`);
    }
    case 'rep_hours_at_most': {
      const repId = rule.repId ?? '';
      const actualHours = getRepHours(ctx.stats, repId);
      return evaluateNumericRule(actualHours, { ...rule, op: 'lte' }, `hours for rep ${repId}`);
    }
    case 'inactive_rep_not_scheduled': {
      const repId = rule.repId ?? '';
      const hasAssignment = ctx.schedule.some((entry) => String(entry.rep_id) === String(repId));
      return {
        ruleId: rule.id,
        passed: !hasAssignment,
        message: `${rule.description} (rep ${repId})`,
        expected: 'no assignments',
        actual: hasAssignment ? 'assigned' : 'not assigned',
      };
    }
    case 'timeoff_blocked': {
      const repId = rule.repId ?? '';
      const date = rule.date ?? '';
      const blocked = !ctx.schedule.some(
        (entry) => String(entry.rep_id) === String(repId) && entry.date === date
      );
      return {
        ruleId: rule.id,
        passed: blocked,
        message: `${rule.description} (rep ${repId} on ${date})`,
        expected: 'no assignment on timeoff date',
        actual: blocked ? 'blocked' : 'assignment present',
      };
    }
    case 'hourgap_for_rep': {
      const repName = rule.repName ?? '';
      const exists = ctx.stats.hourGaps.some((gap) => gap.rep_name === repName);
      return {
        ruleId: rule.id,
        passed: exists,
        message: `${rule.description} (${repName})`,
        expected: 'rep present in hour gap report',
        actual: exists ? 'present' : 'missing',
      };
    }
    default:
      return {
        ruleId: rule.id,
        passed: false,
        message: `${rule.description} (unsupported rule kind)` ,
        expected: rule.kind,
        actual: 'unsupported',
      };
  }
}
