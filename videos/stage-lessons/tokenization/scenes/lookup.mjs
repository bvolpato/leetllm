// Scene 14: lookup: Orbiting 3D embedding weight slab -> input/output table routing -> partial migration bug -> pin by hash.
import {
  COSMOS,
  FINAL_VECTOR,
  IDS_A,
  IDS_B,
  ROLE,
  ROW_SCORES,
  TABLE,
  aura,
  bindCueBeat,
  buildEmbedMatrix3d,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  playCue,
  swapVis,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function lookup(s, c) {
  const activeRow = s.value(2); // row 2 (rain) -> row 5 (falls) -> row 4 (output argmax) -> row 5 (swap bug)
  const view1Vis = s.value(1);
  const view2Vis = s.value(0);
  const showOutput = s.value(0);
  const showSwapBug = s.value(0);
  const showRenumber = s.value(0);
  const showHash = s.value(0);

  const bgAura = aura(340, 20, 560, '#183c6628', '#3c1e5816');
  const slab3d = buildEmbedMatrix3d(activeRow, { x: 350, y: 20 });

  const title = heroTitle(['Each integer ID', 'picks a learned row'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: ROLE.merge,
  });

  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const r = Math.round(activeRow.value);
    const out = showOutput.value;
    const sw = showSwapBug.value;
    const vec = TABLE[r] ?? TABLE[2];
    const nodes = [
      txt('EMBEDDING TABLE  W_E ∈ ℝ^{8×3}', 350, -395, 26, ROLE.piece, 'mono', 'center')
        .glow(5, ROLE.piece)
        .opacity(alpha),
      txt('ACTIVE LOOKUP', -855, -210, 26, ROLE.merge, 'mono', 'left').opacity(alpha),
      tokenPill(sw > 0.5 ? '·soft → ID 5' : r === 5 ? '·falls → ID 5' : 'rain → ID 2', -680, -120, {
        w: 330,
        h: 80,
        color: sw > 0.5 ? ROLE.warn : ROLE.merge,
        size: 34,
        glow: 12,
        opacity: alpha,
      }),
      txt(
        `Row ${r}:  [${vec.map((x) => x.toFixed(1)).join(', ')}]`,
        -855,
        -10,
        34,
        sw > 0.5 ? ROLE.warn : ROLE.piece,
        'mono',
        'left',
      )
        .glow(6, sw > 0.5 ? ROLE.warn : ROLE.piece)
        .opacity(alpha),
    ];

    if (out > 0.05 && sw < 0.3) {
      const topIdx = ROW_SCORES.indexOf(Math.max(...ROW_SCORES));
      nodes.push(
        txt('OUTPUT TABLE LOGITS  h · W_out', -855, 110, 26, ROLE.ok, 'mono', 'left').opacity(
          out * alpha,
        ),
        txt(
          `h = [${FINAL_VECTOR.join(', ')}]  →  Row ${topIdx} wins (${ROW_SCORES[topIdx].toFixed(2)})`,
          -855,
          175,
          28,
          ROLE.ok,
          'mono',
          'left',
        ).opacity(out * alpha),
        lumBar(-855, 240, ROW_SCORES[topIdx] * 560, 28, ROLE.ok, {
          opacity: out * alpha,
          maxTrackW: 560,
        }),
      );
    }

    if (sw > 0.3) {
      nodes.push(
        txt('SILENT SWAP FAILURE', -855, 110, 28, ROLE.warn, 'mono', 'left')
          .glow(8, ROLE.warn)
          .opacity(sw * alpha),
        txt('Replacement gives ID 5 to ·soft', -855, 175, 30, COSMOS.ink, 'sans', 'left').opacity(
          sw * alpha,
        ),
        txt(
          'Lookup succeeds with zero crash, reading ·falls weights!',
          -855,
          240,
          28,
          ROLE.warn,
          'sans',
          'left',
        ).opacity(sw * alpha),
      );
    }

    nodes.push(
      txt(
        `3D glowing cage = Row ${r} selected from W_E`,
        350,
        420,
        28,
        ROLE.merge,
        'mono',
        'center',
      ).opacity(alpha),
    );
    return group(...nodes);
  });

  // View 2: Renumbering checklist (visual table-alignment tracks, zero bullet cards!)
  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const ren = showRenumber.value;
    const hsh = showHash.value;
    const nodes = [
      txt('VOCABULARY ALIGNMENT CHECK', -855, -210, 26, ROLE.piece, 'mono', 'left').opacity(alpha),
      txt(
        `A: ·soft=${IDS_A['·soft']}  ·falls=${IDS_A['·falls']}  ly=${IDS_A.ly}`,
        -855,
        -135,
        32,
        ROLE.piece,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        `B: ·soft=${IDS_B['·soft']}  ·falls=${IDS_B['·falls']}  ly=${IDS_B.ly}`,
        -855,
        -65,
        32,
        ROLE.warn,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    if (ren > 0.05) {
      nodes.push(
        txt(
          'SAFE RENUMBERING MOVES ALL FOUR TOGETHER:',
          -855,
          65,
          28,
          ROLE.merge,
          'mono',
          'left',
        ).opacity(ren * alpha),
        tokenPill('Input W_E', -725, 155, {
          w: 230,
          h: 70,
          color: ROLE.ok,
          size: 28,
          opacity: ren * alpha,
        }),
        tokenPill('Output W_out', -460, 155, {
          w: 240,
          h: 70,
          color: ROLE.ok,
          size: 28,
          opacity: ren * alpha,
        }),
        tokenPill('Special IDs', -190, 155, {
          w: 230,
          h: 70,
          color: ROLE.ok,
          size: 28,
          opacity: ren * alpha,
        }),
      );
    }

    if (hsh > 0.05) {
      nodes.push(
        txt('Pin model + tokenizer by hash', -855, 315, 32, ROLE.ok, 'serif', 'left')
          .glow(8, ROLE.ok)
          .opacity(hsh * alpha),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, slab3d, title, view1, view2);
  orbitScene(s, c, slab3d, { theta: -0.2, phi: 0.9 }, { startOffset: 0.15, endMargin: 0.5 });

  playCue(s, c, 'pick-five', (d) => s.play(activeRow.to(5, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'second', (d) => s.play(showOutput.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'scores', (d) => s.play(activeRow.to(4, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'swap', (d) => s.play(showSwapBug.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'wrong-row', (d) => s.play(activeRow.to(5, { duration: d })), { dur: 0.5 });

  playCue(s, c, 'size', (d) => s.play(swapVis(view1Vis, view2Vis, d)), { dur: 0.6 });
  playCue(s, c, 'renumber', (d) => s.play(showRenumber.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'hash', (d) => s.play(showHash.to(1, { duration: d })), { dur: 0.5 });
  bindCueBeat(s, c, s.value(0), [
    'table',
    'pick-two',
    'lives-in-row',
    'four-vectors',
    'tied',
    'separate',
    'nothing-crashes',
    'same-text',
    'different-ids',
    'special',
    'compare',
    'input-ok',
    'output-stale',
    'decode-wrong',
    'together',
    'ship',
    'differently',
  ]);
}
