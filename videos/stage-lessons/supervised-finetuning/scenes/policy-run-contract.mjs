// Scene 01: Would you train on this reply?: Key age past 14-day cutoff, draft vs approved reply, SFT intervention.
import {
  COSMOS,
  aura,
  circle,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

const CUTOFF_DAY = 14;
const TARGET_DAY = 18;
const X_LEFT = -760;
const X_RIGHT = 760;
const mapDay = (d) => X_LEFT + ((d - 10) / (22 - 10)) * (X_RIGHT - X_LEFT);

export default function policyRunContract(s, c) {
  const phase = s.value(0);
  const keyDay = s.value(12);
  const showDraft = s.value(0);
  const approved = s.value(0);
  const showCompare = s.value(0);

  const bgAura = aura(0, -40, 620, '#5ce1e622', '#ffd16614');
  const title = heroTitle(['Would You Train', 'on This Reply?'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'SUPERVISED FINE-TUNING · DEMONSTRATION AUDIT',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const day = keyDay.value;
    const dr = showDraft.value;
    const acc = approved.value;
    const cmp = showCompare.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.4);

    const railY = -125;
    const cutX = mapDay(CUTOFF_DAY);
    const curX = mapDay(day);
    const pastCutoff = day > CUTOFF_DAY + 0.05;
    const keyCol = acc > 0.5 ? COSMOS.emerald : pastCutoff ? COSMOS.gold : COSMOS.cyan;

    const nodes = [
      // Luminous key-age timeline
      txt('SERVICE KEY AGE TIMELINE', 855, -395, 26, COSMOS.muted, 'mono', 'right'),
      line([X_LEFT, railY], [cutX, railY], { stroke: '#3e527a', width: 5 }),
      line([cutX, railY], [X_RIGHT, railY], { stroke: COSMOS.gold, width: 7 }).glow(
        8 * pulse,
        COSMOS.gold,
      ),
      // Cutoff vertical beacon
      line([cutX, railY - 42], [cutX, railY + 42], { stroke: COSMOS.gold, width: 3.5 }).glow(
        6,
        COSMOS.gold,
      ),
      txt('14-DAY THRESHOLD', cutX, railY + 86, 26, COSMOS.gold, 'mono'),
      txt('ROTATION TICKET REQUIRED →', 380, railY + 86, 26, COSMOS.gold, 'mono'),
      // Scale ticks
      ...[10, 12, 16, 18, 20, 22].map((d) =>
        group(
          line([mapDay(d), railY - 12], [mapDay(d), railY + 12], {
            stroke: d > CUTOFF_DAY ? COSMOS.gold : COSMOS.dim,
            width: 2,
          }),
          txt(
            `${d}d`,
            mapDay(d),
            railY + 38,
            26,
            d === 18 && pastCutoff ? keyCol : COSMOS.dim,
            'mono',
          ),
        ),
      ),
      // Glowing stylized key silhouette sliding along rail
      circle(26, { fill: '#0b1426', stroke: keyCol, width: 5 })
        .at(curX, railY - 82)
        .glow(9, keyCol),
      line([curX + 26, railY - 82], [curX + 94, railY - 82], { stroke: keyCol, width: 6 }).glow(
        7,
        keyCol,
      ),
      line([curX + 68, railY - 82], [curX + 68, railY - 64], { stroke: keyCol, width: 5 }),
      line([curX + 88, railY - 82], [curX + 88, railY - 58], { stroke: keyCol, width: 5 }),
      line([curX, railY - 52], [curX, railY], { stroke: keyCol, width: 3 }),
      glowDot(curX, railY, { radius: 10, color: keyCol }),
      txt(`${Math.round(day)} days`, curX, railY - 134, 34, keyCol, 'mono').glow(7, keyCol),
    ];

    // Proposed vs Approved reply showcase
    const replyCol = acc > 0.5 ? COSMOS.emerald : dr > 0.3 ? COSMOS.amber : COSMOS.blue;
    const replyFill = acc > 0.5 ? '#0c2524' : '#171422';
    const replyTag = acc > 0.5 ? 'APPROVED DEMONSTRATION TARGET' : 'PROPOSED ASSISTANT REPLY';
    const replyQuote =
      acc > 0.5
        ? '“Open a rotation ticket for security review.”'
        : '“Rotation can wait until next month.”';

    nodes.push(
      txt(replyTag, -855, 16, 26, replyCol, 'mono', 'left'),
      glassCell(0, 118, 1710, 134, replyCol, {
        fill: replyFill,
        glow: 10 * pulse,
        width: 2.8,
      }),
      txt(replyQuote, 0, 118, 44, acc > 0.5 ? COSMOS.emerald : COSMOS.ink, 'serif').glow(
        6,
        replyCol,
      ),
    );

    // Subtle status or 3-path intervention comparison along the bottom
    if (cmp > 0.05) {
      const stages = [
        { label: '1 · PROMPT RULE', x: -570, col: COSMOS.blue },
        { label: '2 · RETRIEVAL', x: 0, col: COSMOS.cyan },
        { label: '3 · SFT TOKEN-BY-TOKEN', x: 570, col: COSMOS.emerald },
      ];
      stages.forEach((st) => {
        nodes.push(
          glassCell(st.x, 305, 480, 88, st.col, { fill: '#0e1729', glow: 8, opacity: cmp }),
          txt(st.label, st.x, 305, 28, st.col, 'mono').opacity(cmp),
        );
      });
      nodes.push(
        glowingArc([-320, 305], [-250, 305], -16, { color: COSMOS.cyan, width: 3, opacity: cmp }),
        glowingArc([250, 305], [320, 305], -16, { color: COSMOS.emerald, width: 3, opacity: cmp }),
        txt(
          'Inspect split, labels, and checkpoint before sweeping the learning rate',
          0,
          412,
          28,
          COSMOS.muted,
          'sans',
        ).opacity(cmp),
      );
    } else if (acc > 0.5) {
      nodes.push(
        txt(
          'Security decides whether access continues  ·  Model learns to request review',
          0,
          288,
          30,
          COSMOS.emerald,
          'sans',
        ).opacity(acc),
      );
    } else {
      nodes.push(
        rect(1080, 74, { fill: '#14172a', stroke: COSMOS.gold, width: 2, radius: 10 })
          .at(0, 296)
          .opacity(Math.max(0.25, dr)),
        txt(
          'Key is past 14 days: would you train on this reply?',
          0,
          296,
          28,
          COSMOS.gold,
          'sans',
        ).opacity(Math.max(0.25, dr)),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.at(0.15, () => s.play(keyDay.to(CUTOFF_DAY, { duration: 0.7 })));
  c.on('key-age', () => s.play(keyDay.to(TARGET_DAY, { duration: 0.8 })));
  c.on('wait-proposal', () => s.play(showDraft.to(1, { duration: 0.45 })));
  c.on('replace-reply', () =>
    s.play(approved.to(1, { duration: remainDuration(c, 'replace-reply', 0.55) })),
  );
  c.on('compare-interventions', () =>
    s.play(showCompare.to(1, { duration: remainDuration(c, 'compare-interventions', 0.55) })),
  );
}
