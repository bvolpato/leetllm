// Scene 28: stop-contract: "Where does the returned text end?"
// View 1 (Beat 0): Four stop-reason signal tracks (end-of-turn ID, conversation-end ID,
//   output budget, cancel/error).
// View 2 (Beats 1-2): Cross-token stop-string matching ("stop" split across Token 1 "st" +
//   Token 2 "opera" -> "stop" matches, "era" left over), then streaming buffer hold -> empty string
//   returned strictly AFTER dec-stop-empty.
import { line } from 'vizmatic/stage';
import { COSMOS, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import { ROLE, cinemaAtmosphere, glowVector, lumBar, playCue, swapVis } from '../parts.mjs';

export default function stopContract(s, c) {
  const title = heroTitle(['Where does the', 'returned text end?'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.active,
  });

  const vReasons = s.value(1);
  const vStream = s.value(0);

  const reasonSweep = s.value(1);
  const operaArrived = s.value(0);
  const streamMode = s.value(0);
  const emptyReturned = s.value(0);

  // VIEW 1: Four stop reasons
  const reasonsLayer = guardedDynamic(vReasons, (alpha) => {
    const nodes = [];
    const nLit = Math.round(Math.max(1, Math.min(4, reasonSweep.value)));
    const items = [
      { src: 'end-of-turn ID', dst: 'Assistant message ended', col: ROLE.valid },
      { src: 'conversation-end ID', dst: 'Full conversation ended', col: ROLE.active },
      { src: 'max_tokens budget', dst: 'Length-limited prefix', col: ROLE.winner },
      { src: 'client cancel / error', dst: 'Interrupted stream', col: ROLE.pruned },
    ];

    nodes.push(
      txt(
        'Record the exact termination reason for every response',
        0,
        -280,
        32,
        COSMOS.ink,
        'serif',
        'center',
      ).opacity(alpha),
    );

    items.forEach((it, i) => {
      const y = -155 + i * 132;
      const lit = i < nLit;
      const la = (lit ? 1 : 0.28) * alpha;
      nodes.push(
        lumBar(-435, y, 470, 82, {
          color: it.col,
          fillOpacity: 0.22,
          strokeWidth: 2.4,
          glow: 9,
          radius: 12,
          opacity: la,
        }),
        txt(it.src, -435, y, 30, COSMOS.ink, 'mono', 'center').opacity(la),
        glowVector([-185, y], [15, y], { color: it.col, width: 4, glow: 9, opacity: la }),
        lumBar(415, y, 710, 82, {
          color: it.col,
          fillOpacity: 0.16,
          strokeWidth: 2.2,
          glow: 8,
          radius: 12,
          opacity: la,
        }),
        txt(it.dst, 415, y, 30, it.col, 'mono', 'center').opacity(la),
      );
    });

    return nodes;
  });

  // VIEW 2: Cross-token stop-string ("st" + "opera" matching "stop", leftover "era")
  const streamLayer = guardedDynamic(vStream, (alpha) => {
    const nodes = [];
    const joined = operaArrived.value > 0.4;
    const isStream = streamMode.value > 0.4;
    const isEmpty = emptyReturned.value > 0.4;

    nodes.push(
      txt('Configured stop string:', -740, -245, 34, COSMOS.muted, 'mono', 'left').opacity(alpha),
      lumBar(-95, -245, 220, 72, {
        color: ROLE.winner,
        fillOpacity: 0.26,
        strokeWidth: 2.6,
        glow: 10,
        radius: 12,
        opacity: alpha,
      }),
      txt('"stop"', -95, -245, 42, ROLE.winner, 'mono', 'center')
        .glow(7, ROLE.winner)
        .opacity(alpha),
    );

    // Character cells for Token 1 ("st") and Token 2 ("opera")
    const startX = -525;
    const step = 150;
    const cellY = -10;
    const pieces = joined ? ['st', 'opera'] : ['st'];
    let idx = 0;

    pieces.forEach((piece, pIdx) => {
      const left = startX + idx * step;
      const w = piece.length * step;
      nodes.push(
        txt(
          `Token ${pIdx + 1}: "${piece}"`,
          left + w / 2,
          cellY - 108,
          30,
          pIdx === 0 ? ROLE.base : ROLE.active,
          'mono',
          'center',
        ).opacity(alpha),
        lumBar(left + w / 2, cellY, w - 12, 134, {
          color: pIdx === 0 ? ROLE.base : ROLE.active,
          fillOpacity: 0.16,
          strokeWidth: 2.4,
          glow: 8,
          radius: 14,
          opacity: alpha,
        }),
      );

      for (const ch of piece) {
        const cx = startX + (idx + 0.5) * step;
        const inStop = joined && idx < 4;
        const isLeftover = joined && idx >= 4;
        const col = inStop ? ROLE.winner : isLeftover ? ROLE.pruned : COSMOS.ink;
        nodes.push(
          txt(ch, cx, cellY, 64, col, 'mono', 'center')
            .glow(inStop ? 10 : 0, ROLE.winner)
            .opacity(alpha),
        );
        idx++;
      }
    });

    if (joined) {
      const mEnd = startX + 4 * step;
      const tEnd = startX + 7 * step;
      nodes.push(
        line([startX + 10, cellY + 96], [mEnd - 10, cellY + 96], {
          stroke: ROLE.winner,
          width: 5.5,
        })
          .glow(10, ROLE.winner)
          .opacity(alpha),
        line([mEnd + 10, cellY + 96], [tEnd - 10, cellY + 96], {
          stroke: ROLE.pruned,
          width: 4.5,
        }).opacity(alpha),
        txt(
          '"stop" matched across boundary',
          startX + 2 * step,
          cellY + 144,
          30,
          ROLE.winner,
          'mono',
          'center',
        ).opacity(alpha),
        txt(
          '"era" left over',
          startX + 5.5 * step,
          cellY + 144,
          30,
          ROLE.pruned,
          'mono',
          'center',
        ).opacity(alpha),
      );
    } else if (isStream) {
      nodes.push(
        txt(
          'Buffer holds "st" (possible prefix of "stop")',
          startX + step,
          cellY + 135,
          30,
          ROLE.active,
          'mono',
          'center',
        ).opacity(alpha),
      );
    }

    if (isStream) {
      nodes.push(
        lumBar(0, 325, 1460, 96, {
          color: isEmpty ? ROLE.winner : COSMOS.dim,
          fillOpacity: isEmpty ? 0.24 : 0.1,
          strokeWidth: isEmpty ? 2.8 : 1.8,
          glow: isEmpty ? 10 : 2,
          radius: 14,
          opacity: alpha,
        }),
        txt(
          isEmpty
            ? 'Returned text: ""  (empty string; match dropped)'
            : 'Returned text: [ waiting for next token... ]',
          0,
          325,
          32,
          isEmpty ? ROLE.winner : COSMOS.muted,
          'mono',
          'center',
        )
          .glow(isEmpty ? 7 : 0, ROLE.winner)
          .opacity(alpha),
      );
    } else {
      nodes.push(
        txt(
          'Transformers precomputes vocabulary overlaps to detect split stop strings in tensors.',
          0,
          345,
          28,
          COSMOS.muted,
          'serif',
          'center',
        ).opacity(alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.active, ROLE.winner), title, reasonsLayer, streamLayer);

  playCue(s, c, 'dec-stop-contract-1', (d) => s.play(reasonSweep.to(4, { duration: d })), {
    dur: 1.3,
  });

  c.onBeat(1, () => s.play(swapVis(vReasons, vStream, 0.55)));
  playCue(s, c, 'dec-stop-contract-2', (d) => s.play(operaArrived.to(1, { duration: d })), {
    after: true,
    dur: 0.6,
  });

  c.onBeat(2, () => {
    s.play(streamMode.to(1, { duration: 0.35 }), operaArrived.to(0, { duration: 0.35 }));
  });
  playCue(s, c, 'dec-stop-contract-3', (d) => s.play(operaArrived.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'dec-stop-empty', (d) => s.play(emptyReturned.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
}
