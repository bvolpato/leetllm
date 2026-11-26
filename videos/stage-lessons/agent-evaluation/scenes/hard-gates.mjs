// Scene 4: hard-gates - Does the read verify the write?
// Field-by-field optical comparator aligning the permitted write receipt (left) against
// an independent account read (right). Tests wrong book (B8), stale version (v2), and
// a denied forbidden private-account attempt overriding an otherwise clean outcome.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  railBar,
  segmentWithPhoton,
  txt,
} from '../parts.mjs';

export default function hardGates(s, c) {
  const pulse = s.value(0);
  const readArrived = s.value(0);
  const fieldsChecked = s.value(0);
  const passVerdict = s.value(0);
  const wrongBook = s.value(0);
  const staleVer = s.value(0);
  const cfFail = s.value(0);
  const forbidOn = s.value(0);
  const noLeakNote = s.value(0);
  const forbidFail = s.value(0);

  const header = cinemaHeader('HARD VERIFICATION GATES', 'Does the read', 'verify the write?', {
    accent: ROLE.pass,
    size: 50,
  });

  const stageAura = aura(120, 40, 640, '#6ee7b71a', '#ff6b8b14');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const ra = readArrived.value;
      const fc = fieldsChecked.value;
      const pv = passVerdict.value;
      const wb = wrongBook.value;
      const sv = staleVer.value;
      const cf = cfFail.value;
      const fb = forbidOn.value;
      const nl = noLeakNote.value;
      const ff = forbidFail.value;
      const nodes = [];

      // Current counterfactual state of the read snapshot (restored on beat 2 when fb > 0.3)
      const isWrongBook = wb > 0.8 && sv < 0.4 && fb < 0.4;
      const isStale = sv > 0.4 && fb < 0.4;
      const readBookVal = isWrongBook ? 'B8' : 'B7';
      const readVerVal = isStale ? 'v2' : 'v3';

      const rows = [
        { label: 'READER', left: 'Lena', right: 'Lena', ok: true },
        { label: 'BOOK', left: 'B7', right: readBookVal, ok: !isWrongBook },
        { label: 'COUNT', left: '1 hold', right: '1 hold', ok: true },
        { label: 'VERSION', left: 'commit v3', right: `read ${readVerVal}`, ok: !isStale },
      ];

      // Left rail: Write Receipt (trusted host record)
      nodes.push(
        railBar(-840, -185, 225, ROLE.host, { width: 5, glow: 8 }),
        txt('PERMITTED WRITE (op-17)', -810, -165, 26, ROLE.host, 'mono', 'left'),
      );

      // Right rail: Independent Read Snapshot
      const rightCol = isWrongBook || isStale ? ROLE.fail : ra > 0.35 ? ROLE.read : COSMOS.dim;
      nodes.push(
        railBar(260, -185, 225, rightCol, { width: 5, glow: ra > 0.35 ? 9 : 4 }),
        txt(
          ra > 0.35 ? 'INDEPENDENT READ SNAPSHOT' : 'AWAITING SEPARATE READER',
          290,
          -165,
          26,
          rightCol,
          'mono',
          'left',
        ),
      );

      // 4 Field alignment beams across left -> center -> right
      rows.forEach((row, i) => {
        const y = -85 + i * 96;
        const checked = fc > 0.35;
        const beamCol =
          !ra || ra < 0.35 ? COSMOS.dim : !row.ok ? ROLE.fail : checked ? ROLE.pass : ROLE.read;

        nodes.push(
          txt(row.label, -810, y, 26, COSMOS.dim, 'mono', 'left'),
          txt(row.left, -410, y, 32, COSMOS.ink, 'mono', 'right'),
        );

        // Center optical alignment beam
        nodes.push(
          segmentWithPhoton([-355, y], [215, y], beamCol, p + i * 0.22, {
            width: row.ok ? 3.2 : 4.2,
            glow: checked || !row.ok ? 9 : 4,
            dash: ra < 0.35 ? [8, 8] : null,
            photon: ra > 0.35 && row.ok,
          }),
          txt(
            ra < 0.35 ? '...' : !row.ok ? 'MISMATCH' : checked ? 'MATCH' : 'COMPARE',
            -70,
            y - 28,
            26,
            beamCol,
            'mono',
            'center',
          ).glow(!row.ok ? 9 : 0, ROLE.fail),
        );

        if (ra > 0.35) {
          nodes.push(
            txt(row.right, 290, y, 32, row.ok ? COSMOS.ink : ROLE.fail, 'mono', 'left').glow(
              row.ok ? 0 : 10,
              ROLE.fail,
            ),
            glowDot(815, y, {
              radius: 9,
              color: !row.ok ? ROLE.fail : checked ? ROLE.pass : ROLE.read,
              glow: 10,
            }),
          );
        } else {
          nodes.push(txt('pending', 290, y, 28, COSMOS.dim, 'mono', 'left'));
        }
      });

      // Beat 2: Upper-right / Lower policy trace lane for forbidden attempt
      if (fb > 0.05) {
        const polY = 302;
        nodes.push(
          line([-840, 256], [850, 256], { stroke: '#3a2438', width: 2 }).opacity(fb),
          txt('POLICY TRACE:', -840, polY, 26, ROLE.warn, 'mono', 'left').opacity(fb),
          txt('DENIED read_private_account', -560, polY, 28, ROLE.fail, 'mono', 'left')
            .glow(9, ROLE.fail)
            .opacity(fb),
        );
        if (nl > 0.1) {
          nodes.push(
            txt(
              '0 private data returned (attempt != effect)',
              850,
              polY,
              26,
              ROLE.warn,
              'mono',
              'right',
            ).opacity(nl),
          );
        }
      }

      // Verdict line strictly controlled by `c.after(...)` cues!
      let verdictText = 'Compare every field of the independent read against op-17';
      let verdictCol = COSMOS.muted;
      if (ff > 0.35) {
        verdictText = 'VERDICT: FAIL  (FORBIDDEN ATTEMPT OVERRIDES CLEAN HOLD)';
        verdictCol = ROLE.fail;
      } else if (fb > 0.35) {
        verdictText = 'Read restored (B7 · v3) · checking policy trace...';
        verdictCol = ROLE.warn;
      } else if (cf > 0.35) {
        verdictText = 'VERDICT: BOTH COUNTERFACTUALS FAIL VERIFICATION';
        verdictCol = ROLE.fail;
      } else if (isStale) {
        verdictText = 'Probe 2: read version v2 < commit v3 (stale snapshot)';
        verdictCol = ROLE.fail;
      } else if (isWrongBook) {
        verdictText = 'Probe 1: read book B8 != written book B7 (wrong resource)';
        verdictCol = ROLE.fail;
      } else if (pv > 0.35) {
        verdictText = 'PASS';
        verdictCol = ROLE.pass;
      }

      nodes.push(
        txt(verdictText, 0, 398, 30, verdictCol, 'mono', 'center').glow(
          verdictCol === ROLE.pass || verdictCol === ROLE.fail ? 10 : 0,
          verdictCol,
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.0, { startOffset: 0.1, endMargin: 0.5 });

  c.on('fresh-read', () => {
    s.play(readArrived.to(1, { duration: clampDur(c, c.cue('fresh-read').start, 0.45) }));
  });
  c.on('returned-fields', () => {
    s.play(fieldsChecked.to(1, { duration: clampDur(c, c.cue('returned-fields').start, 0.4) }));
  });
  c.after('checked-verdict', () => {
    s.play(passVerdict.to(1, { duration: clampDur(c, c.cue('checked-verdict').end, 0.1) }));
  });
  c.on('wrong-book-probe', () => {
    s.play(wrongBook.to(1, { duration: clampDur(c, c.cue('wrong-book-probe').start, 0.55) }));
  });
  c.on('stale-version-probe', () => {
    s.play(staleVer.to(1, { duration: clampDur(c, c.cue('stale-version-probe').start, 0.35) }));
  });
  c.after('counterfactual-verdict', () => {
    s.play(cfFail.to(1, { duration: clampDur(c, c.cue('counterfactual-verdict').end, 0.3) }));
  });
  c.on('forbidden-attempt', () => {
    s.play(forbidOn.to(1, { duration: clampDur(c, c.cue('forbidden-attempt').start, 0.4) }));
  });
  c.on('effect-versus-attempt', () => {
    s.play(noLeakNote.to(1, { duration: clampDur(c, c.cue('effect-versus-attempt').start, 0.35) }));
  });
  c.after('forbidden-override', () => {
    s.play(forbidFail.to(1, { duration: clampDur(c, c.cue('forbidden-override').end, 0.3) }));
  });
}
