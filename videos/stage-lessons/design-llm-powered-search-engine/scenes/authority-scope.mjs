// Scene 4: authority-scope - Carry authenticated scope through every branch
// Authenticated principal radiates 6 shielded branch conduits; Beat 1 shows mid-flight revocation
// halting policy@2 at the trusted boundary; Beat 2 shows the exact N=2 vs N=4 IDF side-channel.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  IDF_ELIGIBLE,
  IDF_GLOBAL,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  glowMeter,
  guardedDynamic,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function authorityScope(s, c) {
  const pulse = s.value(0);
  const fanout = s.value(0);
  const beat1On = s.value(0);
  const recheckSlide = s.value(0);
  const beat2On = s.value(0);
  const statsOn = s.value(0);

  const header = cinemaHeader('AUTHENTICATED SCOPE', 'Carry one principal', 'across every branch', {
    accent: ROLE.policy,
    size: 46,
  });

  const stageAura = aura(120, -20, 680, '#60a5fa20', '#ffd16614');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const fn = fanout.value;
      const b1 = beat1On.value > 0.5;
      const rc = recheckSlide.value;
      const b2 = beat2On.value > 0.5;
      const st = statsOn.value;
      const nodes = [];

      // Persistent top scope rail: Authenticated principal -> 6 destinations
      const branches = ['raw query', 'rewrite', 'parent fetch', 'reranker', 'preview', 'cache'];
      const litCount = Math.max(1, Math.ceil(Math.max(0.15, fn) * branches.length));

      nodes.push(
        txt(
          'TRUSTED PRINCIPAL: workspace-a / engineering',
          840,
          -400,
          28,
          ROLE.query,
          'mono',
          'right',
        ).glow(6, ROLE.query),
        line([-840, -245], [840, -245], { stroke: ROLE.policy, width: 3.5 }).glow(7, ROLE.policy),
      );

      branches.forEach((name, i) => {
        const x = -715 + i * 286;
        const lit = i < litCount;
        const col = lit ? ROLE.policy : COSMOS.dim;
        nodes.push(
          beamWithPhotons(quadArcPts([x, -245], [x, -168], 0, 12), col, p + i * 0.15, {
            width: 2.8,
            glow: lit ? 7 : 0,
            photonCount: lit ? 1 : 0,
            alpha: lit ? 0.95 : 0.35,
          }),
          rect(246, 114, { fill: '#0d1528', stroke: col, width: lit ? 2.6 : 1.8, radius: 12 }).at(
            x,
            -108,
          ),
          txt(name, x, -126, 26, lit ? COSMOS.ink : COSMOS.dim, 'mono', 'center'),
          txt(
            lit ? 'workspace-a' : 'locked',
            x,
            -80,
            26,
            lit ? ROLE.query : COSMOS.dim,
            'mono',
            'center',
          ),
        );
      });

      if (b2) {
        // Beat 2: Global vs Eligible IDF side-channel
        nodes.push(
          txt(
            'TERM "approval" APPEARS IN 1 DOCUMENT (df = 1)',
            -840,
            45,
            28,
            COSMOS.ink,
            'mono',
            'left',
          ),
          txt(
            `Eligible corpus (N = 2):  IDF = ${IDF_ELIGIBLE.toFixed(4)}`,
            -840,
            122,
            28,
            ROLE.policy,
            'mono',
            'left',
          ),
          glowMeter(-840, 178, 720, 44, IDF_ELIGIBLE / 1.4, { fill: ROLE.policy }),

          txt(
            `Global index (N = 4):    IDF = ${IDF_GLOBAL.toFixed(4)}`,
            80,
            122,
            28,
            ROLE.focus,
            'mono',
            'left',
          ),
          glowMeter(80, 178, 720, 44, (IDF_GLOBAL / 1.4) * (0.25 + 0.75 * st), {
            fill: ROLE.focus,
          }),

          txt(
            'ln(1 + (N - df + 0.5) / (df + 0.5))  ->  term looks rarer in larger global index',
            -840,
            286,
            28,
            ROLE.focus,
            'mono',
            'left',
          ),
          txt(
            'Filtering results alone leaves global scoring statistics intact; isolate indexes when needed.',
            -840,
            364,
            28,
            COSMOS.muted,
            'sans',
            'left',
          ),
        );
      } else if (b1) {
        // Beat 1: Pre-filter preference + mid-flight permission recheck before crossing
        const revoked = rc > 0.55;
        const pktX = -710 + rc * 540;
        const wallX = -40;
        const wallCol = revoked ? ROLE.deny : ROLE.focus;

        nodes.push(
          txt(
            'FILTER BEFORE TOP-K WHEN SUPPORTED  ·  RECHECK BEFORE CROSSING BOUNDARY',
            -840,
            40,
            26,
            ROLE.focus,
            'mono',
            'left',
          ),
          line([-840, 210], [wallX - 10, 210], { stroke: '#2c3d66', width: 3 }),
          rect(240, 84, {
            fill: '#0e172c',
            stroke: revoked ? ROLE.deny : ROLE.policy,
            width: 3,
            radius: 10,
          })
            .at(pktX, 210)
            .glow(8, revoked ? ROLE.deny : ROLE.policy),
          txt('policy@2', pktX, 210, 28, revoked ? ROLE.deny : ROLE.policy, 'mono', 'center'),

          // Trusted boundary barrier
          line([wallX, 95], [wallX, 325], { stroke: wallCol, width: 6 }).glow(11, wallCol),
          txt('TRUSTED CHECK', wallX, 368, 26, wallCol, 'mono', 'center'),

          // Right panel: live grant state
          rect(740, 210, { fill: '#0e1526', stroke: wallCol, width: 2.8, radius: 14 }).at(440, 210),
          txt('LIVE PERMISSION CHECK', 105, 146, 26, COSMOS.muted, 'mono', 'left'),
          txt(
            revoked ? 'engineering grant: REVOKED' : 'engineering grant: PRESENT',
            105,
            210,
            32,
            revoked ? ROLE.deny : ROLE.ok,
            'mono',
            'left',
          ).glow(6, revoked ? ROLE.deny : ROLE.ok),
          txt(
            revoked ? 'HALTED: no text crosses boundary' : 'Checking before reranker / publish',
            105,
            274,
            26,
            revoked ? ROLE.deny : COSMOS.muted,
            'sans',
            'left',
          ),
        );
      } else {
        // Beat 0: immutable scope statement
        nodes.push(
          rect(1680, 180, { fill: '#0d1527', stroke: ROLE.query, width: 2.4, radius: 14 }).at(
            0,
            170,
          ),
          txt('FAIL-CLOSED ACCESS RULE', -800, 122, 26, ROLE.query, 'mono', 'left'),
          txt(
            'Missing access metadata denies the document. Neither a query nor a source page can widen scope.',
            -800,
            192,
            30,
            COSMOS.ink,
            'sans',
            'left',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.8, { startOffset: 0.1, endMargin: 0.5 });

  c.on('se-authority-scope-0', () => {
    s.play(fanout.to(1, { duration: clampDur(c, c.cue('se-authority-scope-0').start, 1.1) }));
  });
  c.on('se-authority-scope-1', () => {
    s.play(beat1On.to(1, { duration: clampDur(c, c.cue('se-authority-scope-1').start, 0.25) }));
  });
  c.on('se-authority-scope-recheck', () => {
    s.play(
      recheckSlide.to(1, {
        duration: clampDur(c, c.cue('se-authority-scope-recheck').start, 1.0),
      }),
    );
  });
  c.on('se-authority-scope-2', () => {
    s.play(beat2On.to(1, { duration: clampDur(c, c.cue('se-authority-scope-2').start, 0.25) }));
  });
  c.on('se-authority-scope-statistics', () => {
    s.play(
      statsOn.to(1, {
        duration: clampDur(c, c.cue('se-authority-scope-statistics').start, 0.55),
      }),
    );
  });
}
