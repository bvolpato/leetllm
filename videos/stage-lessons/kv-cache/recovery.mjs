import { line, Node, rect } from 'vizmatic/stage';
import { BIG_PER_TOKEN, KIB, MIB } from '../../films/kv-cache/model.mjs';
import { left, picture, words } from './picture.mjs';

const positions = 6400;
const replayRate = 8000;
const payload = positions * BIG_PER_TOKEN / MIB;
export const recoveryAt = linkRate => ({
  payload, leg: payload / linkRate, roundTrip: 2 * payload / linkRate, replay: positions / replayRate,
});

export function buildRecoveryCost(stage, narration) {
  const { clock, show, hide, caption, finish } = picture(stage, narration, 'recovery-cost');
  const quick = recoveryAt(10000), slow = recoveryAt(4000);
  const start = -380, scale = 1160;
  const x = seconds => start + seconds * scale;
  const replayY = -68, swapY = 172;
  const leg = (name, from, duration, y, color) => {
    const width = duration * scale;
    return new Node().add(
      rect(width - 3, 87, { radius: 6, fill: color, stroke: null }),
      words(name, 44, 'bg', 'mono').moveTo([0, 0]),
    ).at(x(from + duration / 2), y);
  };
  const axis = [];
  for (let tick = 0; tick <= 5; tick++) {
    const seconds = tick / 5;
    const guides = [[-146, replayY - 46], [replayY + 46, swapY - 46], [swapY + 46, 236]];
    axis.push(
      ...guides.map(([top, bottom]) =>
        line([x(seconds), top], [x(seconds), bottom], { stroke: 'dim', width: 1.5 })),
      words(seconds.toFixed(1) + ' s', 34, 'dim', 'mono').moveTo([x(seconds), 289]),
    );
  }
  const problem = left(words('6,400 positions   ×   ' + BIG_PER_TOKEN / KIB + ' KiB per position', 52), -845, -310);
  clock.at(0.03, () => show(problem));
  clock.after('size', () => {
    hide(problem);
    show(left(words('6,400 × ' + BIG_PER_TOKEN / KIB + ' KiB   =   ' + quick.payload.toLocaleString('en-US') + ' MiB', 58), -845, -310));
  });
  clock.on('compute-rate', () => show([
    ...axis, left(words('Replay', 59), -845, replayY - 28),
    left(words('8,000 positions/s', 36, 'dim', 'mono'), -845, replayY + 42),
  ]));
  clock.after('replay', () => {
    show(leg('rebuild', 0, quick.replay, replayY, 'green'), 0.4);
    caption('6,400 ÷ 8,000 = ' + quick.replay + ' s of replay.');
  });
  const fastRate = left(words('10,000 MiB/s', 37, 'dim', 'mono'), -845, swapY + 42);
  const out = leg('out', 0, quick.leg, swapY, 'blue');
  const back = leg('back', quick.leg, quick.leg, swapY, 'teal');
  clock.on('link', () => show([left(words('Swap', 59), -845, swapY - 28), fastRate]));
  clock.after('out', () => show(out));
  clock.after('back', () => show(back));
  clock.after('round-trip', () => caption('Out and back take ' + quick.leg + ' + ' + quick.leg + ' = ' + quick.roundTrip + ' s.'));
  clock.on('slow', () => {
    hide([fastRate, out, back]);
    show(left(words('4,000 MiB/s', 37, 'yellow', 'mono'), -845, swapY + 42));
    caption('Same 2,000 MiB each way. The link rate changed.');
  });
  clock.on('predict', () => caption('Which recovery takes less time on this link?', 'yellow'));
  clock.after('slow-out', () => show(leg('out', 0, slow.leg, swapY, 'blue')));
  clock.after('slow-back', () => show(leg('back', slow.leg, slow.leg, swapY, 'teal')));
  clock.after('choice', () => caption('Replay takes ' + slow.replay + ' s. The round trip takes ' + slow.roundTrip.toFixed(1) + ' s.'));
  finish();
}
