---
title: Array stride
aliases: ["array strides"]
importance: 86
---
An **array stride** specifies how many bytes an array advances in memory when one coordinate along a particular axis increases by one. Shape gives the number of valid coordinates; strides describe how those coordinates locate elements in the underlying byte buffer. NumPy stores one stride per axis.

A C-contiguous `float32` array shaped `(3, 4)` stores four-byte values with strides `(16, 4)`. Moving one column advances four bytes. Moving one row advances four columns, or sixteen bytes. Transposing the array changes its shape and stride metadata to `(4, 3)` and `(4, 16)` while still reading the same buffer.

Strides can be negative for a reversed view or zero when an axis repeatedly addresses the same value. NumPy measures them in bytes; PyTorch tensor strides count elements, so don't copy the numbers between APIs without accounting for element size.

## When a view stops being contiguous

Basic slicing and transposition often create views rather than copied data. A transposed view may no longer be C-contiguous. A later reshape, serialization operation, or library call that requires contiguous storage can allocate a copy unexpectedly. Use `np.shares_memory` and contiguity flags when memory ownership or performance matters.

## Example

```python
import numpy as np

x = np.arange(12, dtype=np.float32).reshape(3, 4)
assert x.strides == (16, 4)
assert x.T.strides == (4, 16)
assert np.shares_memory(x, x.T)
```

The transpose changes how indexes walk the same values. It doesn't reorder the underlying bytes merely because its displayed rows and columns exchanged roles.

## Why it matters here

Reshape-versus-transpose mistakes can silently scramble token and head assignments. Strides explain why some tensor layout operations are cheap views while later model or GPU handoffs unexpectedly materialize large copies.

## Related terms

- [NumPy array](glossary://numpy-array)
- [Tensor shape](glossary://tensor-shape)
- [Tensor](glossary://tensor)
- [Matrix](glossary://matrix)
