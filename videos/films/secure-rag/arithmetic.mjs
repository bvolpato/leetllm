import { CANDIDATES, POLICY, PRINCIPAL, SECURE_SOURCES } from './fixtures.mjs';
export function authorize(record, principal = PRINCIPAL, policy = POLICY) {
  return Boolean(
    principal &&
    policy &&
    principal.id &&
    record.tenant === principal.tenant &&
    !policy.deleted &&
    policy.valid &&
    record.policyRevision === policy.revision &&
    principal.groups.includes(record.grant) &&
    policy.groups.includes(record.grant),
  );
}
export function retrieve(
  records = CANDIDATES,
  principal = PRINCIPAL,
  policy = POLICY,
  budget = Infinity,
) {
  return records
    .slice(0, budget)
    .filter((record) => authorize(record, principal, policy))
    .sort((a, b) => b.score - a.score);
}
export function readAuthorizationInputs(
  record = CANDIDATES[5],
  principal = PRINCIPAL,
  policy = POLICY,
) {
  return {
    caller: {
      id: principal.id,
      tenant: principal.tenant,
      groups: [...principal.groups],
    },
    requested: {
      operation: 'read',
      recordId: record.id,
      title: record.title,
    },
    resource: {
      tenant: record.tenant,
      currentGrants: [...policy.groups],
      recordGrant: record.grant,
      sourceRevision: policy.revision,
      recordRevision: record.policyRevision,
      deleted: policy.deleted,
      valid: policy.valid,
    },
    allowed: authorize(record, principal, policy),
  };
}
export function secureEligibility(row, principal, { now = 100 } = {}) {
  if (
    !principal ||
    row.tenant !== principal.tenant ||
    row.deleted !== false ||
    !Object.hasOwn(row, 'start') ||
    !Object.hasOwn(row, 'end')
  )
    return false;
  if (
    !Number.isFinite(now) ||
    (row.start !== null && (!Number.isFinite(row.start) || now < row.start)) ||
    (row.end !== null && (!Number.isFinite(row.end) || now >= row.end))
  )
    return false;
  return (
    row.grant === 'tenant' ||
    row.owner === principal.id ||
    row.users?.includes(principal.id) === true ||
    principal.groups?.includes(row.grant) === true ||
    principal.departments?.includes(row.department) === true ||
    principal.roles?.includes(row.role) === true
  );
}
export function sourceRecord(row) {
  return {
    ...row,
    deleted: false,
    start: null,
    end: null,
  };
}
export function reportAdmission(manifest, current, principal) {
  return (
    Array.isArray(manifest) &&
    manifest.length > 0 &&
    manifest.every((ref) => {
      const row = current.find((r) => r.tenant === ref.tenant && r.id === ref.id);
      return row && row.revision === ref.revision && secureEligibility(row, principal);
    })
  );
}
export function snapshotAdmission({ version, fetched }, required, now, maxAge) {
  const age = now - fetched;
  return {
    age,
    allowed: version === required && age >= 0 && age <= maxAge,
  };
}
export function reconcileChunks(rows, tenant, revision, groups, deleted = false) {
  let updated = 0;
  const next = rows.map((r) => {
    if (r.tenant !== tenant || revision <= r.revision)
      return {
        ...r,
      };
    updated++;
    return {
      ...r,
      revision,
      groups: [...groups],
      deleted,
    };
  });
  return {
    rows: next,
    updated,
  };
}
export function taskScopeCheck(scope, request, now, used, { integrity = true } = {}) {
  const matching = ['tenant', 'user', 'query', 'audience'].every((k) => scope[k] === request[k]);
  if (
    !integrity ||
    !matching ||
    !Number.isFinite(now) ||
    now >= scope.expiry ||
    used.has(scope.nonce)
  )
    return false;
  used.add(scope.nonce);
  return true;
}
export function localOutputCheck(text, contexts, allowed, { clearance = 2 } = {}) {
  if (contexts.some((id) => !allowed.includes(id)))
    return {
      allow: false,
      reason: 'revoked context',
      text: null,
    };
  const clean = text.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]'),
    level = clean.includes('[restricted]') ? 3 : clean.includes('[confidential]') ? 2 : 0;
  if (level > clearance)
    return {
      allow: false,
      reason: 'clearance',
      text: null,
    };
  const citations = [...clean.matchAll(/\[source:([^\]]+)\]/g)].map((x) => x[1]);
  if (!citations.length || citations.some((id) => !contexts.includes(id)))
    return {
      allow: false,
      reason: 'citation membership',
      text: null,
    };
  return {
    allow: true,
    reason: 'implemented checks pass',
    text: clean,
    semanticSupportChecked: false,
  };
}
export function freshSecureState() {
  const principal = {
      id: 'analyst',
      tenant: 'A',
      groups: ['operations', 'security'],
      departments: [],
      roles: [],
    },
    current = SECURE_SOURCES.map(sourceRecord).map((r) =>
      r.id === 'checklist'
        ? {
            ...r,
            revision: 2,
          }
        : r.id === 'FAQ'
          ? {
              ...r,
              grant: null,
              department: null,
            }
          : r,
    ),
    oldReport = [
      {
        tenant: 'A',
        id: 'checklist',
        revision: 1,
      },
      {
        tenant: 'A',
        id: 'FAQ',
        revision: 3,
      },
    ],
    oldDraft = [
      {
        tenant: 'A',
        id: 'FAQ',
        revision: 3,
      },
      {
        tenant: 'A',
        id: 'key',
        revision: 7,
      },
    ],
    replacement = [
      {
        tenant: 'A',
        id: 'checklist',
        revision: 2,
      },
      {
        tenant: 'A',
        id: 'key',
        revision: 7,
      },
    ];
  const allowed = current.filter((r) => secureEligibility(r, principal)).map((r) => r.id);
  const excerpt = {
    id: 'key',
    tenant: 'A',
    revision: 7,
    sentence: 'The security desk reviews rotation requests.',
  };
  const proposed = 'The security desk approves rotation requests. [source:key]';
  const draft = 'The security desk reviews rotation requests. [source:key]';
  const checkDraft = (text, refs) =>
    localOutputCheck(
      text,
      refs.map((r) => r.id),
      allowed,
    );
  const oldOutput = checkDraft(proposed, oldDraft);
  const proposedOutput = checkDraft(proposed, replacement);
  const replacementOutput = checkDraft(draft, replacement);
  const replacementAllowed = reportAdmission(replacement, current, principal);
  const hasCitedRevision = replacement.some(
    (r) => r.id === excerpt.id && r.tenant === excerpt.tenant && r.revision === excerpt.revision,
  );
  const matchesQuote = (result) =>
    hasCitedRevision && result.text === excerpt.sentence + ' [source:' + excerpt.id + ']';
  const quoteMatches = matchesQuote(replacementOutput);
  return {
    principal,
    current,
    oldReport,
    oldDraft,
    replacement,
    oldReportAllowed: reportAdmission(oldReport, current, principal),
    oldDraftAllowed: reportAdmission(oldDraft, current, principal) && oldOutput.allow,
    replacementAllowed,
    allowed,
    oldOutput,
    proposed,
    proposedOutput,
    proposedQuoteMatches: matchesQuote(proposedOutput),
    replacementOutput,
    excerpt,
    draft,
    quoteMatches,
    release: replacementAllowed && replacementOutput.allow && quoteMatches,
  };
}
export function secureRepairTransfer(progress) {
  const q = Math.max(0, Math.min(1, progress)),
    settled = Math.min(2, Math.floor(q * 2 + 1e-9)),
    index = Math.min(1, settled),
    local = q === 1 ? 1 : q * 2 - settled;
  return {
    settled,
    index,
    local,
    active: q > 0 && q < 1 && local > 0,
  };
}
