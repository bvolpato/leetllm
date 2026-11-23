#include <cuda_runtime.h>
#include "transpose_checks.hpp"

#include <algorithm>
#include <cmath>
#include <cstdlib>
#include <iomanip>
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

namespace {

constexpr int kTile = 32;
constexpr int kBlockRows = 8;
constexpr int kWarmup = 5;

#define CUDA_CHECK(call)                                                        \
  do {                                                                          \
    const cudaError_t status = (call);                                           \
    if (status != cudaSuccess) {                                                 \
      throw std::runtime_error(std::string(#call) + ": " +                     \
                               cudaGetErrorString(status));                      \
    }                                                                           \
  } while (0)

enum class Variant { kCopy, kNaive, kTiled, kPadded, kBroken };

__global__ void copy_kernel(float* output, const float* input, int n) {
  const int x = blockIdx.x * kTile + threadIdx.x;
  const int y = blockIdx.y * kTile + threadIdx.y;

  for (int offset = 0; offset < kTile; offset += kBlockRows) {
    if (x < n && y + offset < n) {
      const size_t index = static_cast<size_t>(y + offset) * n + x;
      output[index] = input[index];
    }
  }
}

__global__ void transpose_naive(float* output, const float* input, int n) {
  const int x = blockIdx.x * kTile + threadIdx.x;
  const int y = blockIdx.y * kTile + threadIdx.y;

  for (int offset = 0; offset < kTile; offset += kBlockRows) {
    if (x < n && y + offset < n) {
      const size_t input_index = static_cast<size_t>(y + offset) * n + x;
      const size_t output_index = static_cast<size_t>(x) * n + y + offset;
      output[output_index] = input[input_index];
    }
  }
}

template <int Padding>
__global__ void transpose_tiled(float* output, const float* input, int n) {
  __shared__ float tile[kTile][kTile + Padding];

  const int input_x = blockIdx.x * kTile + threadIdx.x;
  const int input_y = blockIdx.y * kTile + threadIdx.y;

  for (int offset = 0; offset < kTile; offset += kBlockRows) {
    if (input_x < n && input_y + offset < n) {
      const size_t input_index =
          static_cast<size_t>(input_y + offset) * n + input_x;
      tile[threadIdx.y + offset][threadIdx.x] = input[input_index];
    }
  }

  __syncthreads();

  const int output_x = blockIdx.y * kTile + threadIdx.x;
  const int output_y = blockIdx.x * kTile + threadIdx.y;

  for (int offset = 0; offset < kTile; offset += kBlockRows) {
    if (output_x < n && output_y + offset < n) {
      const size_t output_index =
          static_cast<size_t>(output_y + offset) * n + output_x;
      output[output_index] = tile[threadIdx.x][threadIdx.y + offset];
    }
  }
}

// Deliberately incorrect. Use only with Compute Sanitizer in the lab.
__global__ void transpose_broken_no_barrier(float* output,
                                            const float* input, int n) {
  __shared__ float tile[kTile][kTile + 1];

  const int input_x = blockIdx.x * kTile + threadIdx.x;
  const int input_y = blockIdx.y * kTile + threadIdx.y;

  for (int offset = 0; offset < kTile; offset += kBlockRows) {
    if (input_x < n && input_y + offset < n) {
      const size_t input_index =
          static_cast<size_t>(input_y + offset) * n + input_x;
      tile[threadIdx.y + offset][threadIdx.x] = input[input_index];
    }
  }

  // Missing __syncthreads(): some warps can read tile before others write it.

  const int output_x = blockIdx.y * kTile + threadIdx.x;
  const int output_y = blockIdx.x * kTile + threadIdx.y;

  for (int offset = 0; offset < kTile; offset += kBlockRows) {
    if (output_x < n && output_y + offset < n) {
      const size_t output_index =
          static_cast<size_t>(output_y + offset) * n + output_x;
      output[output_index] = tile[threadIdx.x][threadIdx.y + offset];
    }
  }
}

const char* name(Variant variant) {
  switch (variant) {
    case Variant::kCopy:
      return "copy";
    case Variant::kNaive:
      return "naive";
    case Variant::kTiled:
      return "tiled";
    case Variant::kPadded:
      return "padded";
    case Variant::kBroken:
      return "broken";
  }
  return "unknown";
}

Variant parse_variant(const std::string& value) {
  if (value == "copy") return Variant::kCopy;
  if (value == "naive") return Variant::kNaive;
  if (value == "tiled") return Variant::kTiled;
  if (value == "padded") return Variant::kPadded;
  if (value == "broken") return Variant::kBroken;
  throw std::invalid_argument(
      "variant must be all, copy, naive, tiled, padded, or broken");
}

void launch(Variant variant, float* output, const float* input, int n,
            cudaStream_t stream = nullptr) {
  const dim3 block(kTile, kBlockRows);
  const dim3 grid((n + kTile - 1) / kTile, (n + kTile - 1) / kTile);

  switch (variant) {
    case Variant::kCopy:
      copy_kernel<<<grid, block, 0, stream>>>(output, input, n);
      break;
    case Variant::kNaive:
      transpose_naive<<<grid, block, 0, stream>>>(output, input, n);
      break;
    case Variant::kTiled:
      transpose_tiled<0><<<grid, block, 0, stream>>>(output, input, n);
      break;
    case Variant::kPadded:
      transpose_tiled<1><<<grid, block, 0, stream>>>(output, input, n);
      break;
    case Variant::kBroken:
      transpose_broken_no_barrier<<<grid, block, 0, stream>>>(output, input, n);
      break;
  }
}

bool run_variant(Variant variant, const std::vector<float>& host_input,
                 float* device_input, float* device_output, int n, int iters) {
  auto verify_fresh = [&]() {
    // Every unwritten float remains a NaN, never a prior candidate's valid result.
    CUDA_CHECK(cudaMemset(device_output, 0xff, host_input.size() * sizeof(float)));
    launch(variant, device_output, device_input, n);
    CUDA_CHECK(cudaGetLastError());
    CUDA_CHECK(cudaDeviceSynchronize());
    std::vector<float> output(host_input.size());
    CUDA_CHECK(cudaMemcpy(output.data(), device_output,
                          output.size() * sizeof(float), cudaMemcpyDeviceToHost));
    return transpose_lab::check_output(variant == Variant::kCopy,
                                       host_input, output, n);
  };
  const auto before = verify_fresh();
  if (!before.correct || variant == Variant::kBroken) {
    std::cout << name(variant) << ',' << (before.correct ? "true" : "false")
              << ',' << before.mismatches << ',' << before.max_abs_error
              << ",not_measured,not_measured\n";
    return false;  // A known data race is invalid even when sampled output matches.
  }
  for (int i = 0; i < kWarmup; ++i) {
    launch(variant, device_output, device_input, n);
  }
  CUDA_CHECK(cudaGetLastError());
  CUDA_CHECK(cudaDeviceSynchronize());

  cudaEvent_t start;
  cudaEvent_t stop;
  CUDA_CHECK(cudaEventCreate(&start));
  CUDA_CHECK(cudaEventCreate(&stop));
  CUDA_CHECK(cudaEventRecord(start));
  for (int i = 0; i < iters; ++i) {
    launch(variant, device_output, device_input, n);
  }
  CUDA_CHECK(cudaEventRecord(stop));
  CUDA_CHECK(cudaEventSynchronize(stop));
  CUDA_CHECK(cudaGetLastError());

  float total_ms = 0.0f;
  CUDA_CHECK(cudaEventElapsedTime(&total_ms, start, stop));
  CUDA_CHECK(cudaEventDestroy(start));
  CUDA_CHECK(cudaEventDestroy(stop));

  const auto check = verify_fresh();
  if (!check.correct) {
    std::cout << name(variant) << ",false," << check.mismatches << ','
              << check.max_abs_error << ",not_measured,not_measured\n";
    return false;
  }
  if (!std::isfinite(total_ms) || total_ms <= 0.0f) {
    throw std::runtime_error("nonpositive or nonfinite CUDA-event interval");
  }

  const double average_ms = total_ms / iters;
  const double logical_bytes = 2.0 * host_input.size() * sizeof(float);
  const double effective_gb_s = logical_bytes / (average_ms * 1.0e6);

  std::cout << name(variant) << ',' << (check.correct ? "true" : "false")
            << ',' << check.mismatches << ',' << check.max_abs_error << ','
            << std::scientific << std::setprecision(7) << average_ms << ','
            << effective_gb_s << '\n';
  return true;
}

}  // namespace

int main(int argc, char** argv) {
  try {
    const std::string requested = argc > 1 ? argv[1] : "all";
    if (argc > 4) {
      throw std::invalid_argument("usage: transpose_lab [variant] [n] [iters]");
    }
    // Up to 4096^2 - 1, each input integer has an exact, unique float32 value.
    const int n = argc > 2 ? transpose_lab::positive_integer(argv[2], 4096) : 4096;
    const int iters = argc > 3 ? transpose_lab::positive_integer(argv[3], 1000000) : 100;
    if (requested != "all") parse_variant(requested);

    int device = 0;
    cudaDeviceProp properties{};
    CUDA_CHECK(cudaGetDevice(&device));
    CUDA_CHECK(cudaGetDeviceProperties(&properties, device));

    const size_t elements = static_cast<size_t>(n) * n;
    const size_t bytes = elements * sizeof(float);
    std::vector<float> host_input(elements);
    for (size_t i = 0; i < elements; ++i) {
      host_input[i] = static_cast<float>(i);
    }

    float* device_input = nullptr;
    float* device_output = nullptr;
    CUDA_CHECK(cudaMalloc(&device_input, bytes));
    CUDA_CHECK(cudaMalloc(&device_output, bytes));
    CUDA_CHECK(cudaMemcpy(device_input, host_input.data(), bytes,
                          cudaMemcpyHostToDevice));

    std::cerr << "device=" << properties.name << " n=" << n
              << " iters=" << iters << " tile=" << kTile << 'x' << kTile
              << " block=" << kTile << 'x' << kBlockRows << '\n';
    std::cout
        << "variant,correct,mismatches,max_abs_error,average_ms,effective_gb_s\n";

    bool valid = true;
    if (requested == "all") {
      for (Variant variant : {Variant::kCopy, Variant::kNaive,
                              Variant::kTiled, Variant::kPadded}) {
        valid = run_variant(variant, host_input, device_input, device_output, n,
                            iters) && valid;
      }
    } else {
      valid = run_variant(parse_variant(requested), host_input, device_input,
                          device_output, n, iters);
    }

    CUDA_CHECK(cudaFree(device_output));
    CUDA_CHECK(cudaFree(device_input));
    return valid ? 0 : 2;
  } catch (const std::exception& error) {
    std::cerr << "error: " << error.what() << '\n';
    return 1;
  }
}
