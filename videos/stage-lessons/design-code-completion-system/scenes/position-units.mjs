// Scene 05: position-units - Convert the caret before constructing the suffix
// Aligning "a😀b" across 3 coordinate systems: Python code points (2), UTF-16 units (3), UTF-8 bytes (5)!
import { group, line, rect } from 'vizmatic/stage';
import { COSMOS, ROLE, aura, cinemaHeader, clampDur, guardedDynamic, txt } from '../parts.mjs';

export default function positionUnits(s, c) {
  const unitsOn = s.value(0);
  const convertOn = s.value(0);

  const header = cinemaHeader(
    'ENCODING COORDINATE UNITS',
    'Convert the caret',
    'before slicing suffix',
    {
      x: -860,
      y: -445,
      accent: ROLE.warn,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#f59e0b1a', '#5ce1e618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const un = unitsOn.value;
      const cv = convertOn.value;
      const nodes = [];

      // 3 aligned unit rulers for string: "a" + U+1F600 + "b"
      const x0 = -500;
      const rows = [
        {
          label: 'PYTHON CODE PTS',
          cells: [
            { t: '0: "a"', w: 210, col: ROLE.ed },
            { t: '1: U+1F600', w: 460, col: ROLE.focus },
            { t: '2: "b"', w: 210, col: ROLE.ok },
          ],
          caretIdx: 'idx = 2 -> suffix "b"',
          y: -140,
        },
        {
          label: 'VS CODE UTF-16',
          cells: [
            { t: '0: "a"', w: 210, col: ROLE.ed },
            { t: '1..2: surrogate (2 units)', w: 460, col: ROLE.warn },
            { t: '3: "b"', w: 210, col: ROLE.ok },
          ],
          caretIdx: 'unit = 3  (if raw -> drops "b"!)',
          y: -20,
        },
        {
          label: 'UTF-8 BYTES',
          cells: [
            { t: '0: "a"', w: 210, col: ROLE.ed },
            { t: '1..4: 4 UTF-8 bytes', w: 460, col: ROLE.fail },
            { t: '5: "b"', w: 210, col: ROLE.ok },
          ],
          caretIdx: 'byte = 5  (byte 3 splits emoji!)',
          y: 100,
        },
      ];

      rows.forEach((r, idx) => {
        const alpha = idx === 0 ? 1 : 0.45 + un * 0.55;
        nodes.push(txt(r.label, -840, r.y, 26, COSMOS.ink, 'mono', 'left').opacity(alpha));
        let cx = x0;
        r.cells.forEach((cl) => {
          nodes.push(
            rect(cl.w - 8, 48, { fill: '#0b1428', stroke: cl.col, width: 2.8, radius: 6 })
              .at(cx + cl.w * 0.5, r.y)
              .opacity(alpha),
            txt(cl.t, cx + cl.w * 0.5, r.y, 26, cl.col, 'mono', 'center').opacity(alpha),
          );
          cx += cl.w;
        });
        nodes.push(
          txt(
            r.caretIdx,
            cx + 26,
            r.y,
            26,
            idx === 0 ? ROLE.ok : ROLE.warn,
            'mono',
            'left',
          ).opacity(alpha),
        );
      });

      // Vertical caret line cleanly between U+1F600 and "b" (x = x0 + 670 = 170)
      const xCaret = x0 + 670;
      nodes.push(
        line([xCaret, -195], [xCaret, 155], { stroke: ROLE.focus, width: 4, dash: [8, 6] }).glow(
          9,
          ROLE.focus,
        ),
        txt('SAME CARET', xCaret, -225, 26, ROLE.focus, 'mono', 'center'),
        txt('VS CODE UTF-16 API', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('positionAt() / offsetAt() use UTF-16', 480, -378, 26, COSMOS.muted, 'mono', 'center'),
        line([-840, 210], [840, 210], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          cv > 0.4
            ? 'CONVERT 3 UTF-16 UNITS -> 2 CODE POINTS -> SUFFIX PRESERVES "b"!'
            : 'One visible character can occupy 1 code point, 2 UTF-16 units, and 4 UTF-8 bytes',
          0,
          285,
          28,
          cv > 0.4 ? ROLE.ok : COSMOS.muted,
          'mono',
          'center',
        ).glow(cv > 0.4 ? 8 : 0, ROLE.ok),
        txt(
          'Always verify converted range against current document version (edits, undo & redo advance it)',
          0,
          342,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('cc-position-three-five', () => {
    s.play(unitsOn.to(1, { duration: clampDur(c, c.cue('cc-position-three-five').start, 0.35) }));
  });
  c.on('cc-position-units-1', () => {
    s.play(convertOn.to(1, { duration: clampDur(c, c.cue('cc-position-units-1').start, 0.4) }));
  });
}
