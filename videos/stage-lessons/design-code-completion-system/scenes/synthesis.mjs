import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  metricReadout,
  txt,
} from '../parts.mjs';

export function buildSynthesis(s, c) {
  s.add(aura(-460, -40, 560, ROLE.ed, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.focus, COSMOS.bg));

  s.add(
    cinemaHeader('CLOSING THE LOOP', 'What did pressing Tab', 'actually leave in the file?', {
      x: -860,
      y: -445,
      accent: ROLE.focus,
      size: 46,
    }),
  );

  const showT = s.value(0);
  const tabT = s.value(0);
  const undoT = s.value(0);
  const winT = s.value(0);
  const zeroT = s.value(0);

  c.on('close-show', () =>
    s.play(showT.to(1, { duration: clampDur(c, c.cue('close-show').start, 0.5) })),
  );
  c.on('close-tab', () =>
    s.play(tabT.to(1, { duration: clampDur(c, c.cue('close-tab').start, 0.5) })),
  );
  c.on('close-undo', () =>
    s.play(undoT.to(1, { duration: clampDur(c, c.cue('close-undo').start, 0.55) })),
  );
  c.on('close-window', () =>
    s.play(winT.to(1, { duration: clampDur(c, c.cue('close-window').start, 0.45) })),
  );
  // Strict prediction withholding: 0 retained revealed ONLY after close-zero!
  c.after('close-zero', () =>
    s.play(zeroT.to(1, { duration: clampDur(c, c.cue('close-zero').end, 0.5) })),
  );

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const sh = showT.value;
        const tb = tabT.value;
        const un = undoT.value;
        const wn = winT.value;
        const zr = zeroT.value;
        const nodes = [];

        // Live editor buffer strip
        const yEd = -105;
        nodes.push(
          rect(1680, 148, { fill: '#0b1224', stroke: '#2c3d66', width: 2.5, radius: 12 }).at(
            0,
            yEd,
          ),
        );
        nodes.push(txt('auth.py   line 42', -800, yEd - 44, 26, COSMOS.muted, 'mono', 'left'));

        // Developer's own code: "return graph."
        nodes.push(txt('return graph.', -800, yEd + 14, 40, COSMOS.ink, 'mono', 'left'));

        // Ghost / committed / undone suggestion span: "can_read(user,)" (15 chars)
        const sugX = -444;
        if (un < 0.5) {
          if (tb > 0.5) {
            nodes.push(
              txt('can_read(user,)', sugX, yEd + 14, 40, ROLE.ok, 'mono', 'left').glow(7, ROLE.ok),
            );
            // Caret at end of inserted span
            nodes.push(
              line([-58, yEd - 10], [-58, yEd + 38], { stroke: ROLE.focus, width: 4 }).glow(
                8,
                ROLE.focus,
              ),
            );
            nodes.push(
              txt('TAB COMMITTED (+15 CHARS)', 460, yEd + 14, 28, ROLE.ok, 'mono', 'center'),
            );
          } else if (sh > 0.3) {
            nodes.push(
              txt('can_read(user,)', sugX, yEd + 14, 40, COSMOS.muted, 'mono', 'left').opacity(
                0.65 * sh,
              ),
            );
            nodes.push(
              line([-468, yEd - 10], [-468, yEd + 38], { stroke: ROLE.focus, width: 4 }).glow(
                8,
                ROLE.focus,
              ),
            );
            nodes.push(txt('GRAY GHOST PAINTED', 460, yEd + 14, 28, ROLE.ed, 'mono', 'center'));
          } else {
            nodes.push(
              line([-468, yEd - 10], [-468, yEd + 38], { stroke: ROLE.focus, width: 4 }).glow(
                8,
                ROLE.focus,
              ),
            );
            nodes.push(
              txt('EDIT CLOCK RUNNING', 460, yEd + 14, 28, COSMOS.muted, 'mono', 'center'),
            );
          }
        } else {
          // Undone! Developer's "graph." remains, caret returns after the dot
          nodes.push(
            line([-468, yEd - 10], [-468, yEd + 38], { stroke: ROLE.focus, width: 4 }).glow(
              8,
              ROLE.focus,
            ),
          );
          nodes.push(txt('UNDO -> "graph." STAYS', 460, yEd + 14, 28, ROLE.warn, 'mono', 'center'));
        }

        // Timeline strip of events
        const yStep = 66;
        const steps = [
          { x: -640, t: '1. PAINT', done: sh > 0.5, col: ROLE.ed },
          { x: -210, t: '2. PRESS TAB', done: tb > 0.5, col: ROLE.ok },
          { x: 220, t: '3. UNDO INSERT', done: un > 0.5, col: ROLE.warn },
          { x: 640, t: '4. WINDOW ENDS', done: wn > 0.5, col: ROLE.focus },
        ];
        nodes.push(line([-640, yStep], [640, yStep], { stroke: '#233152', width: 3 }));
        steps.forEach((st) => {
          nodes.push(
            rect(260, 56, {
              fill: st.done ? '#101d36' : '#080e1c',
              stroke: st.done ? st.col : '#233152',
              width: st.done ? 3 : 2,
              radius: 8,
            }).at(st.x, yStep),
          );
          nodes.push(txt(st.t, st.x, yStep, 26, st.done ? st.col : COSMOS.muted, 'mono', 'center'));
        });

        // Bottom counters (strict prediction withholding on RETAINED!)
        nodes.push(line([-860, 168], [840, 168], { stroke: '#233152', width: 2 }));

        nodes.push(
          metricReadout('SHOWN', sh > 0.5 ? '1' : '0', -640, 290, { color: ROLE.ed, size: 52 }),
        );
        nodes.push(
          metricReadout('ACCEPTED IDs', tb > 0.5 ? '1' : '0', -210, 290, {
            color: ROLE.ok,
            size: 52,
          }),
        );
        nodes.push(
          metricReadout('INSERTED CHARS', tb > 0.5 ? '15' : '0', 220, 290, {
            color: ROLE.focus,
            size: 52,
          }),
        );

        let retVal = '---';
        let retCol = COSMOS.muted;
        if (zr > 0.5) {
          retVal = '0 / 15';
          retCol = ROLE.fail;
        } else if (wn > 0.5 || un > 0.5) {
          retVal = '? / 15';
          retCol = ROLE.focus;
        }
        nodes.push(metricReadout('RETAINED CHARS', retVal, 640, 290, { color: retCol, size: 52 }));

        if (zr > 0.5) {
          nodes.push(
            txt(
              'STILL COUNTS AS 1 ACCEPTED SUGGESTION  |  TEST POLICY BEHAVIOR SEPARATELY',
              0,
              442,
              26,
              ROLE.warn,
              'mono',
              'center',
            ).opacity(zr),
          );
        } else if (wn > 0.5) {
          nodes.push(
            txt(
              'HOW MANY OF THE 15 INSERTED CHARACTERS REMAIN?',
              0,
              442,
              28,
              ROLE.focus,
              'mono',
              'center',
            ).opacity(wn),
          );
        }

        return group(...nodes);
      },
    ),
  );
}
