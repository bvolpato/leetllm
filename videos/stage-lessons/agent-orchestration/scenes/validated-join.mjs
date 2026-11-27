// Scene 06 (validated-join): "Wait for all results, then check what they mean"
// Orbiting 3D barrier gate + cross-tenant prediction gate (strictly c.after) + canonical JSON digest
// + live rate gauges (2% < 3%, 0.04% = 40% of 0.1%, 25% <= 25%, -1 reject, failures 2->1 digest flip).
import {
  COSMOS,
  REQUEST,
  ROLE,
  V3_CHANGED_PACKET,
  V3_PACKET,
  buildSuperstepBarrier3d,
  cinemaAtmosphere,
  crossSwap,
  glowRing,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  renderGauge,
  rule,
  runAmbientPhase,
  shortHash,
  tweenCue,
  txt,
  values,
} from '../parts.mjs';

export default function validatedJoin(s, c) {
  const phase = s.value(0);
  const barrierStatus = s.value(0); // -1 reject, 0 pending, +1 pass
  const stBatch = s.value(1);
  const stCanon = s.value(0);
  const stRates = s.value(0);

  // Beat 0: Prediction setup (health = tenant9; verdict withheld until c.after!)
  const intendedLit = s.value(0);
  const otherTenant = s.value(0);
  const allDoneLit = s.value(0);
  const fieldsOkLit = s.value(0);
  const askPredict = s.value(0);

  // Beat 1: Barrier OK vs Contract FAIL + 4 rejection reasons + tenant7 replacement + canonical JSON
  const barrierOk = s.value(0);
  const contractFail = s.value(0);
  const rejectScope = s.value(0);
  const rDup = s.value(0);
  const rMiss = s.value(0);
  const rStale = s.value(0);
  const rSource = s.value(0);
  const healthFixed = s.value(0);
  const sortedLit = s.value(0);
  const arrivedLit = s.value(0);
  const jsonLit = s.value(0);
  const swapLit = s.value(0);
  const canonLit = s.value(0);
  const sameDigLit = s.value(0);

  // Beats 2-3: Measured rates, -1 integer range probe, failures 2 -> 1 digest change
  const numLit = s.value(0);
  const ratesInLit = s.value(0);
  const polAllowLit = s.value(0);
  const fictLit = s.value(0);
  const evalBar = s.value(0);
  const evalLimLit = s.value(0);
  const healthBar = s.value(0);
  const healthAllowLit = s.value(0);
  const burnReveal = s.value(0);
  const polBar = s.value(0);
  const readyLit = s.value(0);
  const inRangeLit = s.value(0);
  const negProbe = s.value(0);
  const negReject = s.value(0);
  const srcRefresh = s.value(0);
  const stillPass = s.value(0);
  const digDiff = s.value(0);

  const hashOrig = shortHash(V3_PACKET.evidenceDigest, 10);
  const hashNew = shortHash(V3_CHANGED_PACKET.evidenceDigest, 10);

  const bgAtmo = cinemaAtmosphere(ROLE.merge, ROLE.reject);
  const { view: gate3d } = buildSuperstepBarrier3d(phase, barrierStatus, {
    x: 530,
    y: 25,
    theta: -0.72,
    phi: 1.05,
    distance: 15.0,
    unit: 100,
  });

  const title = heroTitle(['Wait for All Results,', 'Check What They Mean'], {
    x: -860,
    y: -440,
    size: 50,
    lineHeight: 58,
    accent: ROLE.merge,
    eyebrow: `VALIDATED FAN-IN  /  ${REQUEST.tenant}  /  v${REQUEST.version}`,
  });

  const live = guardedDynamic(s.value(1), () => {
    const mBatch = stBatch.value;
    const mCanon = stCanon.value;
    const mRates = stRates.value;
    const lx = -860;
    const nodes = [];

    // Right 3D header (steady text, zero crossSwap flash)
    nodes.push(
      txt('3D VALIDATION GATE', 530, -420, 26, ROLE.merge, 'mono').glow(6, ROLE.merge),
      txt('Scope  |  Canonical JSON  |  Rates', 530, -376, 26, COSMOS.muted, 'sans'),
      txt('Traffic remains 0% until explicit review & writer', 530, 395, 26, COSMOS.muted, 'sans'),
    );

    // =========================================================================
    // STAGE 0: Incoming Batch & Cross-Tenant Prediction Gate
    // =========================================================================
    if (mBatch > 0.02) {
      const hFix = healthFixed.value;
      const fail = Math.max(contractFail.value, rejectScope.value);

      nodes.push(
        txt(
          'INCOMING RECEIPTS  (TARGET: tenant7)',
          lx,
          -210,
          26,
          ROLE.eval,
          'mono',
          'left',
        ).opacity(mBatch),
        rule(lx, -186, 130, -186, ROLE.rule, 2).opacity(mBatch),
      );

      const cards = [
        {
          y: -110,
          branch: 'EVAL',
          tenant: 'tenant7',
          meta: '2/100  v3  done',
          col: ROLE.eval,
          bad: false,
        },
        {
          y: -15,
          branch: 'HEALTH',
          tenant: hFix > 0.5 ? 'tenant7' : 'tenant9',
          meta: '4/10k  v3  done',
          col: hFix > 0.5 ? ROLE.pass : ROLE.reject,
          bad: hFix <= 0.5,
        },
        {
          y: 80,
          branch: 'POLICY',
          tenant: 'tenant7',
          meta: 'cap 25%  v3  done',
          col: ROLE.policy,
          bad: false,
        },
      ];
      cards.forEach((row) => {
        const highlightBad = row.bad && otherTenant.value > 0.3;
        nodes.push(
          lumBar(-495, row.y, 730, 62, {
            color: highlightBad ? ROLE.reject : row.col,
            fillOpacity: highlightBad ? 0.24 : 0.14,
            strokeWidth: highlightBad ? 3 : 2.2,
            glow: highlightBad ? 12 : 6,
            opacity: mBatch,
          }),
          txt(row.branch, lx + 20, row.y, 26, row.col, 'mono', 'left').opacity(mBatch),
          txt(row.tenant, -640, row.y, 28, highlightBad ? ROLE.reject : COSMOS.ink, 'mono', 'left')
            .glow(highlightBad ? 8 : 0, ROLE.reject)
            .opacity(mBatch),
          txt(
            allDoneLit.value > 0.3 || fieldsOkLit.value > 0.3 ? `${row.meta} [OK]` : row.meta,
            -155,
            row.y,
            26,
            COSMOS.muted,
            'mono',
            'right',
          ).opacity(mBatch),
        );
      });

      // Two gate lamps: Barrier vs State Contract (verdict withheld until c.after!)
      const lampY = 185;
      nodes.push(
        glowRing(-790, lampY, 22, barrierOk.value > 0.3 ? ROLE.pass : COSMOS.muted, {
          fillOpacity: barrierOk.value > 0.3 ? 0.5 : 0.12,
          glow: barrierOk.value > 0.3 ? 11 : 0,
          opacity: mBatch,
        }),
        txt(
          barrierOk.value > 0.3 ? 'BARRIER: SATISFIED (3/3)' : 'BARRIER: 3/3 arrived',
          -750,
          lampY,
          26,
          barrierOk.value > 0.3 ? ROLE.pass : COSMOS.muted,
          'mono',
          'left',
        ).opacity(mBatch),
      );

      if (fail > 0.02 && hFix < 0.5) {
        nodes.push(
          glowRing(-300, lampY, 22, ROLE.reject, {
            fillOpacity: 0.55,
            glow: 12,
            opacity: mBatch * fail,
          }),
          txt('CONTRACT: REJECT tenant9', -260, lampY, 26, ROLE.reject, 'mono', 'left')
            .glow(8, ROLE.reject)
            .opacity(mBatch * fail),
        );
      } else if (hFix >= 0.5) {
        nodes.push(
          glowRing(-300, lampY, 22, ROLE.pass, { fillOpacity: 0.55, glow: 12, opacity: mBatch }),
          txt(
            sortedLit.value > 0.3 ? 'SORTED: [eval, health, policy]' : 'MATCHED: tenant7',
            -260,
            lampY,
            26,
            ROLE.pass,
            'mono',
            'left',
          ).opacity(mBatch),
        );
      } else {
        nodes.push(
          glowRing(-300, lampY, 22, ROLE.mark, {
            fillOpacity: 0.25,
            glow: 8,
            opacity: mBatch * (1 - fail),
          }),
          txt(
            askPredict.value > 0.3 ? 'PROCEED TO APPROVAL?  (?)' : 'DECISION: ???',
            -260,
            lampY,
            26,
            ROLE.mark,
            'mono',
            'left',
          ).opacity(mBatch * (1 - fail)),
        );
      }

      // 4 additional rejection criteria strip at bottom
      const reasons = [
        { label: 'Duplicate', v: rDup.value, x: -755 },
        { label: 'Missing', v: rMiss.value, x: -535 },
        { label: 'Stale rev', v: rStale.value, x: -305 },
        { label: 'Src mismatch', v: rSource.value, x: -45 },
      ];
      reasons.forEach((r) => {
        const hot = r.v > 0.35;
        nodes.push(
          lumBar(r.x, 290, 200, 50, {
            color: hot ? ROLE.reject : COSMOS.rule,
            fillOpacity: hot ? 0.22 : 0.08,
            glow: hot ? 9 : 0,
            opacity: mBatch,
          }),
          txt(r.label, r.x, 290, 26, hot ? COSMOS.ink : COSMOS.dim, 'mono').opacity(mBatch),
        );
      });

      if (arrivedLit.value > 0.02) {
        nodes.push(
          txt(
            'Sorted order stays identical whichever branch replied first',
            lx,
            372,
            26,
            ROLE.pass,
            'sans',
            'left',
          ).opacity(mBatch * arrivedLit.value),
        );
      }
    }

    // =========================================================================
    // STAGE 1: Canonical JSON Key Sorting & Digest Equivalence
    // =========================================================================
    if (mCanon > 0.02) {
      const sw = swapLit.value;
      const can = canonLit.value;
      const same = sameDigLit.value;

      nodes.push(
        txt('CANONICAL JSON ENCODING', lx, -210, 26, ROLE.eval, 'mono', 'left').opacity(mCanon),
        rule(lx, -186, 130, -186, ROLE.rule, 2).opacity(mCanon),
      );

      // Copy A
      nodes.push(
        txt('COPY A', lx, -110, 26, ROLE.eval, 'mono', 'left').opacity(mCanon),
        lumBar(-390, -52, 940, 62, {
          color: ROLE.eval,
          fillOpacity: 0.16,
          glow: 7,
          opacity: mCanon,
        }),
        txt(
          '{ "failures": 2,  "cases": 100 }',
          lx + 24,
          -52,
          28,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(mCanon),
      );

      // Copy B (swapped key order)
      nodes.push(
        txt(
          'COPY B (swapped keys)',
          lx,
          28,
          26,
          sw > 0.3 ? ROLE.mark : COSMOS.muted,
          'mono',
          'left',
        ).opacity(mCanon),
        lumBar(-390, 86, 940, 62, {
          color: sw > 0.3 ? ROLE.mark : ROLE.health,
          fillOpacity: 0.16,
          glow: sw > 0.3 ? 10 : 5,
          opacity: mCanon,
        }),
        txt(
          sw > 0.3 ? '{ "cases": 100,  "failures": 2 }' : '{ "failures": 2,  "cases": 100 }',
          lx + 24,
          86,
          28,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(mCanon),
      );

      // Canonical sorted output + SHA-256 match
      nodes.push(
        txt(
          can > 0.3 ? 'SORTED KEYS -> {"cases":100,"failures":2}' : 'Fix key order before hashing',
          lx,
          195,
          28,
          can > 0.3 ? ROLE.pass : COSMOS.muted,
          'mono',
          'left',
        ).opacity(mCanon),
      );
      if (same > 0.02) {
        nodes.push(
          lumBar(-390, 280, 940, 66, {
            color: ROLE.pass,
            fillOpacity: 0.24,
            strokeWidth: 2.8,
            glow: 11,
            opacity: mCanon * same,
          }),
          txt(`IDENTICAL DIGEST: sha256(${hashOrig}...)`, -390, 280, 28, ROLE.pass, 'mono').opacity(
            mCanon * same,
          ),
        );
      }
    }

    // =========================================================================
    // STAGE 2: Measured Threshold Gauges + Range Probe (-1) + Source Refresh (2->1)
    // =========================================================================
    if (mRates > 0.02) {
      const gw = 920;
      const gx = -860;
      const ref = srcRefresh.value;
      const evalFailures = ref > 0.5 ? 1 : values.eval.failures;
      const evalRatePct = ref > 0.5 ? '1.0%' : '2.0%';
      const evalLevel = ref > 0.5 ? 0.26 : 0.53 * Math.max(0.25, evalBar.value);

      nodes.push(
        txt(
          fictLit.value > 0.3 && evalBar.value < 0.2
            ? 'RELEASE THRESHOLDS  (fictional fixture limits)'
            : 'NUMERICAL POLICY CHECKS',
          gx,
          -225,
          26,
          ROLE.mark,
          'mono',
          'left',
        ).opacity(mRates),
        rule(gx, -201, 120, -201, ROLE.rule, 2).opacity(mRates),
      );

      // Gauge 1: Eval 2/100 = 2.0% <= 3.0% (or refreshed 1/100 = 1.0%)
      const g1 = renderGauge(gx, -120, gw, 24, evalLevel, {
        cap: 0.8,
        color: ref > 0.5 ? ROLE.pass : ROLE.eval,
        opacity: mRates,
      });
      nodes.push(
        ...g1.nodes,
        txt(
          `EVAL ${evalFailures}/100 = ${evalRatePct}`,
          gx,
          -166,
          26,
          ref > 0.5 ? ROLE.pass : ROLE.eval,
          'mono',
          'left',
        ).opacity(mRates),
        txt(
          evalLimLit.value > 0.3 ? 'limit <= 3.0%' : 'check limit',
          gx + gw,
          -166,
          26,
          COSMOS.muted,
          'mono',
          'right',
        ).opacity(mRates),
      );

      // Gauge 2: Health 4/10,000 = 0.04% <= 0.10% (40% = 0.4x allowance gated by burnReveal)
      const g2 = renderGauge(gx, 0, gw, 24, 0.32 * Math.max(0.25, healthBar.value), {
        cap: 0.8,
        color: ROLE.health,
        opacity: mRates,
      });
      nodes.push(
        ...g2.nodes,
        txt('HEALTH 4/10k = 0.04%', gx, -46, 26, ROLE.health, 'mono', 'left').opacity(mRates),
        txt(
          burnReveal.value > 0.3
            ? '40% of 0.1% (0.4x)'
            : healthAllowLit.value > 0.3
              ? 'limit <= 0.10%'
              : 'canary errors',
          gx + gw,
          -46,
          26,
          burnReveal.value > 0.3 ? ROLE.mark : COSMOS.muted,
          'mono',
          'right',
        ).opacity(mRates),
      );

      // Gauge 3: Policy traffic 25% <= 25% cap (or -1 probe!)
      const isNeg = negProbe.value > 0.4 && ref < 0.3;
      const g3 = renderGauge(gx, 120, gw, 24, isNeg ? 0.04 : 0.8 * Math.max(0.25, polBar.value), {
        cap: 0.8,
        color: isNeg ? ROLE.reject : ROLE.policy,
        opacity: mRates,
      });
      nodes.push(
        ...g3.nodes,
        txt(
          isNeg
            ? 'PROBE: traffic = -1 (out of range)'
            : `POLICY req ${REQUEST.traffic}% / cap ${values.policy.maxTraffic}%`,
          gx,
          74,
          26,
          isNeg ? ROLE.reject : ROLE.policy,
          'mono',
          'left',
        ).opacity(mRates),
        txt(
          isNeg && negReject.value > 0.3
            ? 'REJECTED'
            : inRangeLit.value > 0.3
              ? 'int [0..100]'
              : 'at ceiling',
          gx + gw,
          74,
          26,
          isNeg ? ROLE.reject : COSMOS.muted,
          'mono',
          'right',
        ).opacity(mRates),
      );

      // Bottom digest & readiness bar
      const by = 200;
      nodes.push(rule(gx, by - 25, 130, by - 25, ROLE.rule, 2).opacity(mRates));
      if (digDiff.value > 0.3 || ref > 0.5) {
        nodes.push(
          txt(`v3 (2/100):  ${hashOrig}...`, gx, by + 18, 26, COSMOS.muted, 'mono', 'left').opacity(
            mRates,
          ),
          txt(
            `v3 (1/100):  ${hashNew}...  (NEW DIGEST)`,
            gx,
            by + 64,
            26,
            ROLE.mark,
            'mono',
            'left',
          )
            .glow(7, ROLE.mark)
            .opacity(mRates),
          txt(
            stillPass.value > 0.3
              ? 'Both pass thresholds -> different reviewer evidence'
              : 'Source changed',
            gx,
            by + 114,
            26,
            ROLE.pass,
            'sans',
            'left',
          ).opacity(mRates),
        );
      } else {
        nodes.push(
          txt(
            readyLit.value > 0.3
              ? `PROPOSAL READY FOR REVIEW  |  digest ${hashOrig}...  |  live traffic 0%`
              : ratesInLit.value > 0.3 || polAllowLit.value > 0.3
                ? 'All three branch checks must pass before building proposal'
                : 'Check eval, health, and policy limits',
            gx,
            by + 30,
            26,
            readyLit.value > 0.3 ? ROLE.pass : COSMOS.muted,
            'mono',
            'left',
          ).opacity(mRates),
        );
      }
    }

    return nodes;
  });

  s.add(bgAtmo, gate3d, title, live);
  runAmbientPhase(s, c, phase, 2.4);
  orbitScene(s, c, gate3d, { theta: 0.3, phi: 0.98 });

  // Beat 0: Cross-tenant prediction setup
  tweenCue(s, c, 'intended-tenant', intendedLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'other-tenant', otherTenant, 1, { duration: 0.35 });
  tweenCue(s, c, 'all-finished', allDoneLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'expected-fields', fieldsOkLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'predict-join', askPredict, 1, { duration: 0.3 });

  // Beat 1: Reveal rejection strictly AFTER contract-fails / reject-scope
  tweenCue(s, c, 'barrier-ok', barrierOk, 1, { duration: 0.3 });
  c.after('contract-fails', () => {
    s.play(contractFail.to(1, { duration: 0.3 }), barrierStatus.to(-1, { duration: 0.3 }));
  });
  tweenCue(s, c, 'reject-scope', rejectScope, 1, { duration: 0.3, after: true });
  tweenCue(s, c, 'reason-duplicate', rDup, 1, { duration: 0.25 });
  tweenCue(s, c, 'reason-missing', rMiss, 1, { duration: 0.25 });
  tweenCue(s, c, 'reason-stale', rStale, 1, { duration: 0.25 });
  tweenCue(s, c, 'reason-source', rSource, 1, { duration: 0.25 });
  c.after('matching-receipts', () => {
    s.play(healthFixed.to(1, { duration: 0.35 }), barrierStatus.to(1, { duration: 0.35 }));
  });
  tweenCue(s, c, 'valid-identities', sortedLit, 1, { duration: 0.3, after: true });
  tweenCue(s, c, 'arrived-first', arrivedLit, 1, { duration: 0.3, after: true });

  // Sub-stage 1b: Canonical JSON encoding
  crossSwap(s, c, 'json-fields', stBatch, stCanon, { duration: 0.42 });
  tweenCue(s, c, 'json-fields', jsonLit, 1, { duration: 0.25 });
  tweenCue(s, c, 'swap-fields', swapLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'canonical-fields', canonLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'same-digest', sameDigLit, 1, { duration: 0.35, after: true });

  // Beats 2-3: Measured rates & probes
  crossSwap(s, c, 'numerical-rules', stCanon, stRates, { duration: 0.42 });
  tweenCue(s, c, 'numerical-rules', numLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'rates-inside', ratesInLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'policy-allows', polAllowLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'fictional', fictLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'validated-join-construct-3', evalBar, 0.5, { duration: 0.3 });
  tweenCue(s, c, 'join-eval-rate', evalBar, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'eval-limit', evalLimLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'health-count', healthBar, 0.5, { duration: 0.3 });
  tweenCue(s, c, 'join-health-rate', healthBar, 1, { duration: 0.35 });
  tweenCue(s, c, 'health-allowance', healthAllowLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'burn-share', burnReveal, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'policy-cap', polBar, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'ready-review', readyLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'in-range', inRangeLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'negative-reset', negProbe, 1, { duration: 0.3 });
  tweenCue(s, c, 'minus-one', negReject, 1, { duration: 0.3 });
  tweenCue(s, c, 'source-refresh', srcRefresh, 1, { duration: 0.35 });
  tweenCue(s, c, 'thresholds-still-pass', stillPass, 1, { duration: 0.3 });
  tweenCue(s, c, 'digests', digDiff, 1, { duration: 0.35 });
}
