#ifndef GEMM_HOST_CHECK
#include <cuda_fp16.h>
#include <cuda_runtime.h>
#include <mma.h>
#endif

#include <algorithm>
#include <cassert>
#include <charconv>
#include <cmath>
#include <cstdint>
#include <cstdlib>
#include <functional>
#include <iomanip>
#include <iostream>
#include <limits>
#include <random>
#include <stdexcept>
#include <string>
#include <vector>

#ifndef GEMM_HOST_CHECK
#define CUDA_CHECK(call)                                                        \
    do {                                                                        \
        cudaError_t status_ = (call);                                           \
        if (status_ != cudaSuccess) {                                           \
            std::cerr << "CUDA error: " << cudaGetErrorString(status_)         \
                      << " at " << __FILE__ << ':' << __LINE__ << '\n';         \
            std::exit(EXIT_FAILURE);                                            \
        }                                                                       \
    } while (0)

constexpr int TILE = 16;
constexpr int REG_N = 64;

__global__ void gemm_scalar_strided(const float* A, const float* B, float* C,
                                    int M, int N, int K) {
    // threadIdx.x changes first inside a warp, so adjacent lanes change rows.
    int row = blockIdx.x * blockDim.x + threadIdx.x;
    int col = blockIdx.y * blockDim.y + threadIdx.y;
    if (row >= M || col >= N) return;

    float acc = 0.0f;
    for (int k = 0; k < K; ++k) acc += A[row * K + k] * B[k * N + col];
    C[row * N + col] = acc;
}

__global__ void gemm_scalar_coalesced(const float* A, const float* B, float* C,
                                      int M, int N, int K) {
    // Adjacent lanes own adjacent columns, so B loads and C stores are contiguous.
    int row = blockIdx.y * blockDim.y + threadIdx.y;
    int col = blockIdx.x * blockDim.x + threadIdx.x;
    if (row >= M || col >= N) return;

    float acc = 0.0f;
    for (int k = 0; k < K; ++k) acc += A[row * K + k] * B[k * N + col];
    C[row * N + col] = acc;
}

__global__ void gemm_shared(const float* A, const float* B, float* C,
                            int M, int N, int K) {
    __shared__ float As[TILE][TILE];
    __shared__ float Bs[TILE][TILE];

    int row = blockIdx.y * TILE + threadIdx.y;
    int col = blockIdx.x * TILE + threadIdx.x;
    float acc = 0.0f;

    for (int k0 = 0; k0 < K; k0 += TILE) {
        int ak = k0 + threadIdx.x;
        int bk = k0 + threadIdx.y;
        As[threadIdx.y][threadIdx.x] =
            (row < M && ak < K) ? A[row * K + ak] : 0.0f;
        Bs[threadIdx.y][threadIdx.x] =
            (bk < K && col < N) ? B[bk * N + col] : 0.0f;
        __syncthreads();

#pragma unroll
        for (int k = 0; k < TILE; ++k) {
            acc += As[threadIdx.y][k] * Bs[k][threadIdx.x];
        }
        __syncthreads();
    }

    if (row < M && col < N) C[row * N + col] = acc;
}

__global__ void gemm_register_blocked(const float* A, const float* B, float* C,
                                      int M, int N, int K) {
    __shared__ float As[TILE][TILE];
    __shared__ float Bs[TILE][REG_N];

    int row = blockIdx.y * TILE + threadIdx.y;
    int col0 = blockIdx.x * REG_N;
    int tid = threadIdx.y * TILE + threadIdx.x;
    float acc[4] = {0.0f, 0.0f, 0.0f, 0.0f};

    for (int k0 = 0; k0 < K; k0 += TILE) {
        int ak = k0 + threadIdx.x;
        As[threadIdx.y][threadIdx.x] =
            (row < M && ak < K) ? A[row * K + ak] : 0.0f;

        for (int linear = tid; linear < TILE * REG_N; linear += TILE * TILE) {
            int sk = linear / REG_N;
            int sn = linear % REG_N;
            int gk = k0 + sk;
            int col = col0 + sn;
            Bs[sk][sn] = (gk < K && col < N) ? B[gk * N + col] : 0.0f;
        }
        __syncthreads();

#pragma unroll
        for (int k = 0; k < TILE; ++k) {
            float a = As[threadIdx.y][k];
#pragma unroll
            for (int j = 0; j < 4; ++j) {
                acc[j] += a * Bs[k][threadIdx.x + j * TILE];
            }
        }
        __syncthreads();
    }

#pragma unroll
    for (int j = 0; j < 4; ++j) {
        int col = col0 + threadIdx.x + j * TILE;
        if (row < M && col < N) C[row * N + col] = acc[j];
    }
}

__global__ void gemm_wmma_aligned(const half* A, const half* B, float* C,
                                  int M, int N, int K) {
#if defined(__CUDA_ARCH__) && __CUDA_ARCH__ < 700
    // Never silently turn an unsupported target into a no-op kernel.
    asm("trap;");
#else
    using namespace nvcuda;
    int row = blockIdx.y * TILE;
    int col = blockIdx.x * TILE;

    wmma::fragment<wmma::accumulator, TILE, TILE, TILE, float> c_frag;
    wmma::fill_fragment(c_frag, 0.0f);

    for (int k0 = 0; k0 < K; k0 += TILE) {
        wmma::fragment<wmma::matrix_a, TILE, TILE, TILE, half,
                       wmma::row_major>
            a_frag;
        wmma::fragment<wmma::matrix_b, TILE, TILE, TILE, half,
                       wmma::row_major>
            b_frag;
        wmma::load_matrix_sync(a_frag, A + row * K + k0, K);
        wmma::load_matrix_sync(b_frag, B + k0 * N + col, N);
        wmma::mma_sync(c_frag, a_frag, b_frag, c_frag);
    }
    wmma::store_matrix_sync(C + row * N + col, c_frag, N,
                            wmma::mem_row_major);
#endif
}
#endif  // !GEMM_HOST_CHECK

struct ErrorStats {
    double max_abs = 0.0;
    double max_rel = 0.0;
    bool pass = true;
};

int round_up(int value, int multiple) {
    if (value <= 0 || multiple <= 0 ||
        value > std::numeric_limits<int>::max() - (multiple - 1)) {
        throw std::invalid_argument("invalid or overflowing padded dimension");
    }
    return ((value + multiple - 1) / multiple) * multiple;
}

int positive_arg(const char* text) {
    std::string input(text);
    int value = 0;
    auto parsed = std::from_chars(input.data(), input.data() + input.size(), value);
    if (parsed.ec != std::errc{} || parsed.ptr != input.data() + input.size() || value <= 0) {
        throw std::invalid_argument("arguments must be positive decimal integers");
    }
    return value;
}

void validate_shape(int M, int N, int K) {
    const std::uint64_t Mp = round_up(M, 16);
    const std::uint64_t Np = round_up(N, 16);
    const std::uint64_t Kp = round_up(K, 16);
    const auto limit = static_cast<std::uint64_t>(std::numeric_limits<int>::max());
    if (Mp * Kp > limit || Kp * Np > limit || Mp * Np > limit) {
        throw std::invalid_argument("shape exceeds this lab's signed 32-bit indexing");
    }
}

std::uint64_t flop_count(int M, int N, int K) {
    return 2ULL * static_cast<std::uint64_t>(M) *
           static_cast<std::uint64_t>(N) * static_cast<std::uint64_t>(K);
}

std::vector<double> reference_gemm(const std::vector<float>& A,
                                   const std::vector<float>& B,
                                   int M, int N, int K) {
    std::vector<double> C(static_cast<size_t>(M) * N, 0.0);
    for (int row = 0; row < M; ++row) {
        for (int col = 0; col < N; ++col) {
            double acc = 0.0;
            for (int k = 0; k < K; ++k) {
                acc += static_cast<double>(A[row * K + k]) *
                       static_cast<double>(B[k * N + col]);
            }
            C[row * N + col] = acc;
        }
    }
    return C;
}

ErrorStats compare(const std::vector<float>& got,
                   const std::vector<double>& ref,
                   double atol, double rtol) {
    ErrorStats stats;
    if (got.empty() || got.size() != ref.size() || !std::isfinite(atol) ||
        !std::isfinite(rtol) || atol < 0.0 || rtol < 0.0) {
        stats.pass = false;
        return stats;
    }
    for (size_t i = 0; i < got.size(); ++i) {
        if (!std::isfinite(got[i]) || !std::isfinite(ref[i])) {
            stats.pass = false;
            stats.max_abs = stats.max_rel = std::numeric_limits<double>::infinity();
            continue;
        }
        double abs_err = std::abs(static_cast<double>(got[i]) - ref[i]);
        double rel_err = abs_err / std::max(std::abs(ref[i]), 1e-12);
        stats.max_abs = std::max(stats.max_abs, abs_err);
        stats.max_rel = std::max(stats.max_rel, rel_err);
        if (abs_err > atol + rtol * std::abs(ref[i])) {
            stats.pass = false;
        }
    }
    return stats;
}

#ifndef GEMM_HOST_CHECK
float time_ms(const std::function<void()>& launch, int iterations) {
    cudaEvent_t start, stop;
    CUDA_CHECK(cudaEventCreate(&start));
    CUDA_CHECK(cudaEventCreate(&stop));
    for (int i = 0; i < 5; ++i) launch();
    CUDA_CHECK(cudaGetLastError());
    CUDA_CHECK(cudaDeviceSynchronize());

    CUDA_CHECK(cudaEventRecord(start));
    for (int i = 0; i < iterations; ++i) launch();
    CUDA_CHECK(cudaGetLastError());
    CUDA_CHECK(cudaEventRecord(stop));
    CUDA_CHECK(cudaEventSynchronize(stop));
    float total_ms = 0.0f;
    CUDA_CHECK(cudaEventElapsedTime(&total_ms, start, stop));
    CUDA_CHECK(cudaEventDestroy(start));
    CUDA_CHECK(cudaEventDestroy(stop));
    if (!std::isfinite(total_ms) || total_ms <= 0.0f) {
        throw std::runtime_error("nonpositive or nonfinite event duration; increase iterations");
    }
    return total_ms / iterations;
}

void print_result(const std::string& name, const ErrorStats& error,
                   float ms, int M, int N, int K) {
    double tflops = static_cast<double>(flop_count(M, N, K)) /
                    (static_cast<double>(ms) * 1e9);
    std::cout << std::left << std::setw(21) << name
              << (error.pass ? "PASS" : "FAIL")
              << " max_abs=" << std::scientific << error.max_abs
              << " max_rel=" << error.max_rel << std::fixed
              << " mean_ms=" << std::setprecision(4) << ms
              << " tflop_s=" << std::setprecision(3) << tflops << '\n';
}

int main(int argc, char** argv) {
    int M = 257, N = 263, K = 251, iterations = 20;
    try {
        if (argc > 5) throw std::invalid_argument("usage: gemm_lab [M N K iterations]");
        if (argc > 1) M = positive_arg(argv[1]);
        if (argc > 2) N = positive_arg(argv[2]);
        if (argc > 3) K = positive_arg(argv[3]);
        if (argc > 4) iterations = positive_arg(argv[4]);
        validate_shape(M, N, K);
    } catch (const std::exception& error) {
        std::cerr << error.what() << '\n';
        return EXIT_FAILURE;
    }

    cudaDeviceProp prop{};
    CUDA_CHECK(cudaGetDeviceProperties(&prop, 0));
    if ((M + 15) / 16 > prop.maxGridSize[0] ||
        (M + 7) / 8 > prop.maxGridSize[1] ||
        (N + 15) / 16 > prop.maxGridSize[1] ||
        (N + 15) / 16 > prop.maxGridSize[0]) {
        std::cerr << "shape exceeds this lab's launch-grid limits\n";
        return EXIT_FAILURE;
    }
    std::cout << "device=" << prop.name << " cc=" << prop.major << '.'
              << prop.minor << " shape=" << M << 'x' << N << 'x' << K
              << " iterations=" << iterations << '\n';

    std::mt19937 rng(7);
    std::uniform_real_distribution<float> dist(-0.5f, 0.5f);
    std::vector<float> A(static_cast<size_t>(M) * K);
    std::vector<float> B(static_cast<size_t>(K) * N);
    for (size_t i = 0; i < A.size(); ++i) {
        A[i] = (i % 17 == 0) ? 0.0f : dist(rng);
    }
    for (size_t i = 0; i < B.size(); ++i) {
        B[i] = (i % 19 == 0) ? 0.0f : dist(rng);
    }
    std::vector<double> ref = reference_gemm(A, B, M, N, K);
    std::vector<float> got(static_cast<size_t>(M) * N);

    float *dA, *dB, *dC;
    CUDA_CHECK(cudaMalloc(&dA, A.size() * sizeof(float)));
    CUDA_CHECK(cudaMalloc(&dB, B.size() * sizeof(float)));
    CUDA_CHECK(cudaMalloc(&dC, got.size() * sizeof(float)));
    CUDA_CHECK(cudaMemcpy(dA, A.data(), A.size() * sizeof(float),
                          cudaMemcpyHostToDevice));
    CUDA_CHECK(cudaMemcpy(dB, B.data(), B.size() * sizeof(float),
                          cudaMemcpyHostToDevice));

    auto check_then_time = [&](const char* name, const std::function<void()>& launch) {
        // All-one bits represent NaN for FP32. Missing stores must not inherit
        // a previous kernel's correct output.
        CUDA_CHECK(cudaMemset(dC, 0xff, got.size() * sizeof(float)));
        launch();
        CUDA_CHECK(cudaGetLastError());
        CUDA_CHECK(cudaDeviceSynchronize());
        CUDA_CHECK(cudaMemcpy(got.data(), dC, got.size() * sizeof(float),
                              cudaMemcpyDeviceToHost));
        ErrorStats error = compare(got, ref, 2e-4, 2e-4);
        if (!error.pass) {
            std::cerr << name << " FAIL timing=SKIPPED max_abs="
                      << error.max_abs << " max_rel=" << error.max_rel << '\n';
            return false;
        }
        print_result(name, error, time_ms(launch, iterations), M, N, K);
        return true;
    };

    dim3 scalar_block(16, 16);
    dim3 strided_grid((M + 15) / 16, (N + 15) / 16);
    auto strided = [&] {
        gemm_scalar_strided<<<strided_grid, scalar_block>>>(dA, dB, dC, M, N,
                                                            K);
    };
    if (!check_then_time("scalar_strided", strided)) return EXIT_FAILURE;

    dim3 coalesced_block(32, 8);
    dim3 coalesced_grid((N + 31) / 32, (M + 7) / 8);
    auto coalesced = [&] {
        gemm_scalar_coalesced<<<coalesced_grid, coalesced_block>>>(
            dA, dB, dC, M, N, K);
    };
    if (!check_then_time("scalar_coalesced", coalesced)) return EXIT_FAILURE;

    dim3 tile_block(TILE, TILE);
    dim3 tile_grid((N + TILE - 1) / TILE, (M + TILE - 1) / TILE);
    auto shared = [&] {
        gemm_shared<<<tile_grid, tile_block>>>(dA, dB, dC, M, N, K);
    };
    if (!check_then_time("shared_16x16", shared)) return EXIT_FAILURE;

    dim3 reg_grid((N + REG_N - 1) / REG_N, (M + TILE - 1) / TILE);
    auto reg = [&] {
        gemm_register_blocked<<<reg_grid, tile_block>>>(dA, dB, dC, M, N, K);
    };
    if (!check_then_time("register_16x64", reg)) return EXIT_FAILURE;

    if (prop.major >= 7) {
        int Mp = round_up(M, TILE);
        int Np = round_up(N, TILE);
        int Kp = round_up(K, TILE);
        std::vector<half> Ah(static_cast<size_t>(Mp) * Kp,
                             __float2half(0.0f));
        std::vector<half> Bh(static_cast<size_t>(Kp) * Np,
                             __float2half(0.0f));
        std::vector<float> Aq(A.size()), Bq(B.size());
        for (int row = 0; row < M; ++row) {
            for (int k = 0; k < K; ++k) {
                half value = __float2half(A[row * K + k]);
                Ah[row * Kp + k] = value;
                Aq[row * K + k] = __half2float(value);
            }
        }
        for (int k = 0; k < K; ++k) {
            for (int col = 0; col < N; ++col) {
                half value = __float2half(B[k * N + col]);
                Bh[k * Np + col] = value;
                Bq[k * N + col] = __half2float(value);
            }
        }
        std::vector<double> half_ref = reference_gemm(Aq, Bq, M, N, K);
        std::vector<float> Cp(static_cast<size_t>(Mp) * Np);
        half *dAh, *dBh;
        float* dCp;
        CUDA_CHECK(cudaMalloc(&dAh, Ah.size() * sizeof(half)));
        CUDA_CHECK(cudaMalloc(&dBh, Bh.size() * sizeof(half)));
        CUDA_CHECK(cudaMalloc(&dCp, Cp.size() * sizeof(float)));
        CUDA_CHECK(cudaMemcpy(dAh, Ah.data(), Ah.size() * sizeof(half),
                              cudaMemcpyHostToDevice));
        CUDA_CHECK(cudaMemcpy(dBh, Bh.data(), Bh.size() * sizeof(half),
                              cudaMemcpyHostToDevice));

        dim3 wmma_grid(Np / TILE, Mp / TILE);
        auto tensor_core = [&] {
            gemm_wmma_aligned<<<wmma_grid, 32>>>(dAh, dBh, dCp, Mp, Np, Kp);
        };
        CUDA_CHECK(cudaMemset(dCp, 0xff, Cp.size() * sizeof(float)));
        tensor_core();
        CUDA_CHECK(cudaGetLastError());
        CUDA_CHECK(cudaDeviceSynchronize());
        CUDA_CHECK(cudaMemcpy(Cp.data(), dCp, Cp.size() * sizeof(float),
                              cudaMemcpyDeviceToHost));
        for (int row = 0; row < M; ++row) {
            std::copy_n(Cp.data() + row * Np, N, got.data() + row * N);
        }
        ErrorStats error = compare(got, half_ref, 5e-3, 2e-3);
        if (!error.pass || !std::all_of(Cp.begin(), Cp.end(),
                                      [](float value) { return std::isfinite(value); })) {
            std::cerr << "wmma_f16_f32 FAIL timing=SKIPPED max_abs="
                      << error.max_abs << " max_rel=" << error.max_rel << '\n';
            return EXIT_FAILURE;
        }
        float ms = time_ms(tensor_core, iterations);
        print_result("wmma_f16_f32", error, ms, M, N, K);
        // Report input-quantization plus arithmetic error separately. The zero
        // tolerances request statistics, not an application-quality pass gate.
        ErrorStats original_input_error = compare(got, ref, 0.0, 0.0);
        std::cout << "wmma_vs_original_fp32 max_abs=" << std::scientific
                  << std::setprecision(6) << original_input_error.max_abs
                  << " max_rel=" << original_input_error.max_rel
                  << std::fixed << '\n';
        std::cout << "wmma_padding=" << Mp << 'x' << Np << 'x' << Kp
                  << " logical_flops=" << flop_count(M, N, K)
                  << " executed_flops=" << flop_count(Mp, Np, Kp) << '\n';

        CUDA_CHECK(cudaFree(dAh));
        CUDA_CHECK(cudaFree(dBh));
        CUDA_CHECK(cudaFree(dCp));
    } else {
        std::cout << "wmma_f16_f32 SKIP requires compute capability >= 7.0\n";
    }

    CUDA_CHECK(cudaFree(dA));
    CUDA_CHECK(cudaFree(dB));
    CUDA_CHECK(cudaFree(dC));
    return EXIT_SUCCESS;
}
#else
// A host-only check compiles the actual parsing, reference, and comparison code.
// It deliberately excludes every CUDA declaration and does not validate kernels.
int main() {
    const std::vector<float> A{1, 2, 0, -1, 3, 2};
    const std::vector<float> B{2, -1, 1, 4, 3, 0};
    const std::vector<double> expected{4, 7, 7, 13};
    assert(reference_gemm(A, B, 2, 2, 3) == expected);
    assert(compare({4, 7, 7, 13}, expected, 0, 0).pass);
    assert(!compare({4, 7, 7}, expected, 0, 0).pass);
    assert(!compare({}, {}, 0, 0).pass);
    assert(!compare({1}, {1}, -1, 0).pass);
    const double nan = std::numeric_limits<double>::quiet_NaN();
    assert(!compare({1}, {nan}, 0, 0).pass);
    assert(!compare({static_cast<float>(nan)}, {1}, 0, 0).pass);
    assert(!compare({1}, {1}, nan, 0).pass);
    assert(!compare({1.01f}, {1}, 0.001, 0).pass);
    assert(compare({0.0001f}, {0}, 0.001, 0).pass);
    for (const char* invalid : {"", "0", "-1", "2x", " 2", "2147483648"}) {
        bool rejected = false;
        try { (void)positive_arg(invalid); }
        catch (const std::invalid_argument&) { rejected = true; }
        assert(rejected);
    }
    assert(positive_arg("257") == 257);
    assert(round_up(257, 16) == 272);
    for (int bad : {0, std::numeric_limits<int>::max()}) {
        bool rejected = false;
        try { (void)round_up(bad, 16); }
        catch (const std::invalid_argument&) { rejected = true; }
        assert(rejected);
    }
    validate_shape(257, 263, 251);
    bool rejected = false;
    try { validate_shape(50000, 50000, 16); }
    catch (const std::invalid_argument&) { rejected = true; }
    assert(rejected);
    assert(flop_count(257, 263, 251) == 33930682ULL);
    assert(flop_count(272, 272, 256) == 37879808ULL);
    std::cout << "PASS host parsing, overflow guards, reference, comparison, FLOP counts\n"
              << "CUDA kernels were not compiled or executed.\n";
}
#endif
