// Scene 5: two-reuse-paths - A return question, then an order question
// Dual-lane energy splitter: Left = Semantic stored-answer copy ($0 generation),
// Right = KV prefix match on Order 42 -> Order 77.
// Strict prediction withholding during beat 1; `prefix-new-output` fires 180 output tokens ($0.00432).
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  dashedRule,
  guardedDynamic,
  prefixMicro,
  quadArcPts,
  txt,
  usd,
} from '../parts.mjs';

export default function twoReusePaths(s, c) {
  const pulseT = s.value(0);
  const copyProg = s.value(0); // `stored-answer-copy`
  const rightVis = s.value(0); // beat 1
  const matchProg = s.value(0); // `prefix-kv-match`
  const outProg = s.value(0); // `prefix-new-output` (beat 2)

  const header = cinemaHeader('TWO REUSE PATHS', 'Copy an answer,', 'or reuse a prefix', {
    x: -860,
    y: -415,
    accent: ROLE.stored,
    size: 52,
  });

  const leftAura = aura(-460, 80, 480, '#6ee7b722', '#07091000');
  const rightAura = aura(420, 80, 520, '#ffd16620', '#ff6b8b16');

  const stageCanvas = guardedDynamic(
    () => 1,
    () => {
      const cp = copyProg.value;
      const rv = rightVis.value;
      const mp = matchProg.value;
      const op = outProg.value;
      const p = 0;
      const nodes = [];

      // LEFT LANE: Stored Semantic Answer Copy
      const lx = -480;
      nodes.push(
        txt('SEMANTIC STORED REPLY', lx, -185, 26, ROLE.stored, 'mono'),
        txt('"What is the return window?"', lx, -132, 30, COSMOS.ink, 'serif'),
        rect(680, 82, { fill: '#0d2620', stroke: ROLE.stored, width: 2.4, radius: 12 })
          .at(lx, -30)
          .glow(8, ROLE.stored),
        txt('Returns accepted within 30 days.', lx, -30, 30, ROLE.stored, 'sans'),
      );

      // Glowing copy photon beam downward to customer reply
      if (cp > 0.05) {
        const arc = quadArcPts([lx, 18], [lx, 178], 0, 20);
        nodes.push(
          beamWithPhotons(arc, ROLE.stored, p, {
            width: 4.5,
            glow: 12,
            photonCount: 2,
            alpha: cp,
          }),
        );
      }

      nodes.push(
        rect(680, 82, {
          fill: cp > 0.5 ? '#0d2620' : '#0f1628',
          stroke: cp > 0.5 ? ROLE.stored : '#354566',
          width: 2.2,
          radius: 12,
          ...(cp > 0.5 ? {} : { dash: [6, 6] }),
        })
          .at(lx, 226)
          .glow(cp > 0.5 ? 9 : 0, ROLE.stored),
        txt(
          cp > 0.5 ? 'Returns accepted within 30 days.' : 'Customer reply slot',
          lx,
          226,
          30,
          cp > 0.5 ? ROLE.stored : COSMOS.muted,
          'sans',
        ),
        txt(
          cp > 0.5 ? '0 generated tokens  ·  $0 generation' : 'Approved policy library',
          lx,
          324,
          28,
          ROLE.stored,
          'mono',
        ),
        txt('Lookup & storage billed separately', lx, 386, 26, COSMOS.muted, 'sans'),
      );

      // Center subtle vertical split line
      nodes.push(dashedRule(-40, -210, -40, 415, '#2b3d66', { width: 2, opacity: 0.65 }));

      // RIGHT LANE: KV Prefix Reuse + New Generation
      const rx = 445;
      if (rv > 0.05) {
        nodes.push(
          txt('KV PREFIX REUSE', rx, -185, 26, ROLE.cached, 'mono').opacity(rv),
          txt('"Does order 77 qualify?"', rx, -132, 30, COSMOS.ink, 'serif').opacity(rv),
        );

        // Order 42 (earlier) and Order 77 (current) aligned prefix/suffix bars
        const barLeft = 55;
        const prefW = 490;
        const sufW = 260;

        // Earlier call (Order 42)
        nodes.push(
          rect(prefW, 62, { fill: '#31260f', stroke: ROLE.cached, width: 2.2, radius: 8 })
            .at(barLeft + prefW * 0.5, -50)
            .opacity(rv),
          txt(
            'Same policy prefix (1,280)',
            barLeft + prefW * 0.5,
            -50,
            26,
            ROLE.cached,
            'mono',
          ).opacity(rv),
          rect(sufW, 62, { fill: '#121a2e', stroke: '#495a80', width: 1.8, radius: 8 })
            .at(barLeft + prefW + 16 + sufW * 0.5, -50)
            .opacity(rv),
          txt('Order 42', barLeft + prefW + 16 + sufW * 0.5, -50, 26, COSMOS.muted, 'mono').opacity(
            rv,
          ),
        );

        // Current call (Order 77)
        nodes.push(
          rect(prefW, 62, { fill: '#392c10', stroke: ROLE.cached, width: 2.6, radius: 8 })
            .at(barLeft + prefW * 0.5, 58)
            .glow(mp > 0.2 ? 10 : 4, ROLE.cached)
            .opacity(rv),
          txt(
            'Reused KV prefix (1,280)',
            barLeft + prefW * 0.5,
            58,
            26,
            ROLE.cached,
            'mono',
          ).opacity(rv),
          rect(sufW, 62, { fill: '#0f2838', stroke: ROLE.input, width: 2.4, radius: 8 })
            .at(barLeft + prefW + 16 + sufW * 0.5, 58)
            .glow(6, ROLE.input)
            .opacity(rv),
          txt(
            'Order 77 (520)',
            barLeft + prefW + 16 + sufW * 0.5,
            58,
            26,
            ROLE.input,
            'mono',
          ).opacity(rv),
        );

        // Match beam linking the two prefixes
        if (mp > 0.05) {
          const matchPts = quadArcPts([barLeft + 40, -14], [barLeft + 40, 22], 0, 14);
          nodes.push(
            beamWithPhotons(matchPts, ROLE.cached, p, {
              width: 3.6,
              glow: 10,
              photonCount: 1,
              alpha: mp * rv,
            }),
            txt('1,280 cache read  ·  520 ordinary', rx, 130, 26, ROLE.cached, 'mono').opacity(
              mp * rv,
            ),
          );
        }

        // Output box: WITHHELD on beat 1 ("Which work does the model still owe?")
        // REVEALED ONLY on beat 2 `prefix-new-output`
        nodes.push(
          rect(766, 82, {
            fill: op > 0.2 ? '#341323' : '#121728',
            stroke: op > 0.2 ? ROLE.output : '#495a80',
            width: 2.4,
            radius: 12,
            ...(op > 0.2 ? {} : { dash: [7, 6] }),
          })
            .at(barLeft + 383, 226)
            .glow(op > 0.2 ? 10 : 0, ROLE.output)
            .opacity(rv),
          txt(
            op > 0.2 ? 'Order 77: verify purchase date...' : 'Which work does the model still owe?',
            barLeft + 383,
            226,
            28,
            op > 0.2 ? ROLE.output : COSMOS.ink,
            'sans',
          ).opacity(rv),
          txt(
            op > 0.2 ? `180 new output tokens  ·  ${usd(prefixMicro, 5)}` : 'Output generation: ?',
            rx,
            324,
            28,
            op > 0.2 ? ROLE.output : COSMOS.muted,
            'mono',
          )
            .glow(op > 0.2 ? 7 : 0, ROLE.output)
            .opacity(rv),
          txt(
            op > 0.2
              ? 'Reused prefix compute, paid for a new answer'
              : 'Match prefix, process Order 77',
            rx,
            386,
            26,
            COSMOS.muted,
            'sans',
          ).opacity(rv),
        );
      } else {
        // Gentle preview anchor on right during beat 0 so frame is balanced (<40% empty)
        nodes.push(
          txt('NEXT: ORDER-SPECIFIC QUESTION', rx, -60, 26, COSMOS.muted, 'mono'),
          txt('Prefix reuse vs. copied answer', rx, 20, 32, ROLE.cached, 'serif').opacity(0.65),
          txt(
            'Same instructions · different customer order',
            rx,
            90,
            26,
            COSMOS.muted,
            'sans',
          ).opacity(0.7),
        );
      }

      return group(...nodes);
    },
  );

  s.add(leftAura, rightAura, header, stageCanvas);

  c.on('stored-answer-copy', () => {
    const t = c.cue('stored-answer-copy').start;
    s.play(copyProg.to(1, { duration: clampDur(c, t, 0.5) }));
  });
  c.onBeat(1, () => {
    const t = c.beats[1].start;
    s.play(rightVis.to(1, { duration: clampDur(c, t, 0.4) }));
  });
  c.on('prefix-kv-match', () => {
    const t = c.cue('prefix-kv-match').start;
    s.play(matchProg.to(1, { duration: clampDur(c, t, 0.45) }));
  });
  c.on('prefix-new-output', () => {
    const t = c.cue('prefix-new-output').start;
    s.play(outProg.to(1, { duration: clampDur(c, t, 0.5) }));
  });
}
