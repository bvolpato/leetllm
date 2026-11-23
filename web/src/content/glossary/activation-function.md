---
title: Activation function
importance: 91
---
An activation function transforms a neuron's pre-activation into the value passed to the next layer. The pre-activation is usually an affine calculation, $z = Wx + b$. Applying a nonlinear function $h = f(z)$ makes the network capable of representing relationships that a single affine map cannot express.

## Why depth needs a bend

Two unactivated layers collapse algebraically: $W_2(W_1x+b_1)+b_2=(W_2W_1)x+(W_2b_1+b_2)$. Adding more matrices changes the coefficients, not the class of function. Insert [ReLU](glossary://relu), [GELU](glossary://gelu), [sigmoid](glossary://sigmoid), or another nonlinear activation between those layers and the collapse no longer applies.

The derivative also determines which error signals reach earlier parameters during [backpropagation](glossary://backpropagation). ReLU blocks its negative branch; sigmoid and tanh can become nearly flat at extreme inputs. Choosing an activation therefore affects both representation and training dynamics.

## Example

For pre-activation $z=-2$, ReLU returns $0$, sigmoid returns approximately $0.119$, and tanh returns approximately $-0.964$. For $z=2$, those same functions return $2$, approximately $0.881$, and approximately $0.964$. They preserve different ranges and gradients, so they aren't interchangeable simply because all three are nonlinear.

## Why it matters here

The neural-network, convolution, recurrent-network, and transformer lessons all depend on recognizing where an activation changes representation and where its derivative can interrupt learning. A correct tensor shape doesn't prove an activation is appropriate or that gradients remain useful.

## Related terms

- [ReLU](glossary://relu)
- [GELU](glossary://gelu)
- [Sigmoid](glossary://sigmoid)
- [Backpropagation](glossary://backpropagation)
- [Feed-forward network](glossary://feed-forward-network)
