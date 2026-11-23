import { assertEqual, dynamic, group, place, to } from 'vizmatic/stage';
import { area, heading, label, mono, namedBox, note, tint } from '../../kit-narrated.mjs';
import { freshPolicyFrame } from '../../../films/beam-search/construction.mjs';
import { retainedPolicy } from '../../../films/beam-search/arithmetic.mjs';
import { COLORS } from '../parts.mjs';
import { drawWord, massStrip, rankPin } from '../ruler.mjs';

export default function freshPolicy(s, c) {
  const guide = ['backup', 'rotate', 'remove'];
  const words = [...guide, 'quota'];
  const raw = freshPolicyFrame({ beat: 0, beatP: 0 }).probabilities;
  const threshold = 0.75;
  const u = 0.65;
  const nucleus = retainedPolicy(raw, 'p', threshold);
  // Intersect the nucleus with the enum, then with any first-step requirement.
  const kept = raw.map((p, i) => (nucleus.indices.includes(i) && guide.includes(words[i]) ? p : 0));
  const normalize = (weights) => {
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    return weights.map((weight) => weight / total);
  };
  const policy = normalize(kept);
  const onlyFirst = policy.map((p, i) => (words[i] === guide[0] ? p : 0));
  const repaired = normalize(onlyFirst);
  const first = drawWord(words, policy, u);
  const second = drawWord(words, repaired, u);
  assertEqual(first + '/' + second, 'rotate/backup', 'two draws at the same rank');

  const [guideTitle, guideLine, inputs, plot, readout, footer] = area
    .inset('normal')
    .rows([0.6, 1, 1.2, 2.4, 1.25, 1.3], 'normal');
  const guideLabel = place(note('Retrieved guide     •     steps in order'), guideTitle, 'left');
  const guideBoxes = guideLine
    .columns(3, 'wide')
    .map((cell, i) =>
      place(namedBox(`${i + 1}    ${guide[i]}`, { width: 330, height: 78, size: 38 }), cell),
    );
  const values = raw.map((p, i) =>
    place(
      mono(`${words[i]}   ${p.toFixed(2)}`, { color: COLORS[i], size: 34 }),
      inputs.columns(4, 'tight')[i],
    ),
  );
  const bar = plot.inset('wide');
  const original = massStrip(bar, raw, COLORS);
  const truncated = massStrip(bar, kept, COLORS);
  const cut = rankPin(bar, threshold, 'threshold .75');
  const pin = rankPin(bar, u, 'draw .65');
  const stage = place(note('First-word field accepts backup, rotate or remove'), footer);
  const whereCut = place(
    label('At which word does the cumulative mass reach .75?', { size: 40 }),
    footer,
  );
  const sum = place(
    mono(
      `Retained mass    ${kept[0].toFixed(2)} + ${kept[1].toFixed(2)} = ${nucleus.mass.toFixed(2)}`,
    ),
    readout,
  );
  const splits = place(
    mono(`Draw shares    backup ${policy[0].toFixed(3)}    rotate ${policy[1].toFixed(3)}`, {
      size: 37,
    }),
    readout,
  );
  const extent = s.value(nucleus.mass);
  const live = dynamic(() =>
    group(
      ...massStrip(
        bar,
        policy.map((p) => p * extent.value),
        COLORS,
      ),
    ),
  );
  const allowed = place(
    label('Keep only step 1 of the guide. Which word will own .65?', { size: 39 }),
    footer,
  );
  const survivor = massStrip(bar, onlyFirst, COLORS);
  const growth = s.value(onlyFirst[0]);
  const corrected = dynamic(() =>
    group(
      ...massStrip(
        bar,
        repaired.map((p) => p * growth.value),
        COLORS,
      ),
    ),
  );
  const draw = place(label('Which word does the sampler write?', { size: 40 }), footer);
  const previous = place(
    label(`Sampled first word     ${first}`, { size: 44, color: COLORS[words.indexOf(first)] }),
    footer,
  );
  const rescale = place(
    mono(`Surviving share   ${onlyFirst[0].toFixed(3)}    →    renormalize`, { size: 36 }),
    readout,
  );
  const selected = place(
    label(`Sampled first word     ${second}`, { size: 44, color: COLORS[words.indexOf(second)] }),
    readout,
  );

  const answer = [second, guide[2], guide[1]];
  const mismatch = answer.findIndex((word, i) => word !== guide[i]);
  const reordered = [...answer];
  [reordered[1], reordered[2]] = [reordered[2], reordered[1]];
  assertEqual(mismatch + 1, 2, 'first unsupported step of the supplied complete answer');
  assertEqual(reordered.join('/'), guide.join('/'), 'reordered steps match the guide');
  const planHead = place(
    note('Finished answer     •     compare each step with the guide above'),
    inputs,
    'left',
  );
  const cells = plot.columns(3, 'wide');
  const plan = answer.map((word, i) =>
    place(namedBox(word, { width: 330, height: 78, size: 41 }), cells[i]),
  );
  const prompt = place(
    label('Where does the answer first depart from the guide?', { size: 42 }),
    footer,
  );
  const reason = place(
    label(`Step ${mismatch + 1}     •     the guide calls for ${guide[mismatch]} here.`, {
      size: 40,
      color: 'yellow',
    }),
    footer,
  );
  const verdict = place(
    label('Accept the revised answer     •     all three steps match the guide', {
      size: 39,
      color: 'green',
    }),
    footer,
  );
  const title = heading(c.title);
  s.add(title, guideLabel, stage);
  c.show('new-guide', guideBoxes);
  c.show(1, [original, values]);
  c.show('threshold', cut);
  c.swap('threshold', stage, whereCut);
  c.swap('crossing', original, truncated, { after: true });
  c.hide('crossing', cut, { after: true });
  c.hide('crossing', whereCut, { after: true });
  c.show('kept-mass', sum, { after: true });
  c.swap('sample-space', truncated, live);
  c.on('sample-space', () => s.play(extent.to(1, { duration: 0.95 })));
  c.swap('sample-space', sum, splits, { after: true });
  c.show('draw', pin);
  c.show('draw', draw);
  c.swap('initial-pick', draw, previous, { after: true });
  c.swap('apply-guide', previous, allowed);
  c.swap('apply-guide', live, survivor, { after: true });
  c.swap('apply-guide', splits, rescale, { after: true });
  c.swap('fixed-pick', survivor, corrected, { after: true });
  c.after('fixed-pick', () => s.play(growth.to(1, { duration: 0.9 })));
  c.swap('fixed-pick', rescale, selected, { after: true });
  c.hide('fixed-pick', allowed, { after: true });
  c.swapAll('finished-answer', [planHead, plan, prompt], { keep: [title, guideLabel, guideBoxes] });
  c.swap('bad-index', prompt, reason, { after: true });
  c.after('bad-index', () =>
    s.play(tint(plan[mismatch], 'yellow'), tint(guideBoxes[mismatch], 'yellow')),
  );
  c.on('move-step', () => {
    const left = cells[1],
      right = cells[2];
    s.play(
      tint(guideBoxes[mismatch], 'ink'),
      to(plan[1], (n) => n.moveTo([left.cx, left.cy + 65])),
      to(plan[2], (n) => n.moveTo([right.cx, right.cy - 65])),
      { duration: 0.28 },
    );
    s.play(
      to(plan[1], (n) => n.moveTo([right.cx, right.cy + 65])),
      to(plan[2], (n) => n.moveTo([left.cx, left.cy - 65])),
      { duration: 0.6 },
    );
    s.play(
      to(plan[1], (n) => n.moveTo(right.point('center'))),
      to(plan[2], (n) => n.moveTo(left.point('center'))),
      { duration: 0.28 },
    );
  });
  c.hide('move-step', reason);
  c.after('accept', () => s.play(...plan.map((node) => tint(node, 'green'))));
  c.show('accept', verdict, { after: true });
}
