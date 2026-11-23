import { dynamic, place } from 'vizmatic/stage';
import { heading, mono, note } from '../../kit-narrated.mjs';
import {
  CENTER,
  FOOT,
  Q,
  RAIL,
  RESIDUALS,
  TEST_PREDICTIONS,
  correctedThreshold,
  latencyRuler,
  number,
  scoreRail,
} from '../parts.mjs';

export default function transfer(s, c) {
  const rail = scoreRail(s);
  rail.active.set(Q.index);
  const ruler = latencyRuler(s, { radius: Q.threshold });
  ruler.endpointOn.set(1);
  const coverage = s.value(0.8);
  const experiment = s.value(0);
  const outputsOn = s.value(1);
  const scope = dynamic(() => [
    place(
      note(
        [
          'marginal coverage · selected deadline subgroup',
          'change forecast only',
          'change target only',
          'change C8 only',
        ][experiment.value],
      ),
      RAIL,
      'top',
    ),
  ]);
  const slots = FOOT.columns(4, 'wide');
  const controls = dynamic(() => {
    const rank = correctedThreshold(RESIDUALS, coverage.value).rank;
    const words = [
      'center ' + number(ruler.prediction.value) + ' ms',
      'coverage ' + number(coverage.value * 100) + '%',
      outputsOn.value > 0.5 ? 'rank ' + rank : 'rank',
      outputsOn.value > 0.5 ? 'radius ' + number(ruler.q.value) + ' ms' : 'radius',
    ];
    return words.map((words, i) =>
      place(
        mono(words, {
          size: 34,
          color:
            (experiment.value === 1 && i === 0) ||
            (experiment.value === 2 && i === 1) ||
            (experiment.value === 3 && i === 3)
              ? 'yellow'
              : 'cyan',
        }),
        slots[i],
      ),
    );
  });
  const audit = place(note('procedure · score · calibration IDs · version · assumptions'), FOOT);
  s.add(
    heading(c.title),
    rail.frame,
    rail.sticks,
    ruler.frame,
    ruler.point,
    ruler.interval,
    ruler.limit,
    scope,
    controls,
  );
  c.after('center', () => {
    experiment.set(1);
    s.play(ruler.prediction.to(TEST_PREDICTIONS[3], { duration: 1.1 }));
  });
  const hideOutputs = () => {
    outputsOn.set(0);
    ruler.endpointOn.set(0);
    rail.reveal.set(0);
  };
  const revealOutputs = () => {
    outputsOn.set(1);
    ruler.endpointOn.set(1);
    rail.reveal.set(1);
  };
  function reset() {
    hideOutputs();
    ruler.prediction.set(CENTER);
    coverage.set(0.8);
    rail.active.set(Q.index);
    ruler.q.set(Q.threshold);
    experiment.set(0);
    revealOutputs();
  }
  c.on('restore-center', reset);
  c.after('coverage-start', () => {
    hideOutputs();
    experiment.set(2);
    coverage.set(0.9);
  });
  c.after('coverage', () => {
    const selected = correctedThreshold(RESIDUALS, 0.9);
    rail.active.set(selected.index);
    s.play(ruler.q.to(selected.threshold, { duration: 0.8 }));
    revealOutputs();
  });
  c.on('restore-target', reset);
  c.after('residual-start', () => {
    hideOutputs();
    experiment.set(3);
    rail.extras[Q.index].set(9);
    rail.reveal.set(1);
  });
  c.after('residual', () => {
    const changed = RESIDUALS.map((v, i) => (i === Q.index ? 9 : v));
    s.play(ruler.q.to(correctedThreshold(changed, 0.8).threshold, { duration: 0.8 }));
    revealOutputs();
  });
  c.swap('record', controls, audit);
}
