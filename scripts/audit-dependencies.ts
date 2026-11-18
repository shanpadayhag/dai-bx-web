import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import {
  type AuditSeverity,
  findBlockingAdvisories,
  type IgnoredAdvisory,
  type NpmAuditReport,
} from './dependency-audit.ts';

const AUDIT_OUTPUT_LIMIT_BYTES = 64 * 1024 * 1024;

const auditChecks: Array<{
  label: string;
  npmArguments: string[];
  minimumSeverity: AuditSeverity;
}> = [
  {
    label: 'production packages',
    npmArguments: ['audit', '--json', '--omit=dev'],
    minimumSeverity: 'moderate',
  },
  { label: 'all packages', npmArguments: ['audit', '--json'], minimumSeverity: 'high' },
];

const ignoredAdvisories = JSON.parse(
  readFileSync(new URL('../audit-ignore.json', import.meta.url), 'utf8'),
) as IgnoredAdvisory[];

let hasBlockingAdvisory = false;

for (const auditCheck of auditChecks) {
  const auditRun = spawnSync('npm', auditCheck.npmArguments, {
    encoding: 'utf8',
    maxBuffer: AUDIT_OUTPUT_LIMIT_BYTES,
  });
  const auditReport = JSON.parse(auditRun.stdout) as NpmAuditReport;
  const blockingAdvisories = findBlockingAdvisories(
    auditReport,
    auditCheck.minimumSeverity,
    ignoredAdvisories,
    new Date(),
  );

  console.log(`${auditCheck.label}: ${blockingAdvisories.length} blocking advisories`);
  for (const advisory of blockingAdvisories) {
    hasBlockingAdvisory = true;
    console.error(`${advisory.severity} ${advisory.packageName} ${advisory.id}: ${advisory.title}`);
  }
}

if (hasBlockingAdvisory) process.exitCode = 1;
