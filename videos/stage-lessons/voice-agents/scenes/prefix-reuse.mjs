// Scene 24: prefix-reuse - Create a reusable endpoint after stable content
// Prompt block layout (Policy + Tools + Committed History + Dynamic State) contrasting
// implicit full-request cache miss (Req A -> Req B) vs explicit breakpoint reuse!
import { group, line, rect } from 'vizmatic/stage';
import { COSMOS, ROLE, aura, cinemaHeader, clampDur, guardedDynamic, txt } from '../parts.mjs';

export default function prefixReuse(s, c) {
  const dynamicOn = s.value(0);
  const missOn = s.value(0);
  const breakOn = s.value(0);
  const pathOn = s.value(0);

  const header = cinemaHeader('PROMPT PREFIX CACHING', 'Create a reusable', 'stable endpoint', {
    x: -860,
    y: -445,
    accent: ROLE.ok,
    size: 46,
  });

  const bgAura = aura(40, 20, 680, '#6ee7b71a', '#5ce1e618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const dn = dynamicOn.value;
      const ms = missOn.value;
      const br = breakOn.value;
      const pt = pathOn.value;
      const nodes = [];

      // Canonical prompt order blocks (Top row y = -110)
      const y1 = -110;
      const segs = [
        { x: -640, w: 300, label: 'POLICY + VOICE', col: ROLE.ok },
        { x: -310, w: 320, label: 'TOOLS + EXAMPLES', col: ROLE.audio },
        { x: 25, w: 310, label: 'COMMITTED TURNS', col: ROLE.media },
        { x: 370, w: 340, label: 'DYNAMIC STATE A', col: ROLE.warn },
      ];

      nodes.push(
        txt(
          'REQUEST A: STABLE PREFIX FIRST -> DYNAMIC SUFFIX LAST',
          -790,
          y1 - 72,
          26,
          ROLE.audio,
          'mono',
          'left',
        ),
      );
      segs.forEach((sg) => {
        nodes.push(
          rect(sg.w, 58, { fill: '#0b1428', stroke: sg.col, width: 3, radius: 8 })
            .at(sg.x, y1)
            .glow(6, sg.col),
          txt(sg.label, sg.x, y1, 26, sg.col, 'mono', 'center'),
        );
      });

      // Second row (y = 80): Request B swaps dynamic suffix A -> B!
      const y2 = 80;
      const msAlpha = 0.35 + ms * 0.65;
      const bpX = 190; // Boundary right after COMMITTED TURNS (before DYNAMIC STATE)!

      nodes.push(
        txt(
          br > 0.4
            ? 'EXPLICIT BREAKPOINT -> REUSED BY REQ B!'
            : 'IMPLICIT ENDPOINT -> REQUEST B MISSES!',
          -790,
          y2 - 72,
          26,
          br > 0.4 ? ROLE.ok : ROLE.fail,
          'mono',
          'left',
        ).opacity(msAlpha),
      );

      segs.forEach((sg, idx) => {
        const isDyn = idx === 3;
        const lbl = isDyn ? 'DYNAMIC STATE B' : sg.label;
        const col = isDyn ? ROLE.cut : br > 0.4 ? ROLE.ok : ROLE.fail;
        nodes.push(
          rect(sg.w, 58, { fill: '#0b1428', stroke: col, width: 3, radius: 8 })
            .at(sg.x, y2)
            .glow(br > 0.4 && !isDyn ? 8 : 4, col)
            .opacity(msAlpha),
          txt(lbl, sg.x, y2, 26, col, 'mono', 'center').opacity(msAlpha),
        );
      });

      // Explicit breakpoint laser beam between stable prefix & dynamic suffix!
      if (br > 0.1) {
        nodes.push(
          line([bpX, y1 - 44], [bpX, y2 + 44], { stroke: ROLE.focus, width: 4.5, dash: [10, 8] })
            .glow(10, ROLE.focus)
            .opacity(br),
          txt('EXPLICIT BREAKPOINT', bpX, y2 + 78, 26, ROLE.focus, 'mono', 'center').opacity(br),
        );
      }

      // Top-right rule
      nodes.push(
        txt('CACHE HYGIENE', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt(
          dn > 0.4
            ? 'Timestamp at start breaks all leading tokens'
            : 'Never omit current facts just to cache',
          480,
          -378,
          26,
          dn > 0.4 ? ROLE.warn : COSMOS.ink,
          'mono',
          'center',
        ),
        txt(
          'Routing key cannot create missing entry',
          480,
          -334,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Bottom reminder
      nodes.push(
        line([-840, 245], [840, 245], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          pt > 0.4
            ? 'Reused prefix still leaves endpointing, tools, TTS & playout on the critical path!'
            : 'Verify minimum cache length, breakpoint rules & reported usage on your chosen route',
          0,
          318,
          26,
          pt > 0.4 ? ROLE.audio : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('va-prefix-reuse-0-2', () => {
    s.play(dynamicOn.to(1, { duration: clampDur(c, c.cue('va-prefix-reuse-0-2').start, 0.35) }));
  });
  c.on('va-prefix-reuse-1-1', () => {
    s.play(missOn.to(1, { duration: clampDur(c, c.cue('va-prefix-reuse-1-1').start, 0.4) }));
  });
  c.on('va-prefix-reuse-1-3', () => {
    s.play(breakOn.to(1, { duration: clampDur(c, c.cue('va-prefix-reuse-1-3').start, 0.45) }));
  });
  c.on('va-prefix-reuse-2-2', () => {
    s.play(pathOn.to(1, { duration: clampDur(c, c.cue('va-prefix-reuse-2-2').start, 0.35) }));
  });
}
