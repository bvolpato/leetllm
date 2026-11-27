// Scene 27: fresh-boundary - What can the gateway do for R-205?
// Finale 3-gate dashboard + final ACL transfer:
// (1) Capacity: 25k/125k = 200ms <= 250ms + 1 slot + 16 blocks -> ACCEPT
// (2) ACL Snapshot: 75s > 60s -> STALE -> repaired to 10s -> USABLE
// (3) Release Gate: leaks blank -> HOLD -> repaired to int 0 -> CANARY ELIGIBLE
// (4) Finance Plan Document: STRICT prediction pause 2 -> EXCLUDED (finance grant missing)!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  FRESH_ADM,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function freshBoundary(s, c) {
  const capRev = s.value(0); // STRICT after sd-fresh-capacity!
  const aclRev = s.value(0); // STRICT after sd-fresh-acl!
  const relRev = s.value(0); // STRICT after sd-fresh-release!
  const repIn = s.value(0); // 10s snapshot + int 0 leaks
  const repRes = s.value(0); // STRICT after sd-fresh-repair-result!
  const docQ = s.value(0); // Ask about finance plan
  const docStop = s.value(0); // STRICT after fresh-doc-stop!

  const header = cinemaHeader('FINAL TRANSFER: R-205', 'What can the gateway', 'do for R-205?', {
    x: -860,
    y: -445,
    accent: ROLE.ok,
    size: 48,
  });

  const bgAura = aura(40, 20, 680, '#6ee7b71a', '#ffd16618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const cp = capRev.value;
      const ac = aclRev.value;
      const rl = relRev.value;
      const ri = repIn.value;
      const rr = repRes.value;
      const dq = docQ.value;
      const ds = docStop.value;
      const nodes = [];

      // 4-Row Independent Decision Dashboard for R-205
      const lx = -850;
      const mx = -410;
      const rx = 250;
      nodes.push(
        txt('BOUNDARY', lx, -210, 26, COSMOS.muted, 'mono', 'left'),
        txt('LIVE INPUT', mx, -210, 26, COSMOS.muted, 'mono', 'left'),
        txt('DECISION', rx, -210, 26, ROLE.focus, 'mono', 'left'),
      );

      // Row 1: Capacity Admission (25k / 125k = 200 ms <= 250 ms)
      const capDec =
        cp > 0.4 ? `ACCEPT (${Math.round(FRESH_ADM.estimatedWait * 1000)} ms <= 250)` : '[ ? ]';
      const capCol = cp > 0.4 ? ROLE.ok : ROLE.focus;
      nodes.push(
        txt('1. CAPACITY', lx, -130, 26, ROLE.req, 'mono', 'left'),
        txt('25k tok · 1 slot · 16 blk', mx, -130, 26, COSMOS.ink, 'mono', 'left'),
        txt(capDec, rx, -130, 26, capCol, 'mono', 'left').glow(cp > 0.4 ? 7 : 0, capCol),
      );

      // Row 2: ACL Snapshot Freshness (75s -> STALE -> repaired 10s -> USABLE!)
      const aclInput = ri > 0.4 ? 'age = 10 s (limit 60 s)' : 'age = 75 s (limit 60 s)';
      const aclDec =
        rr > 0.4
          ? 'USABLE (10 s <= 60 s)'
          : ri > 0.4
            ? '[ ? ]'
            : ac > 0.4
              ? 'STALE (75 s > 60 s)'
              : '[ ? ]';
      const aclCol = rr > 0.4 ? ROLE.ok : ri > 0.4 ? ROLE.focus : ac > 0.4 ? ROLE.fail : ROLE.focus;
      nodes.push(
        txt('2. ACL AGE', lx, -45, 26, ROLE.warn, 'mono', 'left'),
        txt(aclInput, mx, -45, 26, COSMOS.ink, 'mono', 'left'),
        txt(aclDec, rx, -45, 26, aclCol, 'mono', 'left').glow(
          (ac > 0.4 && ri <= 0.4) || rr > 0.4 ? 7 : 0,
          aclCol,
        ),
      );

      // Row 3: Release Gate (leaks blank -> HOLD -> repaired int 0 -> CANARY!)
      const relInput = ri > 0.4 ? 'scores OK · leaks = 0 (int)' : 'scores OK · leaks = blank';
      const relDec =
        rr > 0.4
          ? 'ENTER CANARY (0 int)'
          : ri > 0.4
            ? '[ ? ]'
            : rl > 0.4
              ? 'HOLD (leaks missing)'
              : '[ ? ]';
      const relCol = rr > 0.4 ? ROLE.ok : ri > 0.4 ? ROLE.focus : rl > 0.4 ? ROLE.fail : ROLE.focus;
      nodes.push(
        txt('3. RELEASE', lx, 40, 26, ROLE.policy, 'mono', 'left'),
        txt(relInput, mx, 40, 26, COSMOS.ink, 'mono', 'left'),
        txt(relDec, rx, 40, 26, relCol, 'mono', 'left').glow(
          (rl > 0.4 && ri <= 0.4) || rr > 0.4 ? 7 : 0,
          relCol,
        ),
      );

      // Row 4: Finance Plan Grant Check (STRICT prediction withholding until fresh-doc-stop!)
      const docAlpha = dq > 0.2 || ds > 0.2 ? 1 : 0.35;
      const docDec = ds > 0.4 ? 'EXCLUDED (no finance grant)' : '[ ? ]';
      const docCol = ds > 0.4 ? ROLE.fail : ROLE.focus;
      nodes.push(
        txt('4. DOC GRANT', lx, 125, 26, ROLE.fail, 'mono', 'left').opacity(docAlpha),
        txt('[employees] -> finance-plan', mx, 125, 26, COSMOS.ink, 'mono', 'left').opacity(
          docAlpha,
        ),
        txt(docDec, rx, 125, 26, docCol, 'mono', 'left')
          .glow(ds > 0.4 ? 8 : 0, docCol)
          .opacity(docAlpha),
      );

      // Top-right rule
      nodes.push(
        txt('INDEPENDENT BOUNDARIES', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt(
          'Fixing age & leaks never grants finance ACL',
          480,
          -378,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Bottom prediction pauses & final support receipt!
      const botY = 275;
      nodes.push(line([-840, 200], [840, 200], { stroke: '#25355a', width: 2 }).opacity(0.65));
      if (ds > 0.4) {
        nodes.push(
          txt(
            'SUPPORT RECEIPT: R-205 · finance-plan EXCLUDED · finance grant missing',
            0,
            botY,
            28,
            ROLE.ok,
            'mono',
            'center',
          ).glow(9, ROLE.ok),
          txt(
            'Capacity accepts · Snapshot fresh · Canary allowed · Private document still blocked!',
            0,
            botY + 54,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ),
        );
      } else if (dq > 0.35) {
        nodes.push(
          txt(
            'Caller is in [employees]. May the finance plan appear in R-205’s answer?',
            0,
            botY,
            32,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      } else if (cp < 0.35) {
        nodes.push(
          txt(
            'Predict all three: Admit R-205? Snapshot fresh? Candidate enter canary?',
            0,
            botY,
            32,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      } else {
        nodes.push(
          txt(
            'Each repair moves ONLY its own boundary; independent checks remain enforced',
            0,
            botY,
            26,
            COSMOS.muted,
            'mono',
            'center',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.after('sd-fresh-capacity', () => {
    s.play(capRev.to(1, { duration: clampDur(c, c.cue('sd-fresh-capacity').end, 0.35) }));
  });
  c.after('sd-fresh-acl', () => {
    s.play(aclRev.to(1, { duration: clampDur(c, c.cue('sd-fresh-acl').end, 0.35) }));
  });
  c.after('sd-fresh-release', () => {
    s.play(relRev.to(1, { duration: clampDur(c, c.cue('sd-fresh-release').end, 0.35) }));
  });
  c.on('sd-fresh-repair-inputs', () => {
    s.play(repIn.to(1, { duration: clampDur(c, c.cue('sd-fresh-repair-inputs').start, 0.35) }));
  });
  c.after('sd-fresh-repair-result', () => {
    s.play(repRes.to(1, { duration: clampDur(c, c.cue('sd-fresh-repair-result').end, 0.35) }));
  });
  c.on('fresh-doc-question', () => {
    s.play(docQ.to(1, { duration: clampDur(c, c.cue('fresh-doc-question').start, 0.35) }));
  });
  c.after('fresh-doc-stop', () => {
    s.play(docStop.to(1, { duration: clampDur(c, c.cue('fresh-doc-stop').end, 0.4) }));
  });
}
