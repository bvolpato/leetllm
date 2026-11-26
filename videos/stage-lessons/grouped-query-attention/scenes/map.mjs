// Scene 03: map - Integer division routes any query head index to its shared KV group.
import {
  COSMOS,
  HEADS,
  ROLE,
  cinemaAtmosphere,
  glowDot,
  glowTex,
  glowingArc,
  group,
  groupSize,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  range,
  renderGqaRack2d,
  rule,
  runPhase,
  txt,
} from '../parts.mjs';

export default function map(s, c) {
  const G = groupSize(HEADS.queries, HEADS.gqaKV);
  const phase = s.value(0);
  const lit = s.value(-1);
  const showDiv = s.value(0);
  const span0 = s.value(0);
  const span1 = s.value(0);
  const pick5 = s.value(0);
  const showOwner = s.value(0);
  const showOut = s.value(0);

  const title = heroTitle(['Follow a query to', 'its stored group'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.query,
    eyebrow: 'INTEGER DIVISION · ROUTING RULE',
  });

  const eq = glowTex(String.raw`\text{group} = \left\lfloor \frac{\text{index}}{G} \right\rfloor`, {
    x: 410,
    y: -245,
    size: 48,
    color: ROLE.gold,
    glow: 8,
  });

  const live = guardedDynamic(1, () => {
    const div = showDiv.value;
    const s0 = span0.value;
    const s1 = span1.value;
    const p5 = pick5.value;
    const own = showOwner.value;
    const out = showOut.value;

    const nodes = [
      ...renderGqaRack2d({
        left: -855,
        top: -215,
        width: 710,
        height: 550,
        mode: 1,
        tokens: 2,
        slots: 4,
        lit: lit.value,
        cursor: -1,
        phase: phase.value,
        colNames: ['Rain', 'fell', '2', '3'],
      }),
      rule(-85, -310, -85, 405, COSMOS.rule, 1.6).opacity(0.6),
    ];

    // Group size formula readout
    nodes.push(
      txt(
        div > 0.5
          ? `G = ${HEADS.queries} / ${HEADS.gqaKV} = ${G} queries per KV head`
          : 'G = query heads / KV heads',
        410,
        -115,
        30,
        div > 0.5 ? ROLE.gold : COSMOS.muted,
        'mono',
        'center',
      ).glow(div > 0.5 ? 6 : 0, ROLE.gold),
    );

    // Interactive 8-slot Query Index Rail (0..7)
    const railLeft = 35;
    const railW = 750;
    const cellW = 78;
    const pitch = railW / HEADS.queries;
    const railY = 30;

    nodes.push(txt('QUERY HEAD INDEX', 410, -38, 26, COSMOS.muted, 'mono', 'center'));

    for (const i of range(HEADS.queries)) {
      const cx = railLeft + (i + 0.5) * pitch;
      const isFive = i === 5 && p5 > 0.5;
      const inG0 = i < 4 && s0 > 0.5;
      const inG1 = i >= 4 && s1 > 0.5;
      const col = isFive ? ROLE.gold : inG0 ? ROLE.key : inG1 ? ROLE.query : COSMOS.muted;
      nodes.push(
        lumBar(cx, railY, cellW, 68, {
          color: col,
          fillOpacity: isFive ? 0.38 : inG0 || inG1 ? 0.22 : 0.1,
          strokeWidth: isFive ? 3.2 : 2,
          glow: isFive ? 12 : inG0 || inG1 ? 6 : 2,
          radius: 10,
        }),
        txt(String(i), cx, railY, 34, isFive ? COSMOS.ink : col, 'mono', 'center'),
      );
    }

    // Group 0 bracket arc (0..3 -> KV0)
    if (s0 > 0.02) {
      const x0 = railLeft + 0.5 * pitch;
      const x3 = railLeft + 3.5 * pitch;
      nodes.push(
        glowingArc([x0, railY + 48], [x3, railY + 48], 52, {
          color: ROLE.key,
          width: 3.4,
          glow: 8,
          opacity: s0,
        }),
        glowDot((x0 + x3) / 2, railY + 74, { radius: 5, color: ROLE.key, opacity: s0 }),
        txt('KV0  (Q0–Q3)', (x0 + x3) / 2, railY + 114, 28, ROLE.key, 'mono', 'center').opacity(s0),
      );
    }

    // Group 1 bracket arc (4..7 -> KV1)
    if (s1 > 0.02) {
      const x4 = railLeft + 4.5 * pitch;
      const x7 = railLeft + 7.5 * pitch;
      const col = own > 0.5 ? ROLE.gold : ROLE.query;
      nodes.push(
        glowingArc([x4, railY + 48], [x7, railY + 48], 52, {
          color: col,
          width: own > 0.5 ? 4.2 : 3.4,
          glow: own > 0.5 ? 11 : 8,
          opacity: s1,
        }),
        glowDot((x4 + x7) / 2, railY + 74, { radius: 5, color: col, opacity: s1 }),
        txt('KV1  (Q4–Q7)', (x4 + x7) / 2, railY + 114, 28, col, 'mono', 'center').opacity(s1),
      );
    }

    // Prediction & reveal readout for Query 5 (strictly withheld until c.after('owner')!)
    if (own > 0.02) {
      nodes.push(
        txt('⌊5 / 4⌋ = 1   →   Group KV1', 410, 265, 40, ROLE.gold, 'mono', 'center')
          .glow(9, ROLE.gold)
          .opacity(own),
      );
    } else if (p5 > 0.02) {
      nodes.push(
        txt('Query 5:  ⌊5 / 4⌋ = ?', 410, 265, 40, ROLE.gold, 'mono', 'center')
          .glow(7, ROLE.gold)
          .opacity(p5),
      );
    }

    if (out > 0.02) {
      nodes.push(
        txt(
          'Q5 uses KV1 and builds its own output',
          410,
          345,
          28,
          ROLE.query,
          'sans',
          'center',
        ).opacity(out),
      );
    }

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.query, ROLE.key), title, eq, live);
  runPhase(s, c, phase, 12);

  playCue(s, c, 'divide', (d) => s.play(showDiv.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'first', (d) => s.play(span0.to(1, { duration: d }), lit.to(3, { duration: d })), {
    dur: 0.55,
  });
  playCue(s, c, 'second', (d) => s.play(span1.to(1, { duration: d }), lit.to(7, { duration: d })), {
    dur: 0.55,
  });
  playCue(s, c, 'pick', (d) => s.play(pick5.to(1, { duration: d }), lit.to(5, { duration: d })), {
    dur: 0.5,
  });
  playCue(s, c, 'owner', (d) => s.play(showOwner.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'out', (d) => s.play(showOut.to(1, { duration: d })), { dur: 0.45 });
}
