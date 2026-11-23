import { chain, commonPrefix, hash, reusableTokens } from './arithmetic.mjs';
import { generated, requestTokens, sceneIds, sections, storedTokens, tails } from './fixtures.mjs';
import { progress } from './construction.mjs';
import assert from 'node:assert/strict';
import { createCueTrack } from 'vizmatic';
export const tracks = Object.fromEntries(
  sceneIds.map((id) => [
    id,
    createCueTrack({
      initial: {
        id: `${id}-initial`,
        snapshot: {
          step: 0,
        },
      },
      cues: [0, 1, 2].map((step) => ({
        id: `${id}-${step}`,
        beat: step,
        at: 0,
        snapshot: {
          step,
        },
      })),
    }),
  ]),
);
export function scopedKey(session, clientLabel, version = 'guide 7', revision = 'model 7') {
  const authenticated = {
    'session A': 'tenant A',
    'session B': 'tenant B',
  }[session];
  if (!authenticated) throw new Error('Unauthenticated session');
  return {
    scope: authenticated,
    key: hash([authenticated, revision, version, storedTokens]),
  };
}
export function sampleModel(sceneId, state) {
  const { step } = tracks[sceneId].sample(state).snapshot;
  const p = progress(state.beatP ?? 0);
  if (sceneId === 'causal-keys') {
    const oldBlocks = ['instructions', 'guide 1', 'tools'];
    const newBlocks = step === 0 ? oldBlocks : ['instructions', 'guide 2', 'tools'];
    const oldKeys = chain(oldBlocks),
      keys = chain(newBlocks);
    const keyReady =
      step === 1 ? [true, state.beatP > 0.22, state.beatP > 0.55] : [true, true, true];
    return {
      step,
      p,
      oldBlocks,
      newBlocks,
      oldKeys,
      keys,
      keyReady,
      changed: keys.map((key, i) => key !== oldKeys[i]),
    };
  }
  if (sceneId === 'block-boundaries') {
    const tokens = [...requestTokens];
    if (step === 2) tokens[2] = 20;
    return {
      step,
      p,
      stored: storedTokens,
      tokens,
      exact: commonPrefix(storedTokens, tokens),
      reused: reusableTokens(storedTokens, tokens),
      blockSize: 4,
    };
  }
  if (sceneId === 'prompt-order') {
    const stable = step > 1 || (step === 1 && (state.beatP ?? 0) >= 0.96);
    const a = stable ? [...sections, 'ID A'] : ['ID A', ...sections];
    const b = stable ? [...sections, 'ID B'] : ['ID B', ...sections];
    return {
      step,
      p,
      a,
      b,
      settled: step !== 1 || stable,
      matched: commonPrefix(a, b),
    };
  }
  if (sceneId === 'publication') {
    const entries = new Set();
    if (step >= 1) entries.add(hash(['guide boundary', storedTokens]));
    const lookup = (tokens) => entries.has(hash(['guide boundary', tokens]));
    return {
      step,
      p,
      published: entries.size === 1,
      request: step === 0 ? 'R2' : step === 1 ? 'R1' : 'R3',
      hit: step === 2 && lookup(storedTokens),
    };
  }
  if (sceneId === 'isolation') {
    const a = scopedKey('session A', 'tenant A');
    const b = scopedKey(
      'session B',
      step > 0 ? 'tenant A' : 'tenant B',
      step === 2 ? 'guide 8' : 'guide 7',
    );
    return {
      step,
      p,
      a,
      b,
      clientLabel: step > 0 ? 'tenant A' : 'tenant B',
      same: a.key === b.key,
      version: step === 2 ? 'guide 8' : 'guide 7',
    };
  }
  if (sceneId === 'pool') {
    const blocks = Array.from(
      {
        length: 20,
      },
      (_, id) => ({
        id,
        state: id < 9 ? 'referenced' : id < 17 ? 'cached' : 'free',
        content: `old ${id}`,
      }),
    );
    const order = [17, 18, 19, 9, 10];
    const allocated = step === 0 ? 0 : step === 1 ? Math.floor(p * 5 + 1e-9) : 5;
    for (const id of order.slice(0, allocated))
      blocks[id] = {
        id,
        state: 'new',
        content: 'R4',
      };
    const referenced = blocks.filter(
      (block) => block.state === 'referenced' || block.state === 'new',
    ).length;
    const cached = blocks.filter((block) => block.state === 'cached').length;
    const free = blocks.filter((block) => block.state === 'free').length;
    const prefixOwners = step > 0 || p > 0.8 ? ['R3'] : p > 0.4 ? ['R1', 'R3'] : ['R1'];
    return {
      step,
      p,
      blocks,
      allocated,
      referenced,
      cached,
      free,
      available: cached + free,
      evicted: Math.max(0, allocated - 3),
      old9Present: blocks.some((block) => block.content === 'old 9'),
      prefixOwners,
      prefixRefs: prefixOwners.length,
    };
  }
  const count =
    sceneId === 'intro' ? step + 1 : step === 0 ? Math.min(3, 1 + Math.floor(p * 3)) : 3;
  const rows = tails.slice(0, count).map((tail, i) => ({
    id: `R${i + 1}`,
    tail,
    output: generated[i],
    reused: i === 0 ? 0 : 6000,
    fresh: tail + (i === 0 ? 6000 : 0),
  }));
  const cold = rows.reduce((sum, row) => sum + row.tail + 6000, 0);
  const fresh = rows.reduce((sum, row) => sum + row.fresh, 0);
  return {
    step,
    p,
    rows,
    cold,
    fresh,
    reused: cold - fresh,
    output: rows.reduce((sum, row) => sum + row.output, 0),
    total: cold,
    hits: rows.filter((row) => row.reused > 0).length,
  };
}
export function validateModel() {
  for (const id of sceneIds)
    for (let beat = 0; beat < 3; beat++)
      for (const beatP of [0, 0.12, 0.25, 0.5, 0.72, 0.99, 0.999999]) {
        const s = sampleModel(id, {
          beat,
          beatP,
        });
        assert.equal(s.step, beat);
        if (id === 'pool') {
          assert.equal(s.referenced + s.cached + s.free, 20);
          assert.equal(s.available, 11 - s.allocated);
          assert(s.blocks.slice(0, 9).every((block) => block.state === 'referenced'));
          assert.equal(s.evicted, Math.max(0, s.allocated - 3));
          assert.equal(s.prefixRefs, s.prefixOwners.length);
          assert(s.prefixRefs > 0);
        }
        if (id === 'block-boundaries')
          assert.deepEqual([s.exact, s.reused], beat === 2 ? [2, 0] : [9, 8]);
        if (id === 'isolation') assert(!s.same && s.b.scope === 'tenant B');
        if (id === 'intro' || id === 'savings') {
          assert.equal(s.fresh + s.reused, s.total);
          assert.equal(
            s.output,
            generated.slice(0, s.rows.length).reduce((sum, value) => sum + value, 0),
          );
        }
      }
  for (const id of sceneIds)
    for (let beat = 0; beat < 2; beat++)
      assert.equal(
        sampleModel(id, {
          beat,
          beatP: 1,
        }).step,
        beat + 1,
      );
  assert.deepEqual(
    sampleModel('causal-keys', {
      beat: 1,
      beatP: 0.999999,
    }).changed,
    [false, true, true],
  );
  assert.deepEqual(
    sampleModel('causal-keys', {
      beat: 1,
      beatP: 0.12,
    }).keyReady,
    [true, false, false],
  );
  assert.deepEqual(
    sampleModel('causal-keys', {
      beat: 1,
      beatP: 0.5,
    }).keyReady,
    [true, true, false],
  );
  assert.deepEqual(
    sampleModel('causal-keys', {
      beat: 1,
      beatP: 0.88,
    }).keyReady,
    [true, true, true],
  );
  assert.deepEqual(
    [0, 1, 2].map(
      (beat) =>
        sampleModel('publication', {
          beat,
          beatP: 0.999999,
        }).hit,
    ),
    [false, false, true],
  );
  const total = sampleModel('savings', {
    beat: 2,
    beatP: 1,
  });
  assert.deepEqual([total.cold, total.fresh, total.reused], [18136, 6136, 12000]);
  assert.equal(scopedKey('session A', 'tenant A').key, scopedKey('session A', 'forged').key);
  assert.notEqual(
    scopedKey('session A', '').key,
    scopedKey('session A', '', 'guide 7', 'model 8').key,
  );
  assert.throws(() => scopedKey('unknown', 'tenant A'), /Unauthenticated/);
  return true;
}
