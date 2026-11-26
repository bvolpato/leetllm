import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  base,
  cinemaHeader,
  clampDur,
  fresh,
  guardedDynamic,
  metricReadout,
  txt,
} from '../parts.mjs';

export function buildFreshCursor(s, c) {
  s.add(aura(-460, -40, 560, ROLE.ed, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.ok, COSMOS.bg));

  s.add(
    cinemaHeader('CARET ROUND TRIP', 'Same column, unchanged text,', 'new request epoch', {
      x: -860,
      y: -445,
      accent: ROLE.ed,
      size: 46,
    }),
  );

  const move15 = s.value(0);
  const ret12 = s.value(0);
  const arrive = s.value(0);
  const deny = s.value(0);
  const req104 = s.value(0);
  const paint104 = s.value(0);
  const insert = s.value(0);

  c.on('cc-fresh-move15', () =>
    s.play(move15.to(1, { duration: clampDur(c, c.cue('cc-fresh-move15').start, 0.5) })),
  );
  c.on('cc-fresh-return12', () =>
    s.play(ret12.to(1, { duration: clampDur(c, c.cue('cc-fresh-return12').start, 0.5) })),
  );
  c.on('cursor-arrival', () =>
    s.play(arrive.to(1, { duration: clampDur(c, c.cue('cursor-arrival').start, 0.45) })),
  );
  // Strict prediction withholding: R101 drop withheld until cc-fresh-deny!
  c.after('cc-fresh-deny', () =>
    s.play(deny.to(1, { duration: clampDur(c, c.cue('cc-fresh-deny').end, 0.5) })),
  );
  c.on('cc-fresh-current-request', () =>
    s.play(req104.to(1, { duration: clampDur(c, c.cue('cc-fresh-current-request').start, 0.5) })),
  );
  c.on('cc-fresh-current-paint', () =>
    s.play(paint104.to(1, { duration: clampDur(c, c.cue('cc-fresh-current-paint').start, 0.5) })),
  );
  c.on('cursor-insert', () =>
    s.play(insert.to(1, { duration: clampDur(c, c.cue('cursor-insert').start, 0.5) })),
  );

  // Pre-verify fresh() model calls for both epochs
  const staleSnap = { ...base, epoch: 101 };
  const curSnap = { ...base, epoch: 103 };
  const isR101Fresh = fresh(staleSnap, curSnap); // false
  const isR104Fresh = fresh(curSnap, curSnap); // true

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const m15 = move15.value;
        const r12 = ret12.value;
        const ar = arrive.value;
        const dn = deny.value;
        const r4 = req104.value;
        const p4 = paint104.value;
        const ins = insert.value;
        const nodes = [];

        // Editor line strip
        const yEd = -140;
        nodes.push(
          rect(1680, 140, { fill: '#0b1224', stroke: '#2c3d66', width: 2.5, radius: 12 }).at(
            0,
            yEd,
          ),
        );
        nodes.push(
          txt(
            'BUFFER LINE 42  (TEXT UNCHANGED DURING MOVE)',
            -800,
            yEd - 42,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ),
        );

        const col12X = -500;
        const col15X = -382;
        const caretX = col12X + (col15X - col12X) * m15 * (1 - r12);

        if (ins > 0.5) {
          nodes.push(txt('return graph.', -800, yEd + 16, 36, COSMOS.ink, 'mono', 'left'));
          nodes.push(
            txt('allows(u, r)', col12X + 18, yEd + 16, 36, ROLE.ok, 'mono', 'left').glow(
              8,
              ROLE.ok,
            ),
          );
          nodes.push(txt('# check', col12X + 345, yEd + 16, 36, COSMOS.muted, 'mono', 'left'));
        } else if (p4 > 0.5) {
          nodes.push(txt('return graph.', -800, yEd + 16, 36, COSMOS.ink, 'mono', 'left'));
          nodes.push(
            txt('allows(u, r)', col12X + 18, yEd + 16, 36, ROLE.ed, 'mono', 'left').opacity(0.75),
          );
          nodes.push(txt('# check', col12X + 345, yEd + 16, 36, COSMOS.muted, 'mono', 'left'));
          nodes.push(
            line([col12X, yEd - 8], [col12X, yEd + 38], {
              stroke: ROLE.focus,
              width: 4,
            }).glow(8, ROLE.focus),
          );
        } else {
          nodes.push(txt('return graph.', -800, yEd + 16, 36, COSMOS.ink, 'mono', 'left'));
          nodes.push(txt('# check', -354, yEd + 16, 36, COSMOS.muted, 'mono', 'left'));
          nodes.push(
            line([caretX, yEd - 8], [caretX, yEd + 38], { stroke: ROLE.focus, width: 4 }).glow(
              8,
              ROLE.focus,
            ),
          );
        }

        // Live column & epoch indicator on right side of buffer
        const curCol = m15 > 0.5 && r12 < 0.5 ? 15 : 12;
        const curEpoch = r12 > 0.5 ? 103 : m15 > 0.5 ? 102 : 101;
        nodes.push(
          txt(
            `COL ${curCol}  |  EPOCH ${curEpoch}`,
            790,
            yEd + 16,
            30,
            ROLE.focus,
            'mono',
            'right',
          ),
        );

        // Two snapshot rows comparing incoming reply vs live editor state
        const yLive = 28;
        const yReply = 136;

        nodes.push(txt('LIVE EDITOR', -840, yLive, 26, ROLE.ed, 'mono', 'left'));
        nodes.push(
          txt(
            `doc=auth.py   ver=7   col=${curCol}   sel=${curCol}:${curCol}   epoch=${curEpoch}`,
            -560,
            yLive,
            28,
            COSMOS.ink,
            'mono',
            'left',
          ),
        );

        const showR104 = r4 > 0.5;
        const repLabel = showR104 ? 'FRESH R104' : 'LATE R101';
        const repEpoch = showR104 ? 103 : 101;
        const repCol = showR104 ? ROLE.ok : dn > 0.5 ? ROLE.fail : ROLE.warn;

        nodes.push(txt(repLabel, -840, yReply, 26, repCol, 'mono', 'left'));
        nodes.push(
          txt(
            `doc=auth.py   ver=7   col=12   sel=12:12   epoch=${repEpoch}`,
            -560,
            yReply,
            28,
            ar > 0.3 || showR104 ? repCol : COSMOS.muted,
            'mono',
            'left',
          ),
        );

        // Bottom verdict strip (strict prediction withholding before cc-fresh-deny!)
        nodes.push(line([-860, 232], [840, 232], { stroke: '#233152', width: 2 }));

        let statusTitle = 'IN-FLIGHT REQUEST';
        let statusVal = 'R101 WAITING (EPOCH 101)';
        let statusCol = COSMOS.muted;
        let subLine = 'CARET MOVES INCREMENT EPOCH WITHOUT CHANGING TEXT';

        if (ins > 0.5) {
          statusTitle = 'TAB ACCEPTED';
          statusVal = 'R104 INSERTED BEFORE COMMENT';
          statusCol = ROLE.ok;
          subLine = `fresh(R104, live) === ${String(isR104Fresh)}  |  ONLY FRESH REPLY APPEARS`;
        } else if (p4 > 0.5) {
          statusTitle = 'FRESH MATCH (EPOCH 103 == 103)';
          statusVal = 'PAINT R104 GHOST TEXT';
          statusCol = ROLE.ok;
          subLine = 'BOTH ROWS MATCH AT PAINT AND AT TAB';
        } else if (r4 > 0.5) {
          statusTitle = 'NEW REQUEST SENT';
          statusVal = 'R104 AT EPOCH 103';
          statusCol = ROLE.ed;
          subLine = 'REQUESTED FROM CURRENT CARET AT COLUMN 12';
        } else if (dn > 0.5) {
          statusTitle = `fresh(R101, live) === ${String(isR101Fresh)}`;
          statusVal = 'DROP R101  (101 != 103)';
          statusCol = ROLE.fail;
          subLine = 'RANGE MATCHED AGAIN, BUT EPOCH INVALIDATED ON MOVE OUT';
        } else if (ar > 0.5) {
          statusTitle = 'R101 ARRIVED AT COL 12';
          statusVal = 'CAN THE EDITOR SHOW IT?';
          statusCol = ROLE.focus;
          subLine = 'COMPARE ALL SNAPSHOT FIELDS INCLUDING EPOCH';
        }

        nodes.push(metricReadout(statusTitle, statusVal, 0, 344, { color: statusCol, size: 42 }));
        nodes.push(txt(subLine, 0, 448, 26, COSMOS.muted, 'mono', 'center'));

        return group(...nodes);
      },
    ),
  );
}
