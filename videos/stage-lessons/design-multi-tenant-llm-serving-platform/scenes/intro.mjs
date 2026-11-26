// Scene 01: intro - Should this route deliver another summary?
// A folded citation from Workspace A (Carol only) slides into Bob's Workspace B incident summary.
// Strictly withholds the "Route paused" decision until `c.after('intro-contain')`.
import { circle, group, line, polyPath, rect, Node } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  mix,
  playOn,
  quadArcPts,
  stepAfter,
  stepOn,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const pulse = s.value(0);
  const slide = s.value(0);
  const citeHighlight = s.value(0);
  const choiceOn = s.value(0);
  const pausedOn = s.value(0);
  const delayOn = s.value(0);

  const stageAura = aura(120, -20, 760, '#ff6b8b1c', '#60a5fa18');
  const header = cinemaHeader(
    'MULTI-TENANT SERVING INCIDENT',
    'Should this route deliver',
    'another summary?',
    { x: -860, y: -450, accent: ROLE.B, size: 46 },
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const sl = slide.value;
      const ch = citeHighlight.value;
      const ask = choiceOn.value > 0.5;
      const paused = pausedOn.value > 0.5;
      const delay = delayOn.value > 0.5;

      const nodes = [];

      // Right: Workspace B Incident Summary delivered to Bob
      const sumX = 310;
      const sumY = -20;
      const sumW = 980;
      const sumH = 550;
      nodes.push(
        rect(sumW, sumH, { fill: '#0d1324', stroke: ROLE.B, width: 3.0, radius: 18 })
          .at(sumX, sumY)
          .glow(6 + sl * 4, ROLE.B),
        rect(8, 128, { fill: ROLE.B, stroke: null, radius: 4 }).at(
          sumX - sumW * 0.5 + 42,
          sumY - 165,
        ),
        txt(
          'WORKSPACE B  ·  SUMMARY RECEIPT',
          sumX - sumW * 0.5 + 72,
          sumY - 210,
          26,
          ROLE.B,
          'mono',
          'left',
        ),
        txt(
          'Incident summary',
          sumX - sumW * 0.5 + 72,
          sumY - 148,
          54,
          COSMOS.ink,
          'serif',
          'left',
        ),
        txt(
          'Delivered to: Bob (Workspace B)',
          sumX - sumW * 0.5 + 72,
          sumY - 88,
          30,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );

      // Sliding foreign citation card from Workspace A (Carol only), stays cleanly inside summary box
      const cx = mix(260, 325, sl);
      const cy = mix(122, 102, sl);
      const cw = 820;
      const chH = 248;
      const left = cx - cw * 0.5;
      const right = cx + cw * 0.5;
      const top = cy - chH * 0.5;
      const bot = cy + chH * 0.5;
      const fold = 44;

      const bodyPath = polyPath(
        [
          [left, top],
          [right - fold, top],
          [right, top + fold],
          [right, bot],
          [left, bot],
        ],
        true,
      );
      const earPath = polyPath(
        [
          [right - fold, top],
          [right - fold, top + fold],
          [right, top + fold],
        ],
        true,
      );
      const citeStroke = ch > 0.5 ? ROLE.A : '#9fb4dc';
      nodes.push(
        new Node(bodyPath)
          .fill('#eef2fa')
          .stroke(citeStroke, 3.2)
          .glow(ch > 0.5 ? 10 : 4, ROLE.A),
        new Node(earPath).fill(ROLE.A).stroke(null),
        txt('[1]  CITED SOURCE', left + 36, top + 46, 26, '#263452', 'mono', 'left'),
        txt('Private postmortem', left + 36, top + 104, 48, '#070910', 'serif', 'left'),
        line([left + 36, top + 162], [right - 36, top + 162], { stroke: '#9aa8c4', width: 2 }),
        txt(
          'Workspace A  /  Only reader: Carol',
          left + 36,
          top + 206,
          30,
          ch > 0.5 ? '#1b43a8' : '#1e2942',
          'mono',
          'left',
        ),
      );

      // Left column: Two-name comparison + Route status / Pause gate
      nodes.push(
        txt('RECIPIENT', -855, -210, 26, COSMOS.muted, 'mono', 'left'),
        txt('Bob  (Workspace B)', -855, -162, 30, ROLE.B, 'mono', 'left'),
        txt('PERMITTED READER', -855, -88, 26, COSMOS.muted, 'mono', 'left'),
        txt('Carol  (Workspace A)', -855, -40, 30, ROLE.A, 'mono', 'left'),
      );

      // Mismatch beam clearly right of the names (Carol ends ~ -460)
      if (ch > 0.3) {
        nodes.push(
          beamWithPhotons(quadArcPts([-395, -162], [-395, -40], 26), ROLE.focus, p, {
            width: 3,
            glow: 8,
            photonCount: 1,
            alpha: ch,
          }),
        );
      }

      // Strictly withhold decision until after intro-contain!
      if (paused) {
        nodes.push(
          rect(540, 122, { fill: '#221c0c', stroke: ROLE.focus, width: 3.4, radius: 14 })
            .at(-585, 126)
            .glow(12, ROLE.focus),
          rect(12, 42, { fill: ROLE.focus, stroke: null, radius: 3 }).at(-815, 126),
          rect(12, 42, { fill: ROLE.focus, stroke: null, radius: 3 }).at(-793, 126),
          txt('ROUTE PAUSED', -755, 102, 30, ROLE.focus, 'mono', 'left'),
          txt('Audit record preserved', -755, 150, 26, COSMOS.ink, 'sans', 'left'),
        );
      } else {
        nodes.push(
          rect(540, 122, {
            fill: '#0c1324',
            stroke: ask ? ROLE.focus : '#2c3d66',
            width: 2.6,
            radius: 14,
          })
            .at(-585, 126)
            .glow(ask ? 8 : 0, ROLE.focus),
          circle(16, { fill: null, stroke: ask ? ROLE.focus : COSMOS.muted, width: 3 }).at(
            -810,
            126,
          ),
          txt('?', -810, 126, 26, ask ? ROLE.focus : COSMOS.muted, 'mono', 'center'),
          txt(
            ask ? 'Deliver summary?' : 'Checking citation',
            -770,
            102,
            28,
            ask ? ROLE.focus : COSMOS.muted,
            'mono',
            'left',
          ),
          txt('Recipient vs reader', -770, 150, 26, COSMOS.muted, 'sans', 'left'),
        );
      }

      // Bottom shared-replica queue delay trace (revealed after intro-delay)
      if (delay) {
        nodes.push(
          rect(1710, 86, { fill: '#0b1628', stroke: ROLE.shared, width: 2.6, radius: 14 })
            .at(0, 412)
            .glow(8, ROLE.shared),
          txt(
            'SHARED REPLICA DELAY  ·  Alice (long review) and Bob (short summary) both waited',
            0,
            412,
            29,
            ROLE.shared,
            'mono',
            'center',
          ),
        );
      } else {
        nodes.push(
          txt(
            'Cross-tenant leakage requires immediate containment before tuning throughput.',
            0,
            412,
            28,
            COSMOS.muted,
            'sans',
            'center',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.5);

  playOn(s, c, 'intro-delivery', slide, 1, 1.3);
  playOn(s, c, 'intro-citation', citeHighlight, 1, 0.45);
  stepOn(s, c, 'intro-choice', choiceOn, 1);
  // Strict prediction withholding: pause route ONLY after "Pause deliveries on this route" finishes.
  stepAfter(s, c, 'intro-contain', pausedOn, 1);
  stepAfter(s, c, 'intro-delay', delayOn, 1);
}
