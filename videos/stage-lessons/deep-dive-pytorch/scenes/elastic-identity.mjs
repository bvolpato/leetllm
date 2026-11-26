// Scene 24: A restarted rank is a new endpoint (torchrun elastic restart, complete recovery bundle, durable checkpoint replay window).
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function elasticIdentity(s, c) {
  const phase = s.value(0);
  const stage = s.value(0); // 0=torchrun restarts ranks, 1=full state bundle, 2=durable checkpoint & real crash drill

  const bgAura = aura(0, 20, 620, '#f59e0b1c', '#6ee7b718');
  const title = heroTitle(['A Restarted Rank Is', 'a New Endpoint'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.compile,
    eyebrow: 'TORCHRUN ELASTIC · FULL RECOVERY BUNDLE',
  });

  const live = guardedDynamic(1, () => {
    const st = stage.value;
    const p = phase.value;

    const steps = [
      { k: '1. FAIL', d: 'Worker dies\nafter step N', col: ROLE.bad, x: -640 },
      { k: '2. TORCHRUN', d: 'Restarts group\n(new ranks/size)', col: ROLE.compile, x: -215 },
      { k: '3. APP LOAD', d: 'Rebuild groups\n+ load DCP', col: ROLE.copy, x: 215 },
      { k: '4. RESUME', d: 'Replay unsaved\nsteps -> N+1', col: ROLE.good, x: 640 },
    ];

    const nodes = [txt('ELASTIC RECOVERY LOOP', 0, -225, 28, COSMOS.gold, 'mono')];

    steps.forEach((sp, i) => {
      const lines = sp.d.split('\n');
      nodes.push(
        glassCell(sp.x, -102, 360, 174, sp.col, { fill: '#111b31', glow: 8 }),
        txt(sp.k, sp.x, -152, 28, sp.col, 'mono'),
        txt(lines[0], sp.x, -96, 26, COSMOS.ink, 'sans'),
        txt(lines[1], sp.x, -50, 26, COSMOS.muted, 'sans'),
      );
      if (i < steps.length - 1) {
        nodes.push(
          line([sp.x + 186, -102], [steps[i + 1].x - 186, -102], {
            stroke: COSMOS.gold,
            width: 3.0,
          }),
        );
      }
    });

    // Bottom: Complete state bundle vs Drill requirement
    nodes.push(
      glassCell(-430, 152, 760, 198, st >= 1 ? ROLE.copy : COSMOS.dim, {
        fill: st >= 1 ? '#0e222e' : '#0a0f1c',
        glow: st >= 1 ? 9 : 2,
      }),
      txt('COMPLETE STATE TO PERSIST', -430, 88, 28, st >= 1 ? ROLE.copy : COSMOS.dim, 'mono'),
      txt(
        'Model + Optimizer + Scheduler + GradScaler',
        -430,
        144,
        26,
        st >= 1 ? COSMOS.ink : COSMOS.dim,
        'mono',
      ),
      txt(
        'Global step + RNG + Data cursor + Config',
        -430,
        198,
        26,
        st >= 1 ? ROLE.good : COSMOS.dim,
        'mono',
      ),

      glassCell(430, 152, 760, 198, st >= 2 ? ROLE.good : COSMOS.dim, {
        fill: st >= 2 ? '#0d2624' : '#0a0f1c',
        glow: st >= 2 ? 9 : 2,
      }),
      txt('REAL DISTRIBUTED DRILL', 430, 88, 28, st >= 2 ? ROLE.good : COSMOS.dim, 'mono'),
      txt(
        'Kill worker -> rebuild -> restore shards',
        430,
        144,
        26,
        st >= 2 ? COSMOS.ink : COSMOS.dim,
        'mono',
      ),
      txt(
        'Verify next batch & first resumed step',
        430,
        198,
        26,
        st >= 2 ? COSMOS.gold : COSMOS.dim,
        'mono',
      ),
    );

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-780 + u * 1560, 300, { radius: 6, color: ROLE.compile }),
      txt(
        'Never key checkpoint ownership by old rank filename; torchrun retries cannot recover unsaved work',
        0,
        365,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('pt-elastic-identity-0', () => s.play(stage.to(0, { duration: 0.25 })));
  c.on('pt-elastic-identity-1', () =>
    s.play(stage.to(1, { duration: remainDuration(c, 'pt-elastic-identity-1', 0.45) })),
  );
  c.on('pt-elastic-identity-2', () =>
    s.play(stage.to(2, { duration: remainDuration(c, 'pt-elastic-identity-2', 0.45) })),
  );
}
