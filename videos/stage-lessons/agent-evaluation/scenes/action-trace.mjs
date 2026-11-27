// Scene 3: action-trace - Follow the reservation
// 4-node optical execution pipeline (Catalog -> Host Permit -> Dispatch -> Library Ledger)
// showing clearly that host permission creates zero holds until dispatch commits `hold-17`
// at version 3 (strictly withheld until `c.after('commit-hold')`).
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  autoNode,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  railBar,
  river,
  segmentWithPhoton,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function actionTrace(s, c) {
  const pulse = s.value(0);
  const catResolved = s.value(0);
  const permitted = s.value(0);
  const holdCheckHi = s.value(0);
  const dispatched = s.value(0);
  const committed = s.value(0);

  const header = cinemaHeader('EXECUTION PIPELINE', 'Follow the', 'reservation', {
    accent: ROLE.read,
    size: 50,
  });

  const stageAura = aura(160, 40, 620, '#5ce1e620', '#60a5fa18');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const cr = catResolved.value;
      const pm = permitted.value;
      const hc = holdCheckHi.value;
      const dp = dispatched.value;
      const cm = committed.value;
      const nodes = [];

      // Pipeline node centers (left to center-right)
      const cCat = [-710, 40];
      const cPerm = [-350, 40];
      const cDisp = [20, 40];

      const catNode = autoNode(cCat[0], cCat[1], cr > 0.35 ? 'ID: B7' : 'CATALOG', {
        radius: 64,
        color: cr > 0.35 ? ROLE.read : COSMOS.muted,
        glow: cr > 0.35 ? 11 : 5,
        size: 28,
      });

      const permCol = pm > 0.35 ? ROLE.pass : ROLE.host;
      const permNode = autoNode(cPerm[0], cPerm[1], pm > 0.35 ? 'ALLOW' : 'PERMIT?', {
        radius: 66,
        color: permCol,
        glow: pm > 0.35 ? 11 : 5,
        size: 28,
      });

      const dispCol = cm > 0.35 ? ROLE.read : dp > 0.25 ? ROLE.focus : COSMOS.dim;
      const dispLabel = cm > 0.35 ? 'RECEIPT' : dp > 0.25 ? 'SENDING' : 'GATE';
      const dispNode = autoNode(cDisp[0], cDisp[1], dispLabel, {
        radius: 66,
        color: dispCol,
        glow: dp > 0.25 || cm > 0.35 ? 11 : 4,
        size: 26,
      });

      const [s1a, s1b] = trimSeg(cCat, cPerm, catNode.r, permNode.r);
      const [s2a, s2b] = trimSeg(cPerm, cDisp, permNode.r, dispNode.r);
      const [s3a, s3b] = trimSeg(cDisp, [275, 40], dispNode.r, 0);

      nodes.push(
        txt('1. CATALOG', cCat[0], -86, 26, cr > 0.35 ? ROLE.read : COSMOS.dim, 'mono', 'center'),
        txt('2. HOST PERMIT', cPerm[0], -86, 26, permCol, 'mono', 'center'),
        txt('3. DISPATCH', cDisp[0], -86, 26, dispCol, 'mono', 'center'),
        segmentWithPhoton(s1a, s1b, cr > 0.35 ? ROLE.read : COSMOS.dim, p, {
          width: 3.2,
          glow: cr > 0.35 ? 8 : 3,
          photon: cr > 0.35,
        }),
        segmentWithPhoton(s2a, s2b, pm > 0.35 ? ROLE.pass : COSMOS.dim, p + 0.3, {
          width: 3.2,
          glow: pm > 0.35 ? 8 : 3,
          photon: pm > 0.35,
        }),
        segmentWithPhoton(
          s3a,
          s3b,
          cm > 0.35 ? ROLE.read : dp > 0.25 ? ROLE.focus : COSMOS.dim,
          p + 0.6,
          {
            width: 3.4,
            glow: dp > 0.25 || cm > 0.35 ? 9 : 2,
            dash: dp > 0.25 || cm > 0.35 ? null : [8, 8],
            photon: dp > 0.25 || cm > 0.35,
          },
        ),
        catNode.node,
        permNode.node,
        dispNode.node,
      );

      // Clean sub-captions beneath each node
      nodes.push(
        txt(
          cr > 0.35 ? 'River Stories -> B7' : 'Query: River Stories',
          cCat[0],
          168,
          26,
          cr > 0.35 ? COSMOS.ink : COSMOS.muted,
          'mono',
          'center',
        ),
        txt(
          pm > 0.35 ? 'op-17 · Lena · B7' : 'Awaiting host check',
          cPerm[0],
          168,
          26,
          pm > 0.35 ? ROLE.pass : COSMOS.muted,
          'mono',
          'center',
        ),
        txt(
          cm > 0.35 ? 'hold-17 -> v3' : dp > 0.25 ? 'Dispatching op-17...' : 'Not dispatched yet',
          cDisp[0],
          168,
          26,
          cm > 0.35 ? ROLE.read : dp > 0.25 ? ROLE.focus : COSMOS.dim,
          'mono',
          'center',
        ),
      );

      // Right: Library Account Ledger Rail (0 holds until commit-hold!)
      const ledCol = cm > 0.35 ? ROLE.read : hc > 0.3 ? ROLE.focus : COSMOS.muted;
      nodes.push(
        railBar(295, -170, 260, ledCol, { width: 5, glow: cm > 0.35 || hc > 0.3 ? 11 : 4 }),
        txt('4. LIBRARY ACCOUNT', 325, -150, 26, ledCol, 'mono', 'left'),
        txt(river.reader, 325, -86, 44, COSMOS.ink, 'serif', 'left'),
        txt(
          cm > 0.35 ? 'version 3' : 'version 2',
          855,
          -86,
          30,
          cm > 0.35 ? ROLE.read : COSMOS.muted,
          'mono',
          'right',
        ).glow(cm * 9, ROLE.read),
        line([325, -34], [855, -34], { stroke: '#29385f', width: 2 }),
        txt('HOLD ID', 325, 14, 26, COSMOS.dim, 'mono', 'left'),
        txt('BOOK', 855, 14, 26, COSMOS.dim, 'mono', 'right'),
        line([325, 44], [855, 44], { stroke: '#243154', width: 2 }),
      );

      if (cm < 0.35) {
        const preA = Math.max(0, 1 - cm * 2.5);
        nodes.push(
          txt('(empty account)', 325, 108, 30, COSMOS.muted, 'mono', 'left').opacity(preA),
          txt('0 holds', 855, 108, 30, hc > 0.3 ? ROLE.focus : COSMOS.dim, 'mono', 'right')
            .glow(hc * 9, ROLE.focus)
            .opacity(preA),
          line([325, 154], [855, 154], { stroke: '#243154', width: 2 }).opacity(preA),
          txt(
            hc > 0.3 ? 'Permission alone creates 0 holds' : 'Waiting for committed write',
            325,
            214,
            26,
            hc > 0.3 ? ROLE.focus : COSMOS.dim,
            'mono',
            'left',
          ).opacity(preA),
        );
      } else {
        const postA = Math.min(1, (cm - 0.35) * 2.2);
        nodes.push(
          txt('hold-17', 325, 108, 34, ROLE.read, 'mono', 'left')
            .glow(10, ROLE.read)
            .opacity(postA),
          txt('B7', 855, 108, 34, ROLE.read, 'mono', 'right').glow(10, ROLE.read).opacity(postA),
          line([325, 154], [855, 154], { stroke: '#1f4e5d', width: 2 }).opacity(postA),
          txt('Receipt: op-17 -> hold-17 (v3)', 325, 214, 26, ROLE.pass, 'mono', 'left')
            .glow(7, ROLE.pass)
            .opacity(postA),
        );
      }

      // Dynamic footer
      const footer =
        cm > 0.35
          ? 'COMMITTED: op-17 CREATED hold-17 AT v3 · NOW VERIFY WITH A SEPARATE READER'
          : dp > 0.25
            ? 'Dispatching permitted call op-17 to the library service...'
            : pm > 0.35
              ? 'Host permitted op-17 · check the account before dispatch'
              : 'Resolve the canonical book ID before authorizing a write';
      nodes.push(
        txt(
          footer,
          0,
          392,
          28,
          cm > 0.35 ? ROLE.read : pm > 0.35 ? ROLE.focus : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('catalog-resource', () => {
    s.play(catResolved.to(1, { duration: clampDur(c, c.cue('catalog-resource').start, 0.4) }));
  });
  c.on('permit-action', () => {
    s.play(permitted.to(1, { duration: clampDur(c, c.cue('permit-action').start, 0.4) }));
  });
  c.on('not-executed', () => {
    s.play(holdCheckHi.to(1, { duration: clampDur(c, c.cue('not-executed').start, 0.35) }));
  });
  c.on('dispatch-request', () => {
    s.play(dispatched.to(1, { duration: clampDur(c, c.cue('dispatch-request').start, 0.45) }));
  });
  c.after('commit-hold', () => {
    s.play(committed.to(1, { duration: clampDur(c, c.cue('commit-hold').end, 0.35) }));
  });
}
