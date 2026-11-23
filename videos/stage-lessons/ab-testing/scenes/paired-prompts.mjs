import {
  arrow,
  axes,
  boxOf,
  column,
  dot,
  fade,
  line,
  place,
  polyline,
  row,
  tex,
  to,
} from 'vizmatic/stage';
import { chip, heading, label, mono, note, para } from '../../kit-narrated.mjs';
import { BODY, FOOT } from '../parts.mjs';
import { pairedContrastVariance } from '../../../films/ab-testing/model.mjs';
import { AB_VISUAL_FIXTURES as fixture } from '../../../films/ab-testing/fixtures.mjs';
export default function paired(s, c) {
  const [promptRegion, scoresRegion, contrastRegion] = BODY.rows([1, 3, 3], 'wide');
  const prompt = place(chip('same offline prompt'), promptRegion);
  const scoreRegions = scoresRegion.rows(2, 'wide');
  const shared = scoreRegions.map((region, i) =>
    place(
      row(
        [
          label(i ? 'treatment' : 'control', { color: i ? 'blue' : 'cyan' }),
          chip('difficulty'),
          label(i ? '+ effect + noise T' : '+ noise C', { size: 36 }),
        ],
        { gap: 'normal' },
      ),
      region,
    ),
  );
  const terms = shared.map((block) => block.nodes[1]);
  const equation = place(
    tex('T-C = effect + noise_T-noise_C', { size: 40 }),
    contrastRegion,
    'top',
  );
  const compareTitle = place(
    note('2,000 simulated answers per design   ·   approximate 95% intervals'),
    promptRegion,
  );
  const compareAxis = place(
    axes({
      x: [0, 1],
      y: [0, 3],
      width: scoresRegion.width * 0.8,
      height: scoresRegion.height * 0.7,
      labels: false,
      tips: false,
    }),
    scoresRegion,
  );
  const compareRows = ['independent', 'paired'].map((name, i) => {
    const estimate = fixture.paired[i ? 'pairedLift' : 'independentLift'];
    const se = fixture.paired[i ? 'pairedSe' : 'independentSe'];
    const y = i ? 0.65 : 2;
    const color = i ? 'yellow' : 'cyan';
    return [
      mono(`${name}: ${estimate.toFixed(3)}, SE ${se.toFixed(3)}`, { size: 36, color }).moveTo(
        compareAxis.world(0.5, y + 0.65),
      ),
      line(compareAxis.world(estimate - 1.96 * se, y), compareAxis.world(estimate + 1.96 * se, y), {
        stroke: color,
        width: 8,
      }),
      dot(10, color).moveTo(compareAxis.world(estimate, y)),
    ];
  });
  const compareTicks = [0, 0.5, 1].map((x) => {
    const p = compareAxis.world(x, 0);
    return mono(String(x), { size: 34, color: 'dim' }).moveTo([p[0], p[1] + 35]);
  });
  const gain = place(
    mono(`Contrast variance −${(fixture.paired.varianceReduction * 100).toFixed(1)}%`, {
      color: 'yellow',
      size: 38,
    }),
    contrastRegion,
  );
  const [lastTitle, content, experience] = BODY.rows([1, 4, 1.5], 'wide');
  const [listRegion, answerRegion] = content.columns([1, 1.5], 'wide');
  const ranked = place(
    column(
      [
        label('Interleaved results', { size: 36 }),
        note('1. C: canary status', { color: 'cyan' }),
        note('2. T: rollback policy', { color: 'blue' }),
        note('3. C: error chart', { color: 'cyan' }),
        note('4. T: owner record', { color: 'blue' }),
        note('click → source credit', { color: 'yellow' }),
      ],
      { gap: 'normal' },
    ),
    listRegion,
  );
  const answerSlots = answerRegion.rows(2, 'wide');
  const answers = [
    place(
      column(
        [
          label('Answer C', { color: 'cyan', size: 34 }),
          para('Check canary status. Inspect the error chart.', answerSlots[0].width, { size: 34 }),
        ],
        { gap: 'normal' },
      ),
      answerSlots[0],
    ),
    place(
      column(
        [
          label('Answer T', { color: 'blue', size: 34 }),
          para('Read the rollback policy. Confirm owner acknowledgement.', answerSlots[1].width, {
            size: 34,
          }),
        ],
        { gap: 'normal' },
      ),
      answerSlots[1],
    ),
  ];
  const finalTitle = place(
    label('Lists and complete answers expose different things', { size: 36 }),
    lastTitle,
  );
  const incident = place(chip('inc-17: engineer sees C', { color: 'cyan' }), experience);
  const mixed = place(chip('inc-17: engineer sees C + T', { color: 'red' }), experience);
  const entry = boxOf(incident).point('right');
  const routes = answers.map((answer) => {
    const start = boxOf(answer).point('right');
    start[0] += 18;
    const outside = BODY.point('right')[0] + 24;
    return [start, [outside, start[1]], [outside, entry[1]], entry];
  });
  const links = routes.map((points, i) => [
    polyline(points.slice(0, 3), { stroke: i ? 'blue' : 'cyan', width: 3 }),
    arrow(points[2], points[3], { stroke: i ? 'blue' : 'cyan', width: 3, pad: 20 }),
  ]);
  const token = dot(12, 'blue').moveTo(routes[1][0]);
  const limit = place(
    note('A hard prompt lowers both scores. Pairing cancels the shared difficulty.'),
    FOOT,
  );
  const exposure = place(
    note('Showing both answers changes exposure to the incident policy.'),
    FOOT,
  );
  s.add(heading('Cancel shared difficulty before averaging'), prompt, shared);
  const pairedVariance = pairedContrastVariance(4, 9, 3);
  const difference = place(
    mono('Independent prompts   9 + 4 = 13     ·     Paired   9 + 4 − 2 × 3 = ' + pairedVariance, {
      size: 39,
    }),
    FOOT,
  );
  c.on('cancel', () => s.play(...terms.map((term) => fade(term, 0.2, { duration: 1.2 }))));
  c.show('cancel', equation, { after: true });
  c.show('variance', difference, { after: true });
  c.swap(1, [prompt, shared, equation, difference], [compareTitle, compareAxis, compareTicks]);
  c.show('independent', compareRows[0], { after: true });
  c.show('paired-se', compareRows[1], { after: true });
  c.show('variance-gain', gain, { after: true });
  c.show('scope', limit);
  c.swap(
    'interleaving',
    [compareTitle, compareAxis, compareTicks, compareRows, gain, limit],
    [finalTitle, ranked],
  );
  c.show('answers', [answers, incident, links[0]]);
  c.show('exposure', [links[1], token]);
  c.on('exposure', () => {
    for (const point of routes[1].slice(1))
      s.play(to(token, (n) => n.moveTo(point), { duration: 0.4 }));
  });
  c.swap('exposure', incident, mixed, { after: true });
  c.show('exposure', exposure, { after: true });
  c.clear(links.flat(), 0.5, 0.2);
}
