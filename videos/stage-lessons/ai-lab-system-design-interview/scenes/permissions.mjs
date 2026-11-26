// Scene 18: permissions - Which document may leave the index?
// 3 scored candidates from DOCS (finance-plan 0.99, old-handbook 0.95 deleted, public-access-policy 0.82)
// approaching ACL + deletion gate -> STRICT prediction withholding before revealing ONLY public-access-policy crosses!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  DOCS,
  ELIGIBLE_DOCS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function permissions(s, c) {
  const phase = s.value(0);
  const finStop = s.value(0); // STRICT after permission-finance!
  const delStop = s.value(0); // STRICT after permission-deleted!
  const allowPass = s.value(0); // STRICT after permission-allow!
  const freshRule = s.value(0);

  const header = cinemaHeader(
    'PRE-RETRIEVAL ACL BOUNDARY',
    'Which document may',
    'leave the index?',
    {
      x: -860,
      y: -445,
      accent: ROLE.ok,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#6ee7b71a', '#f43f5e16');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const fn = finStop.value;
      const dl = delStop.value;
      const al = allowPass.value;
      const fr = freshRule.value;
      const nodes = [];

      // Trusted index (left) | ACL + Tombstone Gate (x = 40) | External Reranker (right)
      const gateX = 40;
      nodes.push(
        line([gateX, -210], [gateX, 195], { stroke: ROLE.focus, width: 4.5, dash: [12, 8] }).glow(
          10,
          ROLE.focus,
        ),
        txt('ACL + TOMBSTONE GATE', gateX, -245, 26, ROLE.focus, 'mono', 'center'),
        txt('TRUSTED INDEX (SCORES)', -480, -210, 26, ROLE.req, 'mono', 'center'),
        txt('EXTERNAL RERANKER', 490, -210, 26, ROLE.ok, 'mono', 'center'),
      );

      // Sorted by score descending: finance-plan (0.99), old-handbook (0.95), public-access-policy (0.82)
      const ordered = [...DOCS].sort((a, b) => b.score - a.score);
      const ys = [-115, 0, 115];

      ordered.forEach((doc, idx) => {
        const y = ys[idx];
        const isFin = doc.id === 'finance-plan';
        const isDel = doc.deleted;
        const isOk = !isFin && !isDel;

        let col = ROLE.req;
        let status = '';
        if (isFin && fn > 0.4) {
          col = ROLE.fail;
          status = 'STOPPED: no finance grant';
        } else if (isDel && dl > 0.4) {
          col = ROLE.fail;
          status = 'STOPPED: deleted tombstone';
        } else if (isOk && al > 0.4) {
          col = ROLE.ok;
          status = 'ALLOWED -> CITATION';
        }

        nodes.push(
          txt(`${doc.score.toFixed(2)}  ${doc.id}`, -840, y, 26, col, 'mono', 'left'),
          txt(
            `[${doc.groups.join(',')}${doc.deleted ? ', DEL' : ''}]`,
            -270,
            y,
            26,
            isDel ? ROLE.warn : COSMOS.muted,
            'mono',
            'left',
          ),
        );

        if (isOk && al > 0.4) {
          nodes.push(
            beamWithPhotons(
              [
                [gateX + 18, y],
                [310, y],
              ],
              ROLE.ok,
              p,
              { width: 4.2, photonCount: 2 },
            ),
            txt(ELIGIBLE_DOCS[0].id, 330, y, 26, ROLE.ok, 'mono', 'left').glow(8, ROLE.ok),
          );
        } else if (status) {
          nodes.push(txt(status, gateX + 36, y, 26, ROLE.fail, 'mono', 'left'));
        }
      });

      // Top-right caller context
      nodes.push(
        txt('CALLER GROUP: [employees]', 480, -425, 26, ROLE.ok, 'mono', 'center'),
        txt('Relevance score NEVER overrides ACL!', 480, -378, 26, ROLE.warn, 'mono', 'center'),
      );

      // Bottom prediction prompt -> STRICT withholding before permission-finance/allow!
      const botY = 295;
      if (fr > 0.4) {
        nodes.push(
          txt(
            'APPLY SAME CHECK BEFORE CACHED ANSWERS OR MODELS · FAIL CLOSED IF ACL STALE',
            0,
            botY,
            26,
            ROLE.ok,
            'mono',
            'center',
          ).glow(8, ROLE.ok),
        );
      } else if (al > 0.4) {
        nodes.push(
          txt(
            'ONLY public-access-policy CROSSES -> SUPPORT CAN TRACE CITATION TO ALLOWED SOURCE',
            0,
            botY,
            26,
            ROLE.ok,
            'mono',
            'center',
          ).glow(8, ROLE.ok),
        );
      } else {
        nodes.push(
          txt(
            'Caller is in [employees]. Which document ID may leave for the external reranker?',
            0,
            botY,
            32,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      }

      nodes.push(
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.ok,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.4);

  c.after('permission-finance', () => {
    s.play(finStop.to(1, { duration: clampDur(c, c.cue('permission-finance').end, 0.35) }));
  });
  c.after('permission-deleted', () => {
    s.play(delStop.to(1, { duration: clampDur(c, c.cue('permission-deleted').end, 0.35) }));
  });
  c.after('permission-allow', () => {
    s.play(allowPass.to(1, { duration: clampDur(c, c.cue('permission-allow').end, 0.4) }));
  });
  c.on('permission-freshness', () => {
    s.play(freshRule.to(1, { duration: clampDur(c, c.cue('permission-freshness').start, 0.35) }));
  });
}
