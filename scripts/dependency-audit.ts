const SEVERITY_RANKS = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 } as const;

export type AuditSeverity = keyof typeof SEVERITY_RANKS;

type NpmAdvisory = {
  name: string;
  severity: AuditSeverity;
  title: string;
  url: string;
};

export type NpmAuditReport = {
  vulnerabilities?: Record<string, { via: Array<string | NpmAdvisory> }>;
};

export type IgnoredAdvisory = {
  id: string;
  reason: string;
  reviewBy: string;
};

export type BlockingAdvisory = {
  id: string;
  packageName: string;
  severity: AuditSeverity;
  title: string;
};

const isStillIgnored = (ignoredAdvisory: IgnoredAdvisory, today: Date) =>
  today.getTime() < new Date(`${ignoredAdvisory.reviewBy}T00:00:00Z`).getTime() + 86_400_000;

export const findBlockingAdvisories = (
  auditReport: NpmAuditReport,
  minimumSeverity: AuditSeverity,
  ignoredAdvisories: IgnoredAdvisory[],
  today: Date,
): BlockingAdvisory[] => {
  if (!auditReport.vulnerabilities) {
    throw new Error('npm audit returned no results');
  }

  const ignoredAdvisoryIds = new Set(
    ignoredAdvisories
      .filter((ignoredAdvisory) => isStillIgnored(ignoredAdvisory, today))
      .map((ignoredAdvisory) => ignoredAdvisory.id),
  );
  const blockingAdvisoriesById = new Map<string, BlockingAdvisory>();

  for (const vulnerability of Object.values(auditReport.vulnerabilities)) {
    for (const cause of vulnerability.via) {
      if (typeof cause === 'string') continue;
      const advisoryId = cause.url.split('/').at(-1) ?? cause.url;
      if (
        SEVERITY_RANKS[cause.severity] >= SEVERITY_RANKS[minimumSeverity] &&
        !ignoredAdvisoryIds.has(advisoryId)
      ) {
        blockingAdvisoriesById.set(advisoryId, {
          id: advisoryId,
          packageName: cause.name,
          severity: cause.severity,
          title: cause.title,
        });
      }
    }
  }

  return [...blockingAdvisoriesById.values()].sort((first, second) =>
    first.id.localeCompare(second.id),
  );
};
