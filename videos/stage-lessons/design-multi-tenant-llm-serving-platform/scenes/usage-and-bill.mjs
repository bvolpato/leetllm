// Scene 27: usage-and-bill - Keep the receipt, allocation and invoice separate
// Beat 0: Immutable usage receipt + retries vs duplicate delivery.
// Beat 1: Disconnect counts: generated 120 vs delivered 90 vs billable policy.
// Beat 2: Three aligned columns (Worker observation | Allocation policy | Customer tariff).
// Beat 3: Hourly rate consistency (0.8 GPU-s * $2/3600 === 0.2 node-s * $8/3600 === $0.000444444).
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  STEP_SHARE_A,
  STEP_SHARE_B,
  STEP_TOTAL_COST,
  aura,
  cinemaHeader,
  driftValue,
  glowMeter,
  guardedDynamic,
  stepAfter,
  stepOn,
  txt,
} from '../parts.mjs';

export default function usageAndBill(s, c) {
  const pulse = s.value(0);
  const b0On = s.value(0);
  const recFieldsOn = s.value(0);
  const retryAttemptOn = s.value(0);
  const b1On = s.value(0);
  const disconnOn = s.value(0);
  const billPolOn = s.value(0);
  const b2On = s.value(0);
  const obsOn = s.value(0);
  const allocOn = s.value(0);
  const tariffOn = s.value(0);
  const b3On = s.value(0);
  const div3600On = s.value(0);
  const matchTotalOn = s.value(0);

  const stageAura = aura(0, 20, 760, '#60a5fa1a', '#ffd16616');
  const header = cinemaHeader(
    'METERING, ALLOCATION & BILLING',
    'Keep the receipt, allocation',
    'and invoice separate',
    { x: -860, y: -450, accent: ROLE.focus, size: 46 },
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const rf = recFieldsOn.value > 0.5;
      const retAtt = retryAttemptOn.value > 0.5;
      const b1 = b1On.value > 0.5;
      const disc = disconnOn.value > 0.5;
      const bpol = billPolOn.value > 0.5;
      const b2 = b2On.value > 0.5;
      const obs = obsOn.value > 0.5;
      const alloc = allocOn.value > 0.5;
      const tar = tariffOn.value > 0.5;
      const b3 = b3On.value > 0.5;
      const d36 = div3600On.value > 0.5;
      const match = matchTotalOn.value > 0.5;

      const nodes = [];

      if (!b1 && !b2 && !b3) {
        // Beat 0: Immutable usage receipt schema + attempt vs transport delivery
        nodes.push(
          rect(1660, 86, { fill: '#0b1428', stroke: ROLE.A, width: 2.8, radius: 14 })
            .at(0, -185)
            .glow(7, ROLE.A),
          txt(
            'IMMUTABLE USAGE RECEIPT:  A-1  /  attempt-1  /  reservation A-1',
            0,
            -185,
            29,
            ROLE.A,
            'mono',
            'center',
          ),
        );
        const groups = [
          ['IDENTITY', 'tenant · principal · request · attempt', ROLE.A],
          ['REVISIONS', 'model · adapter · metering policy', ROLE.adapter],
          ['TOKEN COUNTS', 'input · output · cached input', ROLE.shared],
          ['TERMINAL STATE', 'completed · disconnected · failed', ROLE.ok],
        ];
        groups.forEach(([title, sub, col], idx) => {
          const cx = idx % 2 === 0 ? -430 : 430;
          const cy = -42 + Math.floor(idx / 2) * 145;
          nodes.push(
            rect(800, 114, {
              fill: '#0b1224',
              stroke: rf ? col : '#2c3d66',
              width: 2.6,
              radius: 14,
            })
              .at(cx, cy)
              .glow(rf ? 6 : 0, col),
            txt(title, cx - 365, cy - 22, 26, col, 'mono', 'left'),
            txt(sub, cx - 365, cy + 24, 27, COSMOS.ink, 'sans', 'left'),
          );
        });
        nodes.push(
          rect(790, 108, { fill: '#0b1d26', stroke: ROLE.shared, width: 2.6, radius: 14 }).at(
            -430,
            275,
          ),
          txt('msg-7 & msg-8 (duplicate delivery)', -430, 250, 26, ROLE.shared, 'mono', 'center'),
          txt('Settle ONE logical attempt', -430, 296, 26, ROLE.ok, 'sans', 'center'),

          rect(790, 108, {
            fill: '#19150b',
            stroke: retAtt ? ROLE.focus : '#2c3d66',
            width: 2.6,
            radius: 14,
          })
            .at(430, 275)
            .glow(retAtt ? 8 : 0, ROLE.focus),
          txt('Genuine retry -> attempt-2', 430, 250, 26, ROLE.focus, 'mono', 'center'),
          txt('Preserved separately for real work', 430, 296, 26, COSMOS.ink, 'sans', 'center'),
        );
      } else if (b1 && !b2 && !b3) {
        // Beat 1: Client disconnect counts (Generated 120 vs Delivered 90 vs Billable)
        nodes.push(
          txt('CLIENT DISCONNECT TOKEN COUNTS', -835, -185, 28, ROLE.focus, 'mono', 'left'),

          txt('GENERATED OUTPUT', -835, -80, 28, ROLE.shared, 'mono', 'left'),
          glowMeter(-450, -80, 1020, 52, 1.0, { fill: ROLE.shared }),
          txt('120 tokens', 610, -80, 30, ROLE.shared, 'mono', 'left'),

          txt('DELIVERED OUTPUT', -835, 45, 28, ROLE.A, 'mono', 'left'),
          glowMeter(-450, 45, 1020, 52, disc ? 90 / 120 : 0.1, { fill: ROLE.A }),
          txt(disc ? '90 tokens' : '...', 610, 45, 30, ROLE.A, 'mono', 'left'),

          rect(1660, 136, {
            fill: bpol ? '#1b160b' : '#0b1224',
            stroke: bpol ? ROLE.focus : '#2c3d66',
            width: 2.8,
            radius: 16,
          })
            .at(0, 225)
            .glow(bpol ? 8 : 0, ROLE.focus),
          txt(
            'BILLABLE OUTPUT = DECLARED CONTRACT POLICY',
            0,
            196,
            29,
            ROLE.focus,
            'mono',
            'center',
          ),
          txt(
            'Queue wait spends deadline (not busy GPU time); track retries, idle replicas, CPU, storage & egress.',
            0,
            250,
            26,
            COSMOS.ink,
            'sans',
            'center',
          ),
        );
      } else if (b2 && !b3) {
        // Beat 2: Three aligned columns (Observation | Allocation | Tariff)
        const cols = [
          {
            cx: -560,
            title: '1. WORKER OBSERVATION',
            col: ROLE.A,
            active: obs,
            body1: '4 GPUs × 0.2 s',
            body2: '0.8 GPU-seconds',
            sub: 'Measured accelerator step',
          },
          {
            cx: 0,
            title: '2. ALLOCATION POLICY',
            col: ROLE.shared,
            active: alloc,
            body1: 'A 25%  /  B 75%',
            body2: `$${STEP_SHARE_A.toFixed(6)} / $${STEP_SHARE_B.toFixed(6)}`,
            sub: 'Divides step cost across batch',
          },
          {
            cx: 560,
            title: '3. CUSTOMER TARIFF',
            col: ROLE.focus,
            active: tar,
            body1: 'Token price schedule',
            body2: 'May differ from cost',
            sub: 'Compare to spot margin risk',
          },
        ];
        cols.forEach((cl) => {
          nodes.push(
            rect(510, 390, {
              fill: '#0b1224',
              stroke: cl.active ? cl.col : '#2c3d66',
              width: cl.active ? 3.0 : 1.8,
              radius: 18,
            })
              .at(cl.cx, 55)
              .glow(cl.active ? 9 : 0, cl.col),
            txt(cl.title, cl.cx, -85, 26, cl.col, 'mono', 'center'),
            txt(cl.body1, cl.cx, 25, 34, COSMOS.ink, 'mono', 'center'),
            txt(cl.body2, cl.cx, 95, 28, cl.active ? cl.col : COSMOS.muted, 'mono', 'center'),
            txt(cl.sub, cl.cx, 185, 26, COSMOS.muted, 'sans', 'center'),
          );
        });
      } else {
        // Beat 3: Hourly rate conversion (divide by 3,600) -> identical step total!
        nodes.push(
          rect(1660, 128, { fill: '#0b1828', stroke: ROLE.shared, width: 2.8, radius: 16 })
            .at(0, -130)
            .glow(7, ROLE.shared),
          txt('PER-GPU RATE PATH', -790, -160, 26, ROLE.shared, 'mono', 'left'),
          txt(
            d36 ? '(0.8 GPU-seconds ÷ 3,600) × $2 / GPU-hour' : '0.8 GPU-seconds  ×  $2 / GPU-hour',
            -790,
            -104,
            34,
            COSMOS.ink,
            'mono',
            'left',
          ),

          rect(1660, 128, { fill: '#0b1428', stroke: ROLE.A, width: 2.8, radius: 16 })
            .at(0, 62)
            .glow(7, ROLE.A),
          txt('WHOLE-NODE RATE PATH  (INCLUDES ALL 4 GPUs)', -790, 32, 26, ROLE.A, 'mono', 'left'),
          txt(
            d36
              ? '(0.2 node-seconds ÷ 3,600) × $8 / node-hour'
              : '0.2 node-seconds  ×  $8 / node-hour',
            -790,
            88,
            34,
            COSMOS.ink,
            'mono',
            'left',
          ),

          rect(1660, 126, {
            fill: match ? '#0b221b' : '#0b1224',
            stroke: match ? ROLE.ok : '#2c3d66',
            width: 3.0,
            radius: 16,
          })
            .at(0, 265)
            .glow(match ? 10 : 0, ROLE.ok),
          txt(
            match
              ? `BOTH PATHS MATCH EXACTLY:  $${STEP_TOTAL_COST.toFixed(9)}`
              : 'Divide seconds by 3,600 before multiplying by hourly rate...',
            0,
            265,
            36,
            match ? ROLE.ok : COSMOS.dim,
            'mono',
            'center',
          ),
        );
      }

      nodes.push(
        txt(
          'Usage evidence, internal allocation, and customer tariffs keep separate definitions and revisions.',
          0,
          422,
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
  driftValue(s, c, pulse, 4.0);

  stepOn(s, c, 'mt-usage-and-bill-b0', b0On, 1);
  stepAfter(s, c, 'mt-usage-and-bill-s0-0', recFieldsOn, 1);
  stepAfter(s, c, 'mt-usage-and-bill-s0-1', retryAttemptOn, 1);
  stepOn(s, c, 'mt-usage-and-bill-b1', b1On, 1);
  stepAfter(s, c, 'mt-usage-and-bill-s1-0', disconnOn, 1);
  stepAfter(s, c, 'mt-usage-and-bill-s1-1', billPolOn, 1);
  stepOn(s, c, 'mt-usage-and-bill-b2', b2On, 1);
  stepAfter(s, c, 'mt-usage-and-bill-s2-0', obsOn, 1);
  stepAfter(s, c, 'mt-usage-and-bill-s2-1', allocOn, 1);
  stepAfter(s, c, 'mt-usage-and-bill-s2-2', tariffOn, 1);
  stepOn(s, c, 'mt-usage-and-bill-b3', b3On, 1);
  stepAfter(s, c, 'mt-usage-and-bill-s3-0', div3600On, 1);
  stepAfter(s, c, 'mt-usage-and-bill-s3-1', matchTotalOn, 1);
}
