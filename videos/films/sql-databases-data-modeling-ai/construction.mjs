import { clamp, completed, mix, smooth } from './arithmetic.mjs';
import {
  asOf,
  documents,
  permissions,
  publicationInput,
  replacement,
} from './fixtures.mjs';
import {
  active,
  authorizedMatches,
  eligibleRows,
  freshSqlPacket,
  joinedRows,
  permissionRows,
  semanticCandidates,
  sourceCounts,
} from './model.mjs';
import { createPublicationLedger, payloadFingerprint, publishOnce } from './protocols.mjs';
export function directed(state, id, beat, a = 0.2, z = 0.8) {
  if ((state.beat ?? 0) < beat) return 0;
  if ((state.beat ?? 0) > beat) return 1;
  return smooth(
    state.cues?.[id] ? clamp(state.cues[id].progress) : clamp(((state.beatP ?? 0) - a) / (z - a)),
  );
}
export function cueHasBegun(state, id, fallback = 0) {
  const cue = state.cues?.[id];
  if (cue) return cue.phase ? cue.phase !== 'before' : cue.progress > 0;
  return fallback > 0;
}
export function snapshots(counted, committed, detailed, pinned) {
  const before = [
    {
      id: 'c7a',
      document: 'd7',
    },
    {
      id: 'c7b',
      document: 'd7',
    },
    {
      id: 'c9a',
      document: 'd9',
    },
  ];
  const after = [
    ...replacement.map((row) => ({
      id: row.id,
      document: row.document,
    })),
    before[2],
  ];
  return {
    before,
    after,
    committed,
    counted,
    detailed,
    readCommitted: {
      count: counted ? before.length : null,
      countSnapshot: 'S0',
      details: detailed ? (committed ? after : before) : null,
      detailSnapshot: committed ? 'S1' : 'S0',
    },
    repeatableRead: {
      count: counted ? before.length : null,
      countSnapshot: 'S0',
      details: pinned ? before : null,
      detailSnapshot: 'S0',
    },
  };
}
export function snapshotQueryFrame(beat, progress) {
  return snapshots(
    beat > 1 || (beat === 1 && progress >= 0.14),
    beat > 1 || (beat === 1 && progress >= 0.43),
    beat > 1 || (beat === 1 && progress >= 0.72),
    beat === 2 && progress >= 0.45,
  );
}
export function sampleModel(id, state) {
  const b = state.beat ?? 0,
    D = (cue, beat, a, z) => directed(state, cue, beat, a, z);
  if (id === 'opening')
    return {
      restart: D('restart-memory', 0),
      memory: 1 - D('restart-memory', 0),
    };
  if (id === 'durability')
    return {
      store: D('store-row', 0),
      recover: D('recover-row', 1),
    };
  if (id === 'relations')
    return {
      source: D('follow-source-key', 0, 0.1, 0.45),
      owner: D('follow-owner-key', 0, 0.5, 0.8),
      duplicate: D('duplicate-row', 1, 0.15, 0.4),
      missing: D('missing-parent', 1, 0.55, 0.85),
    };
  if (id === 'query') {
    const projection = D('project-fields', 0, 0.08, 0.34),
      bind = D('bind-workspace', 0, 0.5, 0.82),
      filter = bind === 1 ? D('filter-bound-rows', 0) : 0,
      input = D('bind-input', 1, 0.05, 0.34),
      percent = D('literal-percent', 1, 0.48, 0.72),
      underscore = D('literal-underscore', 1, 0.7, 0.92);
    const values = [...documents].sort((a, z) => a.id.localeCompare(z.id));
    const filterProgress = bind === 1 ? filter : 0,
      processedCount = Math.min(values.length, completed(filterProgress, values.length)),
      processedValues = values.slice(0, processedCount);
    const selectedRows = processedValues
      .filter((row) => row.workspace === 'w01')
      .map((row) => [row.id, row.title]);
    const rejectedRows = processedValues.filter((row) => row.workspace !== 'w01');
    const activeIndex =
      filterProgress === 1
        ? values.length - 1
        : filterProgress > 0
          ? Math.floor(filterProgress * values.length)
          : -1;
    return {
      projection,
      bind,
      bindTravel: clamp(bind),
      filterProgress,
      processedCount,
      activeIndex,
      activeProgress:
        filterProgress === 1 ? 1 : filterProgress * values.length - Math.max(0, activeIndex),
      values,
      selectedRows,
      rejectedRows,
      input,
      inputTravel: clamp(input / 0.3),
      percent,
      underscore,
      searchText: "children's coats",
      literalPercentExample: 'Save 10% on this coat.',
      literalUnderscoreExample: 'This field is named document_id.',
    };
  }
  if (id === 'join') {
    const cue = state.cues?.['compare-join-fields'];
    const compare =
      cue?.phase === 'during' ? 0.05 + 0.95 * cue.progress : D('compare-join-fields', 0);
    return {
      compare,
      attach: D('attach-source-title', 1, 0.05, 0.4),
      second: D('join-second-paragraph', 1, 0.55, 0.85),
    };
  }
  if (id === 'validity') {
    const cue = state.cues?.['move-request-time'];
    const place = cue?.phase === 'during' ? 0.5 + 0.5 * cue.progress : D('move-request-time', 0),
      resolve = D('resolve-version', 1, 0.05, 0.45);
    return {
      place,
      resolve,
      open: D('open-ended-version', 1, 0.55, 0.8),
      at: mix(Date.parse('2026-07-01T00:00:00Z'), Date.parse(asOf), resolve),
    };
  }
  if (id === 'authorization') {
    const reader = D('require-reader', 1, 0.02, 0.2),
      owner = D('require-workspace', 1, 0.23, 0.42),
      time = D('require-time', 1, 0.45, 0.65),
      admit = D('admit-context', 2);
    const visible = joinedRows().filter(
      (row) =>
        (reader < 1 || permissions.some(([id, name]) => id === row.id && name === 'Bob')) &&
        (owner < 1 || row.source.workspace === 'w01') &&
        (time < 1 || active(row.source)),
    );
    return {
      reader,
      owner,
      time,
      admit,
      visible: visible.map((row) => row.id),
      allowed: authorizedMatches(),
    };
  }
  if (id === 'indexes') {
    const rows = permissionRows(),
      sorted = [...rows].sort(
        (a, b) => a.principal.localeCompare(b.principal) || a.chunkId.localeCompare(b.chunkId),
      );
    const scan = D('scan-permissions', 0, 0.04, 0.3),
      build = D('build-principal-index', 0, 0.31, 0.67),
      seek = D('seek-reader-range', 0, 0.68, 0.94),
      walk = D('walk-reader-range', 1, 0.03, 0.55),
      result = D('preserve-result-rule', 1, 0.55, 0.84),
      plan = D('inspect-real-plan', 2, 0.08, 0.7);
    const bob = sorted.filter((row) => row.principal === 'Bob'),
      walkCount = completed(walk, 4),
      activeIndex = walk === 1 ? 3 : Math.min(3, Math.floor(walk * 4));
    return {
      rows,
      sorted,
      scan,
      scanCount: completed(scan, 7),
      build,
      built: completed(build, 7),
      seek,
      walk,
      walkCount,
      walkIndex: activeIndex,
      walkProgress: walk === 1 ? 1 : walk * 4 - activeIndex,
      result,
      plan,
      bob,
      allowed: authorizedMatches(),
      walkedAllowed: bob
        .slice(0, walkCount)
        .map((row) => row.chunkId)
        .filter((id) => authorizedMatches().includes(id)),
    };
  }
  if (id === 'counts')
    return {
      group: D('form-source-groups', 0, 0.2, 0.55),
      count: D('count-groups', 0, 0.6, 0.85),
      empty: D('preserve-empty-parent', 1, 0.2, 0.5),
      zero: D('count-child-identity', 2, 0.1, 0.5),
      groups: sourceCounts(),
    };
  if (id === 'publication') {
    const stage = D('stage-new-edition', 0),
      reject = D('reject-broken-reference', 1, 0.05, 0.4),
      rollback = D('rollback-publication', 1, 0.5, 0.85);
    const finish = D('finish-publication', 2, 0.05, 0.5),
      commit = D('commit-publication', 2, 0.6, 0.85),
      committed = finish === 1 && commit === 1;
    return {
      stage,
      reject,
      rollback,
      finish,
      commit,
      committed,
      slot: D('serialize-publisher', 3),
      writerHasDocument:
        b === 0 ? stage >= 0.5 : b === 1 ? rollback < 1 : b === 2 ? finish > 0 : true,
      oldEnded: b === 0 ? stage > 0 : b === 1 ? rollback < 1 : b >= 2 && finish > 0,
      completedChildren:
        b === 0
          ? stage >= 0.65
            ? 1
            : 0
          : b === 1
            ? rollback < 1
              ? 1
              : 0
            : b >= 2
              ? completed(finish, 3)
              : 0,
      readerIds: committed ? replacement.map((row) => row.id) : ['c7a', 'c7b'],
    };
  }
  if (id === 'snapshots') {
    const count = D('capture-first-count', 0),
      commit = D('snapshot-commit', 1, 0.1, 0.35),
      detail = D('read-new-snapshot', 1, 0.5, 0.85),
      pin = D('retain-read-snapshot', 2);
    return {
      count,
      commit,
      detail,
      pin,
      ...snapshots(count === 1, commit === 1, commit === 1 && detail === 1, pin === 1),
    };
  }
  if (id === 'retries') {
    const ledger = createPublicationLedger(),
      first = publishOnce(ledger, 'publish-1'),
      changed = structuredClone(publicationInput);
    changed.chunks[2].text = 'Return clothing with the labels attached.';
    const same = D('compare-same-retry', 1),
      change = D('change-retry-payload', 2, 0.1, 0.4),
      reject = D('reject-changed-retry', 2, 0.55, 0.85);
    const input = change === 1 ? changed : publicationInput,
      result =
        b === 0
          ? null
          : b === 1
            ? same === 1
              ? publishOnce(ledger, 'publish-1', input)
              : null
            : reject === 1
              ? publishOnce(ledger, 'publish-1', input)
              : null;
    return {
      lost: D('lose-publication-reply', 0),
      same,
      change,
      reject,
      input,
      stored: publicationInput,
      storedHash: first.fingerprint,
      incomingHash: payloadFingerprint(input),
      status: result?.status ?? 'compare input',
      documentRows: ledger.data.documents.length,
      chunkRows: ledger.data.chunks.length,
      markers: ledger.requests.size,
    };
  }
  if (id === 'semantic') {
    const normalize = D('normalize-candidate-vectors', 0, 0.02, 0.4),
      project = normalize === 1 ? D('project-cosine-score', 0) : 0,
      rank = project === 1 ? D('rank-by-cosine', 0) : 0,
      prefix = D('inspect-filtered-prefix', 1, 0.05, 0.4),
      advance = D('advance-ranked-search', 1, 0, 1),
      extend = D('continue-candidate-search', 1, 0, 1),
      lineage = D('follow-result-lineage', 2);
    const rows = semanticCandidates(),
      geometryIndex = 0,
      geometryProgress = normalize,
      projectionIndex = 0,
      projectionProgress = project,
      overviewRows = rank > 0 ? rows.slice(1) : [];
    const failureCues = [
      'explain-other-store-failure',
      'explain-retired-failure',
      'explain-reader-failure',
    ];
    const failureIndex = failureCues.reduce(
        (active, id, index) => (cueHasBegun(state, id) ? index : active),
        -1,
      ),
      prefixStarted = cueHasBegun(state, 'inspect-filtered-prefix', prefix),
      advanceStarted = cueHasBegun(state, 'advance-ranked-search', advance),
      resultsStarted = cueHasBegun(state, 'continue-candidate-search', extend);
    let visited = 0,
      activeIndex = 0,
      activeProgress = 0;
    if (resultsStarted) {
      visited = 5;
      activeIndex = 4;
      activeProgress = 1;
    } else if (advanceStarted) {
      const position = advance * 2,
        secondResultComplete = advance >= 0.94;
      visited = 3 + (secondResultComplete ? 2 : completed(advance, 2));
      activeIndex = Math.min(4, 3 + Math.floor(position));
      activeProgress = secondResultComplete || position >= 2 ? 1 : position - Math.floor(position);
    } else if (failureIndex >= 0) {
      visited = failureIndex + 1;
      activeIndex = failureIndex;
      activeProgress = 1;
    } else if (prefixStarted) {
      visited = 1;
      activeIndex = 0;
      activeProgress = 1;
    }
    const allowed = rows
      .slice(0, visited)
      .filter((row) => row.allowed)
      .slice(0, 2);
    return {
      normalize,
      project,
      rank,
      geometryIndex,
      geometryProgress,
      projectionIndex,
      projectionProgress,
      overviewRows,
      prefix,
      advance,
      extend,
      lineage,
      rows,
      visited,
      allowed,
      activeIndex,
      activeProgress,
      failureIndex,
      prefixStarted,
      advanceStarted,
      resultsStarted,
      query: [1, 0],
      requestedResults: 2,
      lexical: authorizedMatches({
        published: true,
        query: 'can I take this coat back?',
      }),
      result: allowed[0] ?? null,
    };
  }
  if (id === 'closing')
    return {
      reopen: D('reopen-final-file', 0),
      version: D('check-final-version', 0, 0.12, 0.48),
      workspace: D('check-final-workspace', 0, 0.34, 0.68),
      reader: D('check-final-reader', 0, 0.56, 0.88),
      reveal:
        b > 1 || (b === 1 && state.cues?.['reveal-final-citation']?.phase === 'after') ? 1 : 0,
      candidates: [
        joinedRows(true).find((row) => row.id === 'c7-old'),
        joinedRows(true).find((row) => row.id === 'c7a'),
        joinedRows(true).find((row) => row.id === 'c7c'),
        joinedRows(true).find((row) => row.id === 'c99'),
        joinedRows(true).find((row) => row.id === 'c9a'),
      ],
      answer: authorizedMatches({
        published: true,
        query: 'fourteen',
      }),
    };
  throw new Error('Unknown SQL teaching scene ' + id);
}
export const sqlCueStep = (id, state, beat, index = 0) => {
  const b = state.beat ?? 0;
  if (b > beat) return 1;
  if (b < beat) return 0;
  const cueId = index === 0 ? id + '-b' + (beat + 1) : id + '-step-' + beat + '-' + index;
  if (state.cues && !Object.hasOwn(state.cues, cueId)) throw Error('Undeclared SQL cue ' + cueId);
  return clamp(state.cues?.[cueId]?.progress ?? 0);
};
export function extendedSqlState(id, state) {
  const S = (b, i = 0) => sqlCueStep(id, state, b, i),
    b = state.beat ?? 0;
  if (id === 'fresh-request') {
    const repairApplied = b > 1 || S(1, 6) === 1,
      repair = b > 1 || S(1, 8) === 1,
      rows = freshSqlPacket(repairApplied),
      allowed = eligibleRows(rows, {
        workspace: 'Harbor',
        principal: 'Bob',
        time: '2026-09-01',
      });
    return {
      rows,
      allowed,
      repairApplied,
      repair,
      revealed: b > 1 || S(1, 4) === 1,
    };
  }
  if (id === 'lineage-version') {
    const changed = S(0, 1) === 1,
      repaired = S(0, 5) === 1,
      vector = changed && !repaired ? [0, 1] : [1, 0];
    return {
      changed,
      repaired,
      vector,
      savedScore: 1,
      recomputedScore: vector[0],
      foreignKeyPasses: true,
    };
  }
  if (id === 'transaction-context')
    return {
      first: directed(state, 'insert-first-k', 0, 0.12, 0.42),
      duplicate: directed(state, 'attempt-second-k', 0, 0.52, 0.82),
      leave: directed(state, 'leave-with-blocks', 1, 0.25, 0.65),
    };
  if (id === 'delete-order') {
    const rolledBack = b > 0 || S(0, 4) === 1;
    return {
      removedCount: rolledBack ? 0 : Math.floor(S(0, 3) * 3),
      rolledBack,
    };
  }
  return {
    beat: b,
  };
}
