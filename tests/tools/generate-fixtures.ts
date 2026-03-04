import fs from 'node:fs';
import path from 'node:path';
import { uploadCases } from '../cases/manifest';
import { CsvCell, CsvTable } from '../cases/types';

const fixturesRoot = path.resolve(process.cwd(), 'tests/generated-fixtures');
const artifactsRawRoot = path.resolve(process.cwd(), 'tests/artifacts/raw');
const artifactsLatestRoot = path.resolve(process.cwd(), 'tests/artifacts/latest');

function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function escapeCsvCell(value: CsvCell): string {
  const raw = String(value);
  if (raw.includes(',') || raw.includes('"') || raw.includes('\n')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function toCsv(table: CsvTable): string {
  const headerRow = table.headers.map(escapeCsvCell).join(',');
  const dataRows = table.rows.map((row) => row.map(escapeCsvCell).join(','));
  return [headerRow, ...dataRows].join('\n');
}

function writeTable(caseDir: string, filename: string, table?: CsvTable): void {
  if (!table) {
    return;
  }
  const outputPath = path.join(caseDir, filename);
  fs.writeFileSync(outputPath, `${toCsv(table)}\n`, 'utf8');
}

function main(): void {
  fs.rmSync(fixturesRoot, { recursive: true, force: true });
  ensureDir(fixturesRoot);
  ensureDir(artifactsRawRoot);
  ensureDir(artifactsLatestRoot);

  const index = uploadCases.map((testCase) => ({
    id: testCase.id,
    title: testCase.title,
    description: testCase.description,
    startDate: testCase.startDate,
    endDate: testCase.endDate,
    tags: testCase.tags,
  }));

  for (const testCase of uploadCases) {
    const caseDir = path.join(fixturesRoot, testCase.id);
    ensureDir(caseDir);

    writeTable(caseDir, 'reps.csv', testCase.files.reps);
    writeTable(caseDir, 'locations.csv', testCase.files.locations);
    writeTable(caseDir, 'availability.csv', testCase.files.availability);
    writeTable(caseDir, 'timeoff.csv', testCase.files.timeoff);

    fs.writeFileSync(
      path.join(caseDir, 'meta.json'),
      `${JSON.stringify(
        {
          id: testCase.id,
          title: testCase.title,
          description: testCase.description,
          startDate: testCase.startDate,
          endDate: testCase.endDate,
          expected: testCase.expected,
          tags: testCase.tags,
        },
        null,
        2
      )}\n`,
      'utf8'
    );
  }

  fs.writeFileSync(path.join(fixturesRoot, 'index.json'), `${JSON.stringify(index, null, 2)}\n`, 'utf8');

  console.log(`Generated ${uploadCases.length} fixture case directories in ${fixturesRoot}`);
}

main();
