import assert from 'node:assert/strict';
import {
  causalTicketLedger,
  standardizedFixture,
  weightedTicketFixture,
  effectAtMix,
} from '../../../films/causality/model.mjs';
import {
  C,
  arrow,
  cue,
  dot,
  line,
  mix,
  num,
  pct,
  rect,
  rule,
  scale,
  sign,
  slug,
  stamp,
  stock,
  text,
  title,
} from './workshop.mjs';

const ledger = causalTicketLedger();
const arms = ['assistant', 'control'];
const names = ['Assistant', 'Human control'];
const colors = [C.blue, C.brass];
const raw = arms.map((arm) => ledger.filter((t) => t.arm === arm));
const rawShares = raw.map((rows) => rows.filter((t) => t.risk === 'low').length / rows.length);
const successes = (rows) => rows.filter((t) => t.resolved).length;
const riskColors = [C.green, '#6eb28d'];
const uniformColor = [C.green, C.green];
const groupRates = raw.map((rows) =>
  ['low', 'high'].map((risk) => {
    const group = rows.filter((t) => t.risk === risk);
    return successes(group) / group.length;
  }),
);

// Each risk group has ten vertical slots per column. The same ticket keeps its
// outcome while its column's width changes with the target population.
function mosaic(ctx, arm, x, y, w, h, easyShare, sort, resolvedColors = uniformColor) {
  const rows = raw[arm];
  const split = rows.filter((t) => t.risk === 'low').length;
  const widths = [w * easyShare, w * (1 - easyShare)];
  rect(ctx, x - 5, y - 5, w + 10, h + 10, C.deep, 4);
  for (let i = 0; i < rows.length; i++) {
    const risk = i < split ? 0 : 1;
    const offset = risk ? i - split : i;
    const cols = (risk ? rows.length - split : split) / 10;
    // Fill successive rows across a stratum, starting at the bottom.
    const targetX = x + (risk ? widths[0] : 0) + ((offset % cols) * widths[risk]) / cols;
    const targetY = y + h - ((Math.floor(offset / cols) + 1) * h) / 10;
    const shuffled = (i * 37) % 100;
    const xx = mix(x + ((shuffled % 10) * w) / 10, targetX, sort);
    const yy = mix(y + (Math.floor(shuffled / 10) * h) / 10, targetY, sort);
    const cellW = mix(w / 10, widths[risk] / cols, sort);
    rect(
      ctx,
      xx + 0.8,
      yy + 0.8,
      Math.max(1, cellW - 1.6),
      h / 10 - 1.6,
      rows[i].resolved ? resolvedColors[risk] : C.red,
      1.5,
    );
    if (cellW > 16)
      line(ctx, xx + cellW - 4, yy + 3, xx + cellW - 4, yy + h / 10 - 3, '#264c422c', 1);
  }
}
function armHead(ctx, i, x, y) {
  rect(ctx, x, y - 20, 6, 23, colors[i], 2);
  text(ctx, names[i], x + 15, y, 23, C.ivory, 'left', 'Serif');
}
function mixLabel(ctx, x, y, w, f, showShares) {
  const divider = x + w * f;
  line(ctx, divider, y - 12, divider, y, C.brass, 2);
  text(
    ctx,
    showShares ? pct(f) + ' easy' : 'Easy',
    x + (w * f) / 2,
    y + 17,
    14,
    C.cream,
    'center',
  );
  text(
    ctx,
    showShares ? pct(1 - f) + ' hard' : 'Hard',
    divider + (w * (1 - f)) / 2,
    y + 17,
    14,
    C.cream,
    'center',
  );
}
function resolutionsPerHundred(arm, easyShare) {
  const [easyRate, hardRate] = groupRates[arm];
  return [100 * easyShare * easyRate, 100 * (1 - easyShare) * hardRate];
}
function resolutionRuler(ctx, x, w, values, progress, showParts, showTotal) {
  const [easy, hard] = values;
  const easyWidth = (w * progress * easy) / 100;
  const hardWidth = (w * progress * hard) / 100;
  rect(ctx, x, 411, w, 22, C.deep, 2);
  if (progress > 0) {
    rect(ctx, x, 411, easyWidth, 22, riskColors[0]);
    rect(ctx, x + easyWidth, 411, hardWidth, 22, riskColors[1]);
    line(ctx, x + easyWidth, 411, x + easyWidth, 433, C.deep, 2);
  }
  scale(ctx, x, 439, w, 0, 100, [0, 50, 100]);
  if (showParts) {
    text(ctx, num(easy) + ' easy', x, 397, 22, riskColors[0], 'left', 'Mono');
    text(ctx, '+ ' + num(hard) + ' hard', x + 122, 397, 22, riskColors[1], 'left', 'Mono');
  }
  if (showTotal)
    text(ctx, pct((easy + hard) / 100), x + w, 397, 27, C.ivory, 'right', 'Mono');
}
function compareMixes(ctx, k) {
  const target = 0.5;
  const markTarget = cue(k, 3, 'yellow marks');
  const aligning = cue(k, 4, 'Move the dividers to the middle');
  const aligned = cue(k, 4, 'Move the dividers to the middle', 1.55);
  const progress = cue(k, 2, 'Count the green tiles', 0.9);
  const sharedParts = cue(k, 4, 'Average the two green heights');
  const resolving = cue(k, 5, 'This reversal');
  const top = 176;
  const height = 136;
  const width = 409;

  title(ctx, 'Two ways to count the same log');
  if (resolving) {
    const observed = successes(raw[0]) - successes(raw[1]);
    const estimates = arms.map((_, i) =>
      resolutionsPerHundred(i, target).reduce((sum, n) => sum + n, 0),
    );
    text(ctx, 'Assistant minus control', 912, 46, 16, C.cream, 'right');
    text(
      ctx,
      'Log ' + sign(observed) + ' pp  →  50/50 ' + sign(estimates[0] - estimates[1]) + ' pp',
      912,
      73,
      17,
      C.ivory,
      'right',
      'Mono',
    );
  } else {
    text(ctx, 'Green area = resolved within 24 hours', 912, 63, 16, C.cream, 'right');
  }

  for (const [i, originalShare] of rawShares.entries()) {
    const x = 45 + i * 458;
    const easy = mix(originalShare, target, aligned);
    armHead(ctx, i, x, 119);
    text(ctx, 'Easy ' + pct(groupRates[i][0]), x, 155, 21, riskColors[0], 'left', 'Mono');
    text(ctx, 'Hard ' + pct(groupRates[i][1]), x + 150, 155, 21, riskColors[1], 'left', 'Mono');
    mosaic(ctx, i, x, top, width, height, easy, 1, riskColors);
    mixLabel(ctx, x, top + height + 7, width, easy, aligned === 1);
    if (markTarget && aligned < 1) {
      const targetX = x + width * target;
      ctx.save();
      ctx.setLineDash([5, 5]);
      line(ctx, targetX, top - 12, targetX, top + height + 2, C.brass, 3);
      ctx.restore();
    }
    if (k.beat.beatIndex > 0) {
      const showParts = aligned === 1 ? sharedParts : !aligning && progress === 1;
      const showTotal = aligning
        ? aligned === 1 && cue(k, 4, i ? 'to sixty' : 'seventy percent')
        : cue(k, 2, i ? 'seventy-six percent' : 'against fifty-four');
      resolutionRuler(ctx, x, width, resolutionsPerHundred(i, easy), progress, showParts, showTotal);
    }
  }
  if (k.beat.beatIndex > 0) {
    const label = aligning ? 'Expected resolutions per 100' : 'Logged resolutions per 100';
    text(ctx, label, 480, 368, 18, C.cream, 'center');
  }
}
export function trays(ctx, k) {
  const ch = k.beat.chapterId;
  if (ch === 'c03') return compareMixes(ctx, k);
  const opening = ch === 'c01';
  const showLog = !opening || cue(k, 1, 'Open the full ticket log');
  const sort = opening ? cue(k, 2, 'Sort the tickets', 1.1) : 1;
  const aligned = opening ? 0 : cue(k, 2, 'Line up the dividers', 1.1);
  const target = 0.7;
  const totals = !opening && cue(k, 4, 'Seventy-eight under');
  title(ctx, opening ? 'Dispatch log' : 'Next week’s hundred tickets');
  if (!showLog) {
    [
      [45, 'Service outage', 'Hard at intake', 'Assistant', C.blue],
      [497, 'Password reset', 'Easy at intake', 'Human control', C.brass],
    ].forEach(([x, issue, risk, arm, color], i) => {
      if (i && !cue(k, 1, 'A password reset')) return;
      stock(ctx, x, 140, 410, 220);
      stamp(ctx, 'INTAKE  /  ' + String(i + 1).padStart(3, '0'), x + 24, 174, C.brassInk);
      text(ctx, issue, x + 24, 231, 34, C.ink, 'left', 'Serif');
      text(ctx, risk, x + 24, 270, 19, C.ink);
      rule(ctx, x + 24, 289, 359, '#baaf92');
      if (cue(k, 1, i ? 'goes to a human' : 'lands with the assistant'))
        text(ctx, 'Routed to ' + arm, x + 24, 330, 20, i ? C.brassInk : C.blueInk);
    });
    return;
  }
  for (let i = 0; i < 2; i++) {
    const x = 45 + i * 458,
      w = 409;
    const easy = mix(rawShares[i], target, aligned);
    armHead(ctx, i, x, 119);
    mosaic(ctx, i, x, 190, w, 155, easy, sort);
    if (sort === 1) mixLabel(ctx, x, 352, w, easy);
    if (opening) {
      if (cue(k, 1, i ? 'seventy-six' : 'fifty-four'))
        text(ctx, successes(raw[i]) + ' / 100 closed', x, 166, 31, colors[i], 'left', 'Mono');
      if (sort === 1) {
        const group = raw[i].filter((t) => t.risk === 'high');
        text(ctx, 'Hard tickets', x, 414, 17, C.muted);
        text(
          ctx,
          successes(group) +
            ' / ' +
            group.length +
            (cue(k, 3, 'The assistant did') ? '   ' + pct(successes(group) / group.length) : ''),
          x,
          458,
          31,
          C.ivory,
          'left',
          'Mono',
        );
      }
    } else {
      const expected = groupRates[i][0] * easy + groupRates[i][1] * (1 - easy);
      text(
        ctx,
        'Easy ' + pct(groupRates[i][0]) + '     Hard ' + pct(groupRates[i][1]),
        x,
        162,
        19,
        C.cream,
        'left',
        'Mono',
      );
      if (aligned < 1) {
        ctx.save();
        ctx.setLineDash([5, 5]);
        line(ctx, x + w * target, 178, x + w * target, 347, C.brass, 3);
        ctx.restore();
      }
      if (aligned === 1)
        text(
          ctx,
          num(100 * easy * groupRates[i][0]) +
            ' easy  +  ' +
            num(100 * (1 - easy) * groupRates[i][1]) +
            ' hard',
          x,
          419,
          22,
          colors[i],
          'left',
          'Mono',
        );
      if (totals)
        text(ctx, pct(expected) + ' at the shared mix', x, 463, 27, C.ivory, 'left', 'Serif');
    }
  }
  if (opening && cue(k, 1, 'Would you send') && !sort)
    text(ctx, 'Send every ticket to human support?', 480, 441, 26, C.ivory, 'center', 'Serif');
  if (ch === 'c08' && cue(k, 7, 'Only ten actual tickets')) {
    rect(ctx, 30, 382, 900, 146, C.deep, 3);
    text(ctx, 'Evidence for the easy assistant rate', 49, 406, 21, C.cream, 'left', 'Serif');
    for (let j = 0; j < 10; j++)
      slug(ctx, 49 + j * 44, 420, 38, 48, j < 9 ? C.green : C.red, String(j + 1));
    text(ctx, '9 / 10 observed', 521, 431, 23, C.blue, 'left', 'Mono');
    text(ctx, 'Applied to 70 future easy tickets', 521, 465, 21, C.cream);
  } else if (!opening)
    text(ctx, 'Target mix   70 easy  /  30 hard', 912, 63, 16, C.cream, 'right');
  else
    text(
      ctx,
      'Green = closed within 24 hours     •     Coral = still open',
      912,
      63,
      15,
      C.cream,
      'right',
    );
}
export function uncertainty(ctx, k) {
  const changed = cue(k, 2, 'Turn one green ticket') && !cue(k, 3, 'Return to the original counts');
  const count = changed ? 8 : 9,
    f = standardizedFixture(count),
    variance = cue(k, 3, 'estimate variance'),
    interval = cue(k, 4, 'rough interval');
  title(ctx, 'One easy ticket changes outcome');
  text(ctx, 'Easy assistant sample', 43, 117, 23, C.ivory, 'left', 'Serif');
  for (let i = 0; i < 10; i++)
    slug(ctx, 43 + i * 44, 142, 37, 48, i < count ? C.green : C.red, String(i + 1));
  text(ctx, count + ' / 10 closed', 44, 229, 24, C.ivory, 'left', 'Mono');
  text(ctx, '70 of next week’s 100 tickets are easy.', 44, 262, 18, C.cream);
  stock(ctx, 552, 105, 367, 179);
  stamp(ctx, 'DEPLOYMENT ESTIMATE', 573, 137, C.brassInk);
  text(ctx, 'Assistant   ' + pct(f.assistant), 573, 179, 23, C.ink, 'left', 'Mono');
  text(ctx, 'Control     ' + pct(f.control), 573, 213, 23, C.ink, 'left', 'Mono');
  text(
    ctx,
    'Difference   ' + sign(100 * f.difference) + ' pp',
    573,
    256,
    23,
    C.greenInk,
    'left',
    'Mono',
  );
  if (variance) {
    text(ctx, 'Var = Σ w² × p(1 − p) / n', 45, 328, 22, C.ivory, 'left', 'Mono');
    text(ctx, 'Four independent cells, fixed target weights', 45, 359, 16, C.cream);
    if (!interval) {
      const names = ['Easy A', 'Easy C', 'Hard A', 'Hard C'];
      f.varianceParts.forEach((v, i) => {
        const x = 48 + i * 223;
        text(ctx, names[i], x, 412, 18, C.cream);
        rect(ctx, x, 425, v * 34500, 18, i % 2 ? C.brass : C.blue);
        text(ctx, num(v, 6), x, 469, 17, C.cream, 'left', 'Mono');
      });
    }
  }
  if (cue(k, 4, 'eight point seven seven'))
    text(ctx, 'SE = ' + num(100 * f.se, 2) + ' pp', 565, 329, 21, C.brass, 'left', 'Mono');
  if (interval) intervalPlot(ctx, 69, 445, 818, f);
}
export function intervalPlot(ctx, x, y, w, f) {
  const pos = scale(ctx, x, y, w, -10, 30, [-10, 0, 10, 20, 30], '');
  line(ctx, pos(0), y - 48, pos(0), y + 5, C.muted, 1);
  const [a, b] = f.interval.map((v) => 100 * v);
  line(ctx, pos(a), y - 20, pos(b), y - 20, C.brass, 5);
  for (const n of [a, b]) {
    line(ctx, pos(n), y - 28, pos(n), y - 12, C.brass, 3);
    text(ctx, sign(n), pos(n), y - 36, 16, C.cream, 'center', 'Mono');
  }
  dot(ctx, pos(f.difference * 100), y - 20, 6, C.green);
  text(
    ctx,
    'Assistant minus control (percentage points)',
    x + w / 2,
    y + 52,
    15,
    C.cream,
    'center',
  );
}
export function estimands(ctx, k) {
  const hetero = cue(k, 2, 'different hypothetical effect vector');
  const effects = hetero ? [0.04, 0.16] : [0.1, 0.1];
  title(
    ctx,
    hetero ? 'When easy and hard tickets benefit differently' : 'Whose outcomes enter the average?',
  );
  text(ctx, 'Within-risk effect', 44, 127, 19, C.muted);
  text(ctx, 'Easy   ' + sign(effects[0] * 100) + ' pp', 260, 130, 24, C.green, 'left', 'Mono');
  text(ctx, 'Hard   ' + sign(effects[1] * 100) + ' pp', 600, 130, 24, C.brass, 'left', 'Mono');
  for (const [i, [pop, p]] of [
    ['All tickets   ·   ATE', 0.5],
    ['Assistant recipients   ·   ATT', 0.1],
    ['Deployment queue', 0.7],
  ].entries()) {
    if (i === 2 && !cue(k, 3, 'seventy-thirty')) continue;
    const y = 200 + i * 104,
      x = 435,
      w = 285;
    text(ctx, pop, 44, y + 11, 22, C.ivory, 'left', 'Serif');
    rect(ctx, x, y - 14, w * p, 30, C.green);
    rect(ctx, x + w * p, y - 14, w * (1 - p), 30, C.brass);
    text(ctx, pct(p) + ' easy', x, y + 41, 15, C.cream);
    text(
      ctx,
      sign(effectAtMix(p, effects) * 100) + ' pp',
      910,
      y + 13,
      29,
      C.ivory,
      'right',
      'Mono',
    );
  }
}
const weighted = {
  raw: weightedTicketFixture(),
  half: weightedTicketFixture({ stabilize: 0.5 }),
  cap: weightedTicketFixture({ clip: 5 }),
};
export function weights(ctx, k) {
  const first = k.beat.chapterId === 'c14';
  const halved =
    !first && cue(k, 4, 'Halve every ticket') && !cue(k, 6, 'Restore the original weights');
  const cap = !first && cue(k, 8, 'Apply the cap');
  const active = cap ? 'cap' : halved ? 'half' : 'raw';
  const rows = weighted[active];
  title(
    ctx,
    first
      ? 'Attach a weight to the route taken'
      : cap
        ? 'Cap each individual weight at five'
        : halved
          ? 'Multiply every weight by one half'
          : 'The weight carried by a hundred tickets',
  );
  for (const [i, a] of rows.entries()) {
    const x = 45 + 459 * i;
    armHead(ctx, i, x, 123);
    text(ctx, a.observed + ' observed tickets', x, 159, 17, C.cream);
    const showWeight = !first || cue(k, 3, 'Start with the ten easy tickets');
    for (const [j, g] of a.groups.entries()) {
      const y = 208 + j * 92;
      const actionProb = i ? 1 - (j ? 0.9 : 0.1) : j ? 0.9 : 0.1;
      text(ctx, (j ? 'Hard' : 'Easy') + '  ·  P(route) = ' + num(actionProb), x, y, 16, C.muted);
      if (showWeight) {
        const w = g.mass * 3.5;
        rect(ctx, x, y + 12, w, 29, '#48665b');
        rect(ctx, x, y + 12, g.successMass * 3.5, 29, C.green);
        const per =
          g.weight === 10 / 9 || Math.abs(g.weight - 10 / 9) < 1e-8
            ? '10/9'
            : Math.abs(g.weight - 5 / 9) < 1e-8
              ? '5/9'
              : num(g.weight);
        text(
          ctx,
          g.count + ' × ' + per + ' = ' + num(g.mass),
          x,
          y + 65,
          20,
          C.ivory,
          'left',
          'Mono',
        );
      } else text(ctx, g.count + ' assigned', x, y + 45, 22, colors[i]);
    }
    const massReady = !first || cue(k, 4, 'two hundred units');
    if (massReady) {
      rule(ctx, x, 389, 406);
      const rateReady = !first || cue(k, 5, 'Now count only the green part');
      text(
        ctx,
        rateReady
          ? num(a.successMass) + ' / ' + num(a.mass) + ' = ' + pct(a.rate)
          : num(a.mass) + ' weight units',
        x,
        427,
        25,
        colors[i],
        'left',
        'Mono',
      );
      if (!first && cue(k, 2, 'thirty-six') && !cap)
        text(ctx, 'Weight-only ESS   ' + num(a.ess), x, 468, 18, C.ivory, 'left', 'Mono');
    }
  }
  if (
    !first &&
    !cap &&
    cue(k, 2, 'Square each individual weight') &&
    !cue(k, 6, 'Restore the original weights')
  )
    text(ctx, 'ESS = (Σ w)² / Σ w²', 480, 510, 19, C.cream, 'center', 'Mono');
  if (first && cue(k, 6, 'At the deployment mix'))
    text(
      ctx,
      '70% easy deployment mix:   78% vs. 68%    •    Both gaps are 10 pp',
      480,
      499,
      17,
      C.cream,
      'center',
    );
  if (cap && cue(k, 10, 'minus three and a third'))
    text(
      ctx,
      'Difference after clipping   ' + sign(100 * (rows[0].rate - rows[1].rate), 2) + ' pp',
      480,
      499,
      19,
      C.brass,
      'center',
      'Mono',
    );
}
function openBatch(ctx, k, chanceKnown, drawn, power, result, assistantChance) {
  const count = 10;
  const travel = cue(k, 2, 'all ten went there', 2.4);
  const forkX = 347, forkY = 335;
  const sourceX = 107, stackX = 833;
  const assistantY = 300, humanY = 374;
  text(ctx, 'New batch', sourceX, 266, 22, C.ivory, 'center', 'Serif');
  text(ctx, 'Assistant stack', stackX, 266, 22, C.ivory, 'center', 'Serif');
  line(ctx, sourceX + 36, forkY, forkX, forkY, C.muted, 3);
  line(ctx, forkX, forkY, 458, assistantY, C.blue, 4);
  arrow(ctx, 458, assistantY, stackX - 44, assistantY, C.blue, 4);
  line(ctx, forkX, forkY, 458, humanY, C.brass, 4);
  arrow(ctx, 458, humanY, 585, humanY, C.brass, 4);
  dot(ctx, forkX, forkY, 7, C.ivory);
  text(ctx, 'Assistant' + (chanceKnown ? '   ' + pct(assistantChance) : ''), 480, 287, 22, C.blue);
  text(ctx, 'Human open' + (chanceKnown ? '   ' + pct(1 - assistantChance) : ''), 433, 404, 22, C.brass);
  text(ctx, drawn ? '0 of 10' : '? of 10', 602, 381, 26, C.ivory, 'left', 'Mono');

  let landed = 0;
  for (let i = 0; i < count; i++) {
    const rowY = 281 + i * 14 + (i >= 5 ? 5 : 0);
    // Each ticket passes the same fork before it joins the new stack.
    const t = Math.max(0, Math.min(1, (travel * 2.4 - i * 0.15) / 1.05));
    let x, y;
    if (t < 0.35) {
      x = mix(sourceX, forkX, t / 0.35);
      y = mix(rowY, forkY, t / 0.35);
    } else if (t < 0.54) {
      const along = (t - 0.35) / 0.19;
      x = mix(forkX, 458, along);
      y = mix(forkY, assistantY, along);
    } else {
      const along = (t - 0.54) / 0.46;
      x = mix(458, stackX, along);
      y = mix(assistantY, rowY, Math.max(0, (along - 0.73) / 0.27));
    }
    slug(ctx, x - 33, y - 5, 66, 10, t < 0.35 ? C.ivory : C.blue);
    if (t === 1) landed++;
  }
  text(ctx, landed + ' / ' + count, stackX, 449, 24, C.blue, 'center', 'Mono');
  if (drawn) {
    text(ctx, 'Chance all ten reach the assistant?', 46, 451, 23, C.ivory, 'left', 'Serif');
    if (power) {
      const probability = result ? '  ≈  ' + pct(assistantChance ** count) : '';
      text(ctx, '0.9¹⁰' + probability, 451, 451, 30, C.brass, 'left', 'Mono');
    }
  }
}

function emptyControl(ctx, k) {
  const closedKnown = cue(k, 1, 'zero');
  const open = cue(k, 2, 'Now open the control route');
  const chanceKnown = cue(k, 2, 'nine-in-ten chance');
  const drawn = cue(k, 2, 'all ten went there');
  const power = cue(k, 2, 'point nine to the tenth');
  const result = cue(k, 2, 'thirty-four point nine percent');
  const assistantChance = 0.9;
  title(ctx, 'Could all ten hard tickets go to the assistant?');
  text(ctx, 'Human route', 65, 140, 22, C.cream);
  text(ctx, 'Chance per ticket', 318, 140, 22, C.cream);
  text(ctx, 'Routed to a human', 630, 140, 22, C.cream);
  function row(y, label, chance, count) {
    stock(ctx, 42, y, 876, 77);
    text(ctx, label, 65, y + 50, 34, C.ink, 'left', 'Serif');
    if (chance) text(ctx, chance, 318, y + 50, 32, C.ink, 'left', 'Mono');
    if (count) text(ctx, count, 630, y + 50, 32, C.blueInk, 'left', 'Mono');
  }
  row(161, 'Closed', closedKnown && '0%', closedKnown && '0 of 10');
  if (!open) return;
  if (k.beat.beatIndex === 1) {
    openBatch(ctx, k, chanceKnown, drawn, power, result, assistantChance);
    return;
  }
  row(259, 'Open', chanceKnown && pct(1 - assistantChance), drawn ? '0 of 10' : '?');
  if (drawn) {
    text(ctx, 'With the route open, how likely is this draw?', 65, 392, 26, C.ivory, 'left', 'Serif');
    if (power) {
      const probability = result ? '  ≈  ' + pct(assistantChance ** 10) : '';
      text(ctx, '0.9¹⁰' + probability, 65, 447, 35, C.brass, 'left', 'Mono');
    }
  }
}

export function support(ctx, k) {
  if (k.beat.chapterId === 'c16') return emptyControl(ctx, k);
  const absent = cue(k, 2, 'If a workflow was impossible');
  title(ctx, 'How many observations does one weight buy?');
  const sub = absent ? 'Separate logging policy  ·  easy tickets' : 'Easy assistant ticket';
  text(ctx, sub, 42, 122, 25, C.ivory, 'left', 'Serif');
  if (!absent) {
    stock(ctx, 43, 156, 338, 185);
    stamp(ctx, 'A-LOW-1  /  LOGGED', 68, 194, C.blueInk);
    text(ctx, 'Resolved in 24 h', 68, 246, 29, C.ink, 'left', 'Serif');
    text(ctx, 'P(assistant) = 0.1', 68, 295, 21, C.ink, 'left', 'Mono');
    if (cue(k, 1, 'weight ten')) {
      for (let i = 0; i < 10; i++)
        slug(ctx, 491 + (i % 5) * 79, 167 + Math.floor(i / 5) * 65, 68, 48, C.green, '1');
      text(ctx, '10 weight units from 1 observed ticket', 487, 334, 20, C.cream);
    }
    return;
  }
  for (const [i, name] of ['Human control', 'Assistant'].entries()) {
    const y = 182 + i * 116;
    text(ctx, name, 44, y + 30, 23, name === 'Assistant' ? C.blue : C.brass);
    for (let j = 0; j < 10; j++) {
      const x = 294 + j * 61;
      rect(ctx, x, y, 49, 43, C.edge, 3);
      rect(ctx, x + 2, y + 2, 45, 39, C.deep, 2);
      if (!i) slug(ctx, x + 2, y + 2, 45, 39, C.brass, String(j + 1));
    }
    text(ctx, 'P(route) = ' + (i ? '0' : '1'), 44, y + 64, 17, C.cream, 'left', 'Mono');
  }
  text(
    ctx,
    'The logging policy supplies no assistant outcomes here.',
    44,
    459,
    24,
    C.ivory,
    'left',
    'Serif',
  );
}
export function checkTickets() {
  assert.deepEqual(raw.map(successes), [54, 76]);
  assert.deepEqual(rawShares, [0.1, 0.9]);
  assert.deepEqual(groupRates, [
    [0.9, 0.5],
    [0.8, 0.4],
  ]);
  for (const [i, share, values] of [
    [0, rawShares[0], [9, 45]],
    [1, rawShares[1], [72, 4]],
    [0, 0.5, [45, 25]],
    [1, 0.5, [40, 20]],
  ])
    assert.deepEqual(resolutionsPerHundred(i, share).map((value) => num(value)), values.map(String));
  assert.deepEqual(
    [9, 8].map((n) => num(standardizedFixture(n).difference * 100)),
    ['10', '3'],
  );
  assert.equal(num(standardizedFixture().se * 100, 2), '8.77');
  assert.deepEqual(
    [0.5, 0.1, 0.7].map((p) => num(effectAtMix(p) * 100)),
    ['10', '14.8', '7.6'],
  );
  for (const [key, sums, mass] of [
    ['raw', [140, 120], 200],
    ['half', [70, 60], 100],
    ['cap', [95, 100], 150],
  ]) {
    const [a, c] = weighted[key];
    assert.deepEqual(
      [a, c].map((row) => Math.round(row.successMass)),
      sums,
    );
    for (const row of [a, c]) {
      assert.equal(Math.round(row.mass), mass);
      assert.equal(row.observed, 100);
      if (key !== 'cap') assert.equal(Math.round(row.ess), 36);
    }
  }
  assert.deepEqual(
    weighted.cap.map((r) => r.groups.map((g) => Math.round(g.mass))),
    [
      [50, 100],
      [100, 50],
    ],
  );
}
