import { decimal, dynamic, line, numberLine, place, rect, to } from 'vizmatic/stage';
import { at, captions, frame, nfmt, pct, plot, point, record } from '../parts.mjs';
import { label } from '../../kit-narrated.mjs';
import { policyValueFixture } from '../../../films/causality/model.mjs';

export default function drCorrection(s, c) {
  frame(
    s,
    c.title,
    'Weighted residuals of observed assistant tickets',
    'One-step policy value',
  );
  const wrongProbability = 0.4;
  const good = policyValueFixture(),
    bad = policyValueFixture({ estimatedPropensity: wrongProbability }),
    restored = policyValueFixture({ estimatedPropensity: wrongProbability, rewardShift: 0 });
  const rows = good.rows.filter((t) => t.arm === 'assistant'),
    bands = plot.rows([1, 1, 0.72, 1.1], 'normal');
  const qShift = s.value(0),
    wrong = s.value(0),
    paint = s.value(0),
    range = s.value(10);
  const shift = good.baseline - restored.baseline;
  const reward = (t) => t.q - shift + qShift.value;
  const propensity = (t) => t.propensity * (1 - wrong.value) + wrongProbability * wrong.value;
  const [base, correction, result] = record(s, [
    ['Mean reward prediction', 'Average over contexts'],
    ['Signed residual correction', 'Weight × (reward − q)'],
    ['Corrected estimate', 'Baseline + correction', 'yellow'],
  ]);
  const failed = rows.find((t) => t.risk === 'low' && !t.resolved);
  const wins = rows.filter((t) => t.risk === 'low' && t.resolved);
  const math = (words) => place(label(words, { size: 35 }), bands[2]);
  const wager = math('Easy ticket ' + failed.id + ':   ' + nfmt(failed.ratio) + ' × (0 − ' + nfmt(failed.q) + ') = ?');
  const failure = math('One failure:   ' + nfmt(failed.ratio) + ' × (0 − ' + nfmt(failed.q) + ') = ' + nfmt(failed.correction));
  const contribution = math('This ticket:   ' + nfmt(failed.q) + ' − ' + nfmt(-failed.correction) + ' = ' + nfmt(failed.q + failed.correction));
  const groupSum = math(wins.length + ' successes × ' + nfmt(wins[0].correction) +
    '   ' + nfmt(failed.correction) + '   =   ' + nfmt(good.groupCorrections[0]));
  const legend = math('← Negative correction                     Positive correction →');
  c.show('failure-input', wager);
  c.swap('failure-result', wager, failure, { after: true, lead: 0 });
  c.swap('one-ticket', failure, contribution, { after: true, lead: 0 });
  c.hide('successes', contribution);
  c.show('easy-sum', groupSum, { after: true, lead: 0 });
  c.swap('residuals', groupSum, legend, { after: true, lead: 0 });
  ['low', 'high'].forEach((risk, i) => {
    const band = bands[i],
      center = point(band, 0.5, 0.67),
      half = band.width * 0.47;
    const armRows = rows.filter((t) => t.risk === risk);
    s.add(
      place(
        label(i ? 'Difficult' : 'Easy', {
          color: 'cyan',
          size: 34,
        }),
        band,
        'top left',
      ),
      at(
        decimal(() => reward(armRows[0]) * 100, {
          prefix: 'Prediction ',
          digits: 0,
          suffix: '%',
          size: 32,
        }),
        band,
        0.43,
        0.13,
      ),
      at(
        decimal(() => propensity(armRows[0]) * 100, {
          prefix: 'Routing model ',
          digits: 0,
          suffix: '%',
          size: 32,
        }),
        band,
        0.82,
        0.13,
      ),
      line([center[0] - half, center[1]], [center[0] + half, center[1]], {
        stroke: 'grid',
        width: 3,
      }),
      line([center[0], center[1] - 35], [center[0], center[1] + 35], { stroke: 'ink', width: 3 }),
      at(decimal(() => -range.value, { digits: 0, size: 27, color: 'dim' }), band, 0.045, 0.94),
      at(decimal(() => range.value, { prefix: '+', digits: 0, size: 27, color: 'dim' }), band, 0.955, 0.94),
    );
    const strips = dynamic(() => {
      if (paint.value < 1) return [];
      let pos = center[0],
        neg = center[0];
      const visibleRows = paint.value === 1 ? armRows.filter((t) => t === failed)
        : paint.value === 2 ? armRows.filter((t) => t.risk === 'low') : armRows;
      return visibleRows.map((t) => {
        const residual = (Number(t.resolved) - reward(t)) / propensity(t);
        const width = (Math.abs(residual) * half) / range.value;
        const x = residual > 0 ? pos + width / 2 : neg - width / 2;
        if (residual > 0) pos += width;
        else neg -= width;
        return rect(Math.max(0.3, width - 0.7), 38, {
          fill: t.resolved ? 'green' : 'red',
          stroke: null,
        }).at(x, center[1]);
      });
    });
    s.add(strips);
  });
  const ruler = place(
    numberLine({
      range: [60, 80],
      ticks: [60, 65, 70, 75, 80],
      length: bands[3].width * 0.86,
      labelSize: 34,
      format: (v) => v + '%',
    }),
    bands[3],
  );
  const baseAt = s.value(75),
    endAt = s.value(75),
    visible = s.value(0);
  const baseline = ruler.marker(() => baseAt.value, { color: 'cyan', radius: 11 }).opacity(0);
  const estimate = ruler.marker(() => endAt.value, { color: 'yellow', radius: 10 }).opacity(0);
  s.add(ruler);
  const correctionSpan = dynamic(() => {
    if (visible.value < 0.01) return [];
    const b = baseline.center,
      e = estimate.center;
    return line(b, e, { stroke: 'yellow', width: 7, opacity: visible.value });
  });
  s.add(correctionSpan);
  const go = (cue, model) =>
    c.after(cue, () =>
      s.play(
        visible.to(1),
        baseAt.to(model.baseline * 100),
        endAt.to(model.dr * 100),
        to(estimate, (n) => n.opacity(1)),
        { duration: 0.4 },
      ),
    );
  c.after('shift-input', () => s.play(qShift.to(shift), { duration: 0.45 }));
  c.after('baseline', () => s.play(to(baseline, (n) => n.opacity(1))));
  base(c, 'baseline', pct(good.baseline), true);
  c.after('failure-result', () => paint.set(1));
  c.on('successes', () => paint.set(2));
  c.on('widen', () => s.play(range.to(65), { duration: 0.8 }));
  c.on('hard-group', () => paint.set(3));
  correction(
    c,
    'residuals',
    '(' +
      nfmt(good.groupCorrections[0]) +
      ' − ' +
      nfmt(Math.abs(good.groupCorrections[1])) +
      ') / ' +
      good.rows.length,
    true,
  );
  go('correct', good);
  result(c, 'correct', pct(good.dr), true);
  c.after('wrong', () =>
    s.play(
      wrong.to(1),
      visible.to(0),
      to(estimate, (n) => n.opacity(0)),
    ),
  );
  correction(c, 'wrong', null, true);
  result(c, 'wrong', null, true);
  correction(c, 'new-sum', nfmt(bad.correction * bad.rows.length) + ' / ' + bad.rows.length, true);
  go('biased', bad);
  result(c, 'biased', pct(bad.dr, 1), true);
  c.after('restore-model', () => {
    s.play(
      qShift.to(0),
      visible.to(0),
      to(estimate, (n) => n.opacity(0)),
      to(baseline, (n) => n.opacity(0)),
      { duration: 0.3 },
    );
  });
  base(c, 'restore-model', null, true);
  correction(c, 'restore-model', null, true);
  result(c, 'restore-model', null, true);
  c.after('restore', () =>
    s.play(
      to(baseline, (n) => n.opacity(1)),
      { duration: 0.4 },
    ),
  );
  base(c, 'restore', pct(restored.baseline), true);
  correction(c, 'restore', '0 / ' + restored.rows.length, true);
  go('restore', restored);
  result(c, 'restore', pct(restored.dr), true);
  captions(
    s,
    c,
    'Start with the model’s prediction for the always-assistant policy.',
    [
      ['shift', 'The reward model now overpredicts both risk groups by five points.', true],
      ['failure-input', 'What signed correction does this failed ticket add?'],
      ['failure-result', 'The logger chose assistant for only one easy ticket in ten.', true],
      ['successes', 'The nine successes pull right. The one failure still pulls further left.'],
      [
        'residuals',
        'Each tile contributes one signed residual. The two risk groups each sum to −5.',
        true,
      ],
      [
        'wrong',
        'Replace both assignment probabilities with 0.4. The ticket outcomes stay fixed.',
        true,
      ],
      [
        'restore',
        'Matched subgroup predictions cancel the grouped residuals even with these weights.',
        true,
      ],
    ],
  );
}
