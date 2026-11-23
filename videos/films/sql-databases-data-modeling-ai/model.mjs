import { cosine } from './arithmetic.mjs';
import {
  asOf,
  chunks,
  documents,
  permissions,
  publicationInput,
  replacement,
  toyEmbeddings,
} from './fixtures.mjs';
export function active(row, at = asOf) {
  return row.from <= at && (row.to === null || at < row.to);
}
export function corpus(published = false) {
  return {
    documents: published
      ? [
          ...documents.map((row) =>
            row.id === 'd7'
              ? {
                  ...row,
                  to: asOf,
                }
              : {
                  ...row,
                },
          ),
          {
            id: 'd7-next',
            workspace: 'w01',
            title: 'Return Policy',
            source: 'returns',
            from: asOf,
            to: null,
          },
        ]
      : documents.map((row) => ({
          ...row,
        })),
    chunks: [...chunks, ...(published ? replacement : [])].map((row) => ({
      ...row,
    })),
    permissions: [...permissions, ...(published ? publicationInput.grants : [])].map((row) => [
      ...row,
    ]),
  };
}
export function joinedRows(published = false) {
  const data = corpus(published);
  return data.chunks.map((row) => ({
    ...row,
    source: data.documents.find((document) => document.id === row.document),
  }));
}
export function authorizedMatches({
  published = false,
  workspace = 'w01',
  principal = 'Bob',
  at = asOf,
  query = 'return',
  enforceWorkspace = true,
  enforceReader = true,
  enforceTime = true,
} = {}) {
  const literal = query.trim().toLowerCase();
  if (!literal) return [];
  const data = corpus(published);
  return joinedRows(published)
    .filter(
      (row) =>
        row.text.toLowerCase().includes(literal) &&
        (!enforceWorkspace || row.source.workspace === workspace) &&
        (!enforceTime || active(row.source, at)) &&
        (!enforceReader ||
          data.permissions.some(([id, reader]) => id === row.id && reader === principal)),
    )
    .map((row) => row.id)
    .sort();
}
export function permissionRows() {
  return permissions.map(([chunkId, principal], i) => ({
    id: 'p' + (i + 1),
    chunkId,
    principal,
  }));
}
export function sourceCounts(published = false, { includeEmpty = false } = {}) {
  const data = corpus(published),
    parents = data.documents.filter((row) => row.workspace === 'w01' && active(row));
  if (includeEmpty)
    parents.push({
      id: 'd-empty',
      title: 'Draft Guide',
    });
  return parents
    .map((row) => ({
      id: row.id,
      title: row.title,
      count: data.chunks.filter((chunk) => chunk.document === row.id).length,
    }))
    .filter((row) => includeEmpty || row.count > 0)
    .sort((a, b) => a.id.localeCompare(b.id));
}
export function semanticCandidates(limit = 6) {
  const data = corpus(true);
  const rows = joinedRows(true);
  return [...toyEmbeddings]
    .filter((row) => row.model === 'E1')
    .map((row) => {
      const child = rows.find((child) => child.id === row.chunk);
      const granted = data.permissions.some(([id, reader]) => id === child.id && reader === 'Bob');
      const reason = child.source.workspace !== 'w01' ? 'workspace'
        : !active(child.source) ? 'retired' : !granted ? 'reader' : 'allowed';
      return {
        ...row,
        score: cosine([1, 0], row.vector),
        allowed: reason === 'allowed',
        reason,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
export const literalSubstringPattern = (value) =>
  '%' + value.replaceAll('!', '!!').replaceAll('%', '!%').replaceAll('_', '!_') + '%';
export function eligibleRows(rows, { workspace, principal, time }) {
  return rows.filter(
    (row) =>
      row.workspace === workspace &&
      row.grants.includes(principal) &&
      row.start <= time &&
      (row.end === null || time < row.end),
  );
}
export function rlsVisible({ role, enabled = true, force = false, policyAllows = false }) {
  if (!enabled || role === 'superuser' || role === 'bypass' || (role === 'owner' && !force))
    return true;
  return policyAllows;
}
export function groupChildren(parents, children) {
  return parents.map((parent) => ({
    parent,
    count: children.filter((child) => child.parent === parent && child.active).length,
  }));
}
export function septemberGrants(addBob = false) {
  const grants = [['old', 'Bob'], ['c80', 'Cara'], ['c81', 'Bob'], ['c82', 'Bob']];
  if (addBob) grants.push(['c80', 'Bob']);
  return grants;
}

export function freshSqlPacket(repair = false) {
  const grants = septemberGrants(repair);
  return [
    {
      id: 'old',
      document: 'd-july',
      workspace: 'Harbor',
      start: '2026-07-01',
      end: '2026-09-01',
      text: 'Return within fourteen days.',
    },
    {
      id: 'c80',
      document: 'd80',
      workspace: 'Harbor',
      start: '2026-09-01',
      end: null,
      text: 'Return within ten days.',
    },
    {
      id: 'c81',
      document: 'd80',
      workspace: 'Harbor',
      start: '2026-09-01',
      end: null,
      text: 'Bring the receipt for a return.',
    },
    {
      id: 'c82',
      document: 'd82',
      workspace: 'Birch',
      start: '2026-01-01',
      end: null,
      text: 'Return within seven days.',
    },
  ].map((row) => ({
    ...row,
    grants: grants.filter(([chunk]) => chunk === row.id).map(([, reader]) => reader),
  }));
}
