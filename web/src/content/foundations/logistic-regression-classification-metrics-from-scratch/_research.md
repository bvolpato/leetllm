---
query: "Logistic Regression and Metrics: connect a worked probability prediction to log loss, gradients, fitting, and the interpretation of classification metrics."
reviewed: "2026-11-16"
status: "reviewed"
---

## Teaching scope

Keep one binary task through the main explanation: predict whether an assistant response contains an unsupported claim from ambiguity and retrieval-support features. The observed label describes the claim, while a threshold turns its probability into a verification decision.

Start with a complete prediction using intercept -1, ambiguity weight 1.2, support weight -0.6, and features [3,2]. The logit is 1.4 and the probability is approximately 0.802. Introduce binary cross-entropy and its purpose before odds, hyperplane distance, variance assumptions, or calibration.

The main progression is prediction, loss, gradient, NumPy training, independent library comparison, boundary geometry, confusion counts, precision and recall, threshold cost, ranking, and calibration. Multiclass regression extends the same gradient. SVMs, kernels, and Gaussian processes are related-model comparisons after the complete logistic mechanism, not prerequisites for it.

## Primary sources

- Hastie, Tibshirani, and Friedman, *The Elements of Statistical Learning*: logistic regression, linear decision rules, regularization, and classification. https://hastie.su.domains/ElemStatLearn/
- Bishop, *Pattern Recognition and Machine Learning*: Bernoulli likelihood, logistic regression, gradient calculations, and softmax classification. https://www.microsoft.com/en-us/research/people/cmbishop/prml-book/
- Scikit-learn `LogisticRegression`: default regularization, `C=np.inf` for an unpenalized fit, intercept handling, and solver behavior. https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html
- Scikit-learn threshold tuning: separate probability estimation from a decision cutoff and choose that cutoff using data separate from model fitting. https://scikit-learn.org/stable/modules/classification_threshold.html
- Scikit-learn `average_precision_score`: recall-weighted average precision and its distinction from trapezoidal integration. https://scikit-learn.org/stable/modules/generated/sklearn.metrics.average_precision_score.html
- Scikit-learn calibration guide: reliability diagrams, bin counts, calibration data, and why Brier score reflects more than calibration alone. https://scikit-learn.org/stable/modules/calibration.html
- Guo et al., *On Calibration of Modern Neural Networks*: temperature scaling and probability calibration. https://arxiv.org/abs/1706.04599
- Scikit-learn SVM guide: margins, hinge objectives, kernel decision functions, and the distinction between decision scores and probability estimates. https://scikit-learn.org/stable/modules/svm.html
- Rasmussen and Williams, *Gaussian Processes for Machine Learning*, Chapter 2: Gaussian conditioning, posterior mean and covariance, observation noise, and dense computational costs. https://gaussianprocess.org/gpml/chapters/RW2.pdf

The scikit-learn API was checked against its 1.9.1 documentation. The article uses `C=np.inf` rather than the deprecated `penalty=None` argument.

## Shared numerical anchors

The eight training rows use ambiguity/support pairs [1,1], [1.5,2], [2,3], [3.5,6], [4,7], [4.5,5], [2.8,4], [3.2,8], with labels [0,0,1,1,1,1,0,0]. A leading column of ones represents the intercept. At zero weights, the mean gradient is [0,-0.34375,-0.375]. A learning-rate-0.2 step gives [0,0.06875,0.075].

After 3000 gradient-descent updates, NumPy reaches approximately [-4.894,3.399,-0.959], mean loss 0.4072. Scikit-learn's unpenalized L-BFGS fit reaches approximately [-4.914,3.414,-0.964]. On the validation rows, the largest probability difference is approximately 0.0012.

The validation scores rounded to three decimals are [0.061,0.169,0.595,0.624,0.971,0.325,0.990,0.244], with labels [0,0,1,0,1,0,1,1]. At cutoffs 0.8, 0.5, and 0.2, the (TP,FP,FN) counts are (2,0,2), (3,1,1), and (4,2,0). With false-negative cost 120 and false-positive cost 18, the costs are 240, 138, and 36.

The validation ranking wins 13 of 16 positive-negative pairs: AUC 0.8125. Positives occupy ranks 1,2,4,6: AP is approximately 0.85417. Four equal-width probability bins give ECE approximately 0.139, while the mean Brier score is approximately 0.158.

Repeating each negative score 25 times preserves the negative score distribution and AUC, but produces 50 false positives alongside four true positives at cutoff 0.2. Precision is 4/54, approximately 0.0741. Appending 100 zero-score negatives changes the negative score distribution and raises AUC while leaving the selected set unchanged.

## Visual mechanisms and assessment

The threshold film keeps the eight scores in fixed positions while a vertical cutoff moves from 0.8 to 0.5 to 0.2. The caught, missed, unnecessary-check, and cost values are computed from those scores on every frame. Point brightness indicates selection; class colors remain stable. Static figures independently explain the gradient, geometry, confusion counts, ROC pair comparisons, precision-recall ordering, and reliability bins.

Mastery questions cover a probability calculation, confident-error gradients, a batch update, threshold cost, class imbalance, AUC and AP ties, ECE and Brier arithmetic, multiclass loss, hinge/kernel calculations, and GP conditioning. Practice extends the same examples by changing learning rate, thresholds, bins, and logit scale.

The next tree lesson uses flower measurements. Its continuity is the change from a straight boundary to a sequence of feature splits, rather than an obligation to reuse the response dataset.
