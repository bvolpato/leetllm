// Scene 03: media-owners - Carry one call across distinct state owners
// Three-plane hotline topology (Client -> Media Worker -> Inference Path) with two out-of-band
// control lanes: local mute branch + confirmed-playout ledger.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  quadArcPts,
  trimSeg,
  txt,
  voiceNode,
} from '../parts.mjs';

export default function mediaOwners(s, c) {
  const mediaOn = s.value(0);
  const inferOn = s.value(0);
  const sfuOn = s.value(0);
  const muteLane = s.value(0);
  const ledgerLane = s.value(0);

  const header = cinemaHeader('CALL STATE OWNERSHIP', 'Carry one call across', 'distinct owners', {
    x: -860,
    y: -445,
    accent: ROLE.media,
    size: 46,
  });

  const bgAura = aura(40, 20, 680, '#60a5fa1a', '#5ce1e618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const md = mediaOn.value;
      const inf = inferOn.value;
      const sfu = sfuOn.value;
      const mt = muteLane.value;
      const lg = ledgerLane.value;
      const nodes = [];

      const cliPt = [-560, -25];
      const medPt = [0, -25];
      const infPt = [560, -25];

      const nCli = voiceNode(cliPt[0], cliPt[1], 'CLIENT', ROLE.client, {
        radius: 82,
        sub: 'mic + speaker sink',
      });
      const nMed = voiceNode(medPt[0], medPt[1], 'MEDIA', ROLE.media, {
        radius: 82,
        sub: 'RTP · buffer · route',
        opacity: 0.45 + md * 0.55,
      });
      const nInf = voiceNode(infPt[0], infPt[1], 'INFERENCE', ROLE.policy, {
        radius: 82,
        sub: 'STT · LLM · tools · TTS',
        opacity: 0.45 + inf * 0.55,
      });

      // Hot-path duplex beams
      const [b1a, b1b] = trimSeg(cliPt, medPt, nCli.r + 18, nMed.r + 18);
      const [b2a, b2b] = trimSeg(medPt, infPt, nMed.r + 18, nInf.r + 18);
      nodes.push(
        beamWithPhotons([b1a, b1b], ROLE.client, 0, { width: 4 }),
        beamWithPhotons([b2a, b2b], ROLE.media, 0, {
          width: 4,
          alpha: 0.45 + inf * 0.55,
        }),
        nCli.node,
        nMed.node,
        nInf.node,
      );

      // Top-right topology note
      nodes.push(
        txt('CALL IDENTITY: call-Alex-4219', 470, -425, 26, ROLE.focus, 'mono', 'center'),
        txt(
          sfu > 0.5 ? '1:1 hotline needs NO group SFU room' : 'Stateful edge + elastic inference',
          470,
          -378,
          26,
          sfu > 0.5 ? ROLE.ok : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Control Lane 1 (bottom-left): Local Mute Branch (zero round-trip!)
      const muteY = 255;
      const muteAlpha = 0.35 + mt * 0.65;
      const muteArc = quadArcPts(
        [cliPt[0] - 30, cliPt[1] + nCli.r + 64],
        [-480, muteY - 40],
        20,
        20,
      );
      nodes.push(
        beamWithPhotons(muteArc, ROLE.cut, 0, {
          width: 3.4,
          alpha: muteAlpha,
        }),
        line([-820, muteY - 36], [-110, muteY - 36], { stroke: ROLE.cut, width: 2.5 }).opacity(
          muteAlpha * 0.7,
        ),
        txt('LOCAL MUTE LANE', -465, muteY, 26, ROLE.cut, 'mono', 'center').opacity(muteAlpha),
        txt(
          'onset mutes speaker without RTT',
          -465,
          muteY + 46,
          26,
          COSMOS.ink,
          'mono',
          'center',
        ).opacity(muteAlpha),
      );

      // Control Lane 2 (bottom-right): Confirmed-Playout Ledger (outside model path!)
      const ledAlpha = 0.35 + lg * 0.65;
      const ledArc = quadArcPts([medPt[0] + 30, medPt[1] + nMed.r + 64], [380, muteY - 40], 25, 24);
      nodes.push(
        beamWithPhotons(ledArc, ROLE.ok, 0, {
          width: 3.4,
          alpha: ledAlpha,
        }),
        line([90, muteY - 36], [830, muteY - 36], { stroke: ROLE.ok, width: 2.5 }).opacity(
          ledAlpha * 0.7,
        ),
        txt('CONFIRMED-PLAYOUT LEDGER', 460, muteY, 26, ROLE.ok, 'mono', 'center').opacity(
          ledAlpha,
        ),
        txt(
          'records sink-acked audio per reply',
          460,
          muteY + 46,
          26,
          COSMOS.ink,
          'mono',
          'center',
        ).opacity(ledAlpha),
      );

      // Bottom invariant
      nodes.push(
        txt(
          'Fast GPUs cannot recover a playback deadline missed at the media edge',
          0,
          398,
          26,
          lg > 0.5 ? ROLE.focus : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('va-media-owners-0-1', () => {
    s.play(mediaOn.to(1, { duration: clampDur(c, c.cue('va-media-owners-0-1').start, 0.35) }));
  });
  c.on('va-media-owners-0-2', () => {
    s.play(inferOn.to(1, { duration: clampDur(c, c.cue('va-media-owners-0-2').start, 0.35) }));
  });
  c.on('va-media-owners-0-3', () => {
    s.play(sfuOn.to(1, { duration: clampDur(c, c.cue('va-media-owners-0-3').start, 0.35) }));
  });
  c.on('va-media-owners-1-0', () => {
    s.play(muteLane.to(0.5, { duration: clampDur(c, c.cue('va-media-owners-1-0').start, 0.25) }));
  });
  c.on('va-media-owners-1-1', () => {
    s.play(muteLane.to(1, { duration: clampDur(c, c.cue('va-media-owners-1-1').start, 0.35) }));
  });
  c.on('va-media-owners-1-2', () => {
    s.play(ledgerLane.to(1, { duration: clampDur(c, c.cue('va-media-owners-1-2').start, 0.35) }));
  });
}
