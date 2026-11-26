// Scene 01: opening - Can a worker start this request in time?
// 5 blocks x 10k tokens at 125k tok/s -> STRICT prediction pause (Queue / 429 / 503?) ->
// unfolds 5 x 80ms = 400ms crossing the 250ms budget -> 503 shared overload + support receipt!
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  OPEN_ADM,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function opening(s, c) {
  const phase = s.value(0);
  const blocksOn = s.value(0);
  const unfoldOn = s.value(0);
  const waitReveal = s.value(0); // STRICT after opening-wait!
  const statusReveal = s.value(0); // STRICT after opening-status!

  const header = cinemaHeader(
    'SYSTEM DESIGN FROM THE CONSTRAINT',
    'Can a worker start',
    'this request in time?',
    {
      x: -860,
      y: -445,
      accent: ROLE.req,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#5ce1e61a', '#f43f5e16');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const bl = blocksOn.value;
      const uf = unfoldOn.value;
      const wr = waitReveal.value;
      const sr = statusReveal.value;
      const nodes = [];

      // Shared ms ruler: 0 .. 480 ms across x = [-760 .. +760]
      const x0 = -760;
      const x1 = 760;
      const mapMs = (ms) => x0 + (ms / 480) * (x1 - x0);
      const rY = 20;

      const x250 = mapMs(250);

      // 5 blocks of 10k tokens each (= 80 ms each -> 400 ms total once unfolded!)
      const blockW = mapMs(80) - x0 - 8;
      for (let i = 0; i < 5; i++) {
        const bx = uf > 0.35 ? mapMs(i * 80) + 4 + blockW * 0.5 : -620 + i * 240;
        const by = uf > 0.35 ? rY : -105;
        const w = uf > 0.35 ? blockW : 210;
        const pastLimit = uf > 0.35 && (i + 1) * 80 > 250 && wr > 0.35;
        const col = pastLimit ? ROLE.fail : ROLE.req;
        nodes.push(
          rect(w, 56, { fill: '#0b1428', stroke: col, width: 3, radius: 8 })
            .at(bx, by)
            .glow(pastLimit ? 9 : 5, col)
            .opacity(0.45 + bl * 0.55),
          txt(uf > 0.35 ? '80 ms' : `BLK ${i + 1}: 10k`, bx, by, 26, col, 'mono', 'center').opacity(
            0.45 + bl * 0.55,
          ),
        );
      }

      // Queue clock axis + 250 ms limit line (stops cleanly below parked blocks and above ticks!)
      nodes.push(
        line([x0, rY + 62], [x1, rY + 62], { stroke: '#344770', width: 4 }),
        line([x250, rY - 46], [x250, rY + 52], {
          stroke: ROLE.focus,
          width: 4,
          dash: [10, 8],
        }).glow(9, ROLE.focus),
        txt('250 ms WAIT LIMIT', x250, rY + 148, 26, ROLE.focus, 'mono', 'center'),
      );
      for (const t of [0, 80, 160, 250, 320, 400]) {
        const tx = mapMs(t);
        nodes.push(
          line([tx, rY + 52], [tx, rY + 72], { stroke: '#5c74a8', width: 2 }),
          txt(
            `${t}`,
            tx,
            rY + 104,
            26,
            t === 400 && wr > 0.35 ? ROLE.fail : t === 250 ? ROLE.focus : COSMOS.dim,
            'mono',
            'center',
          ),
        );
      }

      // Top-right request metadata
      nodes.push(
        txt('CALLER: "Summarize my notes."', 470, -425, 26, ROLE.ok, 'mono', 'center'),
        txt('Access: OK  ·  Quota: OK', 470, -378, 26, COSMOS.ink, 'mono', 'center'),
        txt('Rate: 125,000 tok/s  ·  Ahead: 50,000 tok', 470, -334, 26, ROLE.req, 'mono', 'center'),
      );

      // Bottom prediction prompt -> STRICT reveal of 400 ms & 503 receipt!
      const botY = 275;
      if (sr > 0.35) {
        nodes.push(
          txt(
            `HTTP 503 SHARED OVERLOAD  |  WAIT ${Math.round(OPEN_ADM.estimatedWait * 1000)} ms > 250 ms LIMIT`,
            0,
            botY,
            28,
            ROLE.fail,
            'mono',
            'center',
          ).glow(9, ROLE.fail),
          txt(
            'Receipt records wait_ms=400, limit_ms=250, cause=shared_capacity for support',
            0,
            botY + 54,
            26,
            COSMOS.muted,
            'mono',
            'center',
          ),
        );
      } else if (wr > 0.35) {
        nodes.push(
          txt(
            '5 × 80 ms = 400 ms  (PAST 250 ms LIMIT!)',
            0,
            botY,
            30,
            ROLE.fail,
            'mono',
            'center',
          ).glow(8, ROLE.fail),
        );
      } else {
        nodes.push(
          txt(
            'Queue it, refuse for quota (429), or refuse for overload (503)?',
            0,
            botY,
            34,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      }

      nodes.push(
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.req,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.2);

  c.on('opening-blocks', () => {
    s.play(blocksOn.to(1, { duration: clampDur(c, c.cue('opening-blocks').start, 0.35) }));
  });
  c.on('opening-unfold', () => {
    s.play(unfoldOn.to(1, { duration: clampDur(c, c.cue('opening-unfold').start, 0.5) }));
  });
  c.after('opening-wait', () => {
    s.play(waitReveal.to(1, { duration: clampDur(c, c.cue('opening-wait').end, 0.35) }));
  });
  c.after('opening-status', () => {
    s.play(statusReveal.to(1, { duration: clampDur(c, c.cue('opening-status').end, 0.35) }));
  });
}
