import { group, line, rect } from 'vizmatic/stage';
import {
  COHORT_EQ,
  COHORT_LONG_HIT,
  COHORT_LONG_MISS,
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  metricReadout,
  txt,
} from '../parts.mjs';

export function buildCohortWork(s, c) {
  s.add(aura(-460, -40, 560, ROLE.ok, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.fail, COSMOS.bg));

  s.add(
    cinemaHeader(
      'CACHE COHORT CORRELATION',
      'Same average length and hit rate,',
      'very different prefill load',
      {
        x: -860,
        y: -445,
        accent: ROLE.focus,
        size: 46,
      },
    ),
  );

  const trim1 = s.value(0);
  const sum1 = s.value(0);
  const gpus1 = s.value(0);
  const swap = s.value(0);
  const trim2 = s.value(0);
  const sum2 = s.value(0);
  const gpus2 = s.value(0);

  c.on('cohort-trim', () =>
    s.play(trim1.to(1, { duration: clampDur(c, c.cue('cohort-trim').start, 0.55) })),
  );
  c.on('cohort-first-total', () =>
    s.play(sum1.to(1, { duration: clampDur(c, c.cue('cohort-first-total').start, 0.5) })),
  );
  c.on('cohort-first-count', () =>
    s.play(gpus1.to(1, { duration: clampDur(c, c.cue('cohort-first-count').start, 0.5) })),
  );
  c.on('cohort-swap', () =>
    s.play(swap.to(1, { duration: clampDur(c, c.cue('cohort-swap').start, 0.6) })),
  );
  c.on('cohort-short-cut', () =>
    s.play(trim2.to(1, { duration: clampDur(c, c.cue('cohort-short-cut').start, 0.55) })),
  );
  // Strict prediction withholding: answer stays hidden until narration reveals it
  c.after('cohort-second-total', () =>
    s.play(sum2.to(1, { duration: clampDur(c, c.cue('cohort-second-total').end, 0.5) })),
  );
  c.after('cohort-second-count', () =>
    s.play(gpus2.to(1, { duration: clampDur(c, c.cue('cohort-second-count').end, 0.5) })),
  );

  // Scale: 3072 tokens -> 960 px bar width
  const xBar = -420;
  const maxW = 960;
  const pxPerTok = maxW / 3072;

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const t1 = trim1.value;
        const s1 = sum1.value;
        const g1 = gpus1.value;
        const sw = swap.value;
        const t2 = trim2.value;
        const s2 = sum2.value;
        const g2 = gpus2.value;
        const nodes = [];

        const hitTok = 3072 + (1024 - 3072) * sw;
        const missTok = 1024 + (3072 - 1024) * sw;
        const activeTrim = sw < 0.5 ? t1 : t2;

        // Top scale ruler
        nodes.push(line([xBar, -210], [xBar + maxW, -210], { stroke: '#2c3d66', width: 2 }));
        [0, 1024, 2048, 3072].forEach((v) => {
          const tx = xBar + v * pxPerTok;
          nodes.push(line([tx, -218], [tx, -202], { stroke: '#4d6599', width: 2 }));
          nodes.push(txt(`${v}`, tx, -242, 26, COSMOS.muted, 'mono', 'center'));
        });

        // Row 1: 400 HITS/s (75% reusable trimmed)
        const yHit = -110;
        const hitW = hitTok * pxPerTok;
        const hitKeepW = hitW * (1 - 0.75 * activeTrim);
        const hitCutW = hitW - hitKeepW;

        nodes.push(txt('400 HITS / s', -850, yHit - 18, 28, ROLE.ok, 'mono', 'left'));
        nodes.push(
          txt(
            sw < 0.5 ? '3,072 tok prompt' : '1,024 tok prompt',
            -850,
            yHit + 24,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ),
        );

        nodes.push(
          rect(hitKeepW, 56, { fill: ROLE.ok, stroke: null, radius: 6 })
            .at(xBar + hitKeepW * 0.5, yHit)
            .glow(8, ROLE.ok),
        );
        if (hitCutW > 8) {
          nodes.push(
            rect(hitCutW - 4, 56, { fill: ROLE.ok, stroke: ROLE.ok, width: 2, radius: 6 })
              .at(xBar + hitKeepW + hitCutW * 0.5 + 2, yHit)
              .opacity(0.16),
          );
          if (hitCutW > 220) {
            nodes.push(
              txt(
                '75% REUSED',
                xBar + hitKeepW + hitCutW * 0.5,
                yHit,
                26,
                ROLE.ok,
                'mono',
                'center',
              ).opacity(0.8),
            );
          }
        }
        const hitRemainTok = sw < 0.5 ? (t1 > 0.5 ? 768 : 3072) : t2 > 0.5 ? 256 : 1024;
        nodes.push(
          txt(`${hitRemainTok} tok/req`, xBar + hitW + 24, yHit, 28, ROLE.ok, 'mono', 'left'),
        );

        // Row 2: 400 MISSES/s (100% prefill)
        const yMiss = 38;
        const missW = missTok * pxPerTok;
        nodes.push(txt('400 MISSES / s', -850, yMiss - 18, 28, ROLE.fail, 'mono', 'left'));
        nodes.push(
          txt(
            sw < 0.5 ? '1,024 tok prompt' : '3,072 tok prompt',
            -850,
            yMiss + 24,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ),
        );
        nodes.push(
          rect(missW, 56, { fill: ROLE.fail, stroke: null, radius: 6 })
            .at(xBar + missW * 0.5, yMiss)
            .glow(8, ROLE.fail),
        );
        const missLabelTok = sw < 0.5 ? 1024 : 3072;
        nodes.push(
          txt(`${missLabelTok} tok/req`, xBar + missW + 24, yMiss, 28, ROLE.fail, 'mono', 'left'),
        );

        // Divider + bottom readout
        nodes.push(line([-860, 152], [840, 152], { stroke: '#233152', width: 2 }));

        // Case 1 readout (always visible once computed)
        nodes.push(
          metricReadout(
            'LONG HITS (3072 / 1024)',
            g1 > 0.5
              ? `${COHORT_LONG_HIT.gpus} GPUs`
              : s1 > 0.5
                ? `${(COHORT_LONG_HIT.total / 1000).toFixed(1)}k tok/s`
                : '---',
            -560,
            285,
            { color: ROLE.ok, size: 42 },
          ),
        );
        if (s1 > 0.5) {
          nodes.push(txt('716,800 tok/s', -560, 366, 26, COSMOS.muted, 'mono', 'center'));
        }

        // Baseline equal-length reference
        nodes.push(
          metricReadout('EQUAL (2048 / 2048)', `${COHORT_EQ.gpus} GPUs`, 0, 285, {
            color: ROLE.gpu,
            size: 42,
          }),
        );
        nodes.push(txt('1,024,000 tok/s', 0, 366, 26, COSMOS.muted, 'mono', 'center'));

        // Case 2 readout (strictly withheld during swap prediction hold!)
        let rightVal = '---';
        let rightColor = COSMOS.muted;
        let rightSub = '';
        if (g2 > 0.5) {
          rightVal = `${COHORT_LONG_MISS.gpus} GPUs`;
          rightColor = ROLE.fail;
          rightSub = '1,331,200 tok/s';
        } else if (s2 > 0.5) {
          rightVal = '1,331.2k tok/s';
          rightColor = ROLE.fail;
          rightSub = '400x256 + 400x3072';
        } else if (sw > 0.5) {
          rightVal = '? GPUs';
          rightColor = ROLE.focus;
          rightSub = 'SAME PREFILL LOAD?';
        }
        nodes.push(
          metricReadout('LONG MISSES (1024 / 3072)', rightVal, 560, 285, {
            color: rightColor,
            size: 42,
          }),
        );
        if (rightSub) {
          nodes.push(txt(rightSub, 560, 366, 26, rightColor, 'mono', 'center'));
        }

        return group(...nodes);
      },
    ),
  );
}
