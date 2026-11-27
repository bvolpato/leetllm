// Scene 14: phase-placement - What makes a streaming answer pause?
// Chunked prefill (1 long prompt stall vs 4 interleaved chunks), Prefill-Decode disaggregation
// (KV transfer link + DistServe goodput), and Speculative Decoding ("Meet at noon" -> "Meet at two").
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  sysNode,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function phasePlacement(s, c) {
  const chunkOn = s.value(0);
  const disaggOn = s.value(0);
  const specOn = s.value(0);
  const replaceOn = s.value(0);

  const header = cinemaHeader(
    'PREFILL INTERFERENCE & DECODE',
    'What makes a streaming',
    'answer pause?',
    {
      x: -860,
      y: -445,
      accent: ROLE.req,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#5ce1e61a', '#a78bfa18');

  const view = guardedDynamic(
    () => 1,
    () => {
      const ch = chunkOn.value;
      const ds = disaggOn.value;
      const sp = specOn.value;
      const rp = replaceOn.value;
      const nodes = [];

      // Top lane: Long Prefill Stall vs 4-Chunk Interleaved Prefill
      const x0 = -800;
      const y1 = -165;
      if (ch < 0.5) {
        nodes.push(
          txt(
            'UNINTERRUPTED LONG PREFILL STALLS STREAMING DECODE!',
            x0,
            y1 - 52,
            26,
            ROLE.fail,
            'mono',
            'left',
          ),
          rect(100, 42, { fill: ROLE.ok, stroke: '#ffffff', width: 1.5, radius: 6 }).at(
            x0 + 50,
            y1,
          ),
          txt('D1', x0 + 50, y1, 26, '#070910', 'mono', 'center'),
          rect(760, 42, { fill: ROLE.worker, stroke: '#ffffff', width: 1.5, radius: 6 })
            .at(x0 + 115 + 380, y1)
            .glow(8, ROLE.worker),
          txt(
            'LONG PROMPT PREFILL (DECODE PAUSED!)',
            x0 + 115 + 380,
            y1,
            26,
            '#070910',
            'mono',
            'center',
          ),
          rect(100, 42, { fill: ROLE.ok, stroke: '#ffffff', width: 1.5, radius: 6 }).at(
            x0 + 940,
            y1,
          ),
          txt('D2', x0 + 940, y1, 26, '#070910', 'mono', 'center'),
        );
      } else {
        nodes.push(
          txt(
            'CHUNKED PREFILL: 4 SHORT CHUNKS INTERLEAVED WITH DECODE TURNS',
            x0,
            y1 - 52,
            26,
            ROLE.ok,
            'mono',
            'left',
          ),
        );
        let cx = x0;
        for (let i = 0; i < 4; i++) {
          nodes.push(
            rect(85, 42, { fill: ROLE.ok, stroke: '#ffffff', width: 1.2, radius: 6 }).at(
              cx + 42,
              y1,
            ),
            txt(`D${i + 1}`, cx + 42, y1, 26, '#070910', 'mono', 'center'),
            rect(175, 42, { fill: ROLE.worker, stroke: '#ffffff', width: 1.2, radius: 6 }).at(
              cx + 95 + 88,
              y1,
            ),
            txt(`P${i + 1}`, cx + 95 + 88, y1, 26, '#070910', 'mono', 'center'),
          );
          cx += 280;
        }
      }

      // Middle lane: Prefill -> KV Link -> Decode Disaggregation (DistServe Goodput)
      const y2 = 15;
      const dsAlpha = 0.35 + ds * 0.65;
      const pfPt = [-460, y2];
      const dcPt = [180, y2];
      const nPf = sysNode(pfPt[0], pfPt[1], 'PREFILL', ROLE.req, {
        radius: 66,
        sub: 'TTFT pool',
        opacity: dsAlpha,
      });
      const nDc = sysNode(dcPt[0], dcPt[1], 'DECODE', ROLE.policy, {
        radius: 66,
        sub: 'TPOT pool',
        opacity: dsAlpha,
      });
      const [kA, kB] = trimSeg(pfPt, dcPt, nPf.r + 16, nDc.r + 16);
      nodes.push(
        beamWithPhotons([kA, kB], ROLE.focus, 0, {
          width: 4,
          alpha: dsAlpha,
        }),
        txt(
          'KV TRANSFER LINK',
          (kA[0] + kB[0]) * 0.5,
          y2 - 36,
          26,
          ROLE.focus,
          'mono',
          'center',
        ).opacity(dsAlpha),
        nPf.node,
        nDc.node,
        txt('DISTSERVE GOODPUT:', 560, y2 - 32, 26, ROLE.ok, 'mono', 'center').opacity(dsAlpha),
        txt('req/s meeting BOTH', 560, y2 + 18, 26, COSMOS.ink, 'mono', 'center').opacity(dsAlpha),
        txt('TTFT & TPOT SLOs', 560, y2 + 64, 26, COSMOS.muted, 'mono', 'center').opacity(dsAlpha),
      );

      // Bottom lane: Speculative Decoding ("Meet" "at" "noon" -> "two"!)
      const y3 = 265;
      const spAlpha = 0.35 + sp * 0.65;
      nodes.push(
        line([-840, 165], [840, 165], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          'SPECULATIVE DECODING (1 PARALLEL TARGET VERIFY)',
          -820,
          y3 - 48,
          26,
          ROLE.focus,
          'mono',
          'left',
        ).opacity(spAlpha),
        txt('DRAFT:  "Meet"   "at"   "noon"', -820, y3 + 12, 28, ROLE.req, 'mono', 'left').opacity(
          spAlpha,
        ),
        txt(
          rp > 0.4
            ? 'TARGET:  "Meet" OK  ·  "at" OK  ·  "noon" -> "two"!'
            : 'TARGET VERIFIES ALL 3 TOGETHER',
          -60,
          y3 + 12,
          28,
          rp > 0.4 ? ROLE.ok : COSMOS.muted,
          'mono',
          'left',
        )
          .glow(rp > 0.4 ? 8 : 0, ROLE.ok)
          .opacity(spAlpha),
        txt(
          'Saved decode steps must outweigh draft + verification overhead',
          0,
          y3 + 78,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(spAlpha),
        txt('PHASE INTERFERENCE', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('Chunk · Disaggregate · Speculate', 480, -378, 26, COSMOS.ink, 'mono', 'center'),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('sd-phase-placement-0-result', () => {
    s.play(
      chunkOn.to(1, { duration: clampDur(c, c.cue('sd-phase-placement-0-result').start, 0.4) }),
    );
  });
  c.on('sd-phase-placement-1-operation', () => {
    s.play(
      disaggOn.to(1, { duration: clampDur(c, c.cue('sd-phase-placement-1-operation').start, 0.4) }),
    );
  });
  c.on('sd-phase-placement-2-operation', () => {
    s.play(
      specOn.to(1, { duration: clampDur(c, c.cue('sd-phase-placement-2-operation').start, 0.35) }),
    );
  });
  c.on('sd-phase-placement-2-result', () => {
    s.play(
      replaceOn.to(1, { duration: clampDur(c, c.cue('sd-phase-placement-2-result').start, 0.35) }),
    );
  });
}
