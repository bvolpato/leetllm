// Scene 07 (prepared-dependencies): "How does a dependency reach an offline job?"
// Air-gapped 4-stage supply pipeline + SHA-256 lockfile verification chamber + builder isolation.
import { createHash } from 'node:crypto';
import {
  COSMOS,
  ROLE,
  WORKER_ID,
  cinemaAtmosphere,
  crossSwap,
  glowArrow,
  glowDot,
  guardedDynamic,
  heroTitle,
  lumBar,
  rule,
  tweenCue,
  txt,
  verifyInvariant,
} from '../parts.mjs';

const EXPECTED_HASH = '4dcd7efeab63e7e04b4519b5d817fb0dbf70e714e40843340ca890db60faae03';
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const shortHash = (h) => `sha256:${h.slice(0, 10)}...`;
const WRONG_BYTES = 'schema v3\n';
const PINNED_BYTES = 'schema v2\n';

export default function preparedDependencies(s, c) {
  const wrongHash = sha256(WRONG_BYTES);
  const pinnedHash = sha256(PINNED_BYTES);
  verifyInvariant(wrongHash !== EXPECTED_HASH, 'schema v3 mismatches lockfile pin');
  verifyInvariant(pinnedHash === EXPECTED_HASH, 'schema v2 matches lockfile pin');

  const fetchPos = s.value(0);
  const showEgress = s.value(0);
  const showWrong = s.value(0);
  const showPinned = s.value(0);
  const showQuestion = s.value(0);
  const showReject = s.value(0);
  const showMatch = s.value(0);
  const cachePos = s.value(0);
  const showOffline = s.value(0);
  const showMount = s.value(0);
  const scriptsHot = s.value(0);
  const showSecrets = s.value(0);
  const showInternal = s.value(0);

  const bgAtmo = cinemaAtmosphere(ROLE.host, ROLE.evidence);
  const title = heroTitle(['Prepared Dependencies', 'for Offline Jobs'], {
    x: -860,
    y: -445,
    size: 48,
    lineHeight: 56,
    accent: ROLE.host,
    eyebrow: 'TWO-PHASE AIR-GAPPED SUPPLY PIPELINE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const nodes = [];

    // === UPPER AIR-GAPPED PIPELINE (4 luminous stations) ===
    const py = -165;
    const xIndex = -730;
    const xBuilder = -235;
    const xCache = 235;
    const xWorker = 670;

    // 1. Package Index
    nodes.push(
      lumBar(xIndex, py, 240, 136, {
        color: COSMOS.muted,
        fillOpacity: 0.14,
        strokeWidth: 2,
        glow: 5,
      }),
      txt('PACKAGE', xIndex, py - 20, 26, COSMOS.muted, 'mono'),
      txt('INDEX', xIndex, py + 20, 26, COSMOS.ink, 'mono'),
    );

    // Arrow 1: Index -> Builder
    nodes.push(
      glowArrow([xIndex + 128, py], [xBuilder - 182, py], ROLE.evidence, { width: 4, tip: 13 }),
    );
    if (showEgress.value > 0.02) {
      nodes.push(
        txt('limited egress', -512, py - 118, 26, ROLE.host, 'mono').opacity(showEgress.value),
      );
    }
    if (fetchPos.value > 0.01 && showWrong.value < 0.5 && showPinned.value < 0.5) {
      const fx = xIndex + 132 + (xBuilder - 188 - (xIndex + 132)) * fetchPos.value;
      nodes.push(glowDot(fx, py, { radius: 9, color: ROLE.evidence, glow: 14 }));
    }

    // 2. Builder (isolated prep stage)
    nodes.push(
      lumBar(xBuilder, py, 340, 178, {
        color: scriptsHot.value > 0.4 ? ROLE.candidate : ROLE.warn,
        fillOpacity: 0.14,
        strokeWidth: 2.4,
        glow: 9,
      }),
      txt('BUILDER (PREP)', xBuilder, py - 56, 26, ROLE.warn, 'mono'),
      txt(
        'install scripts run here',
        xBuilder,
        py - 8,
        26,
        scriptsHot.value > 0.4 ? ROLE.candidate : COSMOS.muted,
        'sans',
      ),
    );
    if (showWrong.value > 0.02) {
      nodes.push(
        txt('schema v3 (fetched)', xBuilder, py + 44, 26, ROLE.candidate, 'mono').opacity(
          showWrong.value,
        ),
      );
    }
    if (showPinned.value > 0.02) {
      nodes.push(
        txt('schema v2 (fetched)', xBuilder, py + 44, 26, ROLE.pass, 'mono').opacity(
          showPinned.value,
        ),
      );
    }

    // Arrow 2: Builder -> Approved Cache
    nodes.push(
      glowArrow([xBuilder + 178, py], [xCache - 142, py], ROLE.pass, { width: 4, tip: 13 }),
    );
    if (cachePos.value > 0.01 && cachePos.value < 0.99) {
      const cx = xBuilder + 182 + (xCache - 148 - (xBuilder + 182)) * cachePos.value;
      nodes.push(glowDot(cx, py, { radius: 9, color: ROLE.pass, glow: 14 }));
    }

    // 3. Approved Cache
    nodes.push(
      lumBar(xCache, py, 265, 136, {
        color: cachePos.value > 0.9 ? ROLE.pass : ROLE.host,
        fillOpacity: 0.14,
        strokeWidth: 2.2,
        glow: 8,
      }),
      txt('APPROVED', xCache, py - 24, 26, ROLE.host, 'mono'),
      txt('CACHE', xCache, py + 14, 26, COSMOS.ink, 'mono'),
    );
    if (cachePos.value > 0.85) {
      nodes.push(
        txt('schema v2', xCache, py + 104, 26, ROLE.pass, 'mono').opacity(
          Math.min(1, (cachePos.value - 0.85) * 6.5),
        ),
      );
    }

    // Arrow 3: Cache -> Offline Worker
    nodes.push(
      glowArrow([xCache + 140, py], [xWorker - 186, py], ROLE.host, { width: 4, tip: 13 }),
    );
    if (showMount.value > 0.02) {
      nodes.push(txt('read-only', 428, py - 118, 26, ROLE.host, 'mono').opacity(showMount.value));
    }

    // 4. Offline Worker
    nodes.push(
      lumBar(xWorker, py, 350, 178, {
        color: ROLE.candidate,
        fillOpacity: 0.14,
        strokeWidth: 2.4,
        glow: 9,
      }),
      txt(WORKER_ID, xWorker, py - 56, 26, ROLE.candidate, 'mono'),
      txt('parse.py', xWorker, py - 8, 26, COSMOS.ink, 'mono'),
    );
    if (showOffline.value > 0.02) {
      nodes.push(
        txt('network: closed', xWorker, py + 116, 26, ROLE.host, 'mono').opacity(showOffline.value),
      );
    }
    if (showMount.value > 0.02) {
      nodes.push(
        txt('schema v2 (:ro)', xWorker, py + 44, 26, ROLE.pass, 'mono').opacity(showMount.value),
      );
    }

    // === LOWER HALF: Left = SHA-256 Lockfile Gate | Center = Decision | Right = Builder Guards ===
    const ly = 68;
    nodes.push(
      txt('TRUSTED LOCKFILE PIN', -860, ly, 26, ROLE.host, 'mono', 'left'),
      rule(-860, ly + 24, -220, ly + 24, ROLE.host, 2),
      txt(shortHash(EXPECTED_HASH), -860, ly + 74, 34, ROLE.host, 'mono', 'left').glow(
        7,
        ROLE.host,
      ),
      txt('DOWNLOADED CANDIDATE HASH', -860, ly + 162, 26, ROLE.evidence, 'mono', 'left'),
      rule(-860, ly + 186, -220, ly + 186, ROLE.rule, 2),
    );
    if (showWrong.value > 0.02) {
      nodes.push(
        txt(shortHash(wrongHash), -860, ly + 236, 34, ROLE.candidate, 'mono', 'left')
          .glow(8, ROLE.candidate)
          .opacity(showWrong.value),
        txt('schema v3 != pin', -860, ly + 292, 26, ROLE.candidate, 'mono', 'left').opacity(
          showWrong.value,
        ),
      );
    }
    if (showPinned.value > 0.02) {
      nodes.push(
        txt(shortHash(pinnedHash), -860, ly + 236, 34, ROLE.pass, 'mono', 'left')
          .glow(8, ROLE.pass)
          .opacity(showPinned.value),
        txt('schema v2 == pin', -860, ly + 292, 26, ROLE.pass, 'mono', 'left').opacity(
          showPinned.value,
        ),
      );
    }

    // Center decision column (strict non-overlapping transitions)
    const cx = -135;
    nodes.push(
      txt('CACHE ADMISSION GATE', cx, ly, 26, ROLE.mark, 'mono', 'left'),
      rule(cx, ly + 24, 325, ly + 24, ROLE.rule, 2),
    );
    if (showQuestion.value > 0.02) {
      nodes.push(
        txt('Should v3 enter', cx, ly + 92, 36, ROLE.mark, 'serif', 'left')
          .glow(8, ROLE.mark)
          .opacity(showQuestion.value),
        txt('the approved cache?', cx, ly + 144, 36, ROLE.mark, 'serif', 'left')
          .glow(8, ROLE.mark)
          .opacity(showQuestion.value),
      );
    }
    if (showReject.value > 0.02) {
      nodes.push(
        lumBar(cx + 210, ly + 114, 420, 74, {
          color: ROLE.candidate,
          fillOpacity: 0.18,
          strokeWidth: 2.5,
          glow: 10,
          opacity: showReject.value,
        }),
        txt('REJECT schema v3', cx + 210, ly + 114, 32, ROLE.candidate, 'mono').opacity(
          showReject.value,
        ),
      );
    }
    if (showMatch.value > 0.02) {
      nodes.push(
        lumBar(cx + 210, ly + 114, 420, 74, {
          color: ROLE.pass,
          fillOpacity: 0.18,
          strokeWidth: 2.5,
          glow: 10,
          opacity: showMatch.value,
        }),
        txt('ADMIT schema v2', cx + 210, ly + 114, 32, ROLE.pass, 'mono').opacity(showMatch.value),
      );
    }

    // Right column: Builder hardening rules
    const rx = 400;
    nodes.push(
      txt('KEPT OUT OF BUILDER', rx, ly, 26, ROLE.candidate, 'mono', 'left'),
      rule(rx, ly + 24, 855, ly + 24, ROLE.candidate, 2),
      txt(
        'Review install scripts',
        rx,
        ly + 80,
        26,
        scriptsHot.value > 0.4 ? ROLE.mark : COSMOS.muted,
        'sans',
        'left',
      ),
    );
    if (showSecrets.value > 0.02) {
      nodes.push(
        glowDot(rx + 12, ly + 148, {
          radius: 7,
          color: ROLE.candidate,
          opacity: showSecrets.value,
        }),
        txt('No production secrets', rx + 36, ly + 148, 28, ROLE.candidate, 'sans', 'left').opacity(
          showSecrets.value,
        ),
      );
    }
    if (showInternal.value > 0.02) {
      nodes.push(
        glowDot(rx + 12, ly + 212, {
          radius: 7,
          color: ROLE.candidate,
          opacity: showInternal.value,
        }),
        txt('No internal network', rx + 36, ly + 212, 28, ROLE.candidate, 'sans', 'left').opacity(
          showInternal.value,
        ),
      );
    }

    return nodes;
  });

  s.add(bgAtmo, title, live);

  tweenCue(s, c, 'pd-fetch', fetchPos, 1, { duration: 1.0 });
  tweenCue(s, c, 'pd-egress', showEgress, 1, { duration: 0.35 });
  tweenCue(s, c, 'pd-hash', showWrong, 1, { duration: 0.35 });
  tweenCue(s, c, 'pd-decide', showQuestion, 1, { duration: 0.35 });
  crossSwap(s, c, 'pd-hold', showQuestion, showReject, { duration: 0.4, after: true });
  crossSwap(s, c, 'pd-retry', showWrong, showPinned, { duration: 0.42 });
  tweenCue(s, c, 'pd-retry', showReject, 0, { duration: 0.18 });
  tweenCue(s, c, 'pd-match', showMatch, 1, { duration: 0.35, after: true });
  c.on('pd-offline', () => {
    s.play(cachePos.to(1, { duration: 0.85 }));
  });
  tweenCue(s, c, 'pd-offline', showOffline, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'pd-mount', showMount, 1, { duration: 0.35 });
  tweenCue(s, c, 'pd-untrusted', scriptsHot, 1, { duration: 0.4 });
  tweenCue(s, c, 'pd-secrets', showSecrets, 1, { duration: 0.35 });
  tweenCue(s, c, 'pd-internal', showInternal, 1, { duration: 0.35 });
}
