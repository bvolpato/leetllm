// Cinematic Vizmatic 0.10.0 stage film for Pre-training Data at Scale (26 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyPretrainingInvariants } from './parts.mjs';
import annealSynthetic from './scenes/anneal-synthetic.mjs';
import archives from './scenes/archives.mjs';
import boundaries from './scenes/boundaries.mjs';
import bpeWork from './scenes/bpe-work.mjs';
import corpusEvidence from './scenes/corpus-evidence.mjs';
import decontamination from './scenes/decontamination.mjs';
import dedup from './scenes/dedup.mjs';
import exposureSchedule from './scenes/exposure-schedule.mjs';
import extract from './scenes/extract.mjs';
import filter from './scenes/filter.mjs';
import freshCorpus from './scenes/fresh-corpus.mjs';
import intro from './scenes/intro.mjs';
import inventoryPlan from './scenes/inventory-plan.mjs';
import inventory from './scenes/inventory.mjs';
import labelLayout from './scenes/label-layout.mjs';
import lineage from './scenes/lineage.mjs';
import lshChain from './scenes/lsh-chain.mjs';
import minhashWork from './scenes/minhash-work.mjs';
import mixture from './scenes/mixture.mjs';
import packingWork from './scenes/packing-work.mjs';
import privacy from './scenes/privacy.mjs';
import proseGates from './scenes/prose-gates.mjs';
import restartConsistency from './scenes/restart-consistency.mjs';
import scoreContracts from './scenes/score-contracts.mjs';
import tokenizerChoice from './scenes/tokenizer-choice.mjs';
import transfer from './scenes/transfer.mjs';

export default cinematicLesson({
  id: 'pretraining-data',
  accent: COSMOS.cyan,
  invariants: verifyPretrainingInvariants,
  scenes: {
    intro,
    'inventory-plan': inventoryPlan,
    extract,
    archives,
    filter,
    'prose-gates': proseGates,
    'score-contracts': scoreContracts,
    'corpus-evidence': corpusEvidence,
    dedup,
    'minhash-work': minhashWork,
    'lsh-chain': lshChain,
    inventory,
    mixture,
    'exposure-schedule': exposureSchedule,
    decontamination,
    privacy,
    'tokenizer-choice': tokenizerChoice,
    'bpe-work': bpeWork,
    'packing-work': packingWork,
    boundaries,
    'label-layout': labelLayout,
    lineage,
    'restart-consistency': restartConsistency,
    'anneal-synthetic': annealSynthetic,
    transfer,
    'fresh-corpus': freshCorpus,
  },
});
