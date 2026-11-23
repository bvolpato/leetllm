import { assertEqual, column, line, place, rect, to } from 'vizmatic/stage';
import { area, heading, label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { modelMix, riskDesk } from '../desk.mjs';
import { evidenceValue, reviewValue } from '../parts.mjs';

const speedScores = [
  { action: 'Approve', points: 100, color: 'pink' },
  { action: 'Ask for proof', points: 45, color: 'green' },
  { action: 'Human review', points: 15, color: 'blue' },
];

function checkProposal(action, verified) {
  if (action === 'Approve' && !verified) return { allowed: false, execute: 'Human review' };
  return { allowed: true, execute: action };
}

export default function rewardDesign(s, c) {
  const b = riskDesk(s, { initial: 4, min: 52, max: 56, ticks: [52, 53, 54, 55, 56] });
  const title = heading(c.title);
  const message = (words, color = 'yellow') => place(label(words, { color }), b.foot);
  const payoffs = (percent) =>
    place(
      column(
        [
          mono('Verified reply  +59', { color: 'green' }),
          mono('Leave  −54', { color: 'pink' }),
          mono(modelMix(percent), { size: 40 }),
        ],
        { gap: 'normal' },
      ),
      b.arithmetic,
    );
  const before = payoffs(4),
    after = payoffs(5);
  const [firstReturn, nextReturn] = [4, 5].map((percent) => evidenceValue(percent / 100));
  assertEqual(firstReturn.toFixed(2), '54.48', '4 percent abandonment');
  assertEqual(nextReturn.toFixed(2), '53.35', '5 percent abandonment');
  assertEqual((firstReturn - nextReturn).toFixed(2), '1.13', 'return cost of one percentage point');
  assertEqual(
    nextReturn < reviewValue && reviewValue < firstReturn,
    true,
    'one mark reverses the decision',
  );
  const fifth = b.tray.cells[4];
  const highlight = rect(fifth.width + 5, fifth.height + 5, {
    radius: 6,
    fill: null,
    stroke: 'yellow',
    width: 4,
  }).moveTo(fifth.point('center'));
  const [oldX, oldY] = b.ruler.point(firstReturn);
  const oldTick = line([oldX, oldY - 8], [oldX, oldY + 11], { stroke: 'dim', width: 4 });
  const previous = mono('At 4%   ' + firstReturn.toFixed(2), { color: 'dim', size: 32 }).moveTo([
    oldX,
    oldY - 151,
  ]);
  const previousChoice = message('At 4%, ask for proof.', 'green');
  const pick = message('At 5%, ask for proof or send to review?');
  const difference = message('One change per hundred costs (59 + 54) / 100 = 1.13 points.');
  const newChoice = message('At 5%, send to review.', 'blue');

  const [header, scoreLabel, scoresRegion, stations, track, check, foot] = area.rows(
    [1, 0.55, 1.6, 0.65, 1.2, 0.8, 1.1],
    'normal',
  );
  const [idArea, evidenceArea] = header.columns([1, 1], 'wide');
  const id = place(mono('REQ-10234', { color: 'cyan' }), idArea, 'left');
  const field = (words) =>
    place(namedBox(words, { width: 665, height: 92, color: 'yellow' }), evidenceArea, 'right');
  const emptyField = field('Verified evidence  [ empty ]');
  const fullField = field('Verified evidence  [ present ]');
  const speedHeading = place(note('Simulator objective  ·  speed of closure'), scoreLabel);
  const speedCells = scoresRegion.columns(3, 'wide');
  const scores = speedScores.map(({ action, points, color }, i) => {
    const [name, value] = speedCells[i].rows([1, 1.3], 4);
    return {
      name: place(label(action, { color }), name),
      value: place(mono(String(points), { size: 60, color }), value),
    };
  });
  const proposal = speedScores.reduce((best, candidate) =>
    candidate.points > best.points ? candidate : best,
  ).action;
  const original = checkProposal(proposal, false);
  const replay = checkProposal(proposal, true);
  assertEqual(proposal, 'Approve', 'speed score proposes approval');
  assertEqual(original.allowed, false, 'unverified proposal is rejected');
  assertEqual(original.execute, 'Human review', 'fallback for missing proof');
  assertEqual(
    replay.allowed && replay.execute === proposal,
    true,
    'same proposal with verified proof',
  );
  const labels = stations
    .columns(3, 'loose')
    .map((box, i) => place(note(['Proposal', 'P-7 checks proof', 'Executed action'][i]), box));
  const bays = track.columns(3, 'loose');
  const points = bays.map((bay) => bay.point('center'));
  const rails = [0, 1].map((i) =>
    line([points[i][0] + 155, points[i][1]], [points[i + 1][0] - 155, points[i + 1][1]], {
      stroke: 'faint',
      width: 3,
    }),
  );
  const token = (name, i, color) =>
    place(namedBox(name, { width: 300, height: 94, color }), bays[i]);
  const firstToken = token(proposal, 0, 'pink');
  const fallback = token(original.execute, 1, 'blue');
  const replayToken = token(replay.execute, 0, 'pink');
  const prompt = (words) => place(label(words, { color: 'yellow' }), foot);
  const speedPrompt = prompt('Which action earns the highest speed score?');
  const rejected = place(label('Approval rejected  ·  proof missing', { color: 'pink' }), check);
  const held = place(label('Human review receives the ticket.', { color: 'blue' }), foot);
  const oldReceipt = place(
    column(
      [
        note('09:00  ·  Before verification'),
        mono('No proof    →    Human review', { color: 'blue' }),
      ],
      { gap: 'tight' },
    ),
    scoresRegion,
  );
  const same = prompt('Same approval proposal. What executes with verified proof?');
  const passed = place(label('Proof verified  ·  approval permitted', { color: 'green' }), check);
  const audit = place(
    label('Score the 09:00 decision with the 09:00 evidence.', { color: 'yellow' }),
    foot,
  );

  s.add(title, b.nodes, b.fixed);
  c.show('four', before, { after: true });
  c.show('first-mean', b.marker, { after: true });
  c.show('first-choice', previousChoice, { after: true });
  c.swap('fifth', [previousChoice, before, b.marker], [after, oldTick, previous], {
    fade: 0.12,
    lead: 0,
  });
  c.after('fifth', () => s.play(b.p.to(5, { duration: 0.5 })));
  c.show('fifth', highlight, { after: true });
  c.show('predict', pick);
  c.swap('difference', pick, difference, { after: true });
  c.show('new-mean', b.marker, { after: true });
  c.swap('safe-choice', difference, newChoice, { after: true });
  c.swap(
    'speed',
    [b.nodes, b.fixed, b.marker, after, oldTick, previous, highlight, newChoice],
    [id, emptyField, speedHeading, scores.map((x) => x.name), labels, rails],
  );
  for (const [i, cue] of ['speed-approve', 'speed-ask', 'speed-review'].entries()) {
    c.show(cue, scores[i].value, { after: true });
  }
  c.show('predict-speed', speedPrompt);
  c.swap('propose', speedPrompt, firstToken, { after: true });
  c.on('gate', () => s.play(to(firstToken, (n) => n.moveTo(points[1]), { duration: 0.85 })));
  c.on('empty', () => s.play(to(emptyField.frame, (n) => n.stroke('pink'), { duration: 0.3 })));
  c.show('denied', rejected, { after: true });
  c.swap('fallback', firstToken, fallback, { after: true, fade: 0.13 });
  c.after(
    'fallback',
    () => s.play(to(fallback, (n) => n.moveTo(points[2]), { duration: 0.7 })),
    0.48,
  );
  c.show('fallback', held, { after: true, lead: -1.25 });
  c.swap(
    'replay',
    [speedHeading, scores.flatMap((x) => [x.name, x.value]), rejected, held, fallback],
    oldReceipt,
  );
  c.swap('verified', emptyField, fullField, { after: true });
  c.show('same-proposal', replayToken);
  c.after('same-proposal', () =>
    s.play(to(replayToken, (n) => n.moveTo(points[1]), { duration: 0.6 })),
  );
  c.show('predict-gate', same);
  c.swap('allow', same, passed, { after: true });
  c.after('allow', () => s.play(to(replayToken, (n) => n.moveTo(points[2]), { duration: 0.85 })));
  c.show('audit', audit);
}
