import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import subjectIntro from './scenes/subject-intro.mjs';
import sessionAdmission from './scenes/session-admission.mjs';
import observeProposeAct from './scenes/observe-propose-act.mjs';
import representations from './scenes/observation-representations.mjs';
import grounding from './scenes/grounding-coordinates.mjs';
import freshness from './scenes/observation-freshness.mjs';
import adapterRuntime from './scenes/adapter-runtime.mjs';
import verify from './scenes/verify-after-action.mjs';
import policy from './scenes/policy-and-approval.mjs';
import untrusted from './scenes/untrusted-observation.mjs';
import evaluation from './scenes/evaluation-contract.mjs';
import choose from './scenes/choose-and-measure.mjs';
export default narratedLesson({
  id: 'gui-agent-loop',
  scenes: {
    'subject-intro': subjectIntro,
    'session-admission': sessionAdmission,
    'observe-propose-act': observeProposeAct,
    'observation-representations': representations,
    'grounding-coordinates': grounding,
    'observation-freshness': freshness,
    'adapter-runtime': adapterRuntime,
    'verify-after-action': verify,
    'policy-and-approval': policy,
    'untrusted-observation': untrusted,
    'evaluation-contract': evaluation,
    'choose-and-measure': choose,
  },
});
