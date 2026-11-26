// Scene 29: cached-chunk: Physical order [802, 800, 801]: logical-position mask vs future leak (0.538) vs restored (0.000).
import { dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cacheChunkInSlots,
  cinemaAura,
  cinemaStars,
  heroTitle,
  playAfter,
  playOn,
  txt,
} from '../parts.mjs';

const STORAGE = [2, 0, 1]; // Physical slots 0, 1, 2 hold logical keys 802, 800, 801!
const LOGICAL_LABELS = ['802', '800', '801'];
const MASKED = cacheChunkInSlots([1, 2], STORAGE, true);
const UNMASKED = cacheChunkInSlots([1, 2], STORAGE, false);

export default function cachedChunk(s, c) {
  const phase = s.value(0);
  // 0: reorder slots (withhold which slot q801 must hide!)
  // 1: build-mask / mask-first-row -> reveal slot 0 hidden for q801
  // 2: mask-next-row / compare-chunk -> q802 allows all 3, outputs match ref
  // 3: omit-mask / inspect-leak -> future leak 0.538!
  // 4: restore-mask -> back to 0.000!
  // 5: single-query -> only q802 remains

  const stars = cinemaStars(125, 29, ROLE.danger);
  const stageAura = cinemaAura(0, 20, 700, '#5ce1e61c', '#ff6b8b16');

  const title = heroTitle(['Three keys in', 'physical memory'], {
    x: -860,
    y: -435,
    size: 56,
    lineHeight: 64,
    accent: ROLE.query,
    eyebrow: 'PAGED SLOTS & LOGICAL CAUSAL MASKS',
  });

  const live = dynamic(() => {
    const p = phase.value;
    const unmasked = p >= 2.7 && p < 3.7;
    const singleOnly = p >= 4.6;
    const maskKnown = p >= 0.85;
    const data = unmasked ? UNMASKED : MASKED;

    const nodes = [];

    // Left: 2x3 Physical Slot Permission Grid (rows: q801, q802; cols: slot 0=802, slot 1=800, slot 2=801)
    const gLeft = -660;
    const gTop = -125;
    const cellW = 215;
    const cellH = 128;

    nodes.push(
      txt('Physical slots: [802, 800, 801]', gLeft, gTop - 92, 26, COSMOS.gold, 'mono', 'left'),
    );

    LOGICAL_LABELS.forEach((lbl, col) => {
      const cx = gLeft + col * cellW + cellW * 0.5;
      nodes.push(txt(`s${col}: k${lbl}`, cx, gTop - 32, 26, COSMOS.muted, 'mono'));
    });

    const qRows = [
      { qPos: 801, idx: 0, visible: !singleOnly },
      { qPos: 802, idx: 1, visible: true },
    ];

    qRows.forEach((qr, r) => {
      const cy = gTop + r * cellH + cellH * 0.5;
      const op = qr.visible ? 1 : 0.18;
      nodes.push(txt(`q${qr.qPos}`, gLeft - 72, cy, 28, ROLE.query, 'mono').opacity(op));
      for (let col = 0; col < 3; col++) {
        const cx = gLeft + col * cellW + cellW * 0.5;
        const allowed = data.permissions[r][col];
        const isFutureCell = r === 0 && col === 0; // q801 vs k802 in slot 0!
        let cellText = '?';
        let colStroke = '#465884';
        let fill = '#11182b';
        if (maskKnown) {
          if (isFutureCell && unmasked) {
            cellText = 'LEAK!';
            colStroke = ROLE.danger;
            fill = '#381224';
          } else if (allowed) {
            cellText = 'True ✓';
            colStroke = ROLE.score;
            fill = '#102a24';
          } else {
            cellText = 'False ×';
            colStroke = ROLE.danger;
            fill = '#2d1322';
          }
        }
        nodes.push(
          rect(cellW - 18, cellH - 18, {
            fill,
            stroke: colStroke,
            width: isFutureCell && maskKnown ? 3.2 : 2.0,
            radius: 12,
          })
            .at(cx, cy)
            .opacity(op),
          txt(cellText, cx, cy, 28, maskKnown ? colStroke : COSMOS.gold, 'mono').opacity(op),
        );
      }
    });

    // Right: Output weight carried by Value 802 vs Full-Pass Reference
    const rx = 115;
    const w801On802 = data.outputs[0][2];
    const w802On802 = data.outputs[1][2];
    const ref801 = MASKED.reference[0][2]; // 0.000
    const ref802 = MASKED.reference[1][2]; // 0.568

    nodes.push(
      txt('Weight on Value 802 (vs Full Ref)', rx, gTop - 92, 26, COSMOS.muted, 'mono', 'left'),
      // Row q801 readout
      rect(710, 110, {
        fill: unmasked ? '#311222' : '#101d2e',
        stroke: unmasked ? ROLE.danger : ROLE.score,
        width: 2.6,
        radius: 14,
      })
        .at(rx + 355, gTop + cellH * 0.5)
        .opacity(singleOnly ? 0.18 : 1),
      txt(
        maskKnown
          ? `q801 → v802:  ${w801On802.toFixed(3)}   (ref ${ref801.toFixed(3)})`
          : 'q801 → v802:  ?',
        rx + 355,
        gTop + cellH * 0.5,
        30,
        unmasked ? ROLE.danger : maskKnown ? ROLE.score : COSMOS.gold,
        'mono',
      )
        .opacity(singleOnly ? 0.18 : 1)
        .glow(unmasked ? 10 : 0, ROLE.danger),
      // Row q802 readout
      rect(710, 110, {
        fill: '#102424',
        stroke: ROLE.score,
        width: 2.6,
        radius: 14,
      }).at(rx + 355, gTop + cellH * 1.5),
      txt(
        maskKnown
          ? `q802 → v802:  ${w802On802.toFixed(3)}   (ref ${ref802.toFixed(3)})`
          : 'q802 → v802:  ?',
        rx + 355,
        gTop + cellH * 1.5,
        30,
        maskKnown ? ROLE.score : COSMOS.gold,
        'mono',
      ),
      line([-855, 250], [855, 250], { stroke: '#29375a', width: 1.6 }),
      txt(
        unmasked
          ? 'Mask omitted: q801 leaks 53.8% of its weight from future token 802!'
          : singleOnly
            ? 'Single query 802 sees only its prefix; multi-query chunks need logical-position masks'
            : 'Rule: allow slot j iff logical_pos(key[j]) ≤ logical_pos(query[i])',
        -855,
        320,
        28,
        unmasked ? ROLE.danger : ROLE.score,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(stars, stageAura, title, live);

  // Beat 0: keep slot 0 answer withheld!
  playOn(s, c, 'reorder-slots', (d) => phase.to(0.2, { duration: d }), 0.5);
  playOn(s, c, 'locate-future', (d) => phase.to(0.4, { duration: d }), 0.4);
  // Beat 1: reveal mask rule & slot 0 hidden for q801
  playOn(s, c, 'build-mask', (d) => phase.to(0.9, { duration: d }), 0.4);
  playAfter(s, c, 'mask-first-row', (d) => phase.to(1.2, { duration: d }), 0.4);
  playOn(s, c, 'mask-next-row', (d) => phase.to(1.6, { duration: d }), 0.4);
  playOn(s, c, 'compare-chunk', (d) => phase.to(2.0, { duration: d }), 0.4);
  // Beat 2: remove mask -> future leak 0.538!
  playOn(s, c, 'omit-mask', (d) => phase.to(3.0, { duration: d }), 0.45);
  playOn(s, c, 'inspect-leak', (d) => phase.to(3.3, { duration: d }), 0.4);
  // Beat 3: restore mask -> back to 0.000!
  playOn(s, c, 'restore-mask', (d) => phase.to(4.0, { duration: d }), 0.45);
  // Beat 4: single query 802 only
  playOn(s, c, 'single-query', (d) => phase.to(5.0, { duration: d }), 0.5);
}
