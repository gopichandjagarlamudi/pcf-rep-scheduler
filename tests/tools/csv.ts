import fs from 'node:fs';
import * as XLSX from 'xlsx';

export type CsvRecord = Record<string, unknown>;

export function readCsvAsObjects(filePath: string): CsvRecord[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const workbook = XLSX.readFile(filePath, { raw: true });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) {
    return [];
  }

  const worksheet = workbook.Sheets[firstSheet];
  return XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as CsvRecord[];
}
