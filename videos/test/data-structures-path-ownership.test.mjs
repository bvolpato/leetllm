import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { CUE_ONSET_GRACE_SECONDS } from '../lib/narration-cue-audit.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import { fileURLToPath } from 'node:url';
import {
  MESSAGES,
  UPDATED_MESSAGES,
  QUERY,
  buildIndex,
  scoreRows,
  indexedScores,
  rank,
  search,
  heapTrace,
  ownershipSnapshot,
  eligibleTopK,
  breadthFirstTrace,
  capacityState,
  appendWorksheetState,
  collisionWorksheet,
  permittedFreshRanking,
  q,
  draw,
} from '../animations/ai-data-structures.mjs';

registerLessonFonts();
const reference = JSON.parse(
  fs.readFileSync(new URL('./fixtures/ai-data-structures-reference.json', import.meta.url)),
);
const cue = (progress) => ({
  phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
  progress,
  active: progress > 0 && progress < 1,
  reveal: 1,
  strength: 0,
});
function paint(id, beat, values = {}) {
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  const state = {
    beat,
    beatP: 0.5,
    t: 20,
    duration: 40,
    opacity: 1,
    cues: Object.fromEntries(Object.entries(values).map(([key, p]) => [key, cue(p)])),
  };
  const audit = drawFrame(
    ctx,
    { id: 'ai-data-structures' },
    { id, title: 'Which notes should the assistant read?' },
    state,
    draw,
  );
  assert.deepEqual(layoutIssues(audit), [], id + ' native geometry');
  return { audit, state, ctx };
}
const visible = (audit) => audit.labels.filter((label) => label.alpha > 0.9);

test('scan and postings agree with raw-record Python reference including repeated terms and corpus edits', () => {
  const serial = (index) =>
    Object.fromEntries([...index].map(([word, ids]) => [word, [...ids].sort((a, b) => a - b)]));
  assert.deepEqual(serial(buildIndex()), reference.index);
  assert.deepEqual(scoreRows(), reference.scores);
  assert.deepEqual(rank(indexedScores(buildIndex())), rank(reference.scores));
  assert.deepEqual(search(), reference.ranking.slice(0, 2));
  assert.deepEqual(search(MESSAGES, 'CHARGED charged twice'), reference.ranking.slice(0, 2));
  assert.deepEqual(search(MESSAGES, 'unseen'), []);
  assert.deepEqual(serial(buildIndex(UPDATED_MESSAGES)), reference.updatedIndex);
  assert.deepEqual(search(UPDATED_MESSAGES), reference.updatedTop2);
  assert.equal(QUERY, reference.query);
});

test('bounded heap rejects zero-score arrivals and retains the heapq winners under score ties', () => {
  for (const [order, expected] of [
    [[3, 2, 0, 1], reference.heapDefault],
    [[1, 3, 2, 0], reference.heapZeroFirst],
  ]) {
    const actual = heapTrace(scoreRows(), order);
    assert.deepEqual(
      actual.map((row) => ({
        incomingId: row.incoming.id,
        action: row.action,
        storage: row.after.map((r) => r.id),
        ranked: row.winners.map((r) => r.id),
      })),
      expected,
    );
  }
  assert.deepEqual(
    heapTrace(scoreRows(), [3, 2, 0, 1], 0).map((row) => row.after),
    [[], [], [], []],
  );
  assert.deepEqual(heapTrace()[2].swaps, [[0, 1]]);
});

test('graph discovery and bounded queue retain identity, skip cycles and wait for a capacity release', () => {
  assert.deepEqual(breadthFirstTrace().slice(1), reference.breadthFirstTrace);
  assert(reference.queue.thirdPutRaisesFull);
  assert.deepEqual(capacityState(false, false).slots, [3, 4]);
  assert.deepEqual(capacityState(true, false).logicalOrder, [4]);
  assert.deepEqual(capacityState(true, false).pending, [5]);
  assert.equal(capacityState(true, false).claimed, reference.queue.claimed);
  assert.deepEqual(capacityState(true, true).logicalOrder, reference.queue.afterClaimAndAdmission);
  assert.deepEqual(capacityState(true, true).slots, [5, 4]);
});

test('request-local mutation protects cached IDs and permission filtering fills the available result slots', () => {
  const alias = ownershipSnapshot('alias', true),
    own = ownershipSnapshot('copy', true);
  assert(alias.sharesList);
  assert.deepEqual(alias.nextCaller, [2]);
  assert(!own.sharesList);
  assert.deepEqual(own.request, [2]);
  assert.deepEqual(own.stored, [0, 2]);
  assert.deepEqual(own.nextCaller, [0, 2]);
  assert.notEqual(own.stored, own.nextCaller);
  const actual = eligibleTopK();
  assert.deepEqual(
    actual.selectedThenFiltered.map((r) => r.id),
    reference.eligibleAfterTop2,
  );
  assert.deepEqual(
    actual.filteredThenSelected.map((r) => r.id),
    reference.eligibleBeforeTop2,
  );
});

test('an LRU insertion keeps the complete incoming cache card inside the canvas from its first visible frame', () => {
  for (const progress of [0.75250001, 0.7526, 0.753, 0.76, 0.8, 0.95, 1]) {
    const { audit } = paint('cache-recency', 1, { 'ds-cache-recency-1': progress });
    assert(visible(audit).some((label) => label.text === 'sign · includes M2'));
  }
  const complete = paint('cache-recency', 1, { 'ds-cache-recency-1': 1 }).audit;
  assert(!visible(complete).some((label) => label.text === 'twice'));
  const charged = visible(complete).find((label) => label.text === 'charged');
  const sign = visible(complete).find((label) => label.text === 'sign · includes M2');
  assert(charged.y < sign.y, 'the retained charged entry precedes the newly inserted sign entry');
});

test('front insertion shifts every retained reference and admits the new identity only after its slot clears', () => {
  for (const progress of [0, 0.3, 0.6, 0.9, 1]) {
    const { audit, state, ctx } = paint('list', 2, { 'list-shift': progress }),
      shift = q(state, 'list-shift', 2);
    for (let id = 0; id < 4; id++) {
      const target = audit.targets.find((t) => t.id === 'list-ref-' + id);
      assert(target?.alpha > 0.9);
      assert(Math.abs(target.x - (180 + (id + shift) * 285)) < 1e-8);
    }
    const inserted = visible(audit).find((l) => l.text === 'M4');
    if (shift <= 0.84) assert(!inserted, 'new identity waits for its cleared front slot');
    else {
      assert(inserted);
      assert(inserted.x < audit.targets.find((t) => t.id === 'list-ref-0').x);
    }
    if (progress === 1) {
      assert(visible(audit).some((l) => l.text === 'New request'));
      const data = ctx.getImageData(180, 520, 230, 78).data;
      assert(
        data.some((value, i) => i % 4 === 1 && value > 150 && data[i - 1] < value * 0.9),
        'front item has real green paint',
      );
    }
  }
});

test('list growth copies each reference while the full old array remains intact, then appends M3', () => {
  const states = [
    [0, 1, 1260],
    [0.5, 1, 1260],
    [1, 0, 1260],
    [1, 0.5, 1110],
    [1, 1, 960],
  ];
  for (const [grow, append, expectedM3X] of states) {
    const { audit, state } = paint('list', 1, { 'list-grow': grow, 'list-append': append });
    const copied = q(state, 'list-grow', 1),
      m3 = audit.targets.find((target) => target.id === 'list-ref-3');
    assert(m3, 'incoming identity has a visible focused target');
    assert(
      Math.abs(m3.x - expectedM3X) < 6,
      'M3 stays in its incoming lane until copying finishes',
    );
    for (let id = 0; id < 3; id++) {
      const source = audit.targets.find((item) => item.id === 'list-old-ref-' + id);
      assert.equal(
        Boolean(source),
        copied < 1,
        `old reference M${id} remains until every copy finishes`,
      );
      if (source) {
        assert.equal(source.x, 180 + id * 260);
        assert.equal(
          source.y,
          385,
          'the source array retains its reference while the copy travels',
        );
      }
      const copyProgress = Math.max(0, Math.min(1, (copied - id * 0.18) / 0.56));
      const copy = audit.targets.find((item) => item.id === 'list-copy-ref-' + id);
      assert.equal(
        Boolean(copy),
        copyProgress > 0.08,
        'each copied reference appears after it clears the source box',
      );
      if (copy) {
        const expectedY = 467 + (630 - 467) * copyProgress;
        assert(
          Math.abs(copy.y - expectedY) < 1e-8,
          `M${id} copy reaches the larger array at the measured progress`,
        );
        assert(copy.y >= 463 + 4, 'the moving copy clears the old reference box before appearing');
      }
    }
    assert.equal(visible(audit).filter((label) => label.text === 'M3').length, 1);
    assert.equal(
      visible(audit).some((label) => label.text === 'Incoming reference'),
      expectedM3X !== 960,
    );
  }
  const complete = paint('list', 1, { 'list-grow': 1, 'list-append': 1 }).audit;
  assert(
    visible(complete).some((label) => label.text === 'slot 3'),
    'the appended reference lands in slot 3',
  );
});

test('heap prediction holds both old winners and the actual parent-child positions follow replacement and sift', () => {
  const prediction = paint('heap', 2).audit;
  for (const label of ['M3 · score 1', 'M2 · score 2', 'M0 · score 2'])
    assert(visible(prediction).some((l) => l.text === label));
  assert(!visible(prediction).some((l) => l.text.startsWith('Ranked output:')));
  const held = paint('heap', 3, { 'heap-replace': 1, 'heap-sift': 1 }).audit;
  const root = visible(held).find((l) => l.text === 'M2 · score 2'),
    child = visible(held).find((l) => l.text === 'M0 · score 2');
  assert(root.x > 1000 && root.x < 1270 && root.y > 380 && root.y < 470);
  assert(child.x > 1280 && child.x < 1550 && child.y > 650 && child.y < 740);
  assert(!visible(held).some((l) => l.text === 'M3 · score 1'));
});

test('heap replacement leaves the root unattached until the incoming identity occupies its slot', () => {
  for (const progress of [0, 0.25, 0.5, 0.75, 0.9]) {
    const audit = paint('heap', 3, { 'heap-replace': progress, 'heap-sift': 0 }).audit;
    assert(
      visible(audit).some(
        (l) => l.text === 'M2 · score 2' && l.x > 1280 && l.x < 1550 && l.y > 650 && l.y < 740,
      ),
    );
    assert.equal(
      audit.connectors.filter((c) => c.kind === 'connect').length,
      0,
      'a moving candidate must not appear attached to the child before it reaches the root',
    );
    if (progress >= 0.5)
      assert(
        visible(audit).some((l) => l.text === 'M0 · score 2'),
        'the incoming winner stays visible while traveling into the root',
      );
  }
  const seated = paint('heap', 3, { 'heap-replace': 1, 'heap-sift': 0 }).audit;
  const root = visible(seated).find((l) => l.text === 'M0 · score 2');
  assert(root && root.x > 1000 && root.x < 1270 && root.y > 380 && root.y < 470);
  assert.equal(
    seated.connectors.filter((c) => c.kind === 'connect').length,
    1,
    'the parent edge returns after M0 occupies the actual root slot',
  );
});

test('repeated rendered occurrences raise frequency while retaining exactly one set membership', () => {
  for (const [progress, count] of [
    [0, 1],
    [1, 2],
  ]) {
    const audit = paint('membership', 1, {
      'membership-first': 1,
      'membership-second': progress,
    }).audit;
    assert(visible(audit).some((l) => l.text === 'Frequency: ' + count));
    assert.equal(
      visible(audit).filter((l) => l.text === '{ M0 }').length,
      reference.twiceFirstMembershipCount,
    );
  }
  for (let frame = 0; frame <= 60; frame++) {
    paint('membership', 0, { 'membership-first': frame / 60, 'membership-second': 0 });
    paint('membership', 1, { 'membership-first': 1, 'membership-second': frame / 60 });
  }
});

test('the same document ID travels to separate postings without colliding with its other reference', () => {
  for (let frame = 0; frame <= 80; frame++)
    paint('scan-index', 1, { 'index-second-source': 1, 'index-second': frame / 80 });
});

test('synchronized claim transfers M3 before Worker A attempts and receives Empty', async () => {
  const positions = [];
  for (const progress of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
    const audit = paint('workers', 2, {
      'worker-claim-contract': progress,
      'worker-claim-empty': 0,
      'worker-claim-earlier-check': 0,
      'worker-claim-no-reservation': 0,
    }).audit;
    const m3 = visible(audit).find((label) => label.text === 'M3');
    assert(m3, 'the claimed identity stays visible through transfer');
    positions.push(m3.x);
    assert(visible(audit).some((label) => label.text === 'Earlier check: nonempty'));
    assert(!visible(audit).some((label) => label.text === 'get_nowait() attempt'));
    assert(!visible(audit).some((label) => label.text === 'Empty'));
  }
  assert(
    positions.every((x, index) => index === 0 || x > positions[index - 1]),
    'M3 moves from the queue into Worker B',
  );
  const claimed = paint('workers', 2, {
    'worker-claim-contract': 1,
    'worker-claim-empty': 0,
    'worker-claim-earlier-check': 0,
    'worker-claim-no-reservation': 0,
  }).audit;
  assert(visible(claimed).some((label) => label.text === 'Queue empty'));
  assert(visible(claimed).some((label) => label.text === 'Claimed with get_nowait()'));
  assert(visible(claimed).some((label) => label.text === 'M3' && label.x > 710 && label.x < 1210));
  assert(!visible(claimed).some((label) => label.text === 'Empty'));
  const attempting = paint('workers', 2, {
    'worker-claim-contract': 1,
    'worker-claim-empty': 0.38,
    'worker-claim-earlier-check': 0,
    'worker-claim-no-reservation': 0,
  }).audit;
  const attemptLabels = visible(attempting).map((label) => label.text);
  assert(attemptLabels.includes('get_nowait() attempt'));
  assert(!attemptLabels.includes('Empty'), 'the attempt precedes its returned result');
  const attempted = paint('workers', 2, {
    'worker-claim-contract': 1,
    'worker-claim-empty': 1,
    'worker-claim-earlier-check': 1,
    'worker-claim-no-reservation': 1,
  }).audit;
  const labels = visible(attempted).map((label) => label.text);
  assert.equal(labels.filter((label) => label === 'M3').length, 1);
  for (const label of ['Earlier check: nonempty', 'Snapshot · no job reserved', 'Empty'])
    assert(labels.includes(label), label + ' is shown after Worker B owns M3');
  assert(!labels.includes('get_nowait() attempt'), 'the result replaces the completed attempt');

  const lesson = await readLesson(
    new URL('../lessons/ai-data-structures.lesson.yaml', import.meta.url),
    fileURLToPath(new URL('../../', import.meta.url)),
  );
  const measured = await loadMeasuredTimeline('ai-data-structures');
  const scene = lesson.scenes.find((item) => item.id === 'workers'),
    timing = measured.scenes.find((item) => item.id === 'workers');
  const cues = resolveSceneCues(scene, timing),
    ids = [
      'worker-claim-contract',
      'worker-claim-empty',
      'worker-claim-earlier-check',
      'worker-claim-no-reservation',
    ];
  const ranges = ids.map((id) => cues.find((cue) => cue.id === id));
  assert(ranges.every(Boolean), 'each ownership transition has a measured narration cue');
  assert(
    ranges.every((range, index) => index === 0 || range.start > ranges[index - 1].start),
    'claim, empty result, stale check and no-reservation cues follow the narration',
  );
});

test('completed trie has eight attached edges and three marked word completions', () => {
  const before = paint('trie', 0, { 'trie-prefix': 0, 'trie-output': 0 }).audit;
  assert(!visible(before).some((l) => l.text.endsWith('[end]')));
  const after = paint('trie', 1, { 'trie-prefix': 1, 'trie-output': 1 }).audit;
  assert.equal(after.connectors.filter((c) => c.kind === 'connect').length, 8);
  assert.deepEqual(
    visible(after)
      .filter((l) => l.text.endsWith('[end]'))
      .map((l) => l.text),
    ['charge [end]', 'charged [end]', 'charges [end]'],
  );
});

test('four notes arrive before the search cue and each reply slot fills when its ID is named', async () => {
  const lesson = await readLesson(
    new URL('../lessons/ai-data-structures.lesson.yaml', import.meta.url),
    fileURLToPath(new URL('../../', import.meta.url)),
  );
  const opening = lesson.scenes.find((scene) => scene.id === 'opening'),
    sceneIndex = lesson.scenes.indexOf(opening),
    timing = (await loadMeasuredTimeline('ai-data-structures')).scenes.find(
      (scene) => scene.id === 'opening',
    );
  assert(timing.duration <= 13.5, 'the measured opening stays within the requested short setup');
  assert.equal(opening.beats.length, 4);
  assert.equal(opening.beats[0].visual_cues[0].id, 'opening-question');
  assert.equal(opening.beats[1].visual_cues[0].id, 'opening-records');
  const beforeQuestion = paint('opening', 0, {
    'opening-question': 0,
    'opening-records': 0,
    'opening-predict': 0,
    'opening-first': 0,
    'opening-second': 0,
  }).audit;
  const afterQuestion = paint('opening', 0, {
    'opening-question': 1,
    'opening-records': 0,
    'opening-predict': 0,
    'opening-first': 0,
    'opening-second': 0,
  }).audit;
  for (const id of [0, 1, 2, 3]) {
    const before = beforeQuestion.targets.find((target) => target.id === 'opening-note-' + id),
      after = afterQuestion.targets.find((target) => target.id === 'opening-note-' + id);
    assert(before && after, 'each note has a tracked target');
    assert(after.alpha > 0.99, 'M' + id + ' is fully visible before the next narration beat');
    assert(after.y < before.y, 'M' + id + ' enters during the query phrase');
  }
  const measured = {
    ...timing,
    visualCues: resolveSceneCues(opening, timing),
    cueTiming: 'provider-words',
  };
  const recordCue = measured.visualCues.find((cue) => cue.id === 'opening-records');
  assert(recordCue, 'the four-note cue has measured provider word timing');
  const firstFrame = Math.ceil((recordCue.start + CUE_ONSET_GRACE_SECONDS) * timing.fps),
    lastFrame = Math.ceil(recordCue.end * timing.fps);
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d'),
    messageText = [
      'My card was charged twice. I checked the statement twice.',
      'I cannot sign in.',
      'I was charged twice after changing plans.',
      'The account was charged once.',
    ];
  for (let frame = firstFrame; frame < lastFrame; frame++) {
    const state = frameState(measured, frame / timing.fps, sceneIndex, lesson.scenes.length),
      audit = drawFrame(ctx, lesson, opening, state, draw);
    assert.deepEqual(
      layoutIssues(audit),
      [],
      'opening geometry remains valid across the spoken note cue',
    );
    const labels = visible(audit).map((label) => label.text),
      normalizedPaintedText = labels.join('').replace(/\s/g, '').toLocaleLowerCase('en');
    for (const id of [0, 1, 2, 3]) {
      const target = audit.targets.find((item) => item.id === 'opening-note-' + id);
      assert(
        target?.alpha >= 0.99,
        'M' + id + ' remains fully opaque during the search instruction',
      );
      assert(
        labels.includes('M' + id),
        'M' + id + ' remains readable during the search instruction',
      );
      assert(
        normalizedPaintedText.includes(messageText[id].replace(/\s/g, '').toLocaleLowerCase('en')),
        'M' + id + ' complete message remains readable during the search instruction',
      );
    }
  }
  const beforeMatches = paint('opening', 2, {
    'opening-question': 1,
    'opening-records': 1,
    'opening-predict': 1,
    'opening-first': 0,
    'opening-second': 0,
  });
  const afterMatches = paint('opening', 2, {
    'opening-question': 1,
    'opening-records': 1,
    'opening-predict': 1,
    'opening-first': 1,
    'opening-second': 1,
  });
  const last = afterMatches.audit;
  const labels = visible(last).map((label) => label.text);
  for (const id of [0, 1, 2, 3]) assert(labels.includes('M' + id));
  const replyIdsAt = (seconds) => {
    const state = frameState(measured, seconds, sceneIndex, lesson.scenes.length);
    const frame = drawFrame(ctx, lesson, opening, state, draw);
    const slots = frame.targets.filter((t) =>
      ['opening-first-slot', 'opening-second-slot'].includes(t.id),
    );
    assert.equal(slots.length, 2);
    return visible(frame)
      .filter(
        (label) =>
          /^M\d+$/.test(label.text) &&
          slots.some((slot) => label.x >= slot.x && label.x + label.width <= slot.x + slot.width),
      )
      .sort((a, b) => a.x - b.x)
      .map((label) => label.text);
  };
  const firstName = measured.visualCues.find((cue) => cue.id === 'opening-first');
  const secondName = measured.visualCues.find((cue) => cue.id === 'opening-second');
  assert.deepEqual(replyIdsAt(firstName.start - 1 / timing.fps), []);
  assert.deepEqual(replyIdsAt(firstName.end), ['M0']);
  assert.deepEqual(replyIdsAt(secondName.end), ['M0', 'M2']);
  for (const id of [
    'opening-match-0-charged',
    'opening-match-2-charged',
    'opening-match-3-charged',
    'opening-match-0-twice',
    'opening-match-2-twice',
  ]) {
    const before = beforeMatches.audit.targets.find((target) => target.id === id),
      after = last.targets.find((target) => target.id === id);
    assert(after?.alpha > 0.9, id + ' is visibly matched in a note');
    const x = Math.max(0, Math.floor(after.x)),
      y = Math.max(0, Math.floor(after.y));
    const width = Math.max(1, Math.ceil(after.width)),
      height = Math.max(1, Math.ceil(after.height));
    const a = beforeMatches.ctx.getImageData(x, y, width, height).data,
      b = afterMatches.ctx.getImageData(x, y, width, height).data;
    assert(
      a.some((value, index) => value !== b[index]),
      id + ' changes color when its spoken match cue arrives',
    );
    assert(
      before?.width === after.width && before?.height === after.height,
      id + ' stays attached to the same word',
    );
  }
  assert(
    !last.targets.some((target) => target.id.startsWith('opening-match-1-')),
    'the unrelated sign-in note does not receive query-term highlights',
  );
});

test('cache freshness presents edit, publication, miss, ranking and storage as separate states', () => {
  const edit = visible(
    paint('cache-freshness', 0, { 'freshness-edit': 1, 'freshness-postings': 0 }).audit,
  )
    .filter((label) => label.y < 900)
    .map((label) => label.text);
  assert(edit.includes('I can sign in after changing plans.'));
  assert(!edit.some((label) => label.includes('v7') || label.includes('Query key')));
  const postings = visible(
    paint('cache-freshness', 0, { 'freshness-edit': 1, 'freshness-postings': 1 }).audit,
  )
    .filter((label) => label.y < 900)
    .map((label) => label.text);
  assert(postings.includes('Current postings: charged {M0, M3} · twice {M0}'));
  assert(!postings.some((label) => label.includes('v7') || label.includes('Query key')));
  const publish = visible(
    paint('cache-freshness', 1, { 'freshness-publish': 1, 'freshness-miss': 0 }).audit,
  )
    .filter((label) => label.y < 900)
    .map((label) => label.text);
  assert(publish.includes('Edited notes'));
  assert(publish.includes('Matching index'));
  assert(publish.includes('v8'));
  assert(!publish.some((label) => label.includes('Query key') || label === 'MISS'));
  const miss = visible(
    paint('cache-freshness', 1, { 'freshness-publish': 1, 'freshness-miss': 1 }).audit,
  )
    .filter((label) => label.y < 900)
    .map((label) => label.text);
  assert(miss.includes('v8 · charged twice · top 2 · scope A'));
  assert(miss.includes('Cached v7 result · M0, M2'));
  assert(miss.includes('MISS'));
  assert(!miss.some((label) => label.includes('Fresh ranking') || label.startsWith('M0 ·')));
  const ranked = visible(
    paint('cache-freshness', 2, {
      'freshness-publish': 1,
      'freshness-miss': 1,
      'freshness-recompute': 1,
      'freshness-store': 0,
    }).audit,
  )
    .filter((label) => label.y < 900)
    .map((label) => label.text);
  assert(ranked.includes('M0'));
  assert(ranked.includes('M3'));
  assert(ranked.includes('2'));
  assert(ranked.includes('1'));
  assert(!ranked.some((label) => label.includes('v7') || label === 'MISS'));
  const stored = visible(
    paint('cache-freshness', 2, {
      'freshness-publish': 1,
      'freshness-miss': 1,
      'freshness-recompute': 1,
      'freshness-store': 1,
    }).audit,
  )
    .filter((label) => label.y < 900)
    .map((label) => label.text);
  assert(stored.includes('Key · v8 / charged twice / k=2 / scope A'));
  assert(stored.includes('Value · M0, M3'));
  assert(stored.includes('Bounded capacity · evict older entries'));
  assert(!stored.some((label) => label.includes('v7') || label.includes('M0, M2')));
});

test('measured cache cue frames match the active operation without retaining completed states', async () => {
  const lesson = await readLesson(
    new URL('../lessons/ai-data-structures.lesson.yaml', import.meta.url),
    fileURLToPath(new URL('../../', import.meta.url)),
  );
  const index = lesson.scenes.findIndex((s) => s.id === 'cache-freshness'),
    scene = lesson.scenes[index];
  const timing = (await loadMeasuredTimeline('ai-data-structures')).scenes.find(
    (s) => s.id === scene.id,
  );
  timing.visualCues = resolveSceneCues(scene, timing);
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  const edit = timing.visualCues.find((c) => c.id === 'freshness-edit');
  const postings = timing.visualCues.find((c) => c.id === 'freshness-postings');
  const publication = timing.visualCues.find((c) => c.id === 'freshness-publish');
  const miss = timing.visualCues.find((c) => c.id === 'freshness-miss');
  const recompute = timing.visualCues.find((c) => c.id === 'freshness-recompute');
  const store = timing.visualCues.find((c) => c.id === 'freshness-store');
  for (const [time, required, forbidden] of [
    [edit.end + 1 / 30, 'I can sign in after changing plans.', 'Query key'],
    [postings.end + 1 / 30, 'Current postings: charged {M0, M3} · twice {M0}', 'v7'],
    [(publication.start + publication.end) / 2, 'Matching index', 'MISS'],
    [miss.end + 1 / 30, 'MISS', 'M0 · 2'],
    [(recompute.start + recompute.end) / 2, 'RANK FROM THE CURRENT POSTINGS', 'v7'],
    [store.end + 1 / 30, 'Value · M0, M3', 'M0, M2'],
  ]) {
    const a = drawFrame(
        ctx,
        lesson,
        scene,
        frameState(timing, time, index, lesson.scenes.length),
        draw,
      ),
      labels = a.labels.filter((l) => l.alpha > 0.25 && l.y < 900).map((l) => l.text);
    assert.deepEqual(layoutIssues(a), []);
    assert(labels.includes(required));
    assert(!labels.some((label) => label.includes(forbidden)));
  }
});

test('measured occurrence, worker and permission arrivals retain visible text throughout their actual cue frames', async () => {
  const lesson = await readLesson(
    new URL('../lessons/ai-data-structures.lesson.yaml', import.meta.url),
    fileURLToPath(new URL('../../', import.meta.url)),
  );
  const measured = await loadMeasuredTimeline('ai-data-structures');
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  for (const id of ['membership', 'workers', 'eligibility']) {
    const index = lesson.scenes.findIndex((s) => s.id === id),
      scene = lesson.scenes[index],
      timing = measured.scenes.find((s) => s.id === id);
    timing.visualCues = resolveSceneCues(scene, timing);
    const until = id === 'workers' ? timing.beats[0].until : timing.duration;
    for (let frame = 0; frame < Math.floor(until * 30); frame++) {
      const a = drawFrame(
        ctx,
        lesson,
        scene,
        frameState(timing, frame / 30, index, lesson.scenes.length),
        draw,
      );
      assert.deepEqual([...a.issues, ...layoutIssues(a)], [], id + ' measured frame ' + frame);
    }
  }
});

test('measured heap eviction retains legible actors as the occupied root is released', async () => {
  const lesson = await readLesson(
    new URL('../lessons/ai-data-structures.lesson.yaml', import.meta.url),
    fileURLToPath(new URL('../../', import.meta.url)),
  );
  const measured = await loadMeasuredTimeline('ai-data-structures'),
    index = lesson.scenes.findIndex((s) => s.id === 'heap'),
    scene = lesson.scenes[index],
    timing = measured.scenes.find((s) => s.id === 'heap');
  timing.visualCues = resolveSceneCues(scene, timing);
  const range = timing.visualCues.find((c) => c.id === 'heap-replace'),
    canvas = createCanvas(1920, 1080);
  for (
    let frame = Math.floor(range.start * 30) - 1;
    frame <= Math.ceil(range.end * 30) + 1;
    frame++
  ) {
    const a = drawFrame(
      canvas.getContext('2d'),
      lesson,
      scene,
      frameState(timing, frame / 30, index, lesson.scenes.length),
      draw,
    );
    assert.deepEqual(
      [...a.issues, ...layoutIssues(a)],
      [],
      'heap eviction measured frame ' + frame,
    );
  }
});

test('a claimed queue identity remains visibly owned while later waiting jobs retain their positions', () => {
  const claimed = paint('queue', 1, { 'queue-claim': 1, 'queue-list-shift': 0 }).audit;
  assert(
    visible(claimed).some((l) => l.text === 'M0' && l.x > 1500 && l.y > 500 && l.y < 620),
    'claimed identity survives in the worker area during the comparison beat',
  );
  const capacity = paint('workers', 1, {
    'capacity-wait': 1,
    'capacity-claim': 1,
    'capacity-admit': 1,
  }).audit;
  for (const id of [3, 4, 5])
    assert(
      visible(capacity).some((l) => l.text === 'M' + id),
      'retained claimed or waiting M' + id,
    );
  const labels = visible(capacity);
  assert(labels.find((l) => l.text === 'M3').y > labels.find((l) => l.text === 'M4').y);
  for (const [duplicate, cycle, id] of [
    [0, 0, 0],
    [1, 0, 2],
    [1, 1, 3],
  ]) {
    const a = paint('graph', 1, {
      'graph-discover': 1,
      'graph-duplicate': duplicate,
      'graph-cycle': cycle,
    }).audit;
    assert(
      visible(a).some(
        (l) => l.text === 'M' + id && l.x > 300 && l.x < 530 && l.y > 520 && l.y < 600,
      ),
      'active expansion retains its claimed M' + id,
    );
  }
});

test('queue comparison keeps its narrated array target within frame bounds during removal and shifts', async () => {
  const lesson = await readLesson(
    new URL('../lessons/ai-data-structures.lesson.yaml', import.meta.url),
    fileURLToPath(new URL('../../', import.meta.url)),
  );
  const measured = await loadMeasuredTimeline('ai-data-structures'),
    index = lesson.scenes.findIndex((scene) => scene.id === 'queue'),
    scene = lesson.scenes[index],
    timing = measured.scenes.find((item) => item.id === 'queue');
  timing.visualCues = resolveSceneCues(scene, timing);
  const cue = timing.visualCues.find((item) => item.id === 'queue-list-shift'),
    first = Math.ceil((cue.start + CUE_ONSET_GRACE_SECONDS) * timing.fps),
    last = Math.ceil(cue.end * timing.fps),
    canvas = createCanvas(1920, 1080);
  for (let frame = first; frame < last; frame++) {
    const audit = drawFrame(
        canvas.getContext('2d'),
        lesson,
        scene,
        frameState(timing, frame / timing.fps, index, lesson.scenes.length),
        draw,
      ),
      target = audit.targets.find((item) => item.id === 'queue-array');
    assert(target, 'the narrated list comparison retains its semantic target');
    assert(
      target.x >= -0.5 &&
        target.y >= -0.5 &&
        target.x + target.width <= 1920.5 &&
        target.y + target.height <= 1080.5,
      'the outgoing reference stays inside the canvas while the surviving references shift',
    );
  }
  const at = (fraction) =>
    drawFrame(
      canvas.getContext('2d'),
      lesson,
      scene,
      frameState(timing, cue.start + (cue.end - cue.start) * fraction, index, lesson.scenes.length),
      draw,
    );
  const leaving = visible(at(0.2));
  assert(
    leaving.some((label) => label.text === 'M0 leaves the active list'),
    'the exiting reference is identified during its departure',
  );
  assert(
    leaving.some((label) => label.text === 'M2' && label.x > 800),
    'survivors hold their slots until the removal finishes',
  );
  const removal = visible(at(0.3)),
    removing = removal.find((label) => label.text === 'M0');
  assert(
    removal.some((label) => label.text === 'Removed from list'),
    'the removal tray appears as M0 leaves the active list',
  );
  assert(
    removing && removing.x >= 60 && removing.x < 350,
    'M0 is settled inside the labeled tray before survivors shift',
  );
  assert(
    removal.some((label) => label.text === 'M2' && label.x > 800),
    'M2 waits in its original slot during removal',
  );
  const shifting = visible(at(0.65));
  assert(
    shifting.some((label) => label.text === 'M0' && label.x < 250),
    'M0 is settled in the removed tray',
  );
  assert(
    shifting.some((label) => label.text === 'M2' && label.x > 450 && label.x < 900),
    'M2 shifts only after M0 leaves',
  );
  assert(
    shifting.some((label) => label.text === 'M3' && label.x > 900 && label.x < 1400),
    'M3 shifts with the other remaining reference',
  );
  const end = drawFrame(
      canvas.getContext('2d'),
      lesson,
      scene,
      frameState(timing, (last - 1) / timing.fps, index, lesson.scenes.length),
      draw,
    ),
    labels = visible(end);
  assert(
    labels.some((label) => label.text === 'Removed from list'),
    'the outgoing identity is visibly separated from the active array',
  );
  assert(
    labels.some(
      (label) =>
        label.text === 'M0' && label.x >= 60 && label.x < 350 && label.y > 680 && label.y < 770,
    ),
    'M0 remains labeled inside the removed tray',
  );
  assert(
    labels.some(
      (label) =>
        label.text === 'M2' && label.x > 400 && label.x < 700 && label.y > 680 && label.y < 770,
    ),
  );
  assert(
    labels.some(
      (label) =>
        label.text === 'M3' && label.x > 800 && label.x < 1100 && label.y > 680 && label.y < 770,
    ),
  );
});

test('three aliases point to one painted mutable list before request-owned copying separates objects', () => {
  for (const p of [0, 1]) {
    const a = paint('cache-ownership', 1, {
      'cache-alias-remove': p,
      'cache-copy': 0,
      'cache-copy-remove': 0,
    }).audit;
    assert(visible(a).some((l) => l.text === 'Intentional broken cache: one mutable list'));
    assert.equal(
      visible(a).filter((l) => l.text === 'M2').length,
      1,
      'one physical shared list retains M2',
    );
    assert.equal(visible(a).filter((l) => l.text === 'M0').length, p === 0 ? 1 : 0);
    assert.equal(a.connectors.length, 3, 'the three aliases retain their attached references');
  }
  const safe = paint('cache-ownership', 1, {
    'cache-alias-remove': 1,
    'cache-copy': 1,
    'cache-copy-remove': 1,
  }).audit;
  assert.equal(
    visible(safe).filter((l) => l.text === 'M0').length,
    2,
    'stored tuple and next hit retain M0',
  );
  assert.equal(
    visible(safe).filter((l) => l.text === 'M2').length,
    3,
    'each distinct safe object owns its M2 reference',
  );
});

test('closing scene ends on the earned M0 and M3 answer pair with a short measured hold', async () => {
  const lesson = await readLesson(
    new URL('../lessons/ai-data-structures.lesson.yaml', import.meta.url),
    fileURLToPath(new URL('../../', import.meta.url)),
  );
  const measured = await loadMeasuredTimeline('ai-data-structures');
  const timing = measured.scenes.find((item) => item.id === 'answer');
  assert(
    timing.duration < 18,
    'the closing scene ends after the answer instead of recapping every container',
  );
  const audit = paint('answer', 0, {
    'answer-query': 1,
    'answer-score': 1,
    'answer-output': 1,
  }).audit;
  const labels = visible(audit).map((label) => label.text);
  assert(labels.includes('Assistant reads current winners · M0 + M3 · corpus v8'));
  assert(labels.includes('M0') && labels.includes(UPDATED_MESSAGES[0].text));
  assert(labels.includes('M3') && labels.includes(UPDATED_MESSAGES[3].text));
});

test('tree, graph and trie traversal paint advancing directed heads along attached node routes', () => {
  for (const [scene, id, beat] of [
    ['tree', 'tree-walk', 0],
    ['graph', 'graph-duplicate', 1],
    ['trie', 'trie-prefix', 0],
  ]) {
    const positions = [];
    for (const p of [0.24, 0.49, 0.74]) {
      const { audit, ctx } = paint(scene, beat, { [id]: p }),
        head = audit.connectors.filter((c) => c.kind === 'arrow').at(-1);
      assert(head, scene + ' has a painted advancing traversal head');
      assert(Math.hypot(head.to.x - head.from.x, head.to.y - head.from.y) > 18);
      const center = head.head.reduce((s, p) => ({ x: s.x + p.x / 3, y: s.y + p.y / 3 }), {
        x: 0,
        y: 0,
      });
      const pixel = ctx.getImageData(Math.floor(center.x), Math.floor(center.y), 1, 1).data;
      assert(pixel[1] > 80 || pixel[2] > 100, scene + ' triangle has actual colored paint');
      positions.push([head.to.x, head.to.y]);
    }
    assert.equal(
      new Set(positions.map((p) => p.map((x) => x.toFixed(2)).join(','))).size,
      3,
      scene + ' head moves through distinct path states',
    );
  }
});

test('append worksheet retains six-slot endpoint before the separately narrated seventh resize', () => {
  assert.deepEqual(appendWorksheetState(0, 1), {
    completed: 6,
    step: 5,
    fraction: 1,
    resize: false,
    capacity: 6,
    copies: 3,
    writes: 6,
  });
  assert.deepEqual(appendWorksheetState(1, 1), {
    completed: 7,
    step: 6,
    fraction: 1,
    resize: true,
    capacity: 12,
    copies: 9,
    writes: 7,
  });
  for (let i = 0; i <= 100; i++) assert(appendWorksheetState(0, i / 100).capacity <= 6);
  assert.deepEqual(collisionWorksheet(true).charged, [0, 2]);
  const broken = paint('hash-collision', 2, { 'ds-hash-collision-2': 0.5 }).audit;
  assert.equal(
    visible(broken).filter((l) => l.text === '0').length,
    1,
    'the overwritten hash key has one stored row, not duplicate equal dictionary keys',
  );
});

test('fresh permission prediction withholds scores, then selects the actual current permitted identities', () => {
  const prediction = paint('fresh-permission', 0, { 'ds-fresh-permission-0': 1 }).audit;
  assert.equal(visible(prediction).filter((l) => l.text === 'score ?').length, 4);
  assert(!visible(prediction).some((l) => l.text === 'score 1' || l.text === '2 / 2: M2, M3'));
  const outcome = permittedFreshRanking();
  assert.deepEqual(outcome.late, []);
  assert.deepEqual(
    outcome.early.map((r) => r.id),
    [2, 3],
  );
  for (let i = 0; i <= 180; i++) paint('queue-policy', 1, { 'ds-queue-policy-1': i / 180 });
});

test('fresh permission scores and global winner markers wait for their own completed clauses', () => {
  const labels = (operation, scores, global) =>
    paint('fresh-permission', 1, {
      'ds-fresh-permission-1': operation,
      'ds-fresh-scores': scores,
      'ds-fresh-global-result': global,
      'ds-fresh-scoped-selection': 1,
      'ds-fresh-scoped-order': 1,
      'ds-fresh-scoped-fill': 1,
    }).audit.labels.filter((l) => l.alpha > 0.05);
  for (const progress of [0, 0.5, 0.999]) {
    const pending = labels(0.35, progress, 0);
    assert.equal(pending.filter((l) => l.text === 'score ?').length, 4);
    assert(!pending.some((l) => l.text === 'score 1'));
  }
  const scored = labels(0.4, 1, 0.999);
  assert.equal(scored.filter((l) => l.text === 'score 1').length, 4);
  assert(
    !scored.some((l) => ['M0', 'M1'].includes(l.text) && l.y > 800),
    'global winners stay pending until their clause completes',
  );
  const global = labels(0.55, 1, 1);
  assert.deepEqual(
    global.filter((l) => ['M0', 'M1'].includes(l.text) && l.y > 800).map((l) => l.text),
    ['M0', 'M1'],
  );
  const end = labels(1, 1, 1);
  assert(end.some((l) => l.text === '0 / 2 slots filled'));
  assert(end.some((l) => l.text === '2 / 2: M2, M3'));
});

test('scoped permission winners complete only after selection, ordering and filled-slot clauses', () => {
  const at = (selected, ordered, filled) =>
    paint('fresh-permission', 1, {
      'ds-fresh-permission-1': 0.8,
      'ds-fresh-scores': 1,
      'ds-fresh-global-result': 1,
      'ds-fresh-scoped-selection': selected,
      'ds-fresh-scoped-order': ordered,
      'ds-fresh-scoped-fill': filled,
    });
  for (const selected of [0, 0.5, 0.999]) {
    const a = at(selected, 0, 0).audit;
    assert(
      !visible(a).some((l) => ['M2', 'M3'].includes(l.text) && l.y > 800),
      'supplied input identities do not become selected output before the complete selection clause',
    );
  }
  const greenAt = (ctx, x) => {
    const p = ctx.getImageData(x, 870, 1, 1).data;
    return p[1] > p[0] * 1.15 && p[1] > p[2] * 1.1;
  };
  for (const ordered of [0, 0.5, 0.999]) {
    const { ctx } = at(1, ordered, 0);
    assert(
      !greenAt(ctx, 1170),
      'the first output stays pending or in transit through its ordering clause',
    );
  }
  const first = at(1, 1, 0);
  assert(greenAt(first.ctx, 1170), 'the completed first output has actual green border paint');
  assert(visible(first.audit).some((l) => l.text === 'M2' && l.y > 850));
  assert(!visible(first.audit).some((l) => l.text === 'M3' && l.y > 800));
  for (const filled of [0.5, 0.999])
    assert(
      !greenAt(at(1, 1, filled).ctx, 1440),
      'the second completed output follows the entire filled-slot clause',
    );
  const complete = at(1, 1, 1);
  assert(greenAt(complete.ctx, 1440), 'the completed second output has actual green border paint');
  const final = complete.audit;
  assert.deepEqual(
    visible(final)
      .filter((l) => ['M2', 'M3'].includes(l.text) && l.y > 850)
      .map((l) => l.text),
    ['M2', 'M3'],
  );
  assert(visible(final).some((l) => l.text === '2 / 2: M2, M3'));
});
