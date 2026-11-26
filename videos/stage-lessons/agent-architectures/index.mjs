// Cinematic Vizmatic 0.10.0 stage film for Agent Architectures (ReAct & Plan-and-Execute, 34 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyAgentArchInvariants } from './parts.mjs';
import architectureEvaluation from './scenes/architecture-evaluation.mjs';
import boundedContext from './scenes/bounded-context.mjs';
import budgetReservation from './scenes/budget-reservation.mjs';
import cacheAndContext from './scenes/cache-and-context.mjs';
import ciPolicy from './scenes/ci-policy.mjs';
import completionEvidence from './scenes/completion-evidence.mjs';
import consumedVersions from './scenes/consumed-versions.mjs';
import contextTriangle from './scenes/context-triangle.mjs';
import controlContract from './scenes/control-contract.mjs';
import criticalPath from './scenes/critical-path.mjs';
import cycleAndProgress from './scenes/cycle-and-progress.mjs';
import durableSession from './scenes/durable-session.mjs';
import explicitPlan from './scenes/explicit-plan.mjs';
import freshItinerary from './scenes/fresh-itinerary.mjs';
import incidentRecovery from './scenes/incident-recovery.mjs';
import lostReply from './scenes/lost-reply.mjs';
import planRuntime from './scenes/plan-runtime.mjs';
import reactLoop from './scenes/react-loop.mjs';
import reactResearch from './scenes/react-research.mjs';
import receiptExpiry from './scenes/receipt-expiry.mjs';
import reflexionEvidence from './scenes/reflexion-evidence.mjs';
import reflexionFeedback from './scenes/reflexion-feedback.mjs';
import replan from './scenes/replan.mjs';
import returnBackup from './scenes/return-backup.mjs';
import routerDispatch from './scenes/router-dispatch.mjs';
import searchTree from './scenes/search-tree.mjs';
import selfConsistency from './scenes/self-consistency.mjs';
import stateRecord from './scenes/state-record.mjs';
import strictToolContract from './scenes/strict-tool-contract.mjs';
import subjectIntro from './scenes/subject-intro.mjs';
import taintedInterface from './scenes/tainted-interface.mjs';
import transfer from './scenes/transfer.mjs';
import uctConstruction from './scenes/uct-construction.mjs';
import workflowChoice from './scenes/workflow-choice.mjs';

export default cinematicLesson({
  id: 'agent-architectures',
  accent: COSMOS.cyan,
  invariants: verifyAgentArchInvariants,
  scenes: {
    'subject-intro': subjectIntro,
    'control-contract': controlContract,
    'state-record': stateRecord,
    'react-loop': reactLoop,
    'react-research': reactResearch,
    'ci-policy': ciPolicy,
    'completion-evidence': completionEvidence,
    'workflow-choice': workflowChoice,
    'context-triangle': contextTriangle,
    'cache-and-context': cacheAndContext,
    'tainted-interface': taintedInterface,
    'self-consistency': selfConsistency,
    'reflexion-feedback': reflexionFeedback,
    'reflexion-evidence': reflexionEvidence,
    'explicit-plan': explicitPlan,
    'plan-runtime': planRuntime,
    'critical-path': criticalPath,
    replan,
    'receipt-expiry': receiptExpiry,
    'consumed-versions': consumedVersions,
    'router-dispatch': routerDispatch,
    'search-tree': searchTree,
    'uct-construction': uctConstruction,
    'return-backup': returnBackup,
    'strict-tool-contract': strictToolContract,
    'lost-reply': lostReply,
    'bounded-context': boundedContext,
    'budget-reservation': budgetReservation,
    'cycle-and-progress': cycleAndProgress,
    'incident-recovery': incidentRecovery,
    'durable-session': durableSession,
    'architecture-evaluation': architectureEvaluation,
    transfer,
    'fresh-itinerary': freshItinerary,
  },
});
