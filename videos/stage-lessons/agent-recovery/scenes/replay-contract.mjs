// Scene 9: replay-contract - "A replay contract has a scope and a lifetime"
// Three dynamic stages: (1) SQLite BEGIN IMMEDIATE serialization & SQLITE_BUSY,
// (2) Versioned replay contracts (Stripe v1 24h prune & 500 cache vs v2 completion),
// (3) Primary vs lagging replica (empty != absent) + revision drift + tenant auth.
import { circle, line } from 'vizmatic/stage';
import {
  COSMOS,
  OP,
  ROLE,
  actorOrb,
  ambientClock,
  cinemaAtmosphere,
  glowArrow,
  glowCross,
  glowDot,
  glowPill,
  guardedDynamic,
  heroTitle,
  hexAlpha,
  lowerFooter,
  playCue,
  txt,
} from '../parts.mjs';

export default function replayContract(s, c) {
  const title = heroTitle(['A replay contract has a scope', 'and a lifetime'], {
    x: -855,
    y: -440,
    size: 48,
    lineHeight: 56,
    accent: ROLE.mark,
  });

  const amb = ambientClock(s, c);
  const stage = s.value(0); // 0 = SQLite lock, 1 = v1 vs v2 contract, 2 = replica & auth
  const showLock = s.value(0);
  const showReplay2 = s.value(0);
  const showBusy = s.value(0);
  const showV1 = s.value(0);
  const showPrune = s.value(0);
  const showV2 = s.value(0);
  const showReplica = s.value(0);
  const showNewAdmit = s.value(0);
  const showAuth = s.value(0);

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const pulse = 0.5 + 0.5 * Math.sin(amb.value * Math.PI * 10);
      const st = Math.round(stage.value);
      const nodes = [];

      if (st === 0) {
        // Stage 1: Two concurrent workers racing into SQLite BEGIN IMMEDIATE
        const gateX = -175;
        nodes.push(
          txt(
            'CONCURRENT WRITERS · SQLITE BEGIN IMMEDIATE',
            0,
            -290,
            28,
            ROLE.controller,
            'mono',
            'center',
          ).opacity(alpha),
          actorOrb(-640, -135, 58, ROLE.agent, 'Worker A', 'key-2', { alpha, active: true }),
          actorOrb(-640, 145, 58, ROLE.violet, 'Worker B', 'key-2', {
            alpha,
            active: showLock.value > 0.3,
          }),
          line([gateX, -210], [gateX, 235], {
            stroke: ROLE.mark,
            width: 4.5,
          }).glow(8 + 4 * showLock.value, ROLE.mark),
          txt('BEGIN IMMEDIATE', gateX, -240, 26, ROLE.mark, 'mono', 'center').opacity(alpha),
          glowArrow(-535, -135, 455, -75, ROLE.sure, { width: 3.5, alpha }),
          glowArrow(-535, 145, 455, 85, ROLE.violet, { width: 3.5, alpha, dash: [8, 6] }),
          actorOrb(580, 5, 78, ROLE.controller, 'SQLite', 'Ledger + Jobs', {
            alpha,
            active: true,
          }),
        );

        const pA = -480 + 820 * ((amb.value * 3) % 1);
        nodes.push(glowDot(pA, -110, { radius: 9, color: ROLE.sure, glow: 12, opacity: alpha }));

        if (showLock.value > 0.2) {
          nodes.push(
            glowPill('Worker A commits -> job-2', 165, -182, ROLE.sure, {
              size: 26,
              alpha: showLock.value * alpha,
            }),
          );
        }
        if (showReplay2.value > 0.2) {
          nodes.push(
            glowPill('Worker B replays -> job-2', 165, 195, ROLE.mark, {
              size: 26,
              alpha: showReplay2.value * alpha,
            }),
          );
        }
        if (showBusy.value > 0.2) {
          nodes.push(
            glowPill('Lock wait exceeded -> SQLITE_BUSY (keep key + deadline)', 0, 325, ROLE.fail, {
              size: 27,
              alpha: showBusy.value * alpha,
            }),
          );
        } else {
          nodes.push(
            txt(
              'One key -> one job under serialization; two distinct keys -> two jobs.',
              0,
              325,
              27,
              COSMOS.muted,
              'sans',
              'center',
            ).opacity(alpha),
          );
        }
      } else if (st === 1) {
        // Stage 2: Versioned API Contracts (v1 vs v2 + 24h retention)
        const v1X = -430;
        const v2X = 430;
        nodes.push(
          txt(
            'CHECK API VERSION, RETENTION WINDOW & ERROR RULES',
            0,
            -285,
            27,
            ROLE.mark,
            'mono',
            'center',
          ).opacity(alpha),
          line([0, -225], [0, 260], {
            stroke: hexAlpha(ROLE.controller, 0.45 * alpha),
            width: 2.2,
          }),
          txt('API VERSION 1', v1X, -210, 32, ROLE.agent, 'mono', 'center').opacity(alpha),
          txt('API VERSION 2', v2X, -210, 32, ROLE.sure, 'mono', 'center').opacity(alpha),
          glowPill('Replays 1st executed result (incl. 500)', v1X, -100, ROLE.agent, {
            size: 26,
            alpha: Math.max(0.5, showV1.value) * alpha,
          }),
          txt(
            'Pre-exec validation / conflict not cached',
            v1X,
            -18,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(alpha),
          glowPill(
            'Pruned after >= 24 hours',
            v1X,
            92,
            showPrune.value > 0.4 ? ROLE.fail : ROLE.mark,
            {
              size: 26,
              alpha: Math.max(0.45, showPrune.value) * alpha,
            },
          ),
          txt(
            'Reusing pruned key can mint a new write',
            v1X,
            174,
            26,
            ROLE.fail,
            'sans',
            'center',
          ).opacity(Math.max(0.45, showPrune.value) * alpha),
          glowPill('Attempts to complete failed work', v2X, -100, ROLE.sure, {
            size: 26,
            alpha: Math.max(0.45, showV2.value) * alpha,
          }),
          glowPill('Returns updated response', v2X, 18, ROLE.sure, {
            size: 26,
            alpha: Math.max(0.45, showV2.value) * alpha,
          }),
          txt(
            'Scope, payload check, retention & version matter',
            v2X,
            145,
            26,
            COSMOS.ink,
            'sans',
            'center',
          ).opacity(Math.max(0.45, showV2.value) * alpha),
          txt(
            'Never assume idempotency lives forever or behaves identically across API versions.',
            0,
            325,
            27,
            COSMOS.ink,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else {
        // Stage 3: Primary vs Lagging Replica + Revision Drift + Tenant Auth
        nodes.push(
          txt(
            'PRIMARY VS LAGGING REPLICA · REVISION & TENANT SCOPE',
            0,
            -285,
            27,
            ROLE.fail,
            'mono',
            'center',
          ).opacity(alpha),
          actorOrb(-540, -90, 68, ROLE.sure, 'Primary', `${OP.job} durable`, {
            alpha,
            active: true,
          }),
          actorOrb(100, -90, 68, ROLE.fail, 'Replica', 'lagging (empty)', {
            alpha,
            active: showReplica.value > 0.3,
          }),
          glowArrow(-448, -90, 8, -90, ROLE.mark, { width: 3.5, alpha, dash: [8, 6] }),
          txt('replication lag', -220, -135, 26, ROLE.mark, 'mono', 'center').opacity(alpha),
          glowPill('Empty replica != no job -> KEEP UNKNOWN', -220, 96, ROLE.fail, {
            size: 26,
            alpha: Math.max(0.55, showReplica.value) * alpha,
          }),
          circle(66, {
            fill: hexAlpha(ROLE.op, 0.14 * alpha),
            stroke: ROLE.op,
            width: 3.2,
          })
            .at(610, -90)
            .glow(8, ROLE.op),
          txt('AUTH', 610, -104, 26, ROLE.op, 'mono', 'center').opacity(alpha),
          txt('TENANT', 610, -68, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
          glowPill('New rev -> new admission', 610, 65, ROLE.mark, {
            size: 26,
            alpha: Math.max(0.45, showNewAdmit.value) * alpha,
          }),
          glowPill('Verify caller + tenant before replay', 200, 215, ROLE.op, {
            size: 27,
            alpha: Math.max(0.45, showAuth.value) * alpha * (0.85 + 0.15 * pulse),
          }),
          glowCross(100, -10, 26, ROLE.fail, 0),
          txt(
            'Authenticate caller and tenant before returning any stored replay result.',
            0,
            325,
            27,
            COSMOS.ink,
            'sans',
            'center',
          ).opacity(alpha),
        );
      }

      nodes.push(
        lowerFooter(
          'SCOPE · PAYLOAD · RETENTION · CONSISTENCY',
          st === 0
            ? 'BEGIN IMMEDIATE SERIALIZES WRITES'
            : st === 1
              ? 'V1 VS V2 · 24H PRUNING'
              : 'LAG -> UNKNOWN · AUTH FIRST',
          { accent: st === 2 ? ROLE.fail : ROLE.mark, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.mark, ROLE.controller), title, layer);

  playCue(s, c, 'sqlite-file', (d) => s.play(stage.to(0, { duration: d })), { dur: 0.3 });
  playCue(s, c, 'shared-commit', (d) => s.play(showLock.to(0.5, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'two-workers', (d) => s.play(showLock.to(0.8, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'serialize', (d) => s.play(showLock.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'shared-replay', (d) => s.play(showReplay2.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'two-jobs', (d) => s.play(showReplay2.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'busy', (d) => s.play(showBusy.to(1, { duration: d })), { dur: 0.45 });

  playCue(
    s,
    c,
    'contract-terms',
    (d) => s.play(stage.to(1, { duration: 0.15 }), showV1.to(0.5, { duration: d })),
    {
      dur: 0.45,
    },
  );
  playCue(s, c, 'v1-replay', (d) => s.play(showV1.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'not-saved', (d) => s.play(showV1.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'retention-pruned', (d) => s.play(showPrune.to(0.7, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'pruned-reuse', (d) => s.play(showPrune.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'v2-complete', (d) => s.play(showV2.to(0.7, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'v2-updated', (d) => s.play(showV2.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'versioned', (d) => s.play(showV2.to(1, { duration: d })), { dur: 0.35 });

  playCue(
    s,
    c,
    'lagging-replica',
    (d) => s.play(stage.to(2, { duration: 0.15 }), showReplica.to(0.7, { duration: d })),
    {
      dur: 0.45,
    },
  );
  playCue(s, c, 'keep-unknown', (d) => s.play(showReplica.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'changed-revision', (d) => s.play(showNewAdmit.to(0.7, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'new-admission', (d) => s.play(showNewAdmit.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'auth-tenant', (d) => s.play(showAuth.to(1, { duration: d })), { dur: 0.45 });
}
