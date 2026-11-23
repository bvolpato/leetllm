import { EOS, FAIL_PREFIX, LANGUAGE, TOKEN_SCORES } from './fixtures.mjs';
import assert from 'node:assert/strict';
import { stableSoftmax } from 'vizmatic';
export function legal(prefix, token, language = LANGUAGE) {
  return token === EOS
    ? language.includes(prefix)
    : token.length > 0 && language.some((value) => value.startsWith(prefix + token));
}
export function masked(scores, prefix, tokens) {
  assert.equal(scores.length, tokens.length);
  const indices = tokens.map((token, i) => (legal(prefix, token) ? i : -1)).filter((i) => i >= 0);
  assert(indices.length > 0, 'No representable legal continuation');
  const probabilities = stableSoftmax(indices.map((i) => scores[i]));
  const out = tokens.map(() => 0);
  indices.forEach((id, i) => (out[id] = probabilities[i]));
  return out;
}
export function decode(tokens) {
  let prefix = '';
  for (const token of tokens) {
    assert(legal(prefix, token), `Illegal token ${token}`);
    if (token === EOS) return prefix;
    prefix += token;
  }
  throw new Error('token budget ended before complete output');
}
export function tokenTrace(token, count) {
  const seen = token.slice(0, count);
  return {
    seen,
    possible: LANGUAGE.some((value) => value.startsWith(FAIL_PREFIX + seen)),
    complete: LANGUAGE.includes(FAIL_PREFIX + seen),
  };
}
export function rankedSteps(budget) {
  let prefix = '';
  const steps = [];
  for (let i = 0; i < budget; i++) {
    const candidates = [...TOKEN_SCORES].filter(([token]) => legal(prefix, token));
    assert(candidates.length, 'grammar has no representable continuation');
    const [token] = candidates.reduce((best, next) => (next[1] > best[1] ? next : best));
    steps.push(token);
    if (token === EOS) break;
    prefix += token;
  }
  return steps;
}
export function recursivePrefix(text) {
  const frames = [];
  let stage = 'start',
    remaining = '';
  const trace = [];
  for (let offset = 0; offset < text.length; offset++) {
    const ch = text[offset];
    let valid = true;
    if (stage === 'start' || stage === 'child') {
      if (ch !== '{') valid = false;
      else {
        frames.push({
          id: `open-${offset}`,
          offset,
        });
        stage = 'object';
      }
    } else if (stage === 'object') {
      if (ch === '}') {
        frames.pop();
        stage = frames.length ? 'close' : 'done';
      } else if (ch === '"') {
        remaining = 'child":';
        stage = 'literal';
      } else valid = false;
    } else if (stage === 'literal') {
      if (ch !== remaining[0]) valid = false;
      else {
        remaining = remaining.slice(1);
        if (!remaining) stage = 'child';
      }
    } else if (stage === 'close') {
      if (ch !== '}') valid = false;
      else {
        frames.pop();
        stage = frames.length ? 'close' : 'done';
      }
    } else valid = false;
    trace.push({
      offset,
      ch,
      depth: frames.length,
      valid,
      stage,
    });
    if (!valid)
      return {
        valid: false,
        complete: false,
        frames: [...frames],
        trace,
        errorOffset: offset,
      };
  }
  return {
    valid: true,
    complete: stage === 'done',
    frames: [...frames],
    trace,
  };
}
export function recursiveCandidate(prefix, token) {
  const before = recursivePrefix(prefix),
    trial = recursivePrefix(prefix + token);
  assert(before.valid && !before.complete, 'A candidate starts from a valid unfinished prefix');
  return {
    before,
    trial,
    accepted: trial.valid,
    nextPrefix: trial.valid ? prefix + token : prefix,
    committedFrames: trial.valid ? trial.frames : before.frames,
    eosBefore: before.complete,
    eosAfter: trial.valid && trial.complete,
  };
}
export function treeRelationships(nodes) {
  const by = new Map(nodes.map((n) => [n.id, n]));
  if (by.size !== nodes.length)
    return {
      valid: false,
      reason: 'duplicate ID',
      visited: [],
    };
  const roots = nodes.filter((n) => n.parent === null);
  if (roots.length !== 1)
    return {
      valid: false,
      reason: 'expected one root',
      visited: [],
    };
  if (nodes.some((n) => n.parent !== null && !by.has(n.parent)))
    return {
      valid: false,
      reason: 'unknown parent',
      visited: [],
    };
  const pending = [roots[0].id],
    visited = new Set();
  while (pending.length) {
    const id = pending.pop();
    if (visited.has(id))
      return {
        valid: false,
        reason: 'cycle',
        visited: [...visited],
      };
    visited.add(id);
    pending.push(...nodes.filter((n) => n.parent === id).map((n) => n.id));
  }
  return {
    valid: visited.size === nodes.length,
    reason: visited.size === nodes.length ? 'connected tree' : 'disconnected nodes or cycles',
    visited: [...visited],
  };
}
export function nullableRecord(payload) {
  const keys = Object.keys(payload),
    required = ['run_id', 'status', 'failing_job'];
  if (required.some((k) => !keys.includes(k)) || keys.some((k) => !required.includes(k)))
    return false;
  return (
    typeof payload.run_id === 'string' &&
    ['queued', 'passed', 'failed', 'unknown'].includes(payload.status) &&
    (payload.failing_job === null || typeof payload.failing_job === 'string')
  );
}
export function ciOutcome(record, authorizedProject, snapshot) {
  if (record.project !== authorizedProject)
    return {
      outcome: 'deny',
      queried: false,
    };
  const expected = snapshot[record.project + '/' + record.run_id];
  return {
    outcome: expected === record.status ? 'show snapshot' : 'review',
    queried: true,
  };
}
export function digestIdentity(mentions, catalog) {
  const seen = new Set(),
    duplicates = [];
  for (const m of mentions) {
    if (seen.has(m.service)) duplicates.push(m.service);
    seen.add(m.service);
  }
  return {
    valid: duplicates.length === 0,
    duplicates,
    unknown: mentions.filter((m) => !catalog.includes(m.service)).map((m) => m.service),
  };
}
