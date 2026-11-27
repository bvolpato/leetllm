// Scene 07: partial-transcripts - Treat repeated words as tentative evidence
// Common-prefix streaming recognizer ladder, read-only prefetch vs close-confirmation gate,
// and strict Python bool(False) vs truthy "false" string validation.
import { group, line } from 'vizmatic/stage';
import { COSMOS, ROLE, aura, cinemaHeader, clampDur, guardedDynamic, txt } from '../parts.mjs';

export default function partialTranscripts(s, c) {
  const prefixOn = s.value(0);
  const extendOn = s.value(0);
  const prefetchOn = s.value(0);
  const closeGateOn = s.value(0);
  const boolCheckOn = s.value(0);
  const strBugOn = s.value(0);

  const header = cinemaHeader(
    'INTERIM HYPOTHESES',
    'Treat repeated words',
    'as tentative evidence',
    {
      x: -860,
      y: -445,
      accent: ROLE.audio,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#5ce1e61a', '#a78bfa16');

  const view = guardedDynamic(
    () => 1,
    () => {
      const prf = prefixOn.value;
      const ext = extendOn.value;
      const pf = prefetchOn.value;
      const cg = closeGateOn.value;
      const bc = boolCheckOn.value;
      const sb = strBugOn.value;
      const nodes = [];

      // Left column: Common-prefix streaming transcript ladder
      const lx = -840;
      nodes.push(
        txt('STREAMING COMMON-PREFIX LADDER', lx, -210, 26, ROLE.audio, 'mono', 'left'),
        txt('H1 (interim):  "What is"', lx, -145, 26, COSMOS.ink, 'mono', 'left'),
        txt(
          'H2 (interim):  "What is incident"',
          lx,
          -90,
          26,
          prf > 0.4 ? ROLE.audio : COSMOS.muted,
          'mono',
          'left',
        ),
        txt(
          'Shared prefix: "What is"  (tentative!)',
          lx,
          -35,
          26,
          prf > 0.4 ? ROLE.focus : COSMOS.dim,
          'mono',
          'left',
        ),
        txt(
          'H3 (interim):  "What is incident 4219"',
          lx,
          25,
          26,
          ext > 0.4 ? ROLE.ok : COSMOS.dim,
          'mono',
          'left',
        ),
      );

      // Right column: Action Gate (Prefetch vs Commit vs Close Confirmation)
      const rx = 120;
      nodes.push(
        line([70, -225], [70, 65], { stroke: '#2c3d66', width: 2.5 }),
        txt('ACTION AUTHORITY GATE', rx, -210, 26, ROLE.policy, 'mono', 'left'),
        txt(
          'Status lookup:  cancellable read-only prefetch',
          rx,
          -145,
          26,
          pf > 0.4 ? ROLE.ok : COSMOS.muted,
          'mono',
          'left',
        ),
        txt(
          'History & voice: wait for committed turn',
          rx,
          -90,
          26,
          cg > 0.4 ? ROLE.audio : COSMOS.muted,
          'mono',
          'left',
        ),
        txt(
          'Close incident:  ask confirm + check auth',
          rx,
          -35,
          26,
          cg > 0.4 ? ROLE.warn : COSMOS.muted,
          'mono',
          'left',
        ),
        txt('Revision arrives: discard stale prefetch', rx, 25, 26, COSMOS.muted, 'mono', 'left'),
      );

      // Top-right rule readout
      nodes.push(
        txt('RECOGNIZER REVISIONS', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('repeated words != committed turn', 480, -378, 26, COSMOS.ink, 'mono', 'center'),
      );

      // Bottom stage: Strict Boolean Flag Validation (False vs "false"!)
      const botY = 175;
      nodes.push(
        line([-840, 108], [840, 108], { stroke: '#2c3d66', width: 2 }),
        txt(
          'TYPED COMMIT FLAG VALIDATION (PYTHON)',
          0,
          botY - 24,
          26,
          ROLE.focus,
          'mono',
          'center',
        ),
        txt(
          'committed = False  (bool)  ->  remains UNCOMMITTED',
          -420,
          botY + 38,
          26,
          bc > 0.4 ? ROLE.ok : COSMOS.muted,
          'mono',
          'center',
        ),
        txt(
          'committed = "false"  (str) ->  TRUTHY! REJECT TYPE!',
          420,
          botY + 38,
          26,
          sb > 0.4 ? ROLE.fail : COSMOS.muted,
          'mono',
          'center',
        ).glow(sb > 0.4 ? 8 : 0, ROLE.fail),
        txt(
          'Bind real turn decision to authenticated session before any side effect',
          0,
          botY + 115,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('va-partial-transcripts-0-2', () => {
    s.play(
      prefixOn.to(1, { duration: clampDur(c, c.cue('va-partial-transcripts-0-2').start, 0.35) }),
    );
  });
  c.on('va-partial-transcripts-0-3', () => {
    s.play(
      extendOn.to(1, { duration: clampDur(c, c.cue('va-partial-transcripts-0-3').start, 0.35) }),
    );
  });
  c.on('va-partial-transcripts-1-1', () => {
    s.play(
      prefetchOn.to(1, { duration: clampDur(c, c.cue('va-partial-transcripts-1-1').start, 0.35) }),
    );
  });
  c.on('va-partial-transcripts-1-2', () => {
    s.play(
      closeGateOn.to(1, { duration: clampDur(c, c.cue('va-partial-transcripts-1-2').start, 0.35) }),
    );
  });
  c.on('va-partial-transcripts-2-1', () => {
    s.play(
      boolCheckOn.to(1, { duration: clampDur(c, c.cue('va-partial-transcripts-2-1').start, 0.35) }),
    );
  });
  c.on('va-partial-transcripts-2-2', () => {
    s.play(
      strBugOn.to(1, { duration: clampDur(c, c.cue('va-partial-transcripts-2-2').start, 0.4) }),
    );
  });
}
