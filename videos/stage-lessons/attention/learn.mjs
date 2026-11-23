import { circle, dot, dynamic, fadeIn, fadeOut, line, rect, smoother } from 'vizmatic/stage';
import { sceneHeading } from '../kit.mjs';
import {
  f2,
  midMath,
  midMono,
  midProse,
  prose,
  shareBar,
} from '../../films/attention/defaults.mjs';
import { blendOf, SCALED, softmax, V } from '../../films/attention/model.mjs';

const equalValue = [3, -1];
const colors = ['blue', 'teal'];
const names = ['Birds', 'sing'];
const xy = ([x, y]) => [-795 + 202 * x, 81 - 166 * y];
const vector = (v) => `[${v.map((x) => Number(x.toFixed(2))).join(', ')}]`;

export function buildLearn(stage, narration, { leave }) {
  const scene = narration.scene('learn');
  sceneHeading(stage, scene, narration.title('learn'));
  const bump = stage.value(0);
  const singBump = stage.value(0);
  const merge = stage.value(0);
  const blocked = stage.value(0);
  const values = () => V.map((v) => v.map((x, i) => x + (equalValue[i] - x) * merge.value));
  const scores = () => [
    blocked.value === 1 ? -Infinity : SCALED[1][0] + bump.value,
    SCALED[1][1] + singBump.value,
  ];
  const weights = () => softmax(scores());
  const output = () => blendOf(weights(), values());
  const tick = (a, b) => line(xy(a), xy(b), { stroke: 'faint', width: 2 });
  const grid = [
    ...[0, 1, 2, 3].flatMap((x) => [
      tick([x, -1.25], [x, 2.25]),
      midMono(String(x), xy([x, 0])[0], 334, 40, 'dim'),
    ]),
    ...[-1, 0, 1, 2].flatMap((y) => [
      tick([-0.12, y], [3.25, y]),
      midMono(String(y), -864, xy([0, y])[1], 40, 'dim'),
    ]),
    midProse('Value coordinates', -485, -363, 55),
  ];
  const endpoints = dynamic(() => {
    const [b, s] = values().map(xy);
    const marks = [
      circle(20, { stroke: colors[0], width: 5 })
        .moveTo(b)
        .opacity(blocked.value ? 0.3 : 1),
      circle(15, { stroke: colors[1], width: 4 }).moveTo(s),
    ];
    if (!blocked.value && Math.hypot(b[0] - s[0], b[1] - s[1]) > 1) {
      marks.unshift(line(b, s, { stroke: 'dim', width: 3, dash: [8, 8] }));
    }
    return marks;
  });
  const point = dynamic(() => dot(10, 'yellow').moveTo(xy(output())));
  const nameCells = names.map((name, i) => prose(name, 45, -201 + i * 85, 57, colors[i]));
  const valueRows = dynamic(() =>
    values().map((v, i) => midMono(vector(v), 649, -201 + i * 85, 49, colors[i])),
  );
  const scoreRows = dynamic(() =>
    scores().map((s, i) =>
      midMono(Number.isFinite(s) ? f2(s) : '−∞', 374, -201 + i * 85, 51, colors[i]),
    ),
  );
  const bar = dynamic(() => {
    const w = weights();
    if (blocked.value === 1) {
      return [
        rect(785, 76, { radius: 6, fill: 'teal', stroke: null }).at(448, 49),
        midMono('sing 100%', 448, 49, 47, 'bg'),
      ];
    }
    return shareBar(w, 448, 49, 785, 76, colors, 43, { names });
  });
  const labels = [midProse('Logit', 374, -311, 48, 'dim'), midProse('Value', 649, -311, 48, 'dim')];
  const readout = dynamic(() =>
    midMono(`Output  [${output().map(f2).join(', ')}]`, 448, 206, 53, 'yellow'),
  );
  const plot = [
    ...grid,
    endpoints,
    point,
    ...nameCells,
    ...labels,
    scoreRows,
    valueRows,
    bar,
    readout,
  ];
  scene.at(0.1, () => stage.play(fadeIn(plot), { duration: 0.4 }));
  const scoreChange = (n) => stage.play(bump.to(n), { duration: 1.25, ease: smoother });
  scene.on('raise-first', () => scoreChange(1));

  const slope = midMath(
    '\\partial o/\\partial z_{\\text{Birds}} = a_{\\text{Birds}}(v_{\\text{Birds}} - o)',
    0,
    424,
    58,
  );
  const derivative = dynamic(() => {
    const share = weights()[0];
    const current = output();
    const pull = values()[0].map((n, i) => share * (n - current[i]));
    return midMono(`Slope  [+${f2(pull[0])}, ${f2(pull[1])}]`, 448, 314, 47);
  });
  scene.on('pull', () => stage.play(fadeIn([slope, derivative]), { duration: 0.3 }));
  scene.on('restore', () => scoreChange(0));
  scene.on('meet', () => {
    stage.play(fadeOut([point, readout, slope, derivative]), { duration: 0.18 });
    stage.play(merge.to(1), { duration: 1.45, ease: smoother });
  });
  scene.on('raise-again', () => scoreChange(1));
  const question = midProse('Where will the gold output point land?', 0, 424, 58, 'yellow');
  scene.on('predict', () => stage.play(fadeIn(question), { duration: 0.3 }));
  const zeroSlope = midMath(
    'v_{\\text{Birds}} - o = [0, 0] \\quad \\Rightarrow \\quad \\partial o/\\partial z_{\\text{Birds}} = [0, 0]',
    0,
    424,
    56,
    'yellow',
  );
  scene.after('fixed-output', () => {
    stage.play(fadeOut(question), fadeIn([point, readout]), { duration: 0.25 });
  });
  scene.after('lower-again', () => scoreChange(0));
  scene.after('zero-grad', () => stage.play(fadeIn(zeroSlope), { duration: 0.3 }));

  scene.on('distinct', () => {
    stage.play(fadeOut(zeroSlope), { duration: 0.18 });
    stage.play(merge.to(0), { duration: 1.2, ease: smoother });
  });
  const maskNote = midProse('Birds is blocked before softmax.', 0, 424, 58);
  scene.on('block', () =>
    stage.play(blocked.to(1, { duration: 0 }), fadeIn(maskNote, { duration: 0.3 })),
  );
  scene.on('single-score', () => stage.play(singBump.to(1), { duration: 0.9, ease: smoother }));
  const allowed = dynamic(() => {
    const [b, s] = weights();
    return midMono(
      `Both allowed    Birds ${(100 * b).toFixed(1)}%    sing ${(100 * s).toFixed(1)}%`,
      0,
      424,
      47,
    );
  });
  scene.on('unblock', () => {
    stage.play(fadeOut(maskNote), { duration: 0.2 });
    stage.play(blocked.to(0, { duration: 0 }), fadeIn(allowed, { duration: 0.3 }));
  });
  scene.on('concentrate', () => stage.play(singBump.to(4), { duration: 1.35, ease: smoother }));
  leave(scene, [...plot, allowed]);
}
