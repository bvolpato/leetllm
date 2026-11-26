// Scene 12: debounce-history - Three keystrokes, one send
// Typing "r" (150ms canceled) -> "o" (150ms canceled) -> "." (0ms immediate send #3!),
// late reply #2 -> STRICT prediction pause -> #3 stays -> caret move & policy clear ghost (send log still 1!).
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function debounceHistory(s, c) {
  const phase = s.value(0);
  const sent3 = s.value(0);
  const late2 = s.value(0);
  const keep3 = s.value(0); // STRICT after deb-keep!
  const movePol = s.value(0);

  const header = cinemaHeader('DEBOUNCE & EPOCH MANAGER', 'Three keystrokes,', 'only one send', {
    x: -860,
    y: -445,
    accent: ROLE.warn,
    size: 46,
  });

  const bgAura = aura(40, 20, 680, '#f59e0b1a', '#6ee7b716');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const s3 = sent3.value;
      const l2 = late2.value;
      const k3 = keep3.value;
      const mp = movePol.value;
      const nodes = [];

      // 3 keystroke slots across top-mid (y = -115)
      const keys = [
        { x: -560, key: '1: "r"', note: '150ms -> CANCELED', col: COSMOS.dim },
        { x: 0, key: '2: "o"', note: '150ms -> CANCELED', col: COSMOS.dim },
        { x: 560, key: '3: "."', note: '0ms -> SENT (#3)!', col: ROLE.ok },
      ];
      keys.forEach((k, idx) => {
        const hi = idx === 2 && s3 > 0.4;
        nodes.push(
          rect(380, 64, { fill: '#0b1428', stroke: k.col, width: hi ? 3.5 : 2.5, radius: 10 })
            .at(k.x, -115)
            .glow(hi ? 9 : 0, k.col),
          txt(k.key, k.x, -115, 28, k.col, 'mono', 'center'),
          txt(k.note, k.x, -52, 26, hi ? ROLE.ok : COSMOS.muted, 'mono', 'center'),
        );
      });

      // Middle: Epoch Guard & Send Log (size = 1!)
      const midY = 65;
      nodes.push(
        line([-840, 4], [840, 4], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt('SEND LOG: [ req #3 ]  (COUNT = 1)', -820, midY, 28, ROLE.ed, 'mono', 'left'),
        txt(
          mp > 0.4
            ? 'CARET MOVE & POLICY CHANGE -> CLEAR GHOST & ADVANCE EPOCH (0 NEW SENDS!)'
            : k3 > 0.4
              ? 'EPOCH 3 DROPS LATE REPLY #2'
              : l2 > 0.4
                ? 'LATE REPLY #2 ARRIVES WHILE #3 IS VISIBLE -> WHICH STAYS?'
                : 'Zero-delay dot trigger fires request #3 immediately',
          -820,
          midY + 62,
          26,
          mp > 0.4 ? ROLE.warn : k3 > 0.4 ? ROLE.ok : ROLE.focus,
          'mono',
          'left',
        ),
      );

      // Bottom prediction prompt / server cancellation reality
      const botY = 265;
      nodes.push(line([-840, 200], [840, 200], { stroke: '#25355a', width: 2 }).opacity(0.65));
      if (l2 > 0.35 && k3 < 0.35) {
        nodes.push(
          txt(
            'Late reply #2 arrives with current doc snapshot. Which reply stays visible?',
            0,
            botY,
            32,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      } else {
        nodes.push(
          txt(
            'Server still needs cancel propagation, deadlines & max tokens; count GPU work already spent!',
            0,
            botY,
            26,
            COSMOS.muted,
            'mono',
            'center',
          ),
        );
      }

      nodes.push(
        txt('CLIENT DEBOUNCE', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('Saves 2 of 3 redundant sends', 480, -378, 26, ROLE.ok, 'mono', 'center'),
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.warn,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.4);

  c.on('deb-send', () => {
    s.play(sent3.to(1, { duration: clampDur(c, c.cue('deb-send').start, 0.35) }));
  });
  c.on('deb-late', () => {
    s.play(late2.to(1, { duration: clampDur(c, c.cue('deb-late').start, 0.35) }));
  });
  c.after('deb-keep', () => {
    s.play(keep3.to(1, { duration: clampDur(c, c.cue('deb-keep').end, 0.35) }));
  });
  c.on('deb-move', () => {
    s.play(movePol.to(1, { duration: clampDur(c, c.cue('deb-move').start, 0.4) }));
  });
}
