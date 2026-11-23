---
title: GRU
aliases: ["gated recurrent unit"]
importance: 82
---
A gated recurrent unit (GRU) is a recurrent architecture that combines prior hidden state and new candidate information through learned gates. It usually exposes one hidden state rather than maintaining the distinct hidden and cell states used by an LSTM.

## Update and reset gates are separate

The update gate decides how much prior state to retain versus how much candidate state to write. The reset gate controls how strongly the previous state participates in constructing that candidate. A common convention is:

$$
h_t=(1-z_t)\odot h_{t-1}+z_t\odot\tilde h_t
$$

where $z_t$ is an update gate and $\tilde h_t$ is the candidate. Some papers and libraries reverse the meaning of $z_t$ and use $z_th_{t-1}+(1-z_t)\tilde h_t$. Both parameterizations express interpolation; always identify which convention the implementation uses before interpreting a printed gate value.


## Example

Using the first convention, let the old scalar state be $10$, the candidate state be $2$, and the update gate be $0.25$. The next state is $(1-0.25)10+0.25(2)=8$. Under the reversed convention, the same numeric gate would yield $4$ instead. The gate's semantic role changes between conventions; either is valid when its equations and implementation agree.

## Why it matters here

Comparing a GRU with an LSTM helps explain what gated recurrence changes without confusing architecture complexity with guaranteed quality. The sequence lesson emphasizes explicit state transitions, gate interpretation, and gradient behavior before introducing transformer attention.

## Related terms

- [Recurrent neural network](glossary://recurrent-neural-network)
- [LSTM](glossary://lstm)
- [Sigmoid](glossary://sigmoid)
- [Tanh](glossary://tanh)
