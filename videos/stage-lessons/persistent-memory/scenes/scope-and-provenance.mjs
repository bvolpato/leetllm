// Scene 4: scope-and-provenance - Which records may billing search?
// Scoped eligibility sieve over ACCESS_FIXTURE (6 records: 2 eligible billing replays vs
// payments tenant 0.99, superseded v1, expired, revoked): strict prediction pause on Beat 0 ->
// host ACL + freshness sieve passes ONLY the 2 billing replays -> historical log vs current profile!
import { group, line } from 'vizmatic/stage';
import {
  ACCESS_FIXTURE,
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  fadeInHalf,
  fadeOutHalf,
  guardedDynamic,
  memNode,
  txt,
} from '../parts.mjs';

export default function scopeAndProvenance(s, c) {
  const pulse = s.value(0);
  const filterReveal = s.value(0);
  const prefMode = s.value(0); // 0 = 6-record scope sieve, 1 = log vs current profile
  const retireOn = s.value(0);

  const header = cinemaHeader('PRE-RANKING SCOPE SIEVE', 'Which records may', 'billing search?', {
    accent: ROLE.ok,
    size: 50,
  });

  const stageAura = aura(160, 40, 620, '#6ee7b71c', '#ff6b8b1a');

  // Mode 0: 6-record eligibility register (withholding verdicts during Beat 0!)
  const mode0 = guardedDynamic(
    () => fadeOutHalf(prefMode.value),
    (a) => {
      const fr = filterReveal.value;
      const nodes = [];

      nodes.push(
        txt(
          'SESSION: tenant=billing · repo=webhook',
          -840,
          -185,
          26,
          ROLE.prompt,
          'mono',
          'left',
        ).opacity(a),
        txt('RECORD', -820, -130, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt('TENANT / STATE', -320, -130, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt('SIM', 180, -130, 26, COSMOS.muted, 'mono', 'center').opacity(a),
        txt('ELIGIBLE?', 490, -130, 26, ROLE.focus, 'mono', 'center').opacity(a),
        line([-840, -100], [780, -100], { stroke: '#293961', width: 2 }).opacity(a),
      );

      ACCESS_FIXTURE.records.forEach((rec, i) => {
        const y = -52 + i * 62;
        const ok = ACCESS_FIXTURE.eligible.some((e) => e.id === rec.id);
        const stateTag =
          rec.tenant !== 'billing'
            ? 'tenant=payments (private!)'
            : rec.superseded
              ? 'superseded (v1 != v2)'
              : rec.expired
                ? 'expired TTL'
                : !rec.sourceAccess
                  ? 'access revoked'
                  : 'billing · current · readable';

        const rowCol = fr > 0.35 ? (ok ? ROLE.ok : ROLE.fail) : COSMOS.ink;
        nodes.push(
          txt(rec.id, -820, y, 26, rowCol, 'mono', 'left').opacity(
            a * (fr > 0.35 && !ok ? 0.55 : 1),
          ),
          txt(
            stateTag,
            -320,
            y,
            26,
            fr > 0.35 && !ok ? ROLE.fail : COSMOS.muted,
            'mono',
            'left',
          ).opacity(a),
          txt(
            rec.similarity.toFixed(2),
            180,
            y,
            26,
            rec.similarity >= 0.99 ? ROLE.focus : COSMOS.ink,
            'mono',
            'center',
          ).opacity(a),
          txt(
            fr > 0.35 ? (ok ? 'ADMIT' : 'BLOCKED') : '?',
            490,
            y,
            26,
            fr > 0.35 ? (ok ? ROLE.ok : ROLE.fail) : ROLE.focus,
            'mono',
            'center',
          )
            .glow(fr > 0.35 && ok ? 7 : 0, ROLE.ok)
            .opacity(a),
        );
      });

      nodes.push(
        txt(
          fr > 0.35
            ? 'HOST FILTERS TENANT, REPO, ACCESS, TTL & VERSION BEFORE RANKING (0.99 SIM CANNOT BYPASS!)'
            : 'Payments incident has 0.99 similarity. Which rows can enter comparison?',
          0,
          360,
          fr > 0.35 ? 26 : 32,
          fr > 0.35 ? ROLE.ok : ROLE.focus,
          fr > 0.35 ? 'mono' : 'serif',
          'center',
        )
          .glow(6, fr > 0.35 ? ROLE.ok : ROLE.focus)
          .opacity(a),
      );

      return group(...nodes);
    },
  );

  // Mode 1: Historical Log Receipt vs Current Project Profile
  const mode1 = guardedDynamic(
    () => fadeInHalf(prefMode.value),
    (a) => {
      const rt = retireOn.value;
      const nodes = [];

      const nLog = memNode(-460, 10, 'LOG', ROLE.episodic, {
        radius: 64,
        sub: 'What ran last time',
        opacity: a * (rt > 0.35 ? 0.5 : 1),
      });
      const nProf = memNode(460, 10, 'PROFILE', ROLE.profile, {
        radius: 68,
        sub: 'Command to use NOW',
        opacity: a,
      });
      nodes.push(
        nLog.node,
        nProf.node,
        txt('HISTORICAL FACT', -460, -110, 26, ROLE.episodic, 'mono', 'center').opacity(a),
        txt('ACTIVE PREFERENCE', 460, -110, 26, ROLE.profile, 'mono', 'center').opacity(a),
        txt(
          rt > 0.35
            ? 'ADA’S EXPLICIT CHANGE RETIRES OLD PREFERENCE · ASK ADA IF CONFLICT REMAINS'
            : 'Compare instructions for the same field, project & conditions',
          0,
          290,
          28,
          rt > 0.35 ? ROLE.ok : COSMOS.ink,
          'mono',
          'center',
        )
          .glow(rt > 0.35 ? 7 : 0, ROLE.ok)
          .opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, mode0, mode1);
  driftValue(s, c, pulse, 4.4, { startOffset: 0.1, endMargin: 0.5 });

  // Strict prediction withholding: reveal admitted billing rows AFTER spoken clause!
  c.after('scope-filter', () => {
    s.play(filterReveal.to(1, { duration: clampDur(c, c.cue('scope-filter').end, 0.35) }));
  });
  c.on('receipt-vs-rule', () => {
    s.play(prefMode.to(1, { duration: clampDur(c, c.cue('receipt-vs-rule').start, 0.35) }));
  });
  c.on('source-replacement', () => {
    s.play(retireOn.to(1, { duration: clampDur(c, c.cue('source-replacement').start, 0.35) }));
  });
}
