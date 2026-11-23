---
title: Data type
aliases: ["dtype"]
importance: 93
---
An array's **data type**, commonly written `dtype`, specifies how every stored element is encoded and interpreted. Examples include signed integers such as `int64`, floating-point values such as `float32`, and Boolean values. Shape tells you where an element lives; dtype tells you what its bytes mean and how much storage each element occupies.

An `int64` value uses eight bytes, while a `float32` value uses four. Choosing a narrower type can reduce memory, but it also changes representable range, precision, and sometimes which accelerator operations are supported. Matching shape alone doesn't make an array compatible with a model expecting a particular dtype.

## Precision is part of the contract

NumPy may infer an integer dtype from integer literals or promote values during arithmetic. Mean reductions over integer inputs normally produce floating-point results, while a `float32` input can keep a `float32` accumulator unless a higher-precision dtype is requested. Inspect the resulting dtype at boundaries instead of assuming it stayed unchanged.


## Example

```python
import numpy as np

x = np.array([1, 2, 3], dtype=np.float32)
assert x.dtype == np.float32
assert x.nbytes == 12
```

Three four-byte floating-point values occupy 12 payload bytes. Creating the same values with `dtype=np.float64` doubles that payload to 24 bytes without changing the visible shape.

## Why it matters here

Feature matrices, labels, embedding vectors, model weights, and gradients carry separate dtype requirements. Accidental promotion can increase GPU memory, while overly aggressive lower precision can introduce overflow, underflow, or numerical drift.

## Related terms

- [NumPy array](glossary://numpy-array)
- [Tensor](glossary://tensor)
- [Mixed precision](glossary://mixed-precision)
- [FP16](glossary://fp16)
- [BF16](glossary://bf16)
