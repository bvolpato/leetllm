// Scene 05: Where does the read stop? 9 keys in memory, 4 new queries q0..q3 under k5..k8, causal brackets.
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainAfter,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function causal(s, c) {
  const phase = s.value(0);
  const queryFocus = s.value(0); // 0=q0, 1=q1, 2=q2, 3=q3
  const revealStop = s.value(0); // 0 while asking question for q0; 1 once causal-stop revealed
  const showReadCount = s.value(0);

  const bgAura = aura(0, 20, 660, '#ffd1661a', '#5ce1e61a');

  const title = heroTitle(['Where Does', 'the Read Stop?'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.gold,
    eyebrow: 'CHUNKED PREFILL · CAUSAL HORIZON',
    subtitle: '5 prefix keys + 4 newly appended keys sit together in R2 cache',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const qRow = Math.round(queryFocus.value);
    const rev = revealStop.value;
    const cnt = showReadCount.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const stopKey = 5 + qRow; // 5, 6, 7, 8
    const readableCount = stopKey + 1; // 6, 7, 8, 9

    const nodes = [
      // Page header brackets above the 9 keys (Page 3: k0..3, Page 14: k4..7, Page 6: k8)
      txt('Page 3 (k0..k3)', -505, -162, 26, ROLE.r0, 'mono'),
      txt('Page 14 (k4..k7)', 235, -162, 26, ROLE.r2, 'mono'),
      txt('Page 6', 775, -162, 26, ROLE.r1, 'mono'),
    ];

    // 9 key cells across the canvas with slight page gaps
    const keyX = (j) => {
      const pageIdx = Math.floor(j / 4);
      return -760 + j * 176 + pageIdx * 36;
    };

    for (let j = 0; j < 9; j++) {
      const cx = keyX(j);
      const isPrefix = j < 5;
      const isAllowed = rev > 0.5 && j <= stopKey;
      const isFuture = rev > 0.5 && j > stopKey;
      const isStop = rev > 0.5 && j === stopKey;

      const stroke = isStop
        ? COSMOS.gold
        : isAllowed
          ? ROLE.good
          : isFuture
            ? ROLE.bad
            : isPrefix
              ? ROLE.r0
              : ROLE.r2;
      const fill = isStop ? '#2c2210' : isAllowed ? '#0f2824' : isFuture ? '#24111c' : '#0f1b33';

      nodes.push(
        glassCell(cx, -80, 152, 94, stroke, {
          fill,
          glow: isStop ? 12 * pulse : isAllowed ? 6 : 3,
          opacity: isFuture ? 0.45 : 0.96,
          dash: isFuture ? [8, 6] : undefined,
        }),
        txt(`k${j}`, cx, -98, 32, isStop ? COSMOS.gold : isFuture ? ROLE.bad : COSMOS.ink, 'mono'),
        txt(
          isFuture ? 'future' : isPrefix ? 'prefix' : 'new',
          cx,
          -58,
          26,
          isFuture ? ROLE.bad : COSMOS.muted,
          'sans',
        ),
      );
    }

    // 4 query markers underneath k5..k8
    for (let i = 0; i < 4; i++) {
      const cx = keyX(5 + i);
      const isSel = i === qRow;
      const stroke = isSel ? COSMOS.gold : COSMOS.dim;
      nodes.push(
        glassCell(cx, 110, 152, 82, stroke, {
          fill: isSel ? '#2d2310' : '#0c1324',
          glow: isSel ? 12 * pulse : 0,
        }),
        txt(`q${i}`, cx, 110, 32, isSel ? COSMOS.gold : COSMOS.muted, 'mono'),
      );
    }

    // Readable range bracket between keys and queries (strictly withheld until revealStop!)
    if (rev > 0.5) {
      const bLeft = keyX(0) - 72;
      const bRight = keyX(stopKey) + 72;
      const bMid = (bLeft + bRight) * 0.5;
      nodes.push(
        line([bLeft, -10], [bLeft, 12], { stroke: ROLE.good, width: 3.5 }),
        line([bLeft, 12], [bRight, 12], { stroke: ROLE.good, width: 3.8 }).glow(7, ROLE.good),
        line([bRight, 12], [bRight, -10], { stroke: ROLE.good, width: 3.5 }),
        txt(
          cnt > 0.5
            ? `q${qRow} reads k0..k${stopKey} (${readableCount} keys)`
            : `q${qRow} stops at k${stopKey}`,
          bMid,
          44,
          28,
          ROLE.good,
          'mono',
        ),
      );
    }

    // Bottom readout
    let bottomText = 'Yellow q0 sits under k5: which key is the last one it may read?';
    let bottomCol = COSMOS.gold;
    if (rev > 0.5 && qRow === 0) {
      bottomText =
        cnt > 0.5
          ? 'q0 reads 6 keys (k0..k5); keys k6, k7, k8 are in its future'
          : 'q0 stops at its own key, k5';
      bottomCol = ROLE.good;
    } else if (qRow === 1) {
      bottomText = 'q1 moves right by 1 -> gains k6 (7 readable keys)';
      bottomCol = ROLE.r2;
    } else if (qRow === 2) {
      bottomText = 'q2 moves right by 1 -> gains k7 (8 readable keys)';
      bottomCol = ROLE.r2;
    } else if (qRow === 3) {
      bottomText = 'Only q3 crosses onto Page 6 and reads k8 (all 9 keys)';
      bottomCol = COSMOS.gold;
    }

    nodes.push(
      glassCell(0, 325, 1520, 108, bottomCol, { fill: '#0e172a', glow: 8 }),
      txt(bottomText, 0, 325, 30, bottomCol, 'mono').glow(5, bottomCol),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('causal-query', () =>
    s.play(queryFocus.to(0, { duration: remainDuration(c, 'causal-query', 0.35) })),
  );
  c.after('causal-stop', () =>
    s.play(revealStop.to(1, { duration: remainAfter(c, 'causal-stop', 0.4) })),
  );
  c.after('causal-read', () =>
    s.play(showReadCount.to(1, { duration: remainAfter(c, 'causal-read', 0.4) })),
  );
  c.on('causal-one', () =>
    s.play(queryFocus.to(1, { duration: remainDuration(c, 'causal-one', 0.4) })),
  );
  c.on('causal-two', () =>
    s.play(queryFocus.to(2, { duration: remainDuration(c, 'causal-two', 0.4) })),
  );
  c.on('causal-three', () =>
    s.play(queryFocus.to(3, { duration: remainDuration(c, 'causal-three', 0.4) })),
  );
}
