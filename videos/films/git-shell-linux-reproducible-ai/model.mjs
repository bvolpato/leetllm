import { jsonl, mix, newlineCount, score, smooth } from './arithmetic.mjs';
import {
  commitFixtures,
  freshRows,
  freshWrong,
  job,
  replacement,
  rows,
  wrongRow,
} from './fixtures.mjs';
import { cueProgress } from './construction.mjs';
export function snapshotFrame(state) {
  const staged = cueProgress(state, 'stage-row', 0),
    edited = cueProgress(state, 'edit-row', 1),
    committed = cueProgress(state, 'commit-row', 2);
  const working = {
    ...rows[1],
    prediction: edited === 1 ? 'blocked' : 'escalated',
  };
  return {
    staged,
    edited,
    committed,
    working,
    index:
      staged === 1
        ? {
            ...rows[1],
          }
        : null,
    history:
      committed === 1
        ? {
            ...rows[1],
          }
        : null,
    workingDiff: edited === 1 ? ['- "prediction":"escalated"', '+ "prediction":"blocked"'] : [],
    cachedDiff: committed < 1 && staged === 1 ? ['+ ' + JSON.stringify(rows[1])] : [],
  };
}
export function scoreFrame(state) {
  const first = cueProgress(state, 'compare-first', 0, 0.05, 0.25),
    second = cueProgress(state, 'compare-second', 0, 0.32, 0.55),
    third = cueProgress(state, 'compare-third', 0, 0.64, 0.84);
  const fourth = cueProgress(state, 'append-wrong', 2),
    parts = [first, second, third, fourth];
  const compared = parts.filter((p) => p === 1).length,
    values = [...rows, wrongRow];
  return {
    parts,
    compared,
    result: score(values.slice(0, compared)),
    fourth,
    gate: cueProgress(state, 'integer-gate', 1),
    failure: cueProgress(state, 'failed-gate', 2),
  };
}
export function commitBoundaryFrame(state) {
  const repaired = cueProgress(state, 'unstaged-repair', 0),
    checked = cueProgress(state, 'local-pass', 0, 0.6, 0.9),
    ci = cueProgress(state, 'committed-check', 1);
  const workingRows = repaired === 1 ? rows : [...rows, wrongRow],
    indexRows = [...rows, wrongRow];
  return {
    repaired,
    checked,
    ci,
    workingRows,
    indexRows,
    committedRows: indexRows,
    working: score(workingRows),
    index: score(indexRows),
    committed: score(indexRows),
  };
}
export function bisectTrace() {
  let low = 0,
    high = 7;
  const checks = [];
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2),
      result = score(commitFixtures[mid]),
      good = result.passes;
    checks.push({
      mid,
      good,
      result,
      lowBefore: low,
      highBefore: high,
    });
    if (good) low = mid;
    else high = mid;
  }
  return {
    checks,
    firstBad: high,
  };
}
export function historyFrame(state) {
  const progress = [
      cueProgress(state, 'bisect-three', 0),
      cueProgress(state, 'bisect-five', 1, 0.08, 0.35),
      cueProgress(state, 'bisect-four', 1, 0.42, 0.7),
    ],
    trace = bisectTrace();
  let low = 0,
    high = 7;
  trace.checks.forEach((c, i) => {
    if (c.good) low = mix(low, c.mid, smooth(progress[i]));
    else high = mix(high, c.mid, smooth(progress[i]));
  });
  return {
    progress,
    trace,
    low,
    high,
    complete: cueProgress(state, 'first-bad', 1, 0.72, 0.9) === 1,
  };
}
export function searchResult({ exists = true, pattern = 'denied' } = {}) {
  if (!exists)
    return {
      stdout: '',
      stderr: 'grep: eval/missing.jsonl: No such file or directory',
      status: 2,
      matchingLines: null,
    };
  const matchingLines = jsonl(rows)
    .split('\n')
    .filter((line) => line.includes('"' + pattern + '"')).length;
  return {
    stdout: String(matchingLines),
    stderr: '',
    status: matchingLines ? 0 : 1,
    matchingLines,
  };
}
export function pipelineResult(pipefail) {
  const upstream = searchResult({
    exists: false,
  });
  return {
    upstream,
    downstream: {
      stdout: '0',
      status: 0,
    },
    status: pipefail ? upstream.status : 0,
  };
}
export function shutdownFrame(state) {
  const term = cueProgress(state, 'send-term', 1, 0.05, 0.2),
    flush = cueProgress(state, 'flush-log', 1, 0.3, 0.5),
    collected = cueProgress(state, 'collect-exit', 1, 0.58, 0.82),
    recheck = cueProgress(state, 'identity-recheck', 2);
  return {
    term,
    flush,
    collected,
    recheck,
    alive: collected < 1,
    log: flush === 1 ? 'TERM received; eval log flushed; exiting' : 'check 2: 2/3; exit 0',
    waitStatus: collected === 1 ? 0 : null,
    currentIdentity: recheck === 1 ? replacement : job,
    escalationAuthorized: false,
  };
}
export function cloneFrame(state) {
  const files = cueProgress(state, 'clone-files', 0),
    setup = cueProgress(state, 'clone-setup', 0, 0.55, 0.9),
    receipt = cueProgress(state, 'final-receipt', 1);
  return {
    files,
    setup,
    receipt,
    result: receipt === 1 ? score(rows) : null,
    clean: receipt === 1,
    hostBoundary: cueProgress(state, 'host-boundary', 1, 0.75, 0.93),
  };
}
export function recordContract(value) {
  if (!value.trim())
    return {
      valid: false,
      error: 'empty dataset',
    };
  const values = [];
  for (const line of value.split('\n').filter((line) => line.trim())) {
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      return {
        valid: false,
        error: 'malformed JSON',
      };
    }
    if (!row || typeof row !== 'object' || Array.isArray(row))
      return {
        valid: false,
        error: 'expected JSON object',
      };
    for (const key of ['prompt', 'expected', 'prediction'])
      if (typeof row[key] !== 'string' || !row[key].trim())
        return {
          valid: false,
          error: `${key}: nonempty string required`,
        };
    values.push(row);
  }
  return {
    valid: true,
    rows: values,
    result: score(values),
  };
}
export function inputContractFrame(state) {
  const removed = cueProgress(state, 'remove-final-newline', 2),
    before = jsonl(rows),
    after = removed === 1 ? before.slice(0, -1) : before;
  return {
    removed,
    before,
    after,
    scan: removed === 1 ? 1 : 0.75 + removed * 0.24,
    verdict: cueProgress(state, 'byte-verdict', 2) === 1,
    newlines: cueProgress(state, 'newline-count-reveal', 2) === 1 ? newlineCount(after) : null,
    records:
      cueProgress(state, 'record-count-reveal', 2) === 1
        ? recordContract(after).result.total
        : null,
    matches:
      cueProgress(state, 'match-count-reveal', 2) === 1
        ? recordContract(after).result.correct
        : null,
  };
}
export function freshHandoffFrame(state) {
  const append = cueProgress(state, 'fresh-append-eight', 1),
    stage = cueProgress(state, 'fresh-stage-eight', 1),
    repair = cueProgress(state, 'fresh-working-repair', 1),
    restage = cueProgress(state, 'fresh-repair', 2),
    clone = cueProgress(state, 'fresh-clone-input', 1),
    final = cueProgress(state, 'fresh-final-receipt', 2);
  const working =
    repair === 1 || restage > 0 ? freshRows : append === 1 ? [...freshRows, freshWrong] : freshRows;
  const index = restage === 1 ? freshRows : stage === 1 ? [...freshRows, freshWrong] : freshRows;
  return {
    append,
    stage,
    repair,
    restage,
    clone,
    final,
    working,
    index,
    initialReceipt: cueProgress(state, 'fresh-gate-pass', 0) === 1 ? score(freshRows) : null,
    localReceipt: cueProgress(state, 'fresh-working-pass', 1) === 1 ? score(working) : null,
    cloneRows: restage === 1 ? freshRows : clone === 1 ? [...freshRows, freshWrong] : null,
    cloneReceipt:
      (state.beat ?? 0) >= 2
        ? final === 1
          ? score(freshRows)
          : null
        : cueProgress(state, 'fresh-clone-fails', 1) === 1
          ? score([...freshRows, freshWrong])
          : null,
  };
}
