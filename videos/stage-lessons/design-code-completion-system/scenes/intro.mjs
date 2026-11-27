// Scene 01: intro - Would you show this reply?
// Editor line with pasted "graph." (caret moved +6 cols!) while blue stale reply "graph.allows(req)"
// arrives for the old col -> STRICT prediction pause -> scratch line shows "graph.graph.allows(req)" -> DROP!
import { group, line } from 'vizmatic/stage';
import { COSMOS, ROLE, aura, cinemaHeader, clampDur, guardedDynamic, txt } from '../parts.mjs';

export default function intro(s, c) {
  const pasteOn = s.value(0);
  const joinOn = s.value(0);
  const dropReveal = s.value(0); // STRICT after intro-drop!

  const header = cinemaHeader('CODE COMPLETION FRESHNESS', 'Would you show', 'this reply?', {
    x: -860,
    y: -445,
    accent: ROLE.ed,
    size: 48,
  });

  const bgAura = aura(40, 20, 680, '#5ce1e61a', '#f43f5e16');

  const view = guardedDynamic(
    () => 1,
    () => {
      const ps = pasteOn.value;
      const jn = joinOn.value;
      const dr = dropReveal.value;
      const nodes = [];

      // Live Editor Buffer line
      const lx = -780;
      const edY = -110;
      nodes.push(
        txt('LIVE EDITOR BUFFER (scope.py)', lx, edY - 58, 26, ROLE.ed, 'mono', 'left'),
        txt(
          ps > 0.4 ? 'is_allowed = graph.|' : 'is_allowed = |',
          lx,
          edY + 4,
          34,
          COSMOS.ink,
          'mono',
          'left',
        ),
        txt(
          ps > 0.4 ? 'CARET ADVANCED +6 COLUMNS (PASTED "graph.")' : 'ORIGINAL EMPTY ASSIGNMENT',
          lx,
          edY + 62,
          26,
          ROLE.focus,
          'mono',
          'left',
        ),
      );

      // Arriving blue reply targeted at the OLD insertion column
      const pktY = 55;
      const pktCol = dr > 0.4 ? ROLE.fail : ROLE.gpu;
      nodes.push(
        line([-840, -10], [840, -10], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          'IN-FLIGHT REPLY (BUILT FOR OLD COLUMN BEFORE PASTE)',
          lx,
          pktY - 22,
          26,
          pktCol,
          'mono',
          'left',
        ),
        txt('payload: "graph.allows(request)"', lx, pktY + 34, 30, pktCol, 'mono', 'left').glow(
          7,
          pktCol,
        ),
      );

      // Scratch line test & Drop decision (STRICT withholding before intro-join / intro-drop!)
      const botY = 235;
      nodes.push(line([-840, 165], [840, 165], { stroke: '#25355a', width: 2 }).opacity(0.65));
      if (dr > 0.35) {
        nodes.push(
          txt(
            'SCRATCH LINE: "is_allowed = graph.graph.allows(request)"  ->  DROP REPLY!',
            0,
            botY,
            28,
            ROLE.fail,
            'mono',
            'center',
          ).glow(9, ROLE.fail),
          txt(
            'Editor needs ONLY the suffix after "graph." (or a fresh request at current caret)',
            0,
            botY + 56,
            26,
            ROLE.ok,
            'mono',
            'center',
          ),
        );
      } else if (jn > 0.35) {
        nodes.push(
          txt(
            'SCRATCH LINE: "is_allowed = graph.graph.allows(request)"  (DUPLICATE "graph."!)',
            0,
            botY,
            28,
            ROLE.warn,
            'mono',
            'center',
          ),
        );
      } else {
        nodes.push(
          txt(
            'Caret moved +6 columns while model ran. Would you paint this reply at the caret?',
            0,
            botY,
            32,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      }

      nodes.push(
        txt('STALE SNAPSHOT TRAP', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('Old column != live yellow caret', 480, -378, 26, COSMOS.muted, 'mono', 'center'),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('intro-paste', () => {
    s.play(pasteOn.to(1, { duration: clampDur(c, c.cue('intro-paste').start, 0.35) }));
  });
  c.on('intro-join', () => {
    s.play(joinOn.to(1, { duration: clampDur(c, c.cue('intro-join').start, 0.35) }));
  });
  c.after('intro-drop', () => {
    s.play(dropReveal.to(1, { duration: clampDur(c, c.cue('intro-drop').end, 0.4) }));
  });
}
