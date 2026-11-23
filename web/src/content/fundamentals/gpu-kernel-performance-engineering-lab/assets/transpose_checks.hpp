#pragma once

#include <algorithm>
#include <charconv>
#include <cmath>
#include <cstdint>
#include <cstring>
#include <limits>
#include <stdexcept>
#include <string>
#include <vector>

// Host-side contract shared by the CUDA harness and CPU-only checker tests.
namespace transpose_lab {
inline int positive_integer(const std::string& text, int maximum) {
  int value = 0;
  const auto result = std::from_chars(text.data(), text.data() + text.size(), value);
  if (result.ec != std::errc{} || result.ptr != text.data() + text.size() ||
      value <= 0 || value > maximum) {
    throw std::invalid_argument("expected an integer in [1, " +
                                std::to_string(maximum) + "]");
  }
  return value;
}

inline uint32_t bits(float value) {
  static_assert(sizeof(float) == sizeof(uint32_t), "requires 32-bit float");
  uint32_t result;
  std::memcpy(&result, &value, sizeof(result));
  return result;
}

struct CheckResult {
  bool correct;
  size_t mismatches;
  float max_abs_error;
};

inline CheckResult check_output(bool copy, const std::vector<float>& input,
                                const std::vector<float>& output, int n) {
  if (n <= 0 || input.size() != static_cast<size_t>(n) * n ||
      output.size() != input.size()) {
    throw std::invalid_argument("shape does not match buffers");
  }
  size_t mismatches = 0;
  float max_abs_error = 0.0f;
  for (int row = 0; row < n; ++row) {
    for (int col = 0; col < n; ++col) {
      const size_t destination = static_cast<size_t>(row) * n + col;
      const size_t source = copy ? destination : static_cast<size_t>(col) * n + row;
      const float actual = output[destination], expected = input[source];
      if (bits(actual) != bits(expected)) {
        ++mismatches;
        const float error = std::isfinite(actual) && std::isfinite(expected)
                                ? std::abs(actual - expected)
                                : std::numeric_limits<float>::infinity();
        max_abs_error = std::max(max_abs_error, error);
      }
    }
  }
  return {mismatches == 0, mismatches, max_abs_error};
}
}  // namespace transpose_lab
