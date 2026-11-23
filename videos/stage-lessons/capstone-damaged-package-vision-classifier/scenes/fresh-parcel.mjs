import { column, group, place, rect, to } from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';
import { ACTION } from '../parts.mjs';
import { caption, photograph } from '../inspection.mjs';
import { visionFresh } from '../../../films/capstone-damaged-package-vision-classifier/arithmetic.mjs';

export default function scene(s, c) {
  const early = visionFresh(21),
    late = visionFresh(22);
  const [top, body, status, foot] = area.rows([1, 5.5, 1, 1], 'normal');
  const views = early.traces.filter((t) => t.case_id === 'R-520');
  const cards = body.columns(2, 'loose').map((panel, i) => {
    const [name, image, readings] = panel.rows([1, 5, 1], 'normal');
    const view = views[i];
    return [
      caption(name, view.photo_id, 'cyan', 40),
      photograph(image, i ? 'carton-with-tear' : 'dark'),
      caption(
        readings,
        'Brightness ' +
          view.brightness.toFixed(2) +
          '     Damage ' +
          view.damage_probability.toFixed(2),
        'ink',
        38,
      ),
    ];
  });
  const rule = caption(
    top,
    'Both visible   •   Blur 0.10   •   Minimum brightness 0.20   •   Priority at 0.70',
    'ink',
    38,
  );
  const ask = caption(foot, 'Which queue gets this case?', 'yellow');
  const [a, b] = status.columns(2, 'loose');
  const routes = [caption(a, 'Request a new photo', 'cyan'), caption(b, 'Normal review', 'yellow')];
  const action = ACTION[early.servedActions['R-520']];
  const answer = caption(foot, 'R-520    ' + action + ' review', 'yellow');
  const photoHeading = heading(c.title);
  s.add(photoHeading, ...cards[0]);
  c.show('second', cards[1]);
  c.show('limits', rule);
  c.show('ask', ask);
  c.show('retake', routes[0], { after: true });
  c.show('normal', routes[1], { after: true });
  c.swap('case', ask, answer, { after: true });

  const [rack, waiting] = body.rows([1, 1], 'wide');
  const pockets = rack.columns(early.expected, 'normal');
  const queue = waiting.columns(early.expected, 'normal');
  const records = late.joined;
  const open = pockets.map((slot) =>
    place(
      rect(slot.width, slot.height, {
        fill: 'surface',
        stroke: 'grid',
        width: 3,
        dash: [10, 8],
      }),
      slot,
    ),
  );
  function caseSlip(record, slot) {
    const frame = place(
      rect(slot.width - 12, slot.height - 10, { fill: '#1b303d', stroke: 'cyan', width: 2 }),
      slot,
    );
    const rows = place(
      column(
        [
          mono(record.case_id, { size: 36, color: 'cyan' }),
          label(ACTION[late.servedActions[record.case_id]], { size: 36 }),
          label(record.cell === 'TP' || record.cell === 'FN' ? 'Damaged' : 'Clear', {
            size: 36,
            color: 'pink',
          }),
        ],
        { gap: 'tight' },
      ),
      slot,
    );
    return group(frame, ...rows.nodes);
  }
  const slips = records.map((record, i) =>
    caseSlip(record, record.case_id === 'R-520' ? queue[i] : pockets[i]),
  );
  const last = records.findIndex((record) => record.case_id === 'R-520');
  const caseReceipt = caption(
    top,
    'R-520   ·   Day 20   ·   Served ' + action.toLowerCase() + ' review',
    'yellow',
  );
  const otherSpace = waiting.columns([3.8, 1], 'wide')[0];
  const pending = caption(
    otherSpace,
    'Specialist review on day 21    •    Available on day 22',
    'ink',
    37,
  );
  const count = (day, sample) =>
    caption(
      status,
      'Day ' +
        day +
        '     •     ' +
        sample.joined.length +
        ' of ' +
        sample.expected +
        ' usable cases joined',
      'cyan',
      40,
    );
  const [precisionSlot, recallSlot] = foot.columns(2, 'loose');
  const { TP, FP } = early.counts;
  const precision = caption(precisionSlot, 'Precision   ' + TP + ' / ' + (TP + FP), 'yellow', 44);
  const recall = ({ counts }) =>
    caption(
      recallSlot,
      'Observed recall   ' + counts.TP + ' / ' + (counts.TP + counts.FN),
      'yellow',
      44,
    );
  const day21 = count(21, early),
    day22 = count(22, late);
  const recall21 = recall(early);
  c.swap(
    'report',
    [photoHeading, rule, cards, routes, answer],
    [
      heading('Which damaged parcels reached priority?'),
      caseReceipt,
      open,
      slips.filter((_, i) => i !== last),
      day21,
    ],
  );
  c.show('dated', [slips[last], pending]);
  c.show('early', [precision, recall21], { after: true });
  const predict = caption(status, 'At day 22, what will enter the recall denominator?', 'yellow');
  c.swap('predict', day21, predict);
  c.hide('advance', [recall21, predict, pending]);
  c.on('advance', () => s.play(to(slips[last], (n) => place(n, pockets[last]), { duration: 0.9 })));
  c.show('joined', day22, { after: true });
  c.show('metrics', recall(late), { after: true });
  c.show(
    'decision',
    caption(otherSpace, 'R-520   ·   One damaged case missed by priority review', 'pink', 38),
    { after: true },
  );
}
