// The lesson `estimation` as a narrated film. One file for each scene, in the order of lesson.yaml.
import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import accumulatingEvidence from './scenes/accumulating-evidence.mjs';
import biasAndPrior from './scenes/bias-and-prior.mjs';
import boundary from './scenes/boundary.mjs';
import clusterEvidence from './scenes/cluster-evidence.mjs';
import intro from './scenes/intro.mjs';
import missingLabelTransfer from './scenes/missing-label-transfer.mjs';
import priorAndCalibration from './scenes/prior-and-calibration.mjs';
import report from './scenes/report.mjs';
import resampling from './scenes/resampling.mjs';
import sampleDesign from './scenes/sample-design.mjs';
import sampling from './scenes/sampling.mjs';
import scoreInterval from './scenes/score-interval.mjs';
import targetAndMissing from './scenes/target-and-missing.mjs';

export default narratedLesson({
  id: 'estimation',
  scenes: {
    intro,
    sampling,
    'score-interval': scoreInterval,
    'accumulating-evidence': accumulatingEvidence,
    boundary,
    'sample-design': sampleDesign,
    resampling,
    'prior-and-calibration': priorAndCalibration,
    'target-and-missing': targetAndMissing,
    'cluster-evidence': clusterEvidence,
    'bias-and-prior': biasAndPrior,
    'missing-label-transfer': missingLabelTransfer,
    report,
  },
});
