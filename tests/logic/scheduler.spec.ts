import { describe, expect, it } from 'vitest';
import { generateSchedule } from '../../utils/scheduler';
import { uploadCases } from '../cases/manifest';
import { evaluateRule } from '../tools/assertions';
import { loadCaseData } from '../tools/load-case';

describe('Scheduler output coverage', () => {
  for (const testCase of uploadCases) {
    it(`[case:${testCase.id}] evaluates scheduler expectations for ${testCase.title}`, () => {
      const loaded = loadCaseData(testCase.id);

      const result = generateSchedule(
        loaded.mapped.reps,
        loaded.mapped.locations,
        loaded.mapped.availability,
        loaded.mapped.timeoff,
        loaded.startDate,
        loaded.endDate
      );

      const schedulerRules = testCase.expected.rules.filter((rule) => !rule.kind.startsWith('mapped_'));
      for (const rule of schedulerRules) {
        const evaluation = evaluateRule(rule, {
          mapped: loaded.mapped,
          schedule: result.schedule,
          stats: result.stats,
        });

        expect(
          evaluation.passed,
          `${evaluation.message}. expected=${evaluation.expected ?? '-'} actual=${evaluation.actual ?? '-'}`
        ).toBe(true);
      }
    });
  }
});
