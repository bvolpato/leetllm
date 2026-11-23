import assert from 'node:assert/strict';
import { axes, dot, dynamic, line, place, steps } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { simulateStopping } from '../../../films/training-backpropagation-gradient-descent/model.mjs';

function observations(values, delta) {
  let minimum = Infinity,
    bestEpoch = 0,
    reset = Infinity,
    count = 0;
  return values.map((value, i) => {
    if (value < minimum) {
      minimum = value;
      bestEpoch = i + 1;
    }
    if (value < reset - delta) {
      reset = value;
      count = 0;
    } else {
      count++;
    }
    return { value, epoch: i + 1, bestEpoch, minimum, reset, count };
  });
}

export default function validation(s, c) {
  const title = heading(c.title);
  const [head, body, foot] = area.rows([1, 5, 1], 'wide');
  const roles = place(
    steps(['train · fit', 'validation · choose', 'test · report'], { width: head.width, size: 40 }),
    head,
  );
  const [left, right] = body.columns([3, 2], 'wide');
  const spec = simulateStopping();
  function plot(values, delta, patience, y, yStep) {
    const series = observations(values, delta);
    const index = s.value(0);
    const restored = s.value(0);
    const get = () => series[index.value];
    const ax = place(
      axes({
        x: [0.75, values.length],
        y,
        xStep: 1,
        yStep,
        width: left.width * 0.82,
        height: left.height * 0.76,
        tips: false,
        labelSize: 32,
      }),
      left,
    );
    const trace = dynamic(() => {
      const o = get();
      const marks = [];
      for (let n = 0; n < o.epoch; n++) {
        const p = ax.world(n + 1, series[n].value);
        if (n) marks.push(line(ax.world(n, series[n - 1].value), p, { stroke: 'dim', width: 5 }));
        marks.push(dot(10, 'dim').moveTo(p));
      }
      marks.push(dot(18, 'green').moveTo(ax.world(o.bestEpoch, o.minimum)));
      const selected = restored.value ? o.bestEpoch : o.epoch;
      marks.push(dot(8, 'yellow').moveTo(ax.world(selected, series[selected - 1].value)));
      return marks;
    });
    const rows = right.rows(4, 'normal');
    const readings = dynamic(() => {
      const o = get();
      const epoch = restored.value ? o.bestEpoch : o.epoch;
      return [
        mono((restored.value ? 'restored' : 'evaluated') + '  epoch ' + epoch, {
          size: 45,
          color: 'yellow',
        }).moveTo(rows[0].point('center')),
        mono('saved  ' + o.minimum.toFixed(3) + '  @ ' + o.bestEpoch, {
          size: 46,
          color: 'green',
        }).moveTo(rows[1].point('center')),
        mono('last reset  ' + o.reset.toFixed(3), { size: 39 }).moveTo(rows[2].point('center')),
        mono('patience used  ' + o.count + ' / ' + patience, { size: 40 }).moveTo(
          rows[3].point('center'),
        ),
      ];
    });
    const caption = place(
      note('Epoch →    Validation loss ↑       Reset requires a drop greater than ' + delta),
      foot,
    );
    return {
      all: [ax, trace, readings, caption],
      series,
      at: (epoch) => index.set(epoch - 1),
      restore: () => restored.set(1),
    };
  }
  const run = plot(spec.values, 0.0001, 3, [0, 5], 1);
  const small = plot([1, 0.995, 0.996], 0.01, 2, [0.99, 1.002], 0.005);
  assert.equal(run.series.at(-1).bestEpoch, spec.bestEpoch);
  assert.equal(small.series.at(-1).bestEpoch, 2);
  assert.equal(small.series.at(-1).count, 2);
  const split = body
    .columns(3, 'wide')
    .map((r, i) =>
      place(
        label(['Fit weights and scaling', 'Choose a checkpoint', 'Estimate held-out loss'][i], {
          size: 38,
        }),
        r,
      ),
    );
  s.add(title, roles, split);
  c.on('validation-roles', () => s.play(roles.go(1)));
  c.on('validation-test', () => s.play(roles.go(2)));
  c.swap('validation-build', split, run.all);
  c.on('validation-build', () => s.play(roles.go(1)));
  c.on('validation-fall', () => {
    run.at(2);
    s.wait(0.9);
    run.at(3);
    s.wait(0.9);
    run.at(4);
  });
  c.on('validation-later', () => {
    run.at(5);
    s.wait(0.9);
    run.at(6);
  });
  c.on('validation-patience', () => run.at(7));
  c.on('validation-restore', run.restore);
  c.swap('validation-small', run.all, small.all);
  c.on('validation-save', () => small.at(2));
  c.on('validation-last', () => small.at(3));
  c.on('validation-small-restore', small.restore);
}
