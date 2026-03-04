import fs from 'node:fs';
import path from 'node:path';
import { uploadCases } from '../cases/manifest';

type FlatStatus = 'passed' | 'failed' | 'skipped';

interface FlatTest {
  title: string;
  status: FlatStatus;
  durationMs: number;
  errors: string[];
}

interface SuiteSummary {
  suite: 'logic' | 'e2e';
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
  tests: FlatTest[];
}

const artifactsRaw = path.resolve(process.cwd(), 'tests/artifacts/raw');
const artifactsLatest = path.resolve(process.cwd(), 'tests/artifacts/latest');

function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath: string): any | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return {
      parseError: String(error),
    };
  }
}

function normalizeStatus(value: string | undefined): FlatStatus {
  if (value === 'pass' || value === 'passed') return 'passed';
  if (value === 'skip' || value === 'skipped' || value === 'pending' || value === 'todo') return 'skipped';
  return 'failed';
}

function fromVitestJestLike(data: any): FlatTest[] {
  const tests: FlatTest[] = [];
  const suites = Array.isArray(data?.testResults) ? data.testResults : [];

  for (const suite of suites) {
    const assertions = Array.isArray(suite?.assertionResults) ? suite.assertionResults : [];
    for (const assertion of assertions) {
      const ancestors = Array.isArray(assertion?.ancestorTitles) ? assertion.ancestorTitles : [];
      const title = [...ancestors, assertion?.title || assertion?.fullName || 'Unnamed test']
        .filter(Boolean)
        .join(' > ');
      const errors = Array.isArray(assertion?.failureMessages)
        ? assertion.failureMessages.map((message: unknown) => String(message))
        : [];

      tests.push({
        title,
        status: normalizeStatus(assertion?.status),
        durationMs: Number(assertion?.duration) || 0,
        errors,
      });
    }
  }

  return tests;
}

function fromVitestTaskTree(data: any): FlatTest[] {
  const tests: FlatTest[] = [];

  function walk(node: any, parentTitles: string[]): void {
    if (!node) return;

    if (Array.isArray(node)) {
      for (const item of node) walk(item, parentTitles);
      return;
    }

    if (typeof node !== 'object') return;

    const nodeName = typeof node.name === 'string' ? node.name : typeof node.title === 'string' ? node.title : '';
    const nextTitles = nodeName ? [...parentTitles, nodeName] : parentTitles;

    const state = node?.result?.state || node?.status;
    const isLeaf = node?.type === 'test' || (state && !Array.isArray(node?.tasks));

    if (isLeaf && state) {
      const errors = Array.isArray(node?.result?.errors)
        ? node.result.errors.map((err: unknown) => String((err as any)?.message ?? err))
        : [];

      tests.push({
        title: nextTitles.join(' > '),
        status: normalizeStatus(state),
        durationMs: Number(node?.result?.duration || node?.duration || 0),
        errors,
      });
    }

    if (Array.isArray(node?.tasks)) {
      for (const task of node.tasks) walk(task, nextTitles);
    }

    if (Array.isArray(node?.children)) {
      for (const child of node.children) walk(child, nextTitles);
    }
  }

  walk(data, []);
  return tests;
}

function summarizeLogic(data: any): SuiteSummary {
  let tests = fromVitestJestLike(data);
  if (tests.length === 0) {
    tests = fromVitestTaskTree(data);
  }

  const passed = tests.filter((test) => test.status === 'passed').length;
  const failed = tests.filter((test) => test.status === 'failed').length;
  const skipped = tests.filter((test) => test.status === 'skipped').length;
  const durationMs = tests.reduce((total, test) => total + test.durationMs, 0);

  return {
    suite: 'logic',
    total: tests.length,
    passed,
    failed,
    skipped,
    durationMs,
    tests,
  };
}

function summarizeE2E(data: any): SuiteSummary {
  const tests: FlatTest[] = [];

  function walkSuites(suites: any[], parentTitles: string[]): void {
    for (const suite of suites || []) {
      const suiteTitle = suite?.title ? [...parentTitles, suite.title] : parentTitles;

      for (const spec of suite?.specs || []) {
        const fullTitle = [...suiteTitle, spec.title].filter(Boolean).join(' > ');
        const specTests = Array.isArray(spec?.tests) ? spec.tests : [];

        let status: FlatStatus = 'passed';
        let durationMs = 0;
        const errors: string[] = [];

        if (specTests.length === 0) {
          status = 'skipped';
        }

        for (const specTest of specTests) {
          const results = Array.isArray(specTest?.results) ? specTest.results : [];
          for (const result of results) {
            durationMs += Number(result?.duration) || 0;
            const resultStatus = String(result?.status || 'failed');
            if (resultStatus === 'failed' || resultStatus === 'timedOut' || resultStatus === 'interrupted') {
              status = 'failed';
            }
            if (resultStatus === 'skipped' && status !== 'failed') {
              status = 'skipped';
            }

            if (Array.isArray(result?.errors)) {
              for (const err of result.errors) {
                if (err?.message) errors.push(String(err.message));
              }
            }
          }
        }

        tests.push({
          title: fullTitle,
          status,
          durationMs,
          errors,
        });
      }

      if (Array.isArray(suite?.suites) && suite.suites.length > 0) {
        walkSuites(suite.suites, suiteTitle);
      }
    }
  }

  walkSuites(Array.isArray(data?.suites) ? data.suites : [], []);

  const passed = tests.filter((test) => test.status === 'passed').length;
  const failed = tests.filter((test) => test.status === 'failed').length;
  const skipped = tests.filter((test) => test.status === 'skipped').length;
  const durationMs = tests.reduce((total, test) => total + test.durationMs, 0);

  return {
    suite: 'e2e',
    total: tests.length,
    passed,
    failed,
    skipped,
    durationMs,
    tests,
  };
}

function extractCaseId(testTitle: string): string | null {
  const match = testTitle.match(/\[case:([a-z0-9-]+)\]/i);
  return match ? match[1] : null;
}

function statusFromTests(tests: FlatTest[]): 'passed' | 'failed' | 'skipped' | 'not-run' {
  if (tests.length === 0) return 'not-run';
  if (tests.some((test) => test.status === 'failed')) return 'failed';
  if (tests.some((test) => test.status === 'passed')) return 'passed';
  if (tests.some((test) => test.status === 'skipped')) return 'skipped';
  return 'not-run';
}

function formatDuration(durationMs: number): string {
  return `${(durationMs / 1000).toFixed(2)}s`;
}

function toMarkdown(result: any): string {
  const lines: string[] = [];

  lines.push('# Automated Test Summary');
  lines.push('');
  lines.push(`Generated: ${result.generatedAt}`);
  lines.push(`Overall: ${result.overallStatus.toUpperCase()}`);
  lines.push('');
  lines.push('## Suite Metrics');
  lines.push('');
  lines.push('| Suite | Total | Passed | Failed | Skipped | Duration |');
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: |');

  for (const suite of result.suites) {
    lines.push(
      `| ${suite.suite} | ${suite.total} | ${suite.passed} | ${suite.failed} | ${suite.skipped} | ${formatDuration(suite.durationMs)} |`
    );
  }

  lines.push('');
  lines.push('## Case Results');
  lines.push('');
  lines.push('| Case ID | Title | Logic | E2E |');
  lines.push('| --- | --- | --- | --- |');

  for (const caseSummary of result.caseSummaries) {
    lines.push(
      `| ${caseSummary.caseId} | ${caseSummary.title} | ${caseSummary.logicStatus} | ${caseSummary.e2eStatus} |`
    );
  }

  const failedTests = result.failedTests as Array<{ suite: string; title: string; errors: string[] }>;
  lines.push('');
  lines.push('## Failures');
  lines.push('');

  if (failedTests.length === 0) {
    lines.push('No failures detected.');
  } else {
    for (const failed of failedTests) {
      lines.push(`- [${failed.suite}] ${failed.title}`);
      for (const error of failed.errors.slice(0, 2)) {
        const singleLineError = error.replace(/\s+/g, ' ').trim();
        lines.push(`  - ${singleLineError.slice(0, 240)}`);
      }
    }
  }

  lines.push('');
  return lines.join('\n');
}

function main(): void {
  ensureDir(artifactsLatest);

  const vitestPath = path.join(artifactsRaw, 'vitest.json');
  const playwrightPath = path.join(artifactsRaw, 'playwright.json');

  const vitestRaw = readJson(vitestPath);
  const playwrightRaw = readJson(playwrightPath);

  const logicSummary = summarizeLogic(vitestRaw || {});
  const e2eSummary = summarizeE2E(playwrightRaw || {});

  const logicByCase = new Map<string, FlatTest[]>();
  const e2eByCase = new Map<string, FlatTest[]>();

  for (const test of logicSummary.tests) {
    const caseId = extractCaseId(test.title);
    if (!caseId) continue;
    const list = logicByCase.get(caseId) || [];
    list.push(test);
    logicByCase.set(caseId, list);
  }

  for (const test of e2eSummary.tests) {
    const caseId = extractCaseId(test.title);
    if (!caseId) continue;
    const list = e2eByCase.get(caseId) || [];
    list.push(test);
    e2eByCase.set(caseId, list);
  }

  const caseSummaries = uploadCases.map((testCase) => {
    const logicTests = logicByCase.get(testCase.id) || [];
    const e2eTests = e2eByCase.get(testCase.id) || [];

    return {
      caseId: testCase.id,
      title: testCase.title,
      logicStatus: statusFromTests(logicTests),
      e2eStatus: statusFromTests(e2eTests),
      logicTests,
      e2eTests,
    };
  });

  const failedTests = [
    ...logicSummary.tests.filter((test) => test.status === 'failed').map((test) => ({ suite: 'logic', ...test })),
    ...e2eSummary.tests.filter((test) => test.status === 'failed').map((test) => ({ suite: 'e2e', ...test })),
  ];

  const output = {
    generatedAt: new Date().toISOString(),
    overallStatus: failedTests.length > 0 ? 'failed' : 'passed',
    suites: [logicSummary, e2eSummary],
    caseSummaries,
    failedTests,
    inputs: {
      vitestPath,
      playwrightPath,
    },
  };

  fs.writeFileSync(path.join(artifactsLatest, 'results.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(artifactsLatest, 'summary.md'), toMarkdown(output), 'utf8');

  console.log(`Report written to ${path.join(artifactsLatest, 'results.json')}`);
  console.log(`Report written to ${path.join(artifactsLatest, 'summary.md')}`);
}

main();
