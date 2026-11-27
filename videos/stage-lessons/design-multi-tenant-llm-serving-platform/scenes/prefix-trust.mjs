// Scene 24: prefix-trust - Give cache reuse the same permission story as its contents
// 8-tuple composite prefix cache key (tenant, reader, ACL, model, adapter, tokenizer, layout, tokens).
// Beat 1: Caller-provided salt B/Bob stops at authorization shield (salt partitions, never authenticates).
// Beat 2: ACL revision bumps acl-v1 -> acl-v2 -> prior entry stays unreachable.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  guardedDynamic,
  stepAfter,
  stepOn,
  txt,
} from '../parts.mjs';

const KEY_PARTS = [
  ['TENANT', 'A', ROLE.A],
  ['READER / GROUP', 'Alice', ROLE.A],
  ['ACL REVISION', 'acl-v1', ROLE.policy],
  ['BASE MODEL', 'base-v3', ROLE.kv],
  ['ADAPTER', 'docs-v2', ROLE.adapter],
  ['TOKENIZER', 'tok-v3', ROLE.kv],
  ['KV LAYOUT', 'kv-v1', ROLE.kv],
  ['PREFIX TOKENS', '[1, 5, 9]', ROLE.kv],
];

export default function prefixTrust(s, c) {
  const b0On = s.value(0);
  const compOn = s.value(0);
  const groupOn = s.value(0);
  const b1On = s.value(0);
  const saltPartOn = s.value(0);
  const saltBlockOn = s.value(0);
  const b2On = s.value(0);
  const aclBumpOn = s.value(0);

  const stageAura = aura(0, 20, 760, '#5ce1e61c', '#a78bfa18');
  const header = cinemaHeader(
    'PERMISSION-SCOPED PREFIX CACHE KEYS',
    'Give cache reuse the same',
    'permission story as its contents',
    { x: -860, y: -450, accent: ROLE.kv, size: 46 },
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const comp = compOn.value > 0.5;
      const grp = groupOn.value > 0.5;
      const b1 = b1On.value > 0.5;
      const sPart = saltPartOn.value > 0.5;
      const sBlk = saltBlockOn.value > 0.5;
      const b2 = b2On.value > 0.5;
      const bump = aclBumpOn.value > 0.5;

      const nodes = [];

      // 4x2 grid of composite prefix key tuples
      KEY_PARTS.forEach(([label, val, col], idx) => {
        const cx = -630 + (idx % 4) * 420;
        const cy = -175 + Math.floor(idx / 4) * 145;
        const isAcl = idx === 2;
        const displayVal = isAcl && bump ? 'acl-v2' : val;
        const highlight = (idx < 3 && (grp || b1 || b2)) || (idx >= 3 && (comp || b1 || b2));
        const tileCol = isAcl && bump ? ROLE.focus : col;

        nodes.push(
          rect(386, 112, {
            fill: '#0b1224',
            stroke: highlight ? tileCol : '#2c3d66',
            width: highlight ? 2.8 : 1.8,
            radius: 14,
          })
            .at(cx, cy)
            .glow(highlight ? 7 : 0, tileCol),
          txt(label, cx - 166, cy - 22, 26, highlight ? tileCol : COSMOS.muted, 'mono', 'left'),
          txt(displayVal, cx - 166, cy + 24, 30, COSMOS.ink, 'mono', 'left'),
        );
      });

      // Lower interactive mechanism zone (y = 140 .. 430)
      if (!b1 && !b2) {
        nodes.push(
          rect(1660, 175, {
            fill: '#0b1628',
            stroke: grp ? ROLE.focus : ROLE.kv,
            width: 2.8,
            radius: 16,
          })
            .at(0, 238)
            .glow(grp ? 8 : 3, ROLE.focus),
          txt(
            'TENANT EQUALITY ALONE IS TOO BROAD FOR PRIVATE RAG',
            0,
            200,
            28,
            ROLE.focus,
            'mono',
            'center',
          ),
          txt(
            'Two users inside Workspace A can hold different document grants; key scope must match actual visibility.',
            0,
            262,
            27,
            COSMOS.ink,
            'sans',
            'center',
          ),
        );
      } else if (b1 && !b2) {
        // Beat 1: Caller-supplied cache salt B/Bob blocked at authorization shield
        nodes.push(
          rect(620, 148, { fill: '#240f19', stroke: ROLE.fail, width: 2.8, radius: 16 })
            .at(-515, 225)
            .glow(8, ROLE.fail),
          txt('CALLER-SUPPLIED CACHE SALT', -515, 194, 26, ROLE.fail, 'mono', 'center'),
          txt('salt: "B / Bob"', -515, 248, 34, COSMOS.ink, 'mono', 'center'),

          beamWithPhotons(
            [
              [-200, 225],
              [-25, 225],
            ],
            ROLE.fail,
            0,
            { width: 4.2, glow: 8 },
          ),
          line([0, 138], [0, 312], { stroke: ROLE.fail, width: 9 }).glow(10, ROLE.fail),

          rect(680, 148, { fill: '#19150b', stroke: ROLE.focus, width: 2.8, radius: 16 })
            .at(485, 225)
            .glow(sBlk ? 9 : 4, ROLE.focus),
          txt('TRUSTED POLICY RESOLVER', 485, 194, 26, ROLE.focus, 'mono', 'center'),
          txt(
            sBlk
              ? 'DENIED: Caller is A / Alice'
              : sPart
                ? 'Salt partitions; never authenticates'
                : 'Checking policy...',
            485,
            248,
            28,
            COSMOS.ink,
            'mono',
            'center',
          ),
        );
      } else {
        // Beat 2: ACL revision bump acl-v1 -> acl-v2 makes old cache entry unreachable
        nodes.push(
          rect(680, 140, {
            fill: '#1a150b',
            stroke: bump ? ROLE.focus : ROLE.A,
            width: 2.8,
            radius: 16,
          })
            .at(-475, 200)
            .glow(bump ? 9 : 4, ROLE.focus),
          txt('CURRENT REQUEST SCOPE', -475, 170, 26, COSMOS.muted, 'mono', 'center'),
          txt(
            bump ? 'ACL revision: acl-v2' : 'ACL revision: acl-v1',
            -475,
            222,
            34,
            bump ? ROLE.focus : ROLE.A,
            'mono',
            'center',
          ),

          rect(680, 140, { fill: '#0b1a28', stroke: ROLE.kv, width: 2.8, radius: 16 })
            .at(475, 200)
            .glow(6, ROLE.kv),
          txt('STORED PREFIX BLOCK', 475, 170, 26, COSMOS.muted, 'mono', 'center'),
          txt('ACL revision: acl-v1', 475, 222, 34, ROLE.kv, 'mono', 'center'),
        );
        if (bump) {
          nodes.push(
            line([0, 125], [0, 275], { stroke: ROLE.fail, width: 8 }).glow(10, ROLE.fail),
            txt(
              'ACL revision changed -> stale acl-v1 entry unreachable (cache hit never overrides authorization).',
              0,
              338,
              28,
              ROLE.fail,
              'sans',
              'center',
            ),
          );
        }
      }

      nodes.push(
        txt(
          'A cache key partitions computation compatibility; the service still authorizes every read.',
          0,
          420,
          27,
          COSMOS.muted,
          'sans',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  stepOn(s, c, 'mt-prefix-trust-b0', b0On, 1);
  stepAfter(s, c, 'mt-prefix-trust-s0-1', compOn, 1);
  stepAfter(s, c, 'mt-prefix-trust-s0-2', groupOn, 1);
  stepOn(s, c, 'mt-prefix-trust-b1', b1On, 1);
  stepAfter(s, c, 'mt-prefix-trust-s1-1', saltPartOn, 1);
  stepOn(s, c, 'mt-prefix-trust-s1-3', saltBlockOn, 1);
  stepOn(s, c, 'mt-prefix-trust-b2', b2On, 1);
  stepAfter(s, c, 'mt-prefix-trust-s2-0', aclBumpOn, 1);
}
