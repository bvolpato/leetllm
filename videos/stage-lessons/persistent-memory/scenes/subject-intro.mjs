// Scene 1: subject-intro - What comes back when Ada types "Continue"?
// Constellation of external stores (Profile, Replay Log, Live Repo) orbiting Ada's fresh
// prompt: prediction pause asks whether the model can see her 4-day-old command in a fresh
// chat -> scoped access gates copy profile command, failed replay (2 invoices), & live branch!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  memNode,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function subjectIntro(s, c) {
  const pulse = s.value(0);
  const savedOn = s.value(0);
  const profCopy = s.value(0);
  const repCopy = s.value(0);
  const inv2On = s.value(0);
  const branchOn = s.value(0);

  const header = cinemaHeader(
    'PERSISTENT AGENT MEMORY',
    'What comes back when',
    'Ada types “Continue”?',
    { accent: ROLE.prompt, size: 50 },
  );

  const stageAura = aura(180, 40, 640, '#5ce1e61e', '#6ee7b71a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const sv = savedOn.value;
      const pf = profCopy.value;
      const rp = repCopy.value;
      const i2 = inv2On.value;
      const br = branchOn.value;
      const nodes = [];

      // Left: 3 External Persistent Stores
      const profPt = [-540, -155];
      const logPt = [-540, 45];
      const repoPt = [-540, 245];
      const promptPt = [320, 45];

      const nProf = memNode(profPt[0], profPt[1], 'PROFILE', ROLE.profile, {
        radius: 54,
        sub: '4d ago: test command',
        opacity: 0.45 + sv * 0.55,
      });
      const nLog = memNode(logPt[0], logPt[1], 'LOG', ROLE.episodic, {
        radius: 54,
        sub: i2 > 0.35 ? '2 deliveries -> 2 invoices' : 'Yesterday’s replay',
        opacity: 0.45 + rp * 0.55,
      });
      const nRepo = memNode(repoPt[0], repoPt[1], 'REPO', ROLE.policy, {
        radius: 54,
        sub: 'Live active branch',
        opacity: 0.4 + br * 0.6,
      });

      nodes.push(nProf.node, nLog.node, nRepo.node);

      // Access gate line between external stores & fresh prompt
      nodes.push(
        line([-140, -230], [-140, 315], { stroke: ROLE.focus, width: 3.5, dash: [8, 8] }).opacity(
          0.65,
        ),
        txt('ACCESS CHECK', -140, -260, 26, ROLE.focus, 'mono', 'center'),
      );

      // Flowing beams ONLY when app copies each record into the prompt!
      if (pf > 0.05) {
        nodes.push(
          beamWithPhotons(
            quadArcPts(
              [profPt[0] + nProf.r + 12, profPt[1]],
              [promptPt[0] - 110, promptPt[1] - 40],
              -35,
            ),
            ROLE.profile,
            p * 1.1,
            {
              alpha: pf,
              width: 3.6,
            },
          ),
        );
      }
      if (rp > 0.05) {
        nodes.push(
          beamWithPhotons(
            quadArcPts([logPt[0] + nLog.r + 12, logPt[1]], [promptPt[0] - 110, promptPt[1]], 0),
            ROLE.episodic,
            p * 1.1 + 0.35,
            {
              alpha: rp,
              width: 3.6,
            },
          ),
        );
      }
      if (br > 0.05) {
        nodes.push(
          beamWithPhotons(
            quadArcPts(
              [repoPt[0] + nRepo.r + 12, repoPt[1]],
              [promptPt[0] - 110, promptPt[1] + 40],
              35,
            ),
            ROLE.policy,
            p * 1.1 + 0.7,
            {
              alpha: br,
              width: 3.6,
            },
          ),
        );
      }

      // Right: Fresh Model Prompt Assembly Rail
      const px = 260;
      nodes.push(
        line([px - 24, -180], [px - 24, 265], { stroke: ROLE.prompt, width: 5 }).glow(
          9,
          ROLE.prompt,
        ),
        txt('FRESH MODEL PROMPT', px, -165, 26, ROLE.prompt, 'mono', 'left'),
        txt('1. Instructions', px, -105, 28, COSMOS.muted, 'mono', 'left'),
        txt('2. Ada: “Continue.”', px, -50, 30, COSMOS.ink, 'serif', 'left').glow(5, ROLE.prompt),
      );

      if (pf > 0.05) {
        nodes.push(
          txt('3. + Billing test command', px, 22, 28, ROLE.profile, 'mono', 'left')
            .glow(6, ROLE.profile)
            .opacity(pf),
        );
      }
      if (rp > 0.05) {
        nodes.push(
          txt('4. + Failed replay (2 inv)', px, 84, 28, ROLE.episodic, 'mono', 'left')
            .glow(6, ROLE.episodic)
            .opacity(rp),
        );
      }
      if (br > 0.05) {
        nodes.push(
          txt('5. + Active repo branch', px, 146, 28, ROLE.policy, 'mono', 'left')
            .glow(6, ROLE.policy)
            .opacity(br),
        );
      }

      // Strict prediction withholding during Beat 1!
      if (sv > 0.25 && pf < 0.05) {
        nodes.push(
          txt(
            'Can the model see Ada’s 4-day-old note in a fresh chat?',
            0,
            370,
            34,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      } else if (pf > 0.05) {
        nodes.push(
          txt(
            'MODEL IS STATELESS · APP CHECKS ACCESS & COPIES EXTERNAL STATE INTO PROMPT',
            0,
            370,
            26,
            ROLE.ok,
            'mono',
            'center',
          )
            .glow(6, ROLE.ok)
            .opacity(pf),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.8, { startOffset: 0.1, endMargin: 0.5 });

  c.on('type-continue', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('type-continue').start, 0.25) }));
  });
  c.on('saved-command', () => {
    s.play(savedOn.to(1, { duration: clampDur(c, c.cue('saved-command').start, 0.35) }));
  });
  // Strict prediction withholding: reveal profile copy AFTER spoken clause!
  c.after('profile-lookup', () => {
    s.play(profCopy.to(1, { duration: clampDur(c, c.cue('profile-lookup').end, 0.4) }));
  });
  c.on('copy-receipt', () => {
    s.play(repCopy.to(1, { duration: clampDur(c, c.cue('copy-receipt').start, 0.4) }));
  });
  c.on('replay-count', () => {
    s.play(inv2On.to(1, { duration: clampDur(c, c.cue('replay-count').start, 0.35) }));
  });
  c.on('branch-lookup', () => {
    s.play(branchOn.to(1, { duration: clampDur(c, c.cue('branch-lookup').start, 0.4) }));
  });
}
