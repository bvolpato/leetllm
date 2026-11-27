import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export function buildEvaluationRelease(s, c) {
  s.add(aura(-460, -40, 560, ROLE.ed, COSMOS.bg));
  s.add(aura(460, 100, 560, ROLE.ok, COSMOS.bg));

  s.add(
    cinemaHeader(
      'OFFLINE TO ONLINE RELEASE',
      'Freeze an edit point',
      'before comparing product value',
      {
        x: -860,
        y: -445,
        accent: ROLE.ed,
        size: 46,
      },
    ),
  );

  const stage = s.value(0);
  c.on('cc-evaluation-release-1', () =>
    s.play(stage.to(1, { duration: clampDur(c, c.cue('cc-evaluation-release-1').start, 0.55) })),
  );
  c.on('cc-evaluation-release-2', () =>
    s.play(stage.to(2, { duration: clampDur(c, c.cue('cc-evaluation-release-2').start, 0.55) })),
  );

  const yOff = -120;
  const yOn = 105;
  const yGuard = 325;

  const offXs = [-660, -220, 220, 660];
  const offLabels = [
    ['FREEZE EDIT', 'repo + time split'],
    ['HIDE TARGET', 'time-valid files'],
    ['ISOLATED TEST', 'parse + no secrets'],
    ['POLICY CHECK', 'beyond exact match'],
  ];

  const onXs = [-660, -330, 0, 330, 660];
  const onLabels = [
    ['ELIGIBLE', 'user/ws split'],
    ['REQUESTED', 'fixed trigger'],
    ['SHOWN', 'fixed display'],
    ['ACCEPTED', 'per lang slice'],
    ['RETAINED', 'latency + drops'],
  ];

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const st = stage.value;
        const nodes = [];

        // Stage 1: Offline evaluation
        const offAlpha = st < 0.7 ? 1 : 0.62;
        nodes.push(
          txt(
            '1. OFFLINE TIME-FROZEN REPLAY',
            -850,
            yOff - 76,
            26,
            ROLE.ed,
            'mono',
            'left',
          ).opacity(offAlpha),
        );
        for (let i = 0; i < offXs.length - 1; i++) {
          nodes.push(
            beamWithPhotons(
              [
                [offXs[i] + 150, yOff],
                [offXs[i + 1] - 150, yOff],
              ],
              ROLE.ed,
              0,
              { alpha: offAlpha },
            ),
          );
        }
        offXs.forEach((x, idx) => {
          nodes.push(
            rect(280, 56, { fill: '#0b1224', stroke: ROLE.ed, width: 2.5, radius: 10 })
              .at(x, yOff)
              .glow(st < 0.7 ? 7 : 3, ROLE.ed)
              .opacity(offAlpha),
          );
          nodes.push(
            txt(offLabels[idx][0], x, yOff, 26, ROLE.ed, 'mono', 'center').opacity(offAlpha),
          );
          nodes.push(
            txt(offLabels[idx][1], x, yOff + 54, 26, COSMOS.muted, 'mono', 'center').opacity(
              offAlpha,
            ),
          );
        });

        // Stage 2: Online randomized funnel
        const onAlpha = st >= 0.4 ? (st < 1.6 ? 1 : 0.72) : 0.28;
        nodes.push(
          txt(
            '2. ONLINE WORKSPACE-RANDOMIZED FUNNEL',
            -850,
            yOn - 76,
            26,
            ROLE.ok,
            'mono',
            'left',
          ).opacity(onAlpha),
        );
        for (let i = 0; i < onXs.length - 1; i++) {
          nodes.push(
            beamWithPhotons(
              [
                [onXs[i] + 120, yOn],
                [onXs[i + 1] - 120, yOn],
              ],
              ROLE.ok,
              0,
              { alpha: onAlpha },
            ),
          );
        }
        onXs.forEach((x, idx) => {
          nodes.push(
            rect(220, 56, { fill: '#0b1224', stroke: ROLE.ok, width: 2.5, radius: 10 })
              .at(x, yOn)
              .glow(st >= 0.4 && st < 1.6 ? 7 : 3, ROLE.ok)
              .opacity(onAlpha),
          );
          nodes.push(txt(onLabels[idx][0], x, yOn, 26, ROLE.ok, 'mono', 'center').opacity(onAlpha));
          nodes.push(
            txt(onLabels[idx][1], x, yOn + 54, 26, COSMOS.muted, 'mono', 'center').opacity(onAlpha),
          );
        });

        // Stage 3: Release guardrails
        const gAlpha = st >= 1.4 ? 1 : 0.24;
        nodes.push(
          line([-860, yGuard - 62], [840, yGuard - 62], { stroke: '#233152', width: 2 }).opacity(
            gAlpha,
          ),
        );
        nodes.push(
          txt(
            '3. PREDEFINED ROLLBACK GUARDRAILS',
            -850,
            yGuard - 18,
            26,
            ROLE.focus,
            'mono',
            'left',
          ).opacity(gAlpha),
        );
        const guards = [
          { x: -640, t: 'KNOWN-GOOD ROUTE', sub: 'per language slice', c: ROLE.focus },
          { x: 0, t: 'AVOID TRIVIAL-TOKEN GAMING', sub: 'no heavy abstention', c: ROLE.warn },
          { x: 640, t: 'COST / RETAINED', sub: '+ correctness + coverage', c: ROLE.ok },
        ];
        guards.forEach((g) => {
          nodes.push(
            glowDot(g.x - 190, yGuard + 54, { radius: 8, color: g.c, glow: 8, opacity: gAlpha }),
          );
          nodes.push(txt(g.t, g.x - 166, yGuard + 54, 26, g.c, 'mono', 'left').opacity(gAlpha));
          nodes.push(
            txt(g.sub, g.x - 166, yGuard + 96, 26, COSMOS.muted, 'mono', 'left').opacity(gAlpha),
          );
        });

        return group(...nodes);
      },
    ),
  );
}
