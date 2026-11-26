// Scene 07: admission-dimensions - Reserve the resources that can actually run out
// Presents 6 separate resource reservoirs with explicit units, then demonstrates a request
// passing rate/quota/concurrency but needing 5 KV pages when only 4 are available, flipping to 5.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  driftValue,
  glowMeter,
  guardedDynamic,
  stepAfter,
  stepOn,
  txt,
} from '../parts.mjs';

const RESERVOIRS = [
  ['ARRIVAL RATE', 'requests / minute', 0.42, ROLE.A],
  ['TOKEN WINDOW', 'tokens / window', 0.54, ROLE.shared],
  ['PERIOD QUOTA', 'declared units', 0.36, ROLE.held],
  ['CONCURRENCY', 'in-flight requests', 0.48, ROLE.model],
  ['CONTEXT / OUTPUT', 'positions / sequence', 0.62, ROLE.ok],
  ['WORKER KV POOL', 'physical pages', 0.88, ROLE.B],
];

export default function admissionDimensions(s, c) {
  const pulse = s.value(0);
  const b0On = s.value(0);
  const b1On = s.value(0);
  const fourAvailOn = s.value(0);
  const waitOn = s.value(0);
  const fiveAvailOn = s.value(0);
  const b2On = s.value(0);
  const assembleOn = s.value(0);

  const stageAura = aura(0, 10, 760, '#ffd16618', '#5ce1e61a');
  const header = cinemaHeader(
    'MULTI-DIMENSIONAL ADMISSION',
    'Reserve the resources',
    'that can actually run out',
    { x: -860, y: -450, accent: ROLE.held, size: 46 },
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const b1 = b1On.value > 0.5;
      const fourChecked = fourAvailOn.value > 0.5;
      const waitShown = waitOn.value > 0.5;
      const fiveAvail = fiveAvailOn.value > 0.5;
      const b2 = b2On.value > 0.5;
      const assembled = assembleOn.value > 0.5;

      const nodes = [];

      if (!b1) {
        // Beat 0: Six distinct resource reservoirs in a 3x2 grid
        nodes.push(
          txt(
            'SIX SEPARATE RESERVOIRS · EACH MEASURES A DIFFERENT UNIT',
            840,
            -405,
            26,
            COSMOS.muted,
            'mono',
            'right',
          ),
        );
        RESERVOIRS.forEach(([title, unit, fillFrac, col], i) => {
          const cx = -565 + (i % 3) * 565;
          const cy = -120 + Math.floor(i / 3) * 260;
          nodes.push(
            rect(520, 210, { fill: '#0b1224', stroke: col, width: 2.6, radius: 16 })
              .at(cx, cy)
              .glow(i === 5 ? 9 : 4, col),
            txt(title, cx - 224, cy - 62, 28, col, 'mono', 'left'),
            glowMeter(cx - 224, cy + 2, 448, 34, fillFrac, { fill: col }),
            txt(unit, cx - 224, cy + 62, 26, COSMOS.muted, 'sans', 'left'),
          );
        });
        nodes.push(
          txt(
            'Passing RPM or period quota never proves a worker has spare physical KV pages.',
            0,
            420,
            29,
            ROLE.focus,
            'sans',
            'center',
          ),
        );
      } else {
        // Beat 1 & Beat 2: 4 vs 5 physical worker pages counterfactual
        const availCount = fiveAvail ? 5 : 4;
        nodes.push(
          rect(1680, 86, { fill: '#0c1a24', stroke: ROLE.ok, width: 2.6, radius: 14 }).at(0, -238),
          txt(
            'OTHER GATES PASS:  Permission OK  ·  Rate OK  ·  Quota OK  ·  Concurrency OK',
            0,
            -238,
            27,
            ROLE.ok,
            'mono',
            'center',
          ),

          txt('WORKER PHYSICAL KV PAGES', -840, -138, 28, ROLE.kv, 'mono', 'left'),
          txt('REQUEST DEMAND: 5 PAGES', 840, -138, 28, ROLE.held, 'mono', 'right'),
        );

        for (let j = 0; j < 5; j++) {
          const px = -680 + j * 255;
          const free = j < availCount;
          const col = free ? (j === 4 ? ROLE.ok : ROLE.kv) : ROLE.fail;
          nodes.push(
            rect(210, 178, {
              fill: free ? '#0b1b2b' : '#210f19',
              stroke: col,
              width: 3.0,
              radius: 14,
            })
              .at(px, 0)
              .glow(free ? 8 : 5, col),
            txt(`P${j}`, px, -24, 42, col, 'mono', 'center'),
            txt(
              free ? 'FREE' : 'OCCUPIED',
              px,
              42,
              26,
              free ? ROLE.ok : ROLE.fail,
              'mono',
              'center',
            ),
          );
        }

        // Right-side demand badge
        const passMem = fiveAvail;
        nodes.push(
          rect(300, 178, {
            fill: passMem ? '#0c231c' : '#24101b',
            stroke: passMem ? ROLE.ok : ROLE.fail,
            width: 3.2,
            radius: 16,
          })
            .at(690, 0)
            .glow(10, passMem ? ROLE.ok : ROLE.fail),
          txt('NEEDS 5', 690, -32, 34, ROLE.held, 'mono', 'center'),
          txt(
            passMem ? '5 / 5 READY' : 'ONLY 4 FREE',
            690,
            34,
            30,
            passMem ? ROLE.ok : ROLE.fail,
            'mono',
            'center',
          ),
        );

        // Status banner
        const verdictText = fiveAvail
          ? '5 pages available: memory condition passes (all other gates still apply).'
          : waitShown
            ? '4 < 5 pages: admission must WAIT or route to another eligible worker.'
            : fourChecked
              ? 'Request needs 5 pages; worker only has 4 available.'
              : 'Checking physical page availability...';
        nodes.push(
          txt(
            verdictText,
            0,
            165,
            32,
            fiveAvail ? ROLE.ok : waitShown ? ROLE.fail : ROLE.focus,
            'sans',
            'center',
          ),
        );

        if (b2) {
          nodes.push(
            rect(1680, 140, {
              fill: '#0d1528',
              stroke: assembled ? ROLE.focus : ROLE.shared,
              width: 2.8,
              radius: 16,
            })
              .at(0, 325)
              .glow(assembled ? 8 : 3, ROLE.focus),
            txt(
              'RESERVE:  Assembled prompt (incl. authorized RAG)  +  Max permitted output',
              0,
              296,
              28,
              ROLE.focus,
              'mono',
              'center',
            ),
            txt(
              'Dual holds (tenant allowance + worker pages) need recoverable stages across services.',
              0,
              352,
              27,
              COSMOS.ink,
              'sans',
              'center',
            ),
          );
        } else {
          nodes.push(
            txt(
              'Spare quota units never substitute for missing physical GPU cache pages.',
              0,
              325,
              28,
              COSMOS.muted,
              'sans',
              'center',
            ),
          );
        }
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.0);

  stepOn(s, c, 'mt-admission-dimensions-b0', b0On, 1);
  stepOn(s, c, 'mt-admission-dimensions-b1', b1On, 1);
  stepAfter(s, c, 'mt-admission-dimensions-s1-0', fourAvailOn, 1);
  stepAfter(s, c, 'mt-admission-dimensions-s1-1', waitOn, 1);
  // Strict counterfactual reveal: 5th page becomes available only after s1-2.
  stepAfter(s, c, 'mt-admission-dimensions-s1-2', fiveAvailOn, 1);
  stepOn(s, c, 'mt-admission-dimensions-b2', b2On, 1);
  stepAfter(s, c, 'mt-admission-dimensions-s2-0', assembleOn, 1);
}
