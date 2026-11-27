// Scene 01 (subject-intro): "Where did 30 days come from?"
// Luminous citation beam firing from Assistant Draft through [E1] photon into Cited Policy,
// revealing the browser-session clock vs service-key clock mismatch with strict prediction withholding.
import { dynamic, group, line } from 'vizmatic/stage';
import {
  CORPUS,
  COSMOS,
  ROLE,
  callerTag,
  cinemaAtmosphere,
  glowRing,
  glowingTrail,
  heroTitle,
  lumBar,
  playCue,
  runPhase,
  statusPill,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function subjectIntro(s, c) {
  const session = CORPUS.find((record) => record.id === 'eu-session-v1');
  const [subject, clock] = session.text.split(' expire after ');
  const [duration, condition] = clock.split(' of ');

  const phase = s.value(0);
  const beamPos = s.value(0); // 0 -> 1 photon travel across citation rail
  const showExcerpt = s.value(0); // 0 -> 1 reveals cited sentence after `open`
  const highlightNum = s.value(0); // highlights "30 days" on both sides
  const highlightSession = s.value(0); // highlights "Idle browser sessions"
  const highlightKey = s.value(0); // highlights "rotate a stale key"
  const showCaller = s.value(0); // shows Luna identity on `retrieve`
  // Footer mode: 0 = inspect citation, 1 = question, 2 = hold draft, 3 = search EU key policy
  const footMode = s.value(0);

  const title = heroTitle(['Where Did "30 Days"', 'Come From?'], {
    x: -855,
    y: -440,
    size: 54,
    lineHeight: 64,
    accent: ROLE.policy,
    eyebrow: 'PRODUCTION RETRIEVAL · CITATION AUDIT',
  });

  const live = dynamic(() => {
    const p = phase.value;
    const pulse = 0.78 + 0.22 * Math.sin(p * 3.0);
    const bp = Math.max(0, Math.min(1, beamPos.value));
    const ex = showExcerpt.value;
    const hn = highlightNum.value;
    const hs = highlightSession.value;
    const hk = highlightKey.value;
    const sc = showCaller.value;
    const fm = Math.round(footMode.value);

    const leftCx = -515;
    const rightCx = 515;
    const midY = 30;

    const nodes = [];

    if (sc > 0.02) {
      nodes.push(callerTag(sc));
    }

    // Subtle glowing left & right holographic frames (open floating cinema feel, zero heavy card)
    nodes.push(
      lumBar(leftCx, midY, 640, 420, {
        color: hk > 0.3 ? ROLE.request : ROLE.request,
        fillAlpha: 0.08 + hk * 0.08,
        strokeWidth: 2.2 + hk * 1.4,
        glow: 8 + hk * 6,
        radius: 16,
      }),
      txt('ASSISTANT DRAFT REPLY', leftCx, midY - 165, 26, ROLE.request, 'mono', 'center'),
      txt(
        duration,
        leftCx,
        midY - 40,
        108,
        hn > 0.3 ? ROLE.focus : COSMOS.ink,
        'serif',
        'center',
      ).glow(hn > 0.3 ? 14 * pulse : 5, hn > 0.3 ? ROLE.focus : ROLE.request),
      txt(
        'to rotate a stale service key',
        leftCx,
        midY + 86,
        36,
        hk > 0.3 ? ROLE.request : COSMOS.ink,
        'sans',
        'center',
      ).glow(hk > 0.3 ? 10 : 0, ROLE.request),
      txt('automatically · cites [E1]', leftCx, midY + 144, 28, COSMOS.muted, 'mono', 'center'),
    );

    // Right holographic frame: Cited Policy [E1]
    nodes.push(
      lumBar(rightCx, midY, 640, 420, {
        color: hs > 0.3 ? ROLE.session : ROLE.policy,
        fillAlpha: 0.08 + hs * 0.08,
        strokeWidth: 2.2 + hs * 1.4,
        glow: 8 + hs * 6,
        radius: 16,
      }),
      txt(
        'CITED POLICY PAGE  [E1]',
        rightCx,
        midY - 165,
        26,
        hs > 0.3 ? ROLE.session : ROLE.policy,
        'mono',
        'center',
      ),
    );

    // Unread shimmer lines before citation arrives (non-overlapping fade with excerpt)
    const unreadOp = Math.max(0, 1 - ex * 2.6);
    if (unreadOp > 0.02) {
      [0.72, 0.88, 0.56].forEach((frac, i) => {
        const ly = midY - 55 + i * 64;
        nodes.push(
          line([rightCx - 245, ly], [rightCx - 245 + 490 * frac, ly], {
            stroke: '#3c4e74',
            width: 8,
          }).opacity(unreadOp),
        );
      });
      nodes.push(
        txt(
          'following citation link...',
          rightCx,
          midY + 145,
          26,
          COSMOS.dim,
          'mono',
          'center',
        ).opacity(unreadOp),
      );
    }

    // Excerpt revealed after `open`
    const exOp = Math.max(0, (ex - 0.45) / 0.55);
    if (exOp > 0.02) {
      nodes.push(
        txt(
          subject,
          rightCx,
          midY - 68,
          44,
          hs > 0.3 ? ROLE.session : COSMOS.ink,
          'serif',
          'center',
        )
          .glow(hs > 0.3 ? 12 * pulse : 0, ROLE.session)
          .opacity(exOp),
        txt('expire after', rightCx, midY - 4, 32, COSMOS.muted, 'sans', 'center').opacity(exOp),
        txt(duration, rightCx, midY + 66, 68, hn > 0.3 ? ROLE.focus : COSMOS.ink, 'serif', 'center')
          .glow(hn > 0.3 ? 14 * pulse : 4, hn > 0.3 ? ROLE.focus : ROLE.policy)
          .opacity(exOp),
        txt('of ' + condition, rightCx, midY + 146, 32, COSMOS.muted, 'sans', 'center').opacity(
          exOp,
        ),
      );
    }

    // Luminous citation beam rail connecting Draft -> Policy (split cleanly around [E1] ring)
    const railL = leftCx + 320;
    const railR = rightCx - 320;
    const ringR = 54;
    const photonX = -115 + 230 * bp;
    if (photonX - ringR - 6 > railL) {
      nodes.push(
        glowingTrail(
          [
            [railL, midY],
            [photonX - ringR - 6, midY],
          ],
          { color: ROLE.policy, width: 3.4, glow: 8, opacity: 0.75, core: true },
        ),
      );
    }
    if (photonX + ringR + 6 < railR) {
      nodes.push(
        glowingTrail(
          [
            [photonX + ringR + 6, midY],
            [railR, midY],
          ],
          { color: ROLE.policy, width: 3.4, glow: 8, opacity: 0.75, core: true },
        ),
      );
    }
    nodes.push(
      glowRing(photonX, midY, ringR, ROLE.policy, {
        width: 2.8,
        glow: 10 * pulse,
        fillAlpha: 0.14,
      }),
      txt('[E1]', photonX, midY, 30, ROLE.policy, 'mono', 'center').glow(6, ROLE.policy),
    );

    // Contrasting clock-mismatch orbital indicators below frames once revealed
    if (hs > 0.02) {
      nodes.push(
        statusPill('CLOCK: BROWSER SESSION', rightCx, midY + 258, {
          color: ROLE.session,
          width: 410,
          height: 48,
          opacity: hs,
        }),
      );
    }
    if (hk > 0.02) {
      nodes.push(
        statusPill('ASKED: SERVICE KEY', leftCx, midY + 258, {
          color: ROLE.request,
          width: 370,
          height: 48,
          opacity: hk,
        }),
      );
    }

    // Discrete bottom caption (zero overlap across cues)
    const footMap = [
      { text: 'Trace the citation before trusting the number.', color: COSMOS.muted, font: 'sans' },
      { text: 'What expires after 30 days?', color: ROLE.focus, font: 'serif' },
      {
        text: 'Browser session clock',
        color: ROLE.session,
        font: 'mono',
      },
      {
        text: 'Hold the draft  ·  wrong clock for a service key',
        color: ROLE.danger,
        font: 'mono',
      },
      { text: 'Search for the current EU key policy (RAG)', color: ROLE.policy, font: 'mono' },
    ];
    const foot = footMap[Math.max(0, Math.min(footMap.length - 1, fm))];
    nodes.push(
      txt(foot.text, 0, 425, 38, foot.color, foot.font, 'center').glow(fm > 0 ? 8 : 0, foot.color),
    );

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.request, ROLE.policy), title, live);
  runPhase(s, c, phase, 14);

  // Cue choreography (strict prediction withholding on `which-clock` -> `session-clock` / `hold-reply`)
  playCue(s, c, 'open', (d) => s.play(beamPos.to(1, { duration: d })), { dur: 1.1 });
  tweenCue(s, c, 'open', showExcerpt, 1, { after: true, dur: 0.55 });
  tweenCue(s, c, 'shared-number', highlightNum, 1, { dur: 0.45 });
  playCue(s, c, 'which-clock', () => s.play(footMode.to(1, { duration: 0.05 })), { dur: 0.1 });
  playCue(
    s,
    c,
    'session-clock',
    (d) => s.play(highlightSession.to(1, { duration: d }), footMode.to(2, { duration: 0.001 })),
    { dur: 0.45 },
  );
  playCue(s, c, 'hold-reply', () => s.play(footMode.to(3, { duration: 0.001 })), {
    after: true,
    dur: 0.1,
  });
  tweenCue(s, c, 'key-clock', highlightKey, 1, { dur: 0.45 });
  playCue(
    s,
    c,
    'retrieve',
    (d) => s.play(footMode.to(4, { duration: 0.001 }), showCaller.to(1, { duration: d })),
    { dur: 0.5 },
  );
}
