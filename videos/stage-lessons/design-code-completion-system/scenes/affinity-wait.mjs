import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  metricReadout,
  txt,
} from '../parts.mjs';

export function buildAffinityWait(s, c) {
  s.add(aura(-460, -40, 560, ROLE.gpu, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.warn, COSMOS.bg));

  s.add(
    cinemaHeader('CACHE AFFINITY VS QUEUE', 'When a warm worker', 'loses to a cold replica', {
      x: -860,
      y: -445,
      accent: ROLE.focus,
      size: 46,
    }),
  );

  const servT = s.value(0);
  const tieT = s.value(0);
  const extraT = s.value(0);
  const winT = s.value(0);
  const nineT = s.value(0);

  c.on('aff-services', () =>
    s.play(servT.to(1, { duration: clampDur(c, c.cue('aff-services').start, 0.55) })),
  );
  // Strict prediction withholding: 61 ms tie point withheld until aff-tie;
  // winner (cold 96 ms vs warm 105 ms, wins by 9 ms) withheld until aff-win / aff-nine!
  c.after('aff-tie', () =>
    s.play(tieT.to(1, { duration: clampDur(c, c.cue('aff-tie').end, 0.55) })),
  );
  c.on('aff-extra', () =>
    s.play(extraT.to(1, { duration: clampDur(c, c.cue('aff-extra').start, 0.6) })),
  );
  c.after('aff-win', () =>
    s.play(winT.to(1, { duration: clampDur(c, c.cue('aff-win').end, 0.45) })),
  );
  c.after('aff-nine', () =>
    s.play(nineT.to(1, { duration: clampDur(c, c.cue('aff-nine').end, 0.45) })),
  );

  // Millisecond ruler: 0 to 120 ms across 1140 px (9.5 px / ms)
  const x0 = -500;
  const pxPerMs = 9.5;

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const tie = tieT.value;
        const ext = extraT.value;
        const win = winT.value;
        const nine = nineT.value;
        const nodes = [];

        // Ruler ticks
        const yRuler = -205;
        nodes.push(
          line([x0, yRuler], [x0 + 120 * pxPerMs, yRuler], { stroke: '#2c3d66', width: 2 }),
        );
        [0, 30, 60, 90, 120].forEach((ms) => {
          const rx = x0 + ms * pxPerMs;
          nodes.push(line([rx, yRuler - 8], [rx, yRuler + 8], { stroke: '#4d6599', width: 2 }));
          nodes.push(txt(`${ms} ms`, rx, yRuler - 34, 26, COSMOS.muted, 'mono', 'center'));
        });

        // Cold worker rail: 72 ms prefill + 24 ms decode = 96 ms
        const yCold = -90;
        const coldPrefW = 72 * pxPerMs;
        const decW = 24 * pxPerMs;
        const coldEnd = x0 + 96 * pxPerMs;

        nodes.push(txt('COLD WORKER', -850, yCold - 16, 28, ROLE.gpu, 'mono', 'left'));
        nodes.push(txt('72 + 24 ms', -850, yCold + 24, 26, COSMOS.muted, 'mono', 'left'));

        nodes.push(
          rect(coldPrefW - 3, 62, { fill: ROLE.gpu, stroke: null, radius: 6 })
            .at(x0 + coldPrefW * 0.5, yCold)
            .glow(win > 0.5 ? 10 : 6, ROLE.gpu),
        );
        nodes.push(txt('PREFILL 72', x0 + coldPrefW * 0.5, yCold, 26, '#050811', 'mono', 'center'));

        nodes.push(
          rect(decW - 3, 62, { fill: ROLE.ed, stroke: null, radius: 6 })
            .at(x0 + coldPrefW + decW * 0.5, yCold)
            .glow(win > 0.5 ? 10 : 5, ROLE.ed),
        );
        nodes.push(
          txt('DEC 24', x0 + coldPrefW + decW * 0.5, yCold, 26, '#050811', 'mono', 'center'),
        );

        // Cold finish vertical marker (strictly between rails, never crossing text)
        nodes.push(
          line([coldEnd, yCold + 38], [coldEnd, yCold + 132], {
            stroke: win > 0.5 ? ROLE.ok : '#4d6599',
            width: 2.5,
            dash: [7, 5],
          }),
        );

        // Warm worker rail: extraQueue + 11 ms prefill + 24 ms decode
        const yWarm = 82;
        const extraQueueMs = tie * 61 + ext * 9; // 0 -> 61 -> 70 ms
        const qW = extraQueueMs * pxPerMs;
        const warmPrefW = 11 * pxPerMs;

        nodes.push(txt('WARM WORKER', -850, yWarm - 16, 28, ROLE.focus, 'mono', 'left'));
        nodes.push(
          txt(
            ext > 0.5 ? '+70q, 11 + 24' : tie > 0.5 ? '+61q, 11 + 24' : '11 + 24 ms',
            -850,
            yWarm + 24,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ),
        );

        if (qW > 8) {
          const qCol = ext > 0.5 ? ROLE.fail : ROLE.warn;
          nodes.push(
            rect(qW - 3, 62, { fill: qCol, stroke: null, radius: 6 })
              .at(x0 + qW * 0.5, yWarm)
              .opacity(0.85),
          );
          if (qW > 180) {
            nodes.push(
              txt(
                ext > 0.5 ? 'EXTRA QUEUE 70' : 'EXTRA QUEUE 61',
                x0 + qW * 0.5,
                yWarm,
                26,
                '#050811',
                'mono',
                'center',
              ),
            );
          }
        }

        nodes.push(
          rect(warmPrefW - 2, 62, { fill: ROLE.ok, stroke: null, radius: 6 })
            .at(x0 + qW + warmPrefW * 0.5, yWarm)
            .glow(6, ROLE.ok),
        );
        nodes.push(txt('11', x0 + qW + warmPrefW * 0.5, yWarm, 26, '#050811', 'mono', 'center'));

        nodes.push(
          rect(decW - 3, 62, { fill: ROLE.ed, stroke: null, radius: 6 })
            .at(x0 + qW + warmPrefW + decW * 0.5, yWarm)
            .glow(5, ROLE.ed),
        );
        nodes.push(
          txt('DEC 24', x0 + qW + warmPrefW + decW * 0.5, yWarm, 26, '#050811', 'mono', 'center'),
        );

        // Divider + live readouts with strict prediction withholding
        nodes.push(line([-860, 206], [840, 206], { stroke: '#233152', width: 2 }));

        nodes.push(
          metricReadout('PREFILL SAVED', tie > 0.5 ? '61 ms' : '? ms', -560, 326, {
            color: tie > 0.5 ? ROLE.ok : ROLE.focus,
            size: 46,
          }),
        );

        let midTitle = 'BREAK-EVEN QUEUE';
        let midVal = '?';
        let midCol = ROLE.focus;
        if (win > 0.5) {
          midTitle = 'ROUTE DECISION';
          midVal = 'COLD WORKER';
          midCol = ROLE.ok;
        } else if (ext > 0.5) {
          midTitle = 'AT +70 ms EXTRA WAIT';
          midVal = 'WHICH FINISHES FIRST?';
          midCol = ROLE.focus;
        } else if (tie > 0.5) {
          midTitle = 'LEVEL AT 96 ms';
          midVal = '72 - 11 = 61 ms';
          midCol = ROLE.warn;
        }
        nodes.push(metricReadout(midTitle, midVal, 0, 326, { color: midCol, size: 38 }));

        let rightVal = '---';
        let rightCol = COSMOS.muted;
        if (nine > 0.5) {
          rightVal = 'COLD BY 9 ms';
          rightCol = ROLE.ok;
        } else if (win > 0.5) {
          rightVal = '96 vs 105 ms';
          rightCol = ROLE.ok;
        }
        nodes.push(
          metricReadout('FINISH MARGIN', rightVal, 560, 326, { color: rightCol, size: 40 }),
        );

        if (nine > 0.5) {
          nodes.push(
            txt(
              'CHECK REPO ACCESS, MODEL, CAPACITY & REGION FIRST  |  STILL CHECK FRESHNESS AT PAINT',
              0,
              456,
              26,
              COSMOS.muted,
              'mono',
              'center',
            ).opacity(nine),
          );
        }

        return group(...nodes);
      },
    ),
  );
}
