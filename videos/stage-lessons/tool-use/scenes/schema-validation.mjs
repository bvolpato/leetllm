// Scene 6: schema-validation - Check shape before touching a resource
// Central Hexagonal JSON-Schema Energy Gate with 3 live particle trajectories:
//   - {"book_id":"B7"} passes straight through (emerald)
//   - {"book_id":7} deflects into Type-Rule rejection branch (rose)
//   - {"book_id":"B7","place_hold":true} deflects into Extra-Field rejection branch (rose)
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  energyRail,
  guardedDynamic,
  hexGate,
  quadArcPts,
  txt,
  validArgs,
} from '../parts.mjs';

export default function schemaValidation(s, c) {
  const pulse = s.value(0);
  const validOn = s.value(0);
  const numFailOn = s.value(0);
  const extraFailOn = s.value(0);
  const meaningOn = s.value(0);

  const okValid = validArgs({ book_id: 'B7' });
  const okNum = validArgs({ book_id: 7 });
  const okExtra = validArgs({ book_id: 'B7', place_hold: true });

  const header = cinemaHeader(
    'JSON SCHEMA ENERGY GATE',
    'Check argument shape',
    'before touching a resource',
    { accent: ROLE.runtime, size: 48 },
  );

  const stageAura = aura(0, 40, 620, '#5ce1e622', '#ff6b8b18');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const vl = validOn.value;
      const nf = numFailOn.value;
      const ef = extraFailOn.value;
      const mn = meaningOn.value;
      const nodes = [];

      // Center Hexagonal Schema Gate
      const gateX = 20;
      const gateY = 30;
      nodes.push(
        hexGate(gateX, gateY, 102, ROLE.runtime, {
          label: 'SCHEMA',
          glow: 12,
        }),
        txt('book_id: str · extra: forbid', gateX, -155, 26, ROLE.runtime, 'mono', 'center'),
      );

      // Left incoming proposals (3 luminous channels)
      const y1 = -165;
      const y2 = 30;
      const y3 = 225;

      // Lane 1: Valid string {"book_id":"B7"}
      nodes.push(
        energyRail(-855, y1 - 36, y1 + 36, ROLE.ok),
        txt('{"book_id": "B7"}', -825, y1, 28, COSMOS.ink, 'mono', 'left'),
        beamWithPhotons(quadArcPts([-440, y1], [gateX - 102, gateY - 40], -18), ROLE.ok, p * 1.1, {
          alpha: 0.45 + vl * 0.55,
          width: 3.6,
        }),
      );

      // Output Lane 1: Passes to Resource Resolver
      nodes.push(
        beamWithPhotons(
          quadArcPts([gateX + 102, gateY - 40], [340, y1], -18),
          ROLE.ok,
          p * 1.1 + 0.3,
          { alpha: 0.45 + vl * 0.55, width: 3.8 },
        ),
        energyRail(360, y1 - 45, y1 + 45, ROLE.ok),
        txt(
          okValid ? 'PASS -> RESOLVE RESOURCE' : 'REJECT',
          390,
          y1 - 14,
          28,
          ROLE.ok,
          'mono',
          'left',
        ).glow(6, ROLE.ok),
        txt('Non-empty string, zero extra keys', 390, y1 + 30, 26, COSMOS.muted, 'sans', 'left'),
      );

      // Lane 2: Numeric {"book_id": 7}
      const nAlpha = 0.35 + nf * 0.65;
      nodes.push(
        energyRail(-855, y2 - 36, y2 + 36, nf > 0.3 ? ROLE.fail : ROLE.proposal, {
          opacity: nAlpha,
        }),
        txt(
          '{"book_id": 7}',
          -825,
          y2,
          28,
          nf > 0.3 ? ROLE.fail : COSMOS.ink,
          'mono',
          'left',
        ).opacity(nAlpha),
        beamWithPhotons(
          [
            [-440, y2],
            [gateX - 112, gateY],
          ],
          nf > 0.3 ? ROLE.fail : ROLE.proposal,
          p * 1.1 + 0.25,
          { alpha: nAlpha, width: 3.4 },
        ),
      );
      if (nf > 0.05) {
        nodes.push(
          beamWithPhotons(
            [
              [gateX + 112, gateY],
              [340, y2],
            ],
            ROLE.fail,
            p * 1.3,
            { alpha: nf, width: 3.6 },
          ),
          energyRail(360, y2 - 42, y2 + 42, ROLE.fail, { opacity: nf }),
          txt(!okNum ? 'REJECTED: TYPE RULE' : 'PASS', 390, y2 - 14, 28, ROLE.fail, 'mono', 'left')
            .glow(7, ROLE.fail)
            .opacity(nf),
          txt(
            'Expected string, received number',
            390,
            y2 + 30,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(nf),
        );
      }

      // Lane 3: Extra write field {"book_id":"B7","place_hold":true}
      const eAlpha = 0.35 + ef * 0.65;
      nodes.push(
        energyRail(-855, y3 - 36, y3 + 36, ef > 0.3 ? ROLE.fail : ROLE.proposal, {
          opacity: eAlpha,
        }),
        txt(
          '{"book_id":"B7","place_hold":true}',
          -825,
          y3,
          26,
          ef > 0.3 ? ROLE.fail : COSMOS.ink,
          'mono',
          'left',
        ).opacity(eAlpha),
        beamWithPhotons(
          quadArcPts([-225, y3], [gateX - 102, gateY + 45], 22),
          ef > 0.3 ? ROLE.fail : ROLE.proposal,
          p * 1.1 + 0.6,
          {
            alpha: eAlpha,
            width: 3.4,
          },
        ),
      );
      if (ef > 0.05) {
        nodes.push(
          beamWithPhotons(
            quadArcPts([gateX + 102, gateY + 45], [340, y3], 22),
            ROLE.fail,
            p * 1.3 + 0.4,
            {
              alpha: ef,
              width: 3.6,
            },
          ),
          energyRail(360, y3 - 42, y3 + 42, ROLE.fail, { opacity: ef }),
          txt(
            !okExtra ? 'REJECTED: EXTRA-FIELD RULE' : 'PASS',
            390,
            y3 - 14,
            28,
            ROLE.fail,
            'mono',
            'left',
          )
            .glow(7, ROLE.fail)
            .opacity(ef),
          txt(
            'Model cannot invent a write capability',
            390,
            y3 + 30,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(ef),
        );
      }

      // Bottom note: Shape != Meaning / Policy
      const mnOp = 0.4 + mn * 0.6;
      nodes.push(
        line([-855, 345], [840, 345], { stroke: '#25355a', width: 2 }).opacity(mnOp),
        txt(
          'SHAPE VALIDATION != MEANING OR OWNERSHIP',
          -855,
          395,
          28,
          mn > 0.35 ? ROLE.focus : COSMOS.muted,
          'mono',
          'left',
        )
          .glow(mn > 0.35 ? 6 : 0, ROLE.focus)
          .opacity(mnOp),
        txt(
          'Separate correctable argument errors from policy denials',
          840,
          395,
          26,
          COSMOS.ink,
          'sans',
          'right',
        ).opacity(mnOp),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('schema-validation-beat-1-focus-1', () => {
    s.play(
      validOn.to(1, {
        duration: clampDur(c, c.cue('schema-validation-beat-1-focus-1').start, 0.35),
      }),
    );
  });
  c.on('schema-validation-beat-2-focus-1', () => {
    s.play(
      numFailOn.to(1, {
        duration: clampDur(c, c.cue('schema-validation-beat-2-focus-1').start, 0.35),
      }),
    );
  });
  c.on('schema-extra-field', () => {
    s.play(extraFailOn.to(1, { duration: clampDur(c, c.cue('schema-extra-field').start, 0.35) }));
  });
  c.on('schema-validation-beat-3-focus-1', () => {
    s.play(
      meaningOn.to(1, {
        duration: clampDur(c, c.cue('schema-validation-beat-3-focus-1').start, 0.35),
      }),
    );
  });
}
