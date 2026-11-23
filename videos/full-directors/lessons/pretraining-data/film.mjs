import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { filmFrame, state, total } from './art.mjs';
import intake, { program, archiveSpan, openingCut, filterState } from './intake.mjs';
import selection, { drawPolicy, encodeRotate, mergeCount } from './selection.mjs';
import stream, { packingState, trialState } from './stream.mjs';
import {
  corpus,
  scored,
  examples,
  prose,
  docs,
  ngrams,
  overlap,
  minima,
  matchingBands,
  claimSets,
  candidate,
  share,
  BPE_RULES,
  bpeReplay,
  trainingLines,
  input,
  segments,
  independentObjective,
  releaseEvaluation,
  releaseBatch,
  codeLines,
  nestedLines,
  order,
  restoreRecords,
  digest,
  shardBytes,
  packRecords,
  lengths,
  matrixBytes,
  codeTokens,
  englishCompression,
  preparationBranch,
  PROXY_RESULTS,
  cooldown,
} from './data.mjs';

const painters = [...intake, ...selection, ...stream];
function draw(ctx, clock) {
  filmFrame(ctx);
  painters[clock.beat.chapterIndex](ctx, state(clock));
}
const settled = (beat) => ({ beat, at: (n) => Number(beat >= n) });
function check() {
  assert.equal(painters.length, 26);
  const { htmlBody, start, end, lines } = archiveSpan;
  assert.equal(htmlBody.subarray(start - 5, start).toString(), '<pre>');
  assert.equal(htmlBody.subarray(end, end + 6).toString(), '</pre>');
  assert.deepEqual(lines, program);
  assert.equal(lines[1], '    return a + b');
  assert.deepEqual(
    [2, 3, 4].map((n) => openingCut(settled(n))),
    [0, 0.5, 0.85],
  );
  assert.deepEqual(
    [1, 2, 4, 5].map((n) => total(filterState(settled(n)).kept)),
    [800, 480, 800, 680],
  );
  assert.deepEqual(
    examples.map((text) => prose(text).count),
    [71, 4, 80, 125],
  );
  assert.deepEqual(
    examples.map((text) => prose(text).pass),
    [true, false, false, false],
  );
  assert.equal(total(scored.filter((r) => r.score >= 0.9)), 280);
  const passageSets = docs.map((t) => ngrams(t, 2)),
    { shared, union, ratio } = overlap(...passageSets);
  assert.deepEqual([shared.length, union.length, ratio], [6, 10, 0.6]);
  assert.deepEqual(matchingBands(minima[0], minima[1]), [1, 3]);
  assert.deepEqual(matchingBands(minima[0], minima[2]), []);
  assert.deepEqual(matchingBands(minima[1], minima[2]), []);
  for (const [i, rows] of minima.entries()) {
    assert.equal(rows.length, 32);
    for (const [hash, owner] of rows) {
      assert.match(hash, /^[a-f0-9]{16}$/);
      assert(passageSets[i].includes(owner));
    }
  }
  assert.deepEqual(
    [
      overlap(claimSets[0], claimSets[1]).ratio,
      overlap(claimSets[1], claimSets[2]).ratio,
      overlap(claimSets[0], claimSets[2]).ratio,
    ],
    [2 / 3, 2 / 3, 1 / 3],
  );
  assert.equal(candidate(0.5, 2, 4), 0.68359375);
  assert.equal(Math.round(candidate(0.5, 4, 8) * 100), 40);
  assert.equal(total(corpus), 1000);
  assert.equal(preparationBranch(0.5).tokens, 560);
  assert.equal(preparationBranch(0.85).tokens, 240);
  assert.deepEqual(
    [2, 3, 5, 6].map((i) => drawPolicy(settled(i)).sample.tokens),
    [
      [500, 4500],
      [900, 900],
      [900, 100],
      [500, 500],
    ],
  );
  assert.equal(Math.round(100 * share([0.8, 0.2], [100, 900])[0]), 31);
  assert.equal(matrixBytes(8000, 256, 2), 8192000);
  const line = codeTokens.map((token) => token.text).join('');
  assert.equal(line, program[1]);
  assert.deepEqual(codeTokens.map((token) => token.id), [262, 471, 264, 489, 293]);
  assert.deepEqual(codeTokens.map((token) => token.text.length), [3, 7, 2, 2, 2]);
  assert.equal(codeTokens[1].text, ' return');
  assert.equal(line.length / codeTokens.length, 3.2);
  assert.deepEqual(englishCompression, [3.17, 3.94]);
  const sample = ['rotate', 'keys', 'after', 'review'];
  const count = (w, k) => bpeReplay(w, BPE_RULES.slice(0, k)).flat().length;
  const train = trainingLines.join(' ').split(' ');
  assert.deepEqual(
    [count(train, 0), count(train, 8), count(sample, 0), count(sample, 8)],
    [94, 68, 25, 16],
  );
  assert.deepEqual(
    [2, 3, 4].map((n) => mergeCount(settled(n))),
    [0, 5, 8],
  );
  assert.deepEqual([5, 6, 7, 8].map((k) => count(sample, k)), [19, 18, 17, 16]);
  assert.deepEqual(bpeReplay(sample, BPE_RULES).map((pieces) => pieces.length), [3, 5, 1, 7]);
  assert.deepEqual(encodeRotate(BPE_RULES), [
    { piece: 'rota', id: 28 }, { piece: 'te', id: 21 }, { piece: '</w>', id: 5 },
  ]);
  assert.deepEqual(encodeRotate(BPE_RULES.slice(0, -1)), [
    { piece: 'ro', id: 23 }, { piece: 'ta', id: 22 }, { piece: 'te', id: 21 }, { piece: '</w>', id: 5 },
  ]);
  assert.deepEqual(
    packRecords(lengths).map((bin) => bin.map((v) => v.n)),
    [
      [7, 3],
      [6, 2],
      [5, 5],
    ],
  );
  assert.equal(packRecords(packingState(settled(4)).source).length, 3);
  const objective = independentObjective(input, segments);
  assert.deepEqual(objective.targets, [12, 99, -100, 99, -100]);
  assert.deepEqual(objective.labels, [11, 12, 99, -100, 99]);
  assert.equal(objective.mask[3][2], 0);
  assert.deepEqual(objective.targets.slice(0, -1), objective.labels.slice(1));
  assert.equal(objective.labels.slice(1).filter((v) => v !== -100).length, 3);
  const restored = restoreRecords(order, 2, 4);
  assert.deepEqual(restored.suffix, [1, 2, 3, 4]);
  assert.deepEqual(restored.skippedByReader, [1, 2]);
  assert.deepEqual([...restored.prefix, ...restored.suffix], order);
  assert.notEqual(digest(shardBytes), digest(shardBytes + 'changed'));
  assert.deepEqual(
    [1, 2, 6].map((n) => total(trialState(settled(n)).kept)),
    [600, 180, 300],
  );
  assert.deepEqual(
    [settled(2), settled(6)].map((s) => trialState(s).kept.map((r) => r.id)),
    [['Docs'], ['Code', 'Docs']],
  );
  assert.equal(total(releaseBatch), 600);
  assert.deepEqual(releaseEvaluation.tasks, ['Docs', 'Code']);
  assert.deepEqual(
    [releaseEvaluation.casesPerTask, releaseEvaluation.codeFloor],
    [20, 16],
  );
  assert.deepEqual(
    [releaseEvaluation.baseline, releaseEvaluation.candidate],
    [[16, 17], [19, 15]],
  );
  assert.equal(releaseEvaluation.codeFloor - releaseEvaluation.candidate[1], 1);
  assert(cooldown.candidate[1] < cooldown.floor);
  assert.deepEqual(
    Object.values(PROXY_RESULTS).map((a) => a.filter(Boolean).length),
    [7, 5],
  );
  const probe = spawnSync(
    'python3',
    [
      '-I',
      '-S',
      '-c',
      [
        'import json, sys, hashlib, random',
        'program, left, right, sets, signatures, expected_order = json.load(sys.stdin)',
        'def run(lines, fn, args):',
        '    env = {}',
        '    exec("\\n".join(lines), env)',
        '    return env[fn](*args)',
        'assert run(program, "add", [2, 3]) == 5',
        'try: compile("\\n".join(x.lstrip() for x in program), "<extract>", "exec")',
        'except IndentationError as e: assert e.lineno == 2',
        'else: raise AssertionError("Expected indentation failure")',
        'assert run(left, "decide", [False]) == 2 and run(right, "decide", [False]) is None',
        'assert [x.strip() for x in left] == [x.strip() for x in right]',
        'for items, signature in zip(sets, signatures):',
        '    for salt, row in enumerate(signature):',
        '        assert tuple(row) == min((hashlib.blake2b(f"{salt}|{item}".encode(), digest_size=8).hexdigest(), item) for item in items)',
        'order = list(range(6))',
        'random.Random(17).shuffle(order)',
        'assert order == expected_order',
      ].join('\n'),
    ],
    {
      input: JSON.stringify([program, codeLines, nestedLines, passageSets, minima, order]),
      encoding: 'utf8',
      timeout: 5000,
    },
  );
  if (probe.error) throw probe.error;
  assert.equal(probe.status, 0, probe.stderr);
}
export default { title: 'From Raw Records to a Reproducible Training Stream', draw, check };
