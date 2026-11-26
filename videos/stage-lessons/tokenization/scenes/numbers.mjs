// Scene 17: numbers: Three ways to split 1234567 & 1234568 (learned merges vs single digits vs 1-3 digit groups).
import {
  COSMOS,
  DIGITS,
  GROUPS,
  LEARNED_CUTS,
  NUMBER,
  NUMBER_B,
  ROLE,
  aura,
  bindCueBeat,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function numbers(s, c) {
  const showLearned = s.value(1);
  const showSingle = s.value(0);
  const showGroups = s.value(0);
  const focusLast = s.value(0);

  const bgAura = aura(0, 0, 740, '#17365a26', '#2b1c5418');
  const title = heroTitle(['Numbers:', 'column alignment breaks'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: ROLE.merge,
  });

  const groupsB = NUMBER_B.match(/\d{1,3}/g);
  const stageVis = s.value(1);

  const layer = guardedDynamic(stageVis, (alpha) => {
    const lrn = showLearned.value;
    const sng = showSingle.value;
    const grp = showGroups.value;
    const last = focusLast.value;
    const nodes = [];

    // Row 1: Learned BPE merges cut 1234567 vs 1234568 inconsistently
    if (lrn > 0.05) {
      nodes.push(
        txt('LEARNED BPE MERGES (ILLUSTRATIVE)', -855, -225, 26, ROLE.warn, 'mono', 'left').opacity(
          alpha,
        ),
      );
      [
        { num: NUMBER, cuts: LEARNED_CUTS[0], y: -150 },
        { num: NUMBER_B, cuts: LEARNED_CUTS[1], y: -65 },
      ].forEach((row) => {
        nodes.push(txt(row.num, -855, row.y, 30, COSMOS.muted, 'mono', 'left').opacity(alpha));
        let cx = -610;
        row.cuts.forEach((piece) => {
          const w = piece.length * 38 + 44;
          nodes.push(
            tokenPill(piece, cx + w * 0.5, row.y, {
              w,
              h: 62,
              color: ROLE.warn,
              size: 32,
              opacity: alpha,
            }),
          );
          cx += w + 18;
        });
      });
    }

    // Row 2: Single-digit split (quiet from t=0, illuminates on single cue)
    const aSng = (0.45 + 0.55 * sng) * alpha;
    nodes.push(
      txt('SINGLE-DIGIT SPLIT (7 TOKENS)', -855, 55, 26, ROLE.piece, 'mono', 'left').opacity(aSng),
    );
    DIGITS.forEach((d, idx) => {
      nodes.push(
        tokenPill(d, -795 + idx * 105, 130, {
          w: 84,
          h: 66,
          color: ROLE.piece,
          size: 34,
          opacity: aSng,
        }),
      );
    });
    nodes.push(
      txt('Every decimal place stays aligned', 50, 130, 28, ROLE.piece, 'sans', 'left').opacity(
        aSng,
      ),
    );

    // Row 3: Left-to-right 1-3 digit groups (quiet from t=0, illuminates on groups cue)
    const aGrp = (0.45 + 0.55 * grp) * alpha;
    nodes.push(
      txt('UP TO 3 DIGITS FROM LEFT  (\\d{1,3})', -855, 240, 26, ROLE.ok, 'mono', 'left').opacity(
        aGrp,
      ),
    );
    [
      { cuts: GROUPS, y: 315 },
      { cuts: groupsB, y: 392 },
    ].forEach((row) => {
      let cx = -855;
      row.cuts.forEach((piece, idx) => {
        const isLast = idx === row.cuts.length - 1;
        const w = piece.length * 38 + 46;
        const col = isLast && last > 0.3 ? ROLE.merge : ROLE.ok;
        nodes.push(
          tokenPill(piece, cx + w * 0.5, row.y, {
            w,
            h: 62,
            color: col,
            size: 32,
            glow: isLast && last > 0.3 ? 12 : 6,
            opacity: aGrp,
          }),
        );
        cx += w + 18;
      });
    });
    if (last > 0.2) {
      nodes.push(
        txt(
          'Last digits "7" and "8" stand alone; check the actual regex',
          -210,
          355,
          28,
          ROLE.merge,
          'sans',
          'left',
        )
          .glow(6, ROLE.merge)
          .opacity(last * alpha),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'single', (d) => s.play(showSingle.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'groups', (d) => s.play(showGroups.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'neither', (d) => s.play(focusLast.to(1, { duration: d })), { dur: 0.45 });
  bindCueBeat(s, c, s.value(0), ['visible', 'learned', 'differ', 'columns', 'read']);
}
