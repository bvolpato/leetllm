# Course Core

The LeetLLM core path teaches students to understand, build, and explain AI and ML systems. Each chapter should give the reader something concrete to reason about: a calculation, a changing picture, a working program, or a useful model. Use this document as the curriculum standard for foundation, machine learning, and lab chapters.

## Core Skill Bar

- Build implementation speed through genuine, runnable numerical and systems exercises rather than passive summaries or mock dictionaries.
- Explain stateful systems using concrete events, transactions, queues, caches, and invariants.
- Teach Transformer mechanics from scratch before relying on high-level library abstractions.
- Teach numerical stability when it changes the calculation or explains a failure the reader can now understand. Keep the first explanation of logits, probabilities, losses, and gradients focused on how they work.
- Include backpropagation reasoning across neural network, optimization, and training-loop chapters.
- Cover production predictive ML through feature pipelines, boosted models, ranking, forecasting, vision triage, monitoring, and controlled retraining.
- Cover accelerator and distributed inference systems through hardware execution, kernel measurement, batching, serving data planes, scaling, and failure modes.
- Use hybrid evaluation combining unit tests, dataset metrics, human review, and production checks.
- Include `pass@k` when evaluation chapters discuss code generation or agent success rates.
- Connect research foundations to runnable evidence for Bayesian uncertainty, posterior sampling, generalization assumptions, causal identification, conformal coverage, latent-variable fitting, and training-data privacy.

## Library Stack

- **NumPy:** tensor shapes, broadcasting, vectorization, simulations, linear algebra, and from-scratch algorithms.
- **PyTorch:** tensors, autograd, modules, GPU execution, training loops, mixed precision, and model serving.
- **SciPy:** optimization, numerical integration, statistical distributions, hypothesis tests, and sparse linear algebra where helpful.
- **pytest:** regression tests, edge cases, test fixtures, and failure reproduction.
- **pandas:** tabular cleanup, joins, grouping, feature inspection, and evaluation reports.
- **scikit-learn:** baselines, preprocessing, metrics, cross-validation, logistic regression, k-means, and PCA/SVD.
- **Hugging Face:** tokenizers, datasets, model loading, fine-tuning, and evaluation workflows.
- **FastAPI:** API endpoints, request validation, health checks, streaming, and deployment exercises.
- **Docker:** reproducible environments, local services, production parity, and deployment artifacts.

## Algorithm And Statistics Coverage

- Gradient descent and backpropagation for training intuition and numerical optimization.
- Logistic regression, linear regression from scratch, decision trees, random forests, gradient boosting, ranking, forecasting, k-means, PCA/SVD, HNSW, and beam search.
- Bayes' rule, confidence intervals, bootstrap resampling, `pass@k`, Monte Carlo sampling, and uncertainty reporting.
- Bayesian updating, Markov chain Monte Carlo, Metropolis-Hastings sampling, finite-sample learning guarantees, conformal prediction, latent-variable models, causal identification, and differentially private training.

## Lab Standard

Every core lesson must meet these engineering rules:

- **From-scratch implementation first, then production library:** Build the mechanism directly in NumPy or PyTorch tensors when it illuminates the math, then compare with the idiomatic library API (`torch.nn`, `scikit-learn`, `scipy`).
- **Compute the result being taught:** Scalar arithmetic, small simulations, and numerical libraries are all useful when they expose the mechanism. A simulation must calculate its outcomes from its rules. A model demonstration must use an actual model or inspect recorded model responses with their inputs. Hardcoded answers and library imports alone do not demonstrate learning or inference.
- **Clean pedagogical Python:** Do not clutter educational examples with repetitive type-police boilerplate (`isinstance(..., bool)`, `type(x) not in (int, float)`, or `math.isfinite` guards on ordinary inputs) unless the lesson is specifically teaching schema validation or API parsing.
- **Domain-native examples:** Ground code and math in the natural objects of the topic: token sequences for NLP and attention, image tensors for computer vision, gridworlds and MDPs for reinforcement learning, matrices and probability distributions for math and statistics, and tiles, warps, and HBM transfers for GPU kernels. Never shoehorn unrelated SRE, billing, or IAM roleplay characters into ML, math, or systems labs.
- **Useful practice and extensions:** Let the learner change an input, trace the consequence, and compare it with an explained answer. Add debugging and production concerns when they develop the chapter's central idea. Use analogies and animation to make relationships visible without imposing a fixed template on every lesson.

## Minimum Required Chapter Coverage

- Python for AI Engineering
- NumPy and Tensor Shapes
- Data Structures for AI Systems
- Probability for Machine Learning
- Bayesian Inference from Evidence
- Statistics, Estimation, and Uncertainty
- Distributions, Sampling, and Simulation
- Linear Regression from Scratch
- Cross-Validation, Leakage, and Generalization
- Statistical Learning and Generalization
- Conformal Prediction and Uncertainty
- Clustering, PCA, and Representation Learning
- Probabilistic Generative Models
- Core Retrieval Algorithms
- Decoding Algorithms
- Experiment Design and A/B Testing Foundations
- Causal Inference and Counterfactuals
- PyTorch Training Loops
- Dataset Pipelines and Data Quality
- Privacy-Preserving Machine Learning
- Feature Engineering for Production ML
- Batch and Streaming Feature Pipelines
- Gradient Boosted Trees in Production
- Ranking and Recommendation Systems
- Forecasting and Anomaly Detection
- Monitoring Predictive Models
- Ship a Delivery ETA Prediction Service
- Ship a Product Ranking System
- Ship Demand Forecasting and Alerts
- Ship a Damaged-Package Vision Classifier
- Ship a Production ML Pipeline
- Ship a Document QA Product
- Ship an Evaluation Dashboard
- Ship a Fine-Tuned Classifier
- Ship a Production LLM Agent
- Accelerator Architecture Field Guide
- GPU Profiling, Correctness, and Benchmarking
- GPU Kernel Performance Engineering Lab
- GPU Parallel Primitives Lab
- GPU Compilers and Kernel Languages
- GEMM From Naive CUDA to Tensor Cores
- Low-Precision GPU Programming
- GPU Runtime Execution Lab
- AI-Generated Kernel Engineering
- GPU Failure Operations
- Distributed Inference Data Plane
- Serving Benchmark Engineering
