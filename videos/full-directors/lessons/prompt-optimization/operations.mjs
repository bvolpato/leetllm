import { C, format, mix, smooth } from './studio.mjs';
import {
  small,
  requestCap,
  dev,
  test,
  chosen,
  pairedOutcomes,
  rollback,
  deploy,
  pairScore,
} from './examples.mjs';
import { permits, pair } from './policy.mjs';

export function engine(p) {
  const { beat, cue, title, txt, lab, mono, page, rect, line, dot } = p;
  p.background();
  if (beat === 1) {
    title('Choose the engine before inference', 65, 110);
    page(68, 196, 1460, 468);
    lab('DSPy 3.4.0', 110, 259);
    mono('engine="auto"', 110, 398, 42);
    line(464, 379, 567, 379, C.teal, 5);
    line(567, 337, 567, 505, C.teal, 5);
    p.arrow(567, 337, 748, 337);
    p.arrow(567, 505, 748, 505);
    mono('lm15', 785, 351, 52);
    lab('Supported native request', 1005, 346);
    if (cue(1, 'For eligible compatibility')) {
      mono('LiteLLM', 785, 520, 48);
      lab('Eligible compatibility path', 1050, 512);
    }
    if (cue(1, 'authentication error'))
      txt('An inference failure stays on the selected backend.', 112, 616, 33, C.rust);
    return;
  }
  if (beat === 4) {
    title('What went into this run?', 68, 110);
    page(67, 176, 1461, 541);
    lab('RUN RECORD', 104, 233);
    const records = [
      ['Program', 'artifact digest, data and scorer versions'],
      ['Model', 'revision, engine, generation settings'],
      ['Repeat', 'seed, dependency versions, cache policy'],
    ];
    records.forEach(([k, v], i) => {
      const y = 335 + i * 110;
      lab(k.toUpperCase(), 111, y);
      txt(v, 420, y, 37);
      p.edge(110, y + 33, 1380);
    });
    if (cue(4, 'Temperature zero'))
      txt(
        'Temperature 0 can still yield different results across runs.',
        76,
        790,
        34,
        C.ivory,
        'Serif',
      );
    return;
  }
  title('One prompt asks for two answers', 69, 106);
  page(70, 180, 1456, 502);
  lab('LOCAL COUNTING ENGINE   /   CACHE OFF   /   n = 2', 110, 250);
  const called = [cue(2, 'It makes the first call'), cue(2, 'the second call begin')];
  const complete = [cue(2, 'Only then'), cue(2, 'Two sequential')];
  [0, 1].forEach((i) => {
    const y = 365 + i * 150;
    mono('call ' + (i + 1), 111, y, 40, called[i] ? C.ink : '#788078');
    line(347, y - 16, 939, y - 16, C.rule, 3);
    if (called[i]) dot(347, y - 16, 13, C.teal);
    if (complete[i]) {
      p.arrow(347, y - 16, 938, y - 16);
      mono('answer ' + (i + 1), 969, y, 40);
    }
  });
  mono(complete.filter(Boolean).length + ' completed', 110, 622, 38);
  if (beat === 3)
    txt(
      'LiteLLM may use a provider’s multi-answer operation. Check actual usage.',
      74,
      781,
      33,
      C.ivory,
    );
}
export function capped(p) {
  const { beat, cue, end, title, mono, lab, txt, page, rect, line } = p;
  const revised = beat === 4;
  const trials = revised ? 7 : 8;
  const plan = small(trials);
  const ready = revised ? cue(4, 'It fits') : cue(3, 'That exceeds');
  const verdict = revised ? cue(4, 'That buys') : end(3);
  p.background();
  title('Search requisition', 63, 102);
  page(67, 154, 747, 592);
  lab('FULL EVALUATION   /   ONE ANSWER PER CALL', 105, 214);
  const lines = [
    ['Candidate passes', trials],
    ['Default pass', 1],
    ['Cases per pass', 24],
    ['Calls per case', '2 + 1'],
  ];
  if (beat >= 2)
    lines.push(['Teacher requests', plan.teacher], ['Proposal requests', plan.proposals]);
  lines.forEach(([k, v], i) => {
    const y = 282 + i * 62;
    txt(k, 108, y, 31);
    mono(v, 762, y, 34, C.ink, 'right');
    p.edge(108, y + 14, 652);
  });
  txt('Cache off   /   no retries', 107, 710, 27, C.teal);
  const x = 875;
  if (beat >= 2) {
    lab('HOST REQUEST CAP', x, 195, C.mint);
    mono(requestCap, x, 280, 76, C.ivory);
  }
  if (beat >= 3) {
    if (revised || cue(3, 'Three calls each'))
      mono(format(plan.executions) + ' executions', x, 369, 40, C.ivory);
    if (revised || cue(3, 'Add twelve'))
      mono(format(plan.roleRequests) + ' role requests', x, 431, 40, C.ivory);
    if (ready) {
      const x0 = x,
        x1 = 1500,
        scale = (n) => x0 + (n / 710) * (x1 - x0),
        y = 620;
      lab('TOTAL REQUESTS', x, 512, C.mint);
      mono(format(plan.requests), x, 584, 62, C.ivory);
      rect(x, y, scale(plan.requests) - x, 25, plan.requests <= requestCap ? C.mint : C.orange);
      line(x, y + 33, x1, y + 33, C.sage);
      line(scale(requestCap), y - 17, scale(requestCap), y + 48, C.yellow, 4);
      mono('650', scale(requestCap), y + 84, 29, C.yellow, 'center');
    }
    if (verdict)
      txt(
        plan.requests > requestCap ? plan.requests - requestCap + ' over cap' : 'Within the cap',
        x,
        773,
        41,
        plan.requests > requestCap ? C.orange : C.mint,
        'Serif',
      );
  }
}
const initialPairing = pairedOutcomes(0);
const alternatePairing = pairedOutcomes(4);
const origins = initialPairing.items.flatMap((row, i) =>
  row.compiled && !alternatePairing.items[i].compiled ? [i] : [],
);
const destinations = alternatePairing.items.flatMap((row, i) =>
  row.compiled && !initialPairing.items[i].compiled ? [i] : [],
);

function drawPairings(p) {
  const { beat, clock, cue, title, lab, mono, txt, rect, line, page } = p;
  const after = (phrase) => {
    const { start, end } = clock.wordCue(phrase);
    return clock.reveal(phrase, end - start, { captionStart: false }) === 1;
  };
  const aligned = beat === 4 || after('under a baseline success');
  let move = 0;
  if (beat === 4) {
    const phrase = 'Move four of A’s successes';
    const duration = clock.wordCue('the baseline missed').end - clock.wordCue(phrase).start;
    move = clock.reveal(phrase, duration, { captionStart: false });
  }
  const showInitial = beat === 3 ? after('just three cases favor the baseline') : move === 0;
  const showAlternate = beat === 4 && move === 1 && after('and four favor A');
  const result = showAlternate ? alternatePairing : showInitial ? initialPairing : null;

  p.background();
  title('Two possible pairings', 67, 112);
  page(65, 184, 1471, 545);
  lab('ONE COLUMN PER TEST REQUEST', 106, 246);
  txt('Correct', 1423, 286, 26, C.teal, 'Sans', 'center', 700);

  const baselineY = 313;
  const compiledY = 429;
  const columnX = (i) => 414 + i * 47;
  const check = (x, y, color) => {
    rect(x, y, 36, 52, color);
    line(x + 7, y + 24, x + 14, y + 31, C.paper, 3);
    line(x + 14, y + 31, x + 29, y + 12, C.paper, 3);
  };
  txt('Baseline', 105, baselineY + 40, 38, C.ink, 'Serif');
  txt('Compiled A', 105, compiledY + 40, 38, C.ink, 'Serif');
  mono(test.baseline.correct, 1423, baselineY + 40, 39, C.ink, 'center');
  mono(test.compiled.correct, 1423, compiledY + 40, 39, C.ink, 'center');

  initialPairing.items.forEach(({ baseline, compiled }, i) => {
    const x = columnX(i);
    const paired = result?.items[i];
    if (paired && paired.baseline !== paired.compiled) {
      rect(
        x - 4,
        baselineY - 14,
        44,
        compiledY - baselineY + 80,
        paired.baseline ? '#d5e3ee' : '#c8e0d4',
      );
    }
    if (baseline) check(x, baselineY, C.blue);
    else rect(x, baselineY, 36, 52, '#e3dcca');
    if (aligned) {
      rect(x, compiledY, 36, 52, '#e3dcca');
      if (compiled && !origins.includes(i)) check(x, compiledY, C.teal);
    }
  });

  if (aligned) {
    origins.forEach((origin, i) => {
      const flight = 0.64;
      const delay = ((1 - flight) * (origins.length - 1 - i)) / Math.max(1, origins.length - 1);
      const travel = smooth(Math.max(0, Math.min(1, (move - delay) / flight)));
      const x = mix(columnX(origin), columnX(destinations[i]), travel);
      const y = compiledY + 94 * Math.sin(Math.PI * travel);
      check(x, y, C.teal);
    });
  }
  if (result) {
    mono('Baseline only: ' + result.baselineOnly, 104, 654, 37, C.blue);
    mono('Compiled A only: ' + result.compiledOnly, 820, 654, 37, C.teal);
  }
  if (beat === 4 && cue(4, 'Check the labels'))
    txt(
      'Review the actual paired answers, policy families and labels.',
      74,
      783,
      35,
      C.ivory,
      'Serif',
    );
}

export function tallies(p, { held = false } = {}) {
  const { cue, title, lab, mono, txt, rect, line, page } = p;
  if (held && cue(3, 'Try one possible pairing')) {
    drawPairings(p);
    return;
  }
  p.background();
  title(held ? 'Open the held-out results' : 'Compare on development', 67, 98);
  const chart = (y, caption, data, visible, mark, showDelta = false) => {
    page(68, y, 1465, held ? 273 : 347);
    lab(caption, 106, y + 53);
    [data.baseline, data.compiled].forEach((r, i) => {
      const dy = y + 123 + i * (held ? 91 : 130),
        color = i ? C.teal : C.blue;
      const name = i ? 'Compiled A' : 'Baseline';
      txt(name, 108, dy, 38, C.ink, 'Serif');
      const gx = 438,
        w = 783;
      rect(gx, dy - 39, w, 46, '#e3dcca');
      if (visible[i]) rect(gx, dy - 39, (w * r.correct) / r.total, 46, color);
      for (let j = 0; j <= r.total; j++)
        line(gx + (w * j) / r.total, dy + 8, gx + (w * j) / r.total, dy + 17, C.rule, 2);
      mono((visible[i] ? r.correct : '?') + ' / ' + r.total, 1280, dy, 39);
      if (mark && i && chosen === 'compiled') lab('FROZEN', 109, dy + 29, C.teal, 17);
      if (i && showDelta) {
        const delta = data.compiled.correct - data.baseline.correct;
        const signed = delta >= 0 ? '+' + delta : '−' + Math.abs(delta);
        mono(signed + ' vs baseline', 1230, dy + 36, 29, delta >= 0 ? C.teal : C.rust);
      }
    });
  };
  if (!held) {
    const a = !!cue(4, 'Compiled A gets'),
      b = !!cue(4, 'Which prompt');
    const frozen = !!cue(5, 'Freeze Compiled A');
    chart(224, 'DEVELOPMENT  /  CORRECT ANSWERS', dev, [a, b], frozen, !!cue(5, 'more cases right'));
    if (frozen)
      txt('Freeze Compiled A for the held-out comparison.', 75, 720, 44, C.ivory, 'Serif');
  } else {
    chart(145, 'DEVELOPMENT   /   CHOICE ALREADY FROZEN', dev, [true, true], true, true);
    chart(
      441,
      'HELD-OUT TEST   /   SAME SCALE',
      test,
      [!!cue(2, 'Compiled A gets'), !!cue(2, 'Its five-case')],
      false,
      !!cue(2, 'three-case deficit'),
    );
  }
}
export function replay(p) {
  const { beat, cue, lab, page, txt, stamp } = p;
  if (beat >= 4) {
    tallies(p);
    return;
  }
  p.background();
  permits(p, { w: 672 });
  page(777, 70, 752, 584);
  const revised = beat >= 2,
    prediction = revised ? deploy : rollback;
  lab(revised ? 'REVISED INSTRUCTION' : 'BASELINE INSTRUCTION', 816, 127);
  p.title(revised ? 'Match action and target.' : 'Find an approval.', 816, 205, 49, C.ink);
  txt(revised ? 'Abstain if either lacks support.' : 'Give its ID.', 816, 271, 34);
  const show = revised ? cue(3, 'Both fields match') : cue(1, 'It serves with');
  pair(p, 816, 373, 671, 'Predictor reply', show ? prediction : null, C.blue);
  const scored = revised ? cue(3, 'A single success') : cue(1, 'Change just the instruction');
  if (scored) {
    const v = pairScore(deploy, prediction);
    stamp(v + ' / 1', 816, 517, 195, v ? C.teal : C.rust);
  }
}
