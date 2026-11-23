---
query: "Neural Networks from Scratch: explain nonlinear representation, forward propagation, loss, backpropagation, and training through one XOR example."
reviewed: "2026-11-16"
status: "reviewed"
---

## Teaching scope

Use the four XOR corners throughout the main explanation. A sigmoid neuron introduces weights, bias, logits, and probabilities. Its straight boundary cannot separate the alternating labels. Two ReLU features then change the coordinates so that one output neuron can finish the classification. This gives hidden layers a visible purpose before introducing matrix notation or a catalog of activation functions.

The hand-built hidden features are `max(0,x1-x2)` and `max(0,x2-x1)`. Output weights `[4,4]` and bias `-2` yield logits `[-2,2,2,-2]` on inputs `[[0,0],[0,1],[1,0],[1,1]]`. Use those same numbers for the forward trace, the binary-cross-entropy derivative, and a single gradient update. The later training example starts from random parameters and discovers its own representation.

The article uses one row of weights per output neuron. For a batch `X` with shape `(B,D)` and a layer weight matrix `W` with shape `(H,D)`, the forward calculation is `X @ W.T + b`. The bias has shape `(H,)`. Keep this convention in the prose, figures, NumPy program, and PyTorch comparison.

Activation families, initialization, expressiveness, and numerical stability follow the complete training mechanism. They extend the model the reader already understands.

## Primary sources and the claims they support

- Goodfellow, Bengio, and Courville, *Deep Learning*, Chapter 6: feedforward networks, the XOR example, hidden representations, differentiable losses, and backpropagation. https://www.deeplearningbook.org/contents/mlp.html
- Rumelhart, Hinton, and Williams, *Learning representations by back-propagating errors* (1986): error derivatives propagated through hidden layers. https://www.cs.toronto.edu/~hinton/absps/naturebp.pdf
- PyTorch `Linear`: weight shape `(out_features, in_features)` and affine computation. https://docs.pytorch.org/docs/stable/generated/torch.nn.Linear.html
- PyTorch `BCEWithLogitsLoss`: combining sigmoid and binary cross-entropy using a stable formulation, with mean reduction by default. https://docs.pytorch.org/docs/stable/generated/torch.nn.BCEWithLogitsLoss.html
- PyTorch autograd tutorial: tensors with `requires_grad`, computation graphs, `backward()`, and gradient accumulation. https://docs.pytorch.org/tutorials/beginner/basics/autogradqs_tutorial.html
- He et al., *Delving Deep into Rectifiers* (2015): rectifier-aware initialization with weight variance `2/fan_in`. This is the initialization paper, not the separate ResNet paper. https://arxiv.org/abs/1502.01852
- Hendrycks and Gimpel, *Gaussian Error Linear Units (GELUs)* (2016): GELU as `x Phi(x)`. https://arxiv.org/abs/1606.08415
- Cybenko, *Approximation by superpositions of a sigmoidal function* (1989): uniform approximation of continuous functions on compact domains by sufficiently wide networks with suitable sigmoidal activations. https://doi.org/10.1007/BF02551274
- Leshno et al., *Multilayer Feedforward Networks with Non-Polynomial Activation Functions Can Approximate Any Function* (1992 working paper): the role of nonpolynomial activations and thresholds in approximation results. https://archive.nyu.edu/handle/2451/14329

## Computational anchors

The hand-built network gives probabilities approximately `[0.119,0.881,0.881,0.119]`. At `x=[1,0]`, `y=1`, the output-logit derivative is `p-y`, approximately `-0.119`. Multiplication by output weight `4` gives approximately `-0.477`; the active ReLU passes it and the inactive ReLU stops it. The first hidden weight row therefore has gradient approximately `[-0.477,0]`.

For a batch mean loss, let `D2=(P-Y)/B`. Then `dW2=D2.T @ H`, `db2=D2.sum(axis=0)`, `D1=(D2 @ W2)*(Z1>0)`, `dW1=D1.T @ X`, and `db1=D1.sum(axis=0)`. The article compares all four manually computed parameter gradients with PyTorch autograd, using double precision and values away from ReLU hinges.

The NumPy training example uses seed `1`, two hidden units, learning rate `0.1`, and `4000` updates. Its final mean loss is approximately `0.0044`, with probabilities approximately `[0.007,0.998,0.998,0.007]`. These values describe this particular reproducible run. Different seeds can reach different parameters or fail to learn with such a narrow network.

## Visual mechanisms

The feature-map animation must move the same four points from input coordinates to hidden coordinates. The diagonal blue pair meets at the origin; the two orange points remain on separate positive axes. Only after that transformation does the line `h1+h2=0.5` appear. A folding grid makes the coordinate transformation visible between the four observed inputs.

The static fallback places input space and hidden space side by side. A separate network figure traces `x=[1,0]` forward, and the backward figure follows `p-y` through the output weights and ReLU slopes. Activation curves share one scale so their slopes and negative branches can be compared.

## Assessment coverage

Exercises and mastery questions should test geometric separation, ReLU feature calculations, affine composition, tensor shapes and parameter counts, the `p-y` derivative, inactive ReLU gradients, gradient-descent signs, batch averaging, symmetry breaking, and held-out evaluation. Distractors should represent mistakes in those mechanisms, such as reversing a gradient sign or retaining a negative ReLU output.
