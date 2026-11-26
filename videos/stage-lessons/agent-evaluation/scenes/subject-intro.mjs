// Scene 1: subject-intro - Did Lena get her reservation?
// Optical comparison between the assistant's chat promise on the left and Lena's
// real library account on the right, strictly withholding the zero-hold failure verdict
// until after `opening-verdict`.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  autoNode,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  quadArcPts,
  railBar,
  river,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function subjectIntro(s, c) {
  const pulse = s.value(0);
  const claimGlow = s.value(0);
  const bridgeOn = s.value(0);
  const accountOpen = s.value(0);
  const scanOn = s.value(0);
  const verdictOn = s.value(0);

  const header = cinemaHeader('AGENT EVALUATION', 'Did Lena get her', 'reservation?', {
    accent: ROLE.pass,
    size: 50,
  });

  const stageAura = aura(240, 40, 620, '#5ce1e620', '#6ee7b716');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const cg = claimGlow.value;
      const br = bridgeOn.value;
      const ao = accountOpen.value;
      const sc = scanOn.value;
      const vd = verdictOn.value;
      const nodes = [];

      // Left: Assistant chat promise rail + book catalog emblem
      const claimCol = cg > 0.3 ? ROLE.host : COSMOS.muted;
      nodes.push(
        railBar(-840, -170, 55, claimCol, { width: 5, glow: cg > 0.3 ? 10 : 4 }),
        txt('ASSISTANT CHAT REPLY', -810, -150, 26, claimCol, 'mono', 'left'),
        txt('“Your book is reserved.”', -810, -82, 42, COSMOS.ink, 'serif', 'left').glow(
          cg * 8,
          ROLE.host,
        ),
        txt('Claim from candidate output', -810, -12, 26, COSMOS.muted, 'sans', 'left'),
        txt(
          'Unverified text alone proves nothing',
          -810,
          36,
          26,
          vd > 0.4 ? ROLE.fail : COSMOS.dim,
          'mono',
          'left',
        ),
      );

      // Lower-left: Book B7 optical target emblem (circular node, zero box chrome)
      const bookNode = autoNode(-740, 240, river.book, {
        radius: 56,
        color: sc > 0.3 ? ROLE.read : ROLE.pass,
        glow: sc > 0.3 ? 12 : 7,
        size: 36,
      });
      nodes.push(
        bookNode.node,
        txt(river.title, -640, 214, 34, COSMOS.ink, 'serif', 'left'),
        txt('Requested: 1 hold for Lena', -640, 264, 26, COSMOS.muted, 'mono', 'left'),
      );

      // Center: Optical verification node linking Chat Claim <-> Library Account
      const probeCol = vd > 0.4 ? ROLE.fail : ao > 0.4 ? ROLE.read : ROLE.focus;
      const probeLabel = vd > 0.4 ? '0 != 1' : ao > 0.4 ? 'CHECK B7' : 'VERIFY?';
      const probe = autoNode(0, 20, probeLabel, {
        radius: 66,
        color: probeCol,
        glow: 10,
        size: 28,
      });
      nodes.push(probe.node);

      const leftAnchor = [-270, -50];
      const rightAnchor = [260, -50];
      const [l0, l1] = trimSeg(leftAnchor, [0, 20], 0, probe.r);
      const [r0, r1] = trimSeg([0, 20], rightAnchor, probe.r, 0);

      nodes.push(
        beamWithPhotons(quadArcPts(l0, l1, -30, 20), ROLE.host, p, {
          width: 3.2,
          glow: 8,
          photonCount: br > 0.2 ? 2 : 1,
          alpha: 0.45 + 0.55 * br,
        }),
        beamWithPhotons(quadArcPts(r0, r1, -30, 20), probeCol, p + 0.35, {
          width: 3.4,
          glow: 9,
          photonCount: ao > 0.2 || br > 0.2 ? 2 : 1,
          alpha: 0.35 + 0.65 * Math.max(br, ao),
        }),
      );

      // Right: Lena's Library Account Ledger Rail
      const accCol = vd > 0.4 ? ROLE.fail : ao > 0.3 ? ROLE.read : COSMOS.dim;
      nodes.push(
        railBar(270, -170, 260, accCol, { width: 5, glow: ao > 0.3 ? 10 : 4 }),
        txt('LIBRARY ACCOUNT RECORD', 300, -150, 26, accCol, 'mono', 'left'),
        txt(river.reader, 300, -86, 46, COSMOS.ink, 'serif', 'left'),
        txt(
          ao > 0.3 ? `version ${river.start}` : 'Sealed until inspected',
          850,
          -86,
          28,
          ao > 0.3 ? ROLE.read : COSMOS.dim,
          'mono',
          'right',
        ),
        line([300, -34], [850, -34], { stroke: '#2b3b64', width: 2 }),
      );

      if (ao < 0.35) {
        const veilAlpha = 1 - ao * 2.5;
        nodes.push(
          txt('OPEN ACCOUNT TO CHECK HOLDS', 300, 62, 28, COSMOS.muted, 'mono', 'left').opacity(
            Math.max(0, veilAlpha),
          ),
          txt('Target catalog ID: B7', 300, 122, 26, COSMOS.dim, 'mono', 'left').opacity(
            Math.max(0, veilAlpha),
          ),
        );
      } else {
        const showAlpha = Math.min(1, (ao - 0.35) * 2.2);
        nodes.push(
          txt('HOLD ID', 300, 14, 26, COSMOS.dim, 'mono', 'left').opacity(showAlpha),
          txt('BOOK', 850, 14, 26, COSMOS.dim, 'mono', 'right').opacity(showAlpha),
          line([300, 44], [850, 44], { stroke: '#243154', width: 2 }).opacity(showAlpha),
          txt('(no hold rows on record)', 300, 108, 30, COSMOS.muted, 'mono', 'left').opacity(
            showAlpha,
          ),
          line([300, 152], [850, 152], { stroke: '#243154', width: 2 }).opacity(showAlpha),
        );
        if (sc > 0.1 && vd < 0.05) {
          nodes.push(
            txt('Filter: reader = Lena · book = B7', 300, 212, 26, ROLE.focus, 'mono', 'left')
              .glow(6, ROLE.focus)
              .opacity(showAlpha * sc),
          );
        }
      }

      // Verdict strictly withheld until `c.after('opening-verdict')`!
      if (vd > 0.35) {
        const vA = Math.min(1, (vd - 0.35) * 2.2);
        nodes.push(
          txt('MATCHING B7 HOLDS: 0', 300, 216, 32, ROLE.fail, 'mono', 'left')
            .glow(10, ROLE.fail)
            .opacity(vA),
          txt(
            'VERDICT: FAIL THIS RUN  (0 holds found; 1 requested)',
            0,
            392,
            34,
            ROLE.fail,
            'mono',
            'center',
          )
            .glow(11, ROLE.fail)
            .opacity(vA),
        );
      } else {
        nodes.push(
          txt(
            ao > 0.3
              ? 'Compare the account rows against Lena’s request for B7'
              : 'Where is the authoritative evidence of a hold?',
            0,
            392,
            28,
            COSMOS.muted,
            'mono',
            'center',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.0, { startOffset: 0.1, endMargin: 0.5 });

  c.on('completion-claim', () => {
    s.play(claimGlow.to(1, { duration: clampDur(c, c.cue('completion-claim').start, 0.4) }));
  });
  c.on('choose-record', () => {
    s.play(bridgeOn.to(1, { duration: clampDur(c, c.cue('choose-record').start, 0.45) }));
  });
  c.on('inspect-account', () => {
    s.play(accountOpen.to(1, { duration: clampDur(c, c.cue('inspect-account').start, 0.5) }));
  });
  c.on('empty-account', () => {
    s.play(scanOn.to(1, { duration: clampDur(c, c.cue('empty-account').start, 0.4) }));
  });
  c.after('opening-verdict', () => {
    s.play(verdictOn.to(1, { duration: clampDur(c, c.cue('opening-verdict').end, 0.35) }));
  });
}
