import { column, group, place, rect, to } from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';
import { visionDevelopment } from '../../../films/capstone-damaged-package-vision-classifier/fixtures.mjs';
import { visionThreshold } from '../../../films/capstone-damaged-package-vision-classifier/arithmetic.mjs';
import { caption } from '../inspection.mjs';

export default function scene(s, c) {
  s.add(heading(c.title));
  const [rule, trayTitle, tray, waiting, history, decision] = area.rows(
    [1, 0.72, 2.35, 2.35, 1.65, 0.9],
    'normal',
  );
  const slots = 4,
    minRecovered = 3;
  const positives = visionDevelopment.filter(([, damaged]) => damaged).length;
  const cutoffs = [0.8, 0.7, 0.3];
  const results = cutoffs.map((cut) => visionThreshold(visionDevelopment, cut));
  const bays = tray.columns(visionDevelopment.length, 'normal');
  const bench = waiting.columns(visionDevelopment.length, 'normal');
  const [left, right] = trayTitle.columns([4, 2], 'normal');
  s.add(
    caption(
      rule,
      'At most 4 priority cases     •     Recover at least 3 of the 4 damaged cases',
      'ink',
    ),
    caption(left, 'Priority review slots', 'yellow', 34),
    caption(right, 'Beyond capacity', 'pink', 34),
  );
  const tickets = visionDevelopment.map(([score, damaged], i) => {
    const bay = bays[i],
      slot = bench[i];
    s.add(
      place(
        rect(bay.width, bay.height, {
          fill: 'surface',
          stroke: i < slots ? 'yellow' : 'pink',
          width: 2,
          ...(i >= slots ? { dash: [10, 8] } : {}),
        }),
        bay,
      ),
    );
    const panel = place(
      rect(slot.width - 20, slot.height - 12, { fill: '#1d303f', stroke: 'grid', width: 2 }),
      slot,
    );
    const words = place(
      column(
        [
          mono(score.toFixed(2), { size: 54 }),
          label(damaged ? 'Damaged' : 'Clear', { size: 35, color: damaged ? 'pink' : 'cyan' }),
        ],
        { gap: 'tight' },
      ),
      slot,
    );
    return group(panel, ...words.nodes);
  });
  const ledger = history.columns(cutoffs.length, 'wide');
  const totals = results.map((m, i) =>
    place(
      column(
        [
          mono('Cutoff ' + m.threshold.toFixed(2), { size: 36, color: 'dim' }),
          label(m.slots + ' slots   ·   ' + m.TP + '/' + positives + ' recovered', { size: 37 }),
        ],
        { gap: 'tight' },
      ),
      ledger[i],
    ),
  );
  s.add(tickets);
  let current = Infinity;
  function testCut(cue, cutoff) {
    const from = current;
    current = cutoff;
    c.on(cue, () => {
      const moves = tickets.flatMap((ticket, i) => {
        const score = visionDevelopment[i][0];
        if (score >= cutoff === score >= from) return [];
        const slot = score >= cutoff ? bays[i] : bench[i];
        return [to(ticket, (node) => place(node, slot), { duration: 0.8 })];
      });
      s.play(...moves);
    });
  }
  const active = cutoffs.map((cut) =>
    caption(decision, 'Testing cutoff  ' + cut.toFixed(2), 'blue', 37),
  );
  let prior;
  for (const [i, cue] of ['eight', 'seven', 'three'].entries()) {
    testCut(cue, cutoffs[i]);
    if (prior) c.swap(cue, prior, active[i]);
    else c.show(cue, active[i]);
    c.show(cue + '-count', totals[i], { after: true });
    prior = active[i];
  }
  const ask = caption(decision, 'Which cutoff meets both requirements?');
  c.swap('ask', prior, ask);
  const chosen = results.find((m) => m.slots <= slots && m.TP >= minRecovered);
  testCut('choose', chosen.threshold);
  c.swap(
    'choose',
    ask,
    caption(decision, 'Freeze ' + chosen.threshold.toFixed(2) + ' for the holdout', 'yellow'),
    { after: true },
  );
}
