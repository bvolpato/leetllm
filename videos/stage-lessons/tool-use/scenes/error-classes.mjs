// Scene 18: error-classes - Choose recovery from the actual failure class
// 4-Channel Typed Failure-State Router mapping Validation Error, Policy Denial, Transient Read,
// and Unknown Write to their four distinct allowed recovery transitions + bounded error hygiene.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  energyRail,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function errorClasses(s, c) {
  const pulse = s.value(0);
  const valOn = s.value(0);
  const revalOn = s.value(0);
  const denyOn = s.value(0);
  const readRetryOn = s.value(0);
  const unknownWriteOn = s.value(0);
  const hygieneOn = s.value(0);
  const queuedOn = s.value(0);

  const header = cinemaHeader(
    'TYPED FAILURE RECOVERY',
    'Match every recovery rule',
    'to the actual failure class',
    { accent: ROLE.caution, size: 46 },
  );

  const stageAura = aura(100, 40, 620, '#fb923c1a', '#5ce1e61a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const vl = valOn.value;
      const rv = revalOn.value;
      const dn = denyOn.value;
      const rr = readRetryOn.value;
      const uw = unknownWriteOn.value;
      const hg = hygieneOn.value;
      const qd = queuedOn.value;
      const nodes = [];

      // 2x2 Quadrant Optical Rails (zero stacked bullet cards!)
      const quads = [
        {
          x: -855,
          y: -155,
          title: '1. VALIDATION ERROR',
          action: 'Return short structured error -> bounded model edit',
          rule: rv > 0.35 ? 'REVALIDATE CORRECTED CALL FROM SCRATCH' : 'Missing or mistyped field',
          col: ROLE.proposal,
          op: 0.45 + Math.max(vl, rv) * 0.55,
          glow: rv > 0.35,
        },
        {
          x: 40,
          y: -155,
          title: '2. POLICY / AUTH DENIAL',
          action: 'Stop · wait for trusted state or approval to change',
          rule: 'Different spelling or invented ID is NOT a fix',
          col: ROLE.denied,
          op: 0.35 + dn * 0.65,
          glow: dn > 0.35,
        },
        {
          x: -855,
          y: 65,
          title: '3. TRANSIENT READ FAILURE',
          action: 'Retry inside runtime with backoff + 1 deadline',
          rule: 'Never ask the model to guess a new release ID',
          col: ROLE.runtime,
          op: 0.35 + rr * 0.65,
          glow: rr > 0.35,
        },
        {
          x: 40,
          y: 65,
          title: '4. UNKNOWN WRITE TIMEOUT',
          action: 'Destination may have committed · reconcile op_id',
          rule: 'NEVER issue a fresh blind write on dropped reply',
          col: ROLE.caution,
          op: 0.35 + uw * 0.65,
          glow: uw > 0.35,
        },
      ];

      quads.forEach((q, i) => {
        nodes.push(
          energyRail(q.x, q.y - 36, q.y + 102, q.col, { opacity: q.op }),
          txt(q.title, q.x + 28, q.y - 18, 28, q.col, 'mono', 'left')
            .glow(q.glow ? 7 : 0, q.col)
            .opacity(q.op),
          txt(q.action, q.x + 28, q.y + 34, 26, COSMOS.ink, 'sans', 'left').opacity(q.op),
          txt(
            q.rule,
            q.x + 28,
            q.y + 82,
            26,
            q.glow ? q.col : COSMOS.muted,
            'mono',
            'left',
          ).opacity(q.op),
          beamWithPhotons(
            [
              [q.x + 28, q.y + 114],
              [q.x + 760, q.y + 114],
            ],
            q.col,
            p * 1.1 + i * 0.25,
            { alpha: q.op * 0.75, width: 2.6, photonCount: 1 },
          ),
        );
      });

      // Bottom Error Hygiene & Status Semantics Strip
      const hOp = 0.4 + Math.max(hg, qd) * 0.6;
      nodes.push(
        line([-855, 250], [840, 250], { stroke: '#25355a', width: 2 }).opacity(hOp),
        txt(
          'BOUNDED ERROR CODES ONLY (NO STACK TRACES OR SECRETS)',
          -855,
          302,
          26,
          hg > 0.35 ? ROLE.ok : COSMOS.muted,
          'mono',
          'left',
        )
          .glow(hg > 0.35 ? 6 : 0, ROLE.ok)
          .opacity(hOp),
        txt(
          qd > 0.35
            ? 'HTTP 200 can still carry domain failure  ·  queued = ACCEPTED, NOT COMPLETED'
            : 'Preserve status, observation time & source identity · Cap bytes & tokens',
          -855,
          362,
          26,
          qd > 0.35 ? ROLE.focus : COSMOS.ink,
          'sans',
          'left',
        )
          .glow(qd > 0.35 ? 6 : 0, ROLE.focus)
          .opacity(hOp),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('tu-error-classes-1', () => {
    s.play(valOn.to(1, { duration: clampDur(c, c.cue('tu-error-classes-1').start, 0.3) }));
  });
  c.on('tu-error-revalidate', () => {
    s.play(revalOn.to(1, { duration: clampDur(c, c.cue('tu-error-revalidate').start, 0.3) }));
  });
  c.on('tu-error-denial-waits', () => {
    s.play(denyOn.to(1, { duration: clampDur(c, c.cue('tu-error-denial-waits').start, 0.35) }));
  });
  c.on('tu-error-classes-2', () => {
    s.play(readRetryOn.to(1, { duration: clampDur(c, c.cue('tu-error-classes-2').start, 0.35) }));
  });
  c.on('tu-error-unknown-write', () => {
    s.play(
      unknownWriteOn.to(1, { duration: clampDur(c, c.cue('tu-error-unknown-write').start, 0.35) }),
    );
  });
  c.on('tu-error-classes-3', () => {
    s.play(hygieneOn.to(1, { duration: clampDur(c, c.cue('tu-error-classes-3').start, 0.35) }));
  });
  c.on('tu-error-queued', () => {
    s.play(queuedOn.to(1, { duration: clampDur(c, c.cue('tu-error-queued').start, 0.35) }));
  });
}
