export type NumericOperator = 'eq' | 'gte' | 'lte';

export type RuleKind =
  | 'mapped_reps_count'
  | 'mapped_locations_count'
  | 'mapped_availability_count'
  | 'mapped_timeoff_count'
  | 'schedule_shift_count'
  | 'rep_stats_count'
  | 'stat_overflow_count'
  | 'stat_unassigned_count'
  | 'stat_hourgap_count'
  | 'inactive_rep_not_scheduled'
  | 'timeoff_blocked'
  | 'rep_hours_at_least'
  | 'rep_hours_at_most'
  | 'hourgap_for_rep';

export interface AssertionRule {
  id: string;
  description: string;
  kind: RuleKind;
  op?: NumericOperator;
  value?: number;
  repId?: string;
  repName?: string;
  date?: string;
}

export interface ExpectedOutcome {
  shouldGenerate: boolean;
  rules: AssertionRule[];
}

export type CsvCell = string | number;

export interface CsvTable {
  headers: string[];
  rows: CsvCell[][];
}

export interface FileSet {
  reps: CsvTable;
  locations: CsvTable;
  availability?: CsvTable;
  timeoff?: CsvTable;
}

export interface UploadCase {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  files: FileSet;
  expected: ExpectedOutcome;
  tags: string[];
}

export interface RuleEvaluation {
  ruleId: string;
  passed: boolean;
  message: string;
  expected?: string;
  actual?: string;
}

export interface CaseResult {
  caseId: string;
  title: string;
  suite: 'logic' | 'e2e';
  passed: boolean;
  durationMs: number;
  assertions: RuleEvaluation[];
  details: string[];
}
