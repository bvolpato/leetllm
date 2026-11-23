import { assertEqual, place, rect, segmentedBar, to } from 'vizmatic/stage';
import { label, mono } from '../../kit-narrated.mjs';
import { STATE, captions, diff, frame, measure, pct, plot, point } from '../parts.mjs';
import { effectAtMix } from '../../../films/causality/model.mjs';
import { rates } from '../../../films/causality/fixtures.mjs';

export default function estimands(s, c) {
  frame(
    s,
    'Who enters the average effect?',
    'Target mix from easy to difficult',
    'Average resolution effect',
  );
  const equal = rates.assistant.map((v, i) => v - rates.control[i]);
  const changed = [0.04, 0.16];
  const mixes = [STATE.weighted.easy[0], STATE.strata.easy[0], STATE.deployment.easy[0]];
  const names = ['All logged tickets', 'Assistant recipients', 'Deployment'];
  const averages = mixes.map((w) => effectAtMix(w, changed));
  assertEqual(diff(averages[1], 1), '+14.8 pp', 'Average among assistant recipients');
  assertEqual(diff(averages[2], 1), '+7.6 pp', 'Average in deployment');
  const right = measure.rows(3, 'normal');
  const equalLabels = [],
    easyLabels = [],
    difficultLabels = [],
    results = [];
  const rows = plot.rows(3, 'normal').map((band, i) => {
    const [title, body, effects] = band.rows([1, 1, 0.8], 'tight');
    const w = mixes[i];
    const chart = place(
      segmentedBar(
        [
          { name: 'Easy', value: w, color: 'dim' },
          { name: 'Difficult', value: 1 - w, color: 'grid' },
        ],
        { width: body.width - 4, height: 48, labels: false, max: 1 },
      ),
      body,
    );
    const centers = [w / 2, (1 + w) / 2];
    const shares = [w, 1 - w].map((v, g) =>
      mono(pct(v), { size: 31, color: g ? 'ink' : 'bg' }).moveTo(point(body, centers[g], 0.5)),
    );
    const effect = (g, v) => mono(diff(v), { size: 31 }).moveTo(point(effects, centers[g], 0.4));
    equalLabels.push(...equal.map((v, g) => effect(g, v)));
    easyLabels.push(effect(0, changed[0]));
    difficultLabels.push(effect(1, changed[1]));
    const value = diff(averages[i], i ? 1 : 0) + ['  ATE', '  ATT', ''][i];
    results.push(place(mono(value, { size: 42, color: 'yellow' }), right[i], 'left'));
    s.add(place(label(names[i], { size: 35 }), title, 'left'), chart, shares);
    return point(right[i], 0, 0.76);
  });
  const width = measure.width * 0.35;
  const focus = rect(width, 4, { fill: 'yellow', stroke: null }).at(
    rows[0][0] + width / 2,
    rows[0][1],
  );
  const select = (cue, i) =>
    c.on(cue, () =>
      s.play(
        to(focus, (v) => v.at(rows[i][0] + width / 2, rows[i][1])),
        { duration: 0.5 },
      ),
    );
  s.add(focus);
  select('treated', 1);
  c.show('equal', equalLabels, { after: true, lead: 0 });
  const original = mixes.map((w, i) =>
    place(mono(diff(effectAtMix(w, equal)), { size: 42 }), right[i], 'left'),
  );
  c.show('equal', original, { after: true, lead: 0 });
  c.hide('change-effects', [equalLabels, original]);
  c.show('easy-effect', easyLabels, { after: true, lead: 0 });
  c.show('different', difficultLabels, { after: true, lead: 0 });
  select('half', 0);
  select('att-mix', 1);
  select('deploy', 2);
  ['ate', 'att', 'deployment'].forEach((cue, i) =>
    c.show(cue, results[i], { after: true, lead: 0 }),
  );
  captions(
    s,
    c,
    'The left segment counts easy tickets. The right segment counts difficult tickets.',
    [
      ['treated', 'ATT averages the effect among tickets assigned to the assistant.'],
      ['change-effects', 'Now suppose the effect differs between easy and difficult tickets.'],
      [
        'deployment',
        'Each row weights the same two subgroup effects by its own population mix.',
        true,
      ],
    ],
  );
}
