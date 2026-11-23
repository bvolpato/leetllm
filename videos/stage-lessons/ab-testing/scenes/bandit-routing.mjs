import { axes, dot, dynamic, indicate, place, polyline, to } from 'vizmatic/stage';
import { chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import { BODY, FOOT } from '../parts.mjs';
import { AB_VISUAL_FIXTURES as fixture } from '../../../films/ab-testing/fixtures.mjs';
export default function bandit(s, c) {
  const [caption, plot, routing] = BODY.rows([1, 4, 2], 'normal');
  const title = place(label('First incident   ·   draw a success rate for each arm'), caption);
  const mature = place(label('First incident   ·   update the arm that received it'), caption);
  const phase = s.value(0);
  const axis = place(
    axes({
      x: [0, 1],
      y: [0, 3],
      width: plot.width * 0.8,
      height: plot.height * 0.78,
      xStep: 0.5,
      yStep: 1,
      labelSize: 34,
      tips: false,
    }),
    plot,
  );
  // The first trace starts with two uniform priors. Only control receives its first reward.
  const first = fixture.bandit.pullTrace[0];
  const curves = dynamic(() => {
    const xs = Array.from({ length: 101 }, (_, i) => i / 100);
    return [
      polyline(
        xs.map((x) => axis.world(x, 1 + phase.value * (2 * (1 - x) - 1))),
        { stroke: 'cyan', width: 5 },
      ),
      polyline(
        xs.map((x) => axis.world(x, 1)),
        { stroke: 'blue', width: 3, dash: [8, 8] },
      ),
    ];
  });
  const samples = [first.sampleControl, first.sampleTreatment].map((value, i) => [
    dot(13, i ? 'blue' : 'cyan').moveTo(axis.world(value, 1)),
    mono((i ? 'Rewrite ' : 'Control ') + value.toFixed(2), {
      size: 38,
      color: i ? 'blue' : 'cyan',
    }).moveTo(axis.world(value, i ? 1.55 : 1.8)),
  ]);
  const stations = routing.columns(3, 'normal');
  const nodes = [chip('new incident'), chip('stored arm'), chip('mature reward')].map((node, i) =>
    place(node, stations[i], 'bottom'),
  );
  const stored = place(chip('stored control', { color: 'cyan' }), stations[1], 'bottom');
  const traveler = dot(13, 'yellow').moveTo(stations[0].point('top'));
  const allocation = place(
    mono(
      `2,000 simulated choices   ·   control ${fixture.bandit.controlPulls}   ·   rewrite ${fixture.bandit.treatmentPulls.toLocaleString('en-US')}`,
      {
        size: 38,
      },
    ),
    FOOT,
  );
  const posterior = place(
    mono(`control: Beta(${first.alphaC}, ${first.betaC}) after reward ${first.reward}`, {
      size: 36,
      color: 'cyan',
    }),
    FOOT,
  );
  const caution = place(
    note('Adaptive allocation needs policy-aware inference and explicit guardrails.'),
    FOOT,
  );
  s.add(heading('Draw, route, wait, then update'), title, axis, curves, nodes);
  c.on('update-rule', () => s.play(indicate(nodes[2], { scale: 1 })));
  c.show('sample', samples);
  c.show('sample', traveler);
  c.on('choose', () =>
    s.play(to(traveler, (n) => n.moveTo(stations[1].point('top')), { duration: 1.5 })),
  );
  c.swap('control', nodes[1], stored, { after: true });
  c.show('allocation', allocation, { after: true });
  c.on('mature', () =>
    s.play(to(traveler, (n) => n.moveTo(stations[2].point('top')), { duration: 1.5 })),
  );
  c.hide('mature', samples);
  c.swap('mature', title, mature);
  c.swap('failure', allocation, posterior, { after: true });
  c.after('failure', () => s.play(phase.to(1, { duration: 1.2 })));
  c.swap('bias', posterior, caution);
}
