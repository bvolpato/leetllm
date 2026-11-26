import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  accepted,
  aura,
  cinemaHeader,
  clampDur,
  glowDot,
  glowMeter,
  guardedDynamic,
  metricReadout,
  retained,
  sum,
  txt,
} from '../parts.mjs';

export function buildValue(s, c) {
  s.add(aura(-420, -40, 560, ROLE.ok, COSMOS.bg));
  s.add(aura(460, 120, 520, ROLE.focus, COSMOS.bg));

  s.add(
    cinemaHeader('POST-ACCEPTANCE SURVIVAL', 'An accepted suggestion', 'can be completely undone', {
      x: -860,
      y: -445,
      accent: ROLE.ok,
      size: 46,
    }),
  );

  const edited = s.value(0);
  const policy = s.value(0);

  c.on('value-beat-1-focus-1', () => {
    s.play(edited.to(1, { duration: clampDur(c, c.cue('value-beat-1-focus-1').start, 0.7) }));
  });
  c.on('value-beat-2-focus-1', () => {
    s.play(policy.to(1, { duration: clampDur(c, c.cue('value-beat-2-focus-1').start, 0.6) }));
  });

  const rows = [
    {
      id: 'S1',
      code: 'allow_admin(user)',
      ins: accepted[0],
      ret: retained[0],
      statusBefore: 'ACCEPTED (+18)',
      statusAfter: 'UNDONE (0 RETAINED)',
      colorAfter: ROLE.fail,
    },
    {
      id: 'S2',
      code: 'else',
      ins: accepted[1],
      ret: retained[1],
      statusBefore: 'ACCEPTED (+4)',
      statusAfter: 'KEPT AS ACCEPTED (4)',
      colorAfter: ROLE.ok,
    },
    {
      id: 'S3',
      code: 'graph.can_read(user, repo, scope="branch")',
      ins: accepted[2],
      ret: retained[2],
      statusBefore: 'ACCEPTED (+42)',
      statusAfter: '35 KEPT + 7 REPLACED',
      colorAfter: ROLE.focus,
    },
    {
      id: 'S4',
      code: 'return False  # fallback',
      ins: accepted[3],
      ret: retained[3],
      statusBefore: 'SHOWN (NOT ACCEPTED)',
      statusAfter: 'NEVER ACCEPTED (0)',
      colorAfter: COSMOS.muted,
    },
  ];

  // Column header anchors (open canvas, zero boxes)
  s.add(txt('ID', -830, -235, 26, COSMOS.muted, 'mono', 'left'));
  s.add(txt('INSERTED -> OBSERVATION WINDOW', -730, -235, 26, COSMOS.muted, 'mono', 'left'));
  s.add(txt('OUTCOME', 165, -235, 26, COSMOS.muted, 'mono', 'left'));
  s.add(line([-860, -206], [840, -206], { stroke: '#233152', width: 2 }));

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const e = edited.value;
        const nodes = [];
        rows.forEach((r, idx) => {
          const y = -132 + idx * 124;
          const col = e > 0.5 ? r.colorAfter : r.ins > 0 ? ROLE.ed : COSMOS.muted;
          nodes.push(glowDot(-820, y, { radius: 8, color: col, glow: 8 }));
          nodes.push(txt(r.id, -792, y, 28, col, 'mono', 'left'));

          // Survival bar scaled to 42 chars max (width 560px)
          const maxW = 560;
          const barX = -715;
          const insW = r.ins > 0 ? Math.max(44, (r.ins / 42) * maxW) : 0;
          const retW = r.ret > 0 ? Math.max(44, (r.ret / 42) * maxW) : 0;

          // Track
          nodes.push(
            rect(maxW, 38, { fill: '#0b1224', stroke: '#203052', width: 2, radius: 6 }).at(
              barX + maxW * 0.5,
              y,
            ),
          );

          if (r.ins > 0) {
            if (e < 0.5) {
              nodes.push(
                rect(insW, 32, { fill: ROLE.ed, stroke: null, radius: 5 })
                  .at(barX + insW * 0.5, y)
                  .opacity(0.85),
              );
            } else {
              if (r.ret > 0) {
                nodes.push(
                  rect(retW, 32, { fill: ROLE.ok, stroke: null, radius: 5 })
                    .at(barX + retW * 0.5, y)
                    .glow(7, ROLE.ok),
                );
              }
              const lostW = insW - retW;
              if (lostW > 6) {
                const fillLost = r.id === 'S3' ? ROLE.focus : ROLE.fail;
                const opLost = r.id === 'S3' ? 0.85 : 0.25;
                nodes.push(
                  rect(lostW - 2, 32, {
                    fill: fillLost,
                    stroke: fillLost,
                    width: 1.5,
                    radius: 4,
                  })
                    .at(barX + retW + lostW * 0.5 + 1, y)
                    .opacity(opLost),
                );
              }
            }
          }

          nodes.push(
            txt(r.code.slice(0, 32), barX + 12, y - 48, 26, COSMOS.ink, 'mono', 'left').opacity(
              r.id === 'S1' && e > 0.5 ? 0.42 : 0.92,
            ),
          );

          nodes.push(
            txt(e > 0.5 ? r.statusAfter : r.statusBefore, 165, y, 26, col, 'mono', 'left'),
          );
        });
        return group(...nodes);
      },
    ),
  );

  // Bottom live accumulators
  s.add(line([-860, 328], [840, 328], { stroke: '#233152', width: 2 }));
  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const e = edited.value;
        const p = policy.value;
        const nodes = [
          metricReadout('ACCEPTED IDs', '3 / 4', -660, 412, { color: ROLE.ed, size: 42 }),
          metricReadout('INSERTED CHARS', `${sum(accepted)}`, -220, 412, {
            color: ROLE.focus,
            size: 42,
          }),
          metricReadout(
            'RETAINED ORIGINAL',
            e > 0.5 ? `${sum(retained)} / ${sum(accepted)}` : 'OBSERVING...',
            240,
            412,
            { color: e > 0.5 ? ROLE.ok : COSMOS.muted, size: 42 },
          ),
        ];
        if (p > 0.5) {
          nodes.push(
            txt(
              'UNOBSERVED WINDOWS = CENSORED  |  RETAINED BUG IS STILL A BUG',
              0,
              488,
              26,
              ROLE.warn,
              'mono',
              'center',
            ),
          );
        }
        return group(...nodes);
      },
    ),
  );
}
