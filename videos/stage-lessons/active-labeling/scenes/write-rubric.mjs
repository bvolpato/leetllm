import {
  appear,
  vanish,
  assertEqual,
  boxOf,
  column,
  dot,
  grid,
  indicate,
  place,
  rect,
  row,
  seq,
  to,
} from 'vizmatic/stage';
import { chip, label, namedBox, note, para, tint } from '../../kit-narrated.mjs';
import { candidates } from '../../../films/active-labeling/fixtures.mjs';
import { judgePair } from '../../../films/active-labeling/model.mjs';
import { footer, open, picture } from '../parts.mjs';
export default function writeRubric(s, c) {
  open(s, c);
  const [ruleRegion, pairRegion, outRegion] = picture.rows([1, 4, 2], 'wide');
  const rules = place(
    row(
      ['safety + authorization', 'correctness', 'useful next step', 'clarity'].map((v) =>
        chip(v, { color: 'dim' }),
      ),
      { gap: 'normal' },
    ),
    ruleRegion,
  );
  const cells = pairRegion.columns(2, 'loose');
  const frames = cells.map((r) =>
    place(rect(r.width - 8, r.height - 8, { stroke: 'dim', width: 4, radius: 12 }), r).zIndex(-1),
  );
  const makeAnswer = (id, index) => {
    const a = candidates[id];
    return place(
      column(
        [
          label(id, { color: a.safe ? 'green' : 'red' }),
          para(a.label.replace('\n', '. '), cells[index].width - 80),
          row([
            chip('safe: ' + a.safe, { color: a.safe ? 'green' : 'red' }),
            chip('correct: ' + a.correct, { color: a.correct ? 'green' : 'red' }),
          ]),
        ],
        { gap: 'normal' },
      ),
      cells[index].inset('normal'),
    );
  };
  const ab = ['A', 'B'].map(makeAnswer),
    cd = ['C', 'D'].map(makeAnswer);
  const [decisionRegion, otherRegion] = outRegion.columns(2, 'wide');
  const decisionFrame = place(
    rect(decisionRegion.width - 8, decisionRegion.height - 8, {
      stroke: 'dim',
      width: 4,
      radius: 12,
    }),
    decisionRegion,
  ).zIndex(-1);
  const chosen = place(
    label(judgePair(candidates.A, candidates.B), { color: 'yellow' }),
    decisionRegion,
  );
  const both = place(
    column([
      label(judgePair(candidates.C, candidates.D), { color: 'red' }),
      note('incident review'),
    ]),
    decisionRegion,
  );
  const tie = chip('safe equivalents → tie', { color: 'dim' });
  const adjudication = chip('missing evidence → adjudicate', { color: 'red' });
  const alternatives = place(column([tie, adjudication]), otherRegion);
  const flags = place(
    note('Reviewer-supplied flags · approval and answer text are not verified here.'),
    footer,
  );
  const ratings = { full: 5, missing: 3, invented: 1 };
  assertEqual(
    ratings.full > ratings.missing && ratings.missing > ratings.invented,
    true,
    'citation anchors are ordered',
  );
  const citationRegions = picture.columns(3, 'wide');
  const citationFrames = citationRegions.map((r) =>
    place(rect(r.width - 8, r.height - 8, { stroke: 'dim', width: 3, radius: 12 }), r).zIndex(-1),
  );
  const citationHeads = citationRegions.map((r) =>
    place(note('Citation rubric'), r.inset('normal'), 'top'),
  );
  const anchors = [
    [ratings.full, 'green', 'Suite: required suite', 'Approval: approved ID'],
    [ratings.missing, 'dim', 'Suite: required suite', 'Approval: omitted'],
    [ratings.invented, 'red', 'Suite: required suite', 'Approval: invented ID'],
  ].map(([score, color, suite, approval], i) =>
    place(
      column([label(String(score), { size: 96, color }), note(suite), note(approval, { color })], {
        gap: 'wide',
      }),
      citationRegions[i].inset('normal'),
    ),
  );
  const spacing = place(note('Ordered anchors · no assumed equal spacing'), footer);
  const [qualificationLine, instructionLine] = footer.rows(2, 'tight');
  const missing = place(
    note('Missing approval evidence → review.', { color: 'red' }),
    qualificationLine,
  );
  const blindIdentity = note('Hide model identities from reviewers.');
  const balanceOrder = note('Balance the display order.');
  const reviewInstructions = place(row([blindIdentity, balanceOrder]), instructionLine);
  const recordOrder = place(
    note('Store the response identities and their display order.'),
    instructionLine,
  );
  const dots = frames.map((frame, i) =>
    dot(13, i ? 'red' : 'green').moveTo(boxOf(frame).point('top')),
  );
  const gateLane = boxOf(rules).bottom + 22;
  const safetyGate = [boxOf(rules.nodes[0]).point('center')[0], gateLane];
  const correctnessGate = [boxOf(rules.nodes[1]).point('center')[0], gateLane];
  const outside = boxOf(frames[0]).left + 12;
  const decisionArrival = [outside, boxOf(decisionFrame).top];
  s.add(rules, frames, ab, decisionFrame, flags);
  c.on('policy-first', () =>
    s.play(indicate(rules.nodes.slice(0, 2), { color: 'yellow', scale: 1 })),
  );
  c.show('compare-pair', dots);
  c.on(
    'compare-pair',
    () =>
      s.play(
        seq(
          to(dots[0], (n) => n.moveTo([boxOf(frames[0]).point('top')[0], gateLane]), {
            duration: 0.3,
          }),
          to(dots[0], (n) => n.moveTo(safetyGate), { duration: 0.6 }),
          to(dots[0], (n) => n.moveTo(correctnessGate), { duration: 0.8 }),
          to(dots[0], (n) => n.moveTo([outside, gateLane]), { duration: 0.6 }),
          to(dots[0], (n) => n.moveTo(decisionArrival), { duration: 0.8 }),
        ),
        seq(
          to(dots[1], (n) => n.moveTo([boxOf(frames[1]).point('top')[0], gateLane]), {
            duration: 0.3,
          }),
          to(dots[1], (n) => n.moveTo(safetyGate), { duration: 1.4 }),
        ),
      ),
    0.4,
  );
  c.show('choose-a', chosen, { after: true });
  c.hide('choose-a', dots, { after: true });
  c.swap(2, ab, cd);
  c.hide(2, chosen);
  c.show('both-unsafe', both.nodes[0], { after: true });
  c.show('incident-route', both.nodes[1], { after: true });
  c.show('separate-outcomes', tie, { after: true });
  c.show('adjudicate-missing-evidence', adjudication, { after: true });
  c.on('citation-five', () =>
    s.play(
      vanish([rules, frames, cd, decisionFrame, both, alternatives, flags]),
      appear([citationFrames, citationHeads]),
    ),
    -0.1,
  );
  c.show('citation-five', anchors[0]);
  c.show('citation-three', anchors[1]);
  c.show('citation-one', anchors[2]);
  c.show('rating-anchors', spacing);
  c.swap('missing-context', spacing, missing);
  c.show('blind-model-identity', blindIdentity, { after: true });
  c.show('balance-display-order', balanceOrder, { after: true });
  c.after('store-response-order', () => s.play(vanish(reviewInstructions), appear(recordOrder)));
}
