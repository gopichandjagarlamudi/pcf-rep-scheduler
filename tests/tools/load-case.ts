import fs from 'node:fs';
import path from 'node:path';
import { mapDataToAvailability, mapDataToLocation, mapDataToRep, mapDataToTimeOff } from '../../utils/fileHelpers';
import { uploadCaseById } from '../cases/manifest';
import { UploadCase } from '../cases/types';
import { readCsvAsObjects } from './csv';

export interface LoadedCaseData {
  fixtureDir: string;
  testCase: UploadCase;
  raw: {
    reps: Record<string, unknown>[];
    locations: Record<string, unknown>[];
    availability: Record<string, unknown>[];
    timeoff: Record<string, unknown>[];
  };
  mapped: {
    reps: any[];
    locations: any[];
    availability: any[];
    timeoff: any[];
  };
  startDate: Date;
  endDate: Date;
}

function parseDate(input: string): Date {
  const [year, month, day] = input.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function getFixtureDir(caseId: string): string {
  return path.resolve(process.cwd(), 'tests/generated-fixtures', caseId);
}

export function assertFixtureExists(caseId: string): string {
  const fixtureDir = getFixtureDir(caseId);
  if (!fs.existsSync(fixtureDir)) {
    throw new Error(
      `Fixture directory missing for case ${caseId}: ${fixtureDir}. Run \"npm run test:fixtures\" first.`
    );
  }
  return fixtureDir;
}

export function loadCaseData(caseId: string): LoadedCaseData {
  const testCase = uploadCaseById.get(caseId);
  if (!testCase) {
    throw new Error(`Unknown case id: ${caseId}`);
  }

  const fixtureDir = assertFixtureExists(caseId);
  const repsPath = path.join(fixtureDir, 'reps.csv');
  const locationsPath = path.join(fixtureDir, 'locations.csv');
  const availabilityPath = path.join(fixtureDir, 'availability.csv');
  const timeoffPath = path.join(fixtureDir, 'timeoff.csv');

  const rawReps = readCsvAsObjects(repsPath);
  const rawLocations = readCsvAsObjects(locationsPath);
  const rawAvailability = readCsvAsObjects(availabilityPath);
  const rawTimeoff = readCsvAsObjects(timeoffPath);

  const mappedReps = mapDataToRep(rawReps as any[]);
  const mappedLocations = mapDataToLocation(rawLocations as any[]);
  const mappedAvailability = mapDataToAvailability(rawAvailability as any[]);
  const mappedTimeoff = mapDataToTimeOff(rawTimeoff as any[]);

  return {
    fixtureDir,
    testCase,
    raw: {
      reps: rawReps,
      locations: rawLocations,
      availability: rawAvailability,
      timeoff: rawTimeoff,
    },
    mapped: {
      reps: mappedReps,
      locations: mappedLocations,
      availability: mappedAvailability,
      timeoff: mappedTimeoff,
    },
    startDate: parseDate(testCase.startDate),
    endDate: parseDate(testCase.endDate),
  };
}
