// Scene 06: delivery: Server vs Client lanes: uniform +30ms wire shift vs proxy flush coalescing T3+T4 at 470ms!
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  tokenTimes,
  txt,
} from '../parts.mjs';

export default function delivery(s, c) {
  const buffered = s.value(0); // 0 = uniform +30ms shift, 1 = T3 & T4 coalesce at 470ms!
  const showEventAvg = s.value(0);
  const revealServerNeed = s.value(0); // strictly withheld until AFTER `join-ids`!

  const bgAura = aura(0, 0, 740, '#3a1a3626', '#16355e18');
  const title = heroTitle(['Wire Buffering:', 'server emit vs client flush'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.stall,
  });

  const xOf = (ms) => -640 + ((ms - 300) / 190) * 1400;
  const serverY = -125;
  const clientY = 105;

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const buf = buffered.value;
    const avg = showEventAvg.value;
    const srv = revealServerNeed.value;
    const nodes = [
      txt('SERVER', -855, serverY, 30, ROLE.clockA, 'mono', 'left').opacity(alpha),
      glowingTrail(
        [
          [xOf(310), serverY],
          [xOf(480), serverY],
        ],
        { color: '#273a64', width: 3, core: false, opacity: alpha },
      ),
      txt('CLIENT', -855, clientY, 30, ROLE.stall, 'mono', 'left').opacity(alpha),
      glowingTrail(
        [
          [xOf(310), clientY],
          [xOf(480), clientY],
        ],
        { color: '#45243b', width: 3, core: false, opacity: alpha },
      ),
    ];

    tokenTimes.forEach((sMs, idx) => {
      const uniformC = sMs + 30;
      const bufferedC = idx < 2 ? uniformC : 470;
      const cMs = uniformC + (bufferedC - uniformC) * buf;
      const sx = xOf(sMs);
      const cx = xOf(cMs);
      const isCoalesced = idx >= 2 && buf > 0.4;
      const col = isCoalesced ? ROLE.stall : ROLE.clockA;

      nodes.push(
        glowingTrail(
          [
            [sx, serverY + 12],
            [cx, clientY - 12],
          ],
          { color: col, width: isCoalesced ? 4.5 : 3, glow: isCoalesced ? 12 : 6, opacity: alpha },
        ),
        glowDot(sx, serverY, { radius: 9, color: ROLE.clockA, opacity: alpha }),
        txt(`T${idx + 1} (${sMs})`, sx, serverY - 40, 26, ROLE.clockA, 'mono', 'center').opacity(
          alpha,
        ),
        glowDot(cx, clientY, {
          radius: isCoalesced ? 12 : 9,
          color: col,
          glow: 14,
          opacity: alpha,
        }),
      );
      if (!(idx === 3 && buf > 0.12)) {
        const lbl = idx === 2 && buf > 0.7 ? 'T3+T4 (470)' : `T${idx + 1} (${Math.round(cMs)})`;
        nodes.push(txt(lbl, cx, clientY + 46, 26, col, 'mono', 'center').opacity(alpha));
      }
    });

    if (avg > 0.05 && srv < 0.2) {
      nodes.push(
        txt(
          'Client sees 85 ms gap ÷ 2 tokens = 42.5 ms/tok: can you recover when T3 left the server?',
          -855,
          295,
          28,
          ROLE.wait,
          'serif',
          'left',
        )
          .glow(8, ROLE.wait)
          .opacity(avg * (1 - srv * 5) * alpha),
      );
    }

    if (srv > 0.2) {
      nodes.push(
        txt(
          'No: you need server timestamps joined by token ID (speculative decode can also burst tokens)',
          -855,
          295,
          28,
          ROLE.clockA,
          'sans',
          'left',
        )
          .glow(6, ROLE.clockA)
          .opacity(srv * alpha),
      );
    }
    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'flush-two', (d) => s.play(buffered.to(1, { duration: d })), { dur: 0.75 });
  playCue(s, c, 'event-average', (d) => s.play(showEventAvg.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  // Strictly withhold answer until AFTER `join-ids`!
  playCue(s, c, 'join-ids', (d) => s.play(revealServerNeed.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  bindCueBeat(s, c, s.value(0), ['trace-crossings', 'buffer-two', 'event-gap']);
}
