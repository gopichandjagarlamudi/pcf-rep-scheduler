import { describe, expect, it } from 'vitest';
import { uploadCases } from '../cases/manifest';
import { AssertionRule } from '../cases/types';
import { loadCaseData } from '../tools/load-case';

function assertMappedRule(rule: AssertionRule, mapped: { reps: any[]; locations: any[]; availability: any[]; timeoff: any[] }): void {
  const op = rule.op ?? 'eq';
  const expected = rule.value ?? 0;

  let actual = 0;
  switch (rule.kind) {
    case 'mapped_reps_count':
      actual = mapped.reps.length;
      break;
    case 'mapped_locations_count':
      actual = mapped.locations.length;
      break;
    case 'mapped_availability_count':
      actual = mapped.availability.length;
      break;
    case 'mapped_timeoff_count':
      actual = mapped.timeoff.length;
      break;
    default:
      throw new Error(`Non-mapped rule passed into mapping assertion: ${rule.kind}`);
  }

  if (op === 'eq') expect(actual, rule.description).toBe(expected);
  if (op === 'gte') expect(actual, rule.description).toBeGreaterThanOrEqual(expected);
  if (op === 'lte') expect(actual, rule.description).toBeLessThanOrEqual(expected);
}

describe('CSV mapping coverage', () => {
  for (const testCase of uploadCases) {
    it(`[case:${testCase.id}] maps uploaded data for ${testCase.title}`, () => {
      const loaded = loadCaseData(testCase.id);
      const mappingRules = testCase.expected.rules.filter((rule) => rule.kind.startsWith('mapped_'));

      for (const rule of mappingRules) {
        assertMappedRule(rule, loaded.mapped);
      }

      // Every fixture should at least load its required files without throwing.
      expect(Array.isArray(loaded.raw.reps)).toBe(true);
      expect(Array.isArray(loaded.raw.locations)).toBe(true);
    });
  }
});
