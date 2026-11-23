#include <cuda_runtime.h>
#include "primitives_host.hpp"

#include <algorithm>
#include <cstddef>
#include <cstdlib>
#include <functional>
#include <iomanip>
#include <iostream>
#include <limits>
#include <string>
#include <utility>
#include <vector>

namespace {

constexpr int kBlockThreads = 256;
constexpr int kItemsPerBlock = 2 * kBlockThreads;
static_assert(kBlockThreads % 32 == 0, "Full warps are required");
static_assert(sizeof(int) == 4 && sizeof(long long) == 8);
using primitives_lab::div_up;

void check_cuda(cudaError_t status, const char* expression, const char* file, int line) {
    if (status == cudaSuccess) {
        return;
    }
    std::cerr << file << ':' << line << " CUDA error for " << expression << ": "
              << cudaGetErrorString(status) << '\n';
    std::exit(EXIT_FAILURE);
}

#define CHECK_CUDA(expr) check_cuda((expr), #expr, __FILE__, __LINE__)

__device__ long long warp_sum(long long value) {
    constexpr unsigned kFullMask = 0xffffffffu;
    const unsigned lane = threadIdx.x % warpSize;
    for (int offset = warpSize / 2; offset > 0; offset /= 2) {
        const long long other = __shfl_down_sync(kFullMask, value, offset);
        if (lane + offset < warpSize) {
            value += other;
        }
    }
    return value;
}

__global__ void serial_sum_kernel(const int* input, long long* output, std::size_t n) {
    if (blockIdx.x != 0 || threadIdx.x != 0) {
        return;
    }

    long long sum = 0;
    for (std::size_t i = 0; i < n; ++i) {
        sum += input[i];
    }
    output[0] = sum;
}

template <typename Input>
__global__ void reduce_pass_kernel(
    const Input* input,
    long long* block_sums,
    std::size_t n
) {
    __shared__ long long warp_sums[kBlockThreads / 32];

    const unsigned lane = threadIdx.x & (warpSize - 1);
    const unsigned warp = threadIdx.x / warpSize;
    const std::size_t first =
        static_cast<std::size_t>(blockIdx.x) * kItemsPerBlock + threadIdx.x;

    long long sum = 0;
    if (first < n) {
        sum += static_cast<long long>(input[first]);
    }
    if (first + kBlockThreads < n) {
        sum += static_cast<long long>(input[first + kBlockThreads]);
    }

    sum = warp_sum(sum);
    if (lane == 0) {
        warp_sums[warp] = sum;
    }
    __syncthreads();

    if (warp == 0) {
        const unsigned warp_count = (blockDim.x + warpSize - 1) / warpSize;
        long long block_sum = lane < warp_count ? warp_sums[lane] : 0;
        block_sum = warp_sum(block_sum);
        if (lane == 0) {
            block_sums[blockIdx.x] = block_sum;
        }
    }
}

void launch_hierarchical_sum(
    const int* input,
    long long* output,
    long long* scratch_a,
    long long* scratch_b,
    std::size_t n
) {
    std::size_t count = div_up(n, static_cast<std::size_t>(kItemsPerBlock));
    reduce_pass_kernel<int><<<count, kBlockThreads>>>(input, scratch_a, n);
    CHECK_CUDA(cudaGetLastError());

    long long* source = scratch_a;
    long long* destination = scratch_b;
    while (count > 1) {
        const std::size_t next = div_up(count, static_cast<std::size_t>(kItemsPerBlock));
        reduce_pass_kernel<long long><<<next, kBlockThreads>>>(
            source,
            destination,
            count
        );
        CHECK_CUDA(cudaGetLastError());
        count = next;
        std::swap(source, destination);
    }

    CHECK_CUDA(cudaMemcpyAsync(
        output,
        source,
        sizeof(long long),
        cudaMemcpyDeviceToDevice
    ));
}

__global__ void serial_exclusive_scan_kernel(
    const int* input,
    long long* output,
    std::size_t n
) {
    if (blockIdx.x != 0 || threadIdx.x != 0) {
        return;
    }

    long long running = 0;
    for (std::size_t i = 0; i < n; ++i) {
        output[i] = running;
        running += input[i];
    }
}

template <typename Input>
__global__ void block_exclusive_scan_kernel(
    const Input* input,
    long long* output,
    long long* block_sums,
    std::size_t n
) {
    __shared__ long long values[kItemsPerBlock];

    const std::size_t block_start =
        static_cast<std::size_t>(blockIdx.x) * kItemsPerBlock;
    const std::size_t i0 = block_start + threadIdx.x;
    const std::size_t i1 = i0 + kBlockThreads;

    values[threadIdx.x] = i0 < n ? static_cast<long long>(input[i0]) : 0;
    values[threadIdx.x + kBlockThreads] =
        i1 < n ? static_cast<long long>(input[i1]) : 0;
    __syncthreads();

    for (int stride = 1; stride < kItemsPerBlock; stride *= 2) {
        const int index = (threadIdx.x + 1) * stride * 2 - 1;
        if (index < kItemsPerBlock) {
            values[index] += values[index - stride];
        }
        __syncthreads();
    }

    if (threadIdx.x == 0) {
        block_sums[blockIdx.x] = values[kItemsPerBlock - 1];
        values[kItemsPerBlock - 1] = 0;
    }
    __syncthreads();

    for (int stride = kItemsPerBlock / 2; stride > 0; stride /= 2) {
        const int index = (threadIdx.x + 1) * stride * 2 - 1;
        if (index < kItemsPerBlock) {
            const long long left = values[index - stride];
            values[index - stride] = values[index];
            values[index] += left;
        }
        __syncthreads();
    }

    if (i0 < n) {
        output[i0] = values[threadIdx.x];
    }
    if (i1 < n) {
        output[i1] = values[threadIdx.x + kBlockThreads];
    }
}

__global__ void add_block_offsets_kernel(
    long long* values,
    const long long* block_offsets,
    std::size_t n
) {
    const std::size_t block_start =
        static_cast<std::size_t>(blockIdx.x) * kItemsPerBlock;
    const std::size_t i0 = block_start + threadIdx.x;
    const std::size_t i1 = i0 + kBlockThreads;
    const long long offset = block_offsets[blockIdx.x];

    if (i0 < n) {
        values[i0] += offset;
    }
    if (i1 < n) {
        values[i1] += offset;
    }
}

class ScanPlan {
public:
    explicit ScanPlan(std::size_t n) {
        std::size_t count = n;
        while (true) {
            counts_.push_back(count);
            const std::size_t blocks =
                div_up(count, static_cast<std::size_t>(kItemsPerBlock));

            long long* sums = nullptr;
            CHECK_CUDA(cudaMalloc(&sums, blocks * sizeof(long long)));
            block_sums_.push_back(sums);

            if (counts_.size() > 1) {
                long long* offsets = nullptr;
                CHECK_CUDA(cudaMalloc(&offsets, count * sizeof(long long)));
                offsets_.push_back(offsets);
            }

            if (blocks == 1) {
                break;
            }
            count = blocks;
        }
    }

    ScanPlan(const ScanPlan&) = delete;
    ScanPlan& operator=(const ScanPlan&) = delete;

    ~ScanPlan() {
        for (long long* pointer : block_sums_) {
            cudaFree(pointer);
        }
        for (long long* pointer : offsets_) {
            cudaFree(pointer);
        }
    }

    void launch(const int* input, long long* output) const {
        for (std::size_t stage = 0; stage < counts_.size(); ++stage) {
            const std::size_t count = counts_[stage];
            const std::size_t blocks =
                div_up(count, static_cast<std::size_t>(kItemsPerBlock));

            if (stage == 0) {
                block_exclusive_scan_kernel<int><<<blocks, kBlockThreads>>>(
                    input,
                    output,
                    block_sums_[stage],
                    count
                );
            } else {
                block_exclusive_scan_kernel<long long><<<blocks, kBlockThreads>>>(
                    block_sums_[stage - 1],
                    offsets_[stage - 1],
                    block_sums_[stage],
                    count
                );
            }
            CHECK_CUDA(cudaGetLastError());
        }

        for (std::size_t stage = counts_.size() - 1; stage > 0; --stage) {
            const std::size_t lower = stage - 1;
            long long* lower_output = lower == 0 ? output : offsets_[lower - 1];
            const std::size_t lower_count = counts_[lower];
            const std::size_t blocks =
                div_up(lower_count, static_cast<std::size_t>(kItemsPerBlock));
            add_block_offsets_kernel<<<blocks, kBlockThreads>>>(
                lower_output,
                offsets_[lower],
                lower_count
            );
            CHECK_CUDA(cudaGetLastError());
        }
    }

private:
    std::vector<std::size_t> counts_;
    std::vector<long long*> block_sums_;
    std::vector<long long*> offsets_;
};

float measure_ms(const std::function<void()>& launch, int iterations) {
    cudaEvent_t start;
    cudaEvent_t stop;
    CHECK_CUDA(cudaEventCreate(&start));
    CHECK_CUDA(cudaEventCreate(&stop));

    for (int i = 0; i < 5; ++i) {
        launch();
    }
    CHECK_CUDA(cudaGetLastError());
    CHECK_CUDA(cudaDeviceSynchronize());

    CHECK_CUDA(cudaEventRecord(start));
    for (int i = 0; i < iterations; ++i) {
        launch();
    }
    CHECK_CUDA(cudaGetLastError());
    CHECK_CUDA(cudaEventRecord(stop));
    CHECK_CUDA(cudaEventSynchronize(stop));

    float elapsed = 0.0F;
    CHECK_CUDA(cudaEventElapsedTime(&elapsed, start, stop));
    CHECK_CUDA(cudaEventDestroy(start));
    CHECK_CUDA(cudaEventDestroy(stop));
    return elapsed / static_cast<float>(iterations);
}

bool check_sum(long long observed, long long expected) {
    return observed == expected;
}

bool check_scan(
    const std::vector<long long>& observed,
    const std::vector<long long>& expected,
    std::size_t* first_bad
) {
    for (std::size_t i = 0; i < observed.size(); ++i) {
        if (observed[i] != expected[i]) {
            *first_bad = i;
            return false;
        }
    }
    *first_bad = std::numeric_limits<std::size_t>::max();
    return true;
}

double logical_gb_s(std::size_t logical_bytes, float average_ms) {
    return static_cast<double>(logical_bytes) /
           (static_cast<double>(average_ms) * 1.0e6);
}

}  // namespace

int main(int argc, char** argv) {
    std::size_t n = 1u << 24;
    int iterations = 50;
    try {
        if (argc > 3) {
            throw std::invalid_argument("Usage: primitives_lab [n] [iterations]");
        }
        if (argc > 1) {
            n = primitives_lab::positive_count(argv[1], primitives_lab::max_items());
        }
        if (argc > 2) {
            iterations = static_cast<int>(primitives_lab::positive_count(
                argv[2], std::numeric_limits<int>::max()
            ));
        }
    } catch (const std::invalid_argument& error) {
        std::cerr << error.what() << '\n';
        return EXIT_FAILURE;
    }

    int device = 0;
    cudaDeviceProp properties{};
    CHECK_CUDA(cudaGetDevice(&device));
    CHECK_CUDA(cudaGetDeviceProperties(&properties, device));
    if (div_up(n, kItemsPerBlock) > static_cast<std::size_t>(properties.maxGridSize[0])) {
        std::cerr << "Requested grid exceeds this device's x dimension\n";
        return EXIT_FAILURE;
    }
    int driver_version = 0;
    int runtime_version = 0;
    CHECK_CUDA(cudaDriverGetVersion(&driver_version));
    CHECK_CUDA(cudaRuntimeGetVersion(&runtime_version));

    constexpr int pattern[] = {3, -1, 4, 1, 5, -9, 2, 6};
    std::vector<int> input(n);
    std::vector<long long> expected_scan(n);
    long long expected_sum = 0;
    for (std::size_t i = 0; i < n; ++i) {
        input[i] = pattern[i % std::size(pattern)];
        expected_scan[i] = expected_sum;
        expected_sum += input[i];
    }

    int* device_input = nullptr;
    long long* device_sum = nullptr;
    long long* device_scan = nullptr;
    const std::size_t partial_count =
        div_up(n, static_cast<std::size_t>(kItemsPerBlock));
    long long* scratch_a = nullptr;
    long long* scratch_b = nullptr;

    CHECK_CUDA(cudaMalloc(&device_input, n * sizeof(int)));
    CHECK_CUDA(cudaMalloc(&device_sum, sizeof(long long)));
    CHECK_CUDA(cudaMalloc(&device_scan, n * sizeof(long long)));
    CHECK_CUDA(cudaMalloc(&scratch_a, partial_count * sizeof(long long)));
    CHECK_CUDA(cudaMalloc(&scratch_b, partial_count * sizeof(long long)));
    CHECK_CUDA(cudaMemcpy(
        device_input,
        input.data(),
        n * sizeof(int),
        cudaMemcpyHostToDevice
    ));

    ScanPlan scan_plan(n);

    const auto serial_sum = [&] {
        serial_sum_kernel<<<1, 1>>>(device_input, device_sum, n);
    };
    const auto hierarchical_sum = [&] {
        launch_hierarchical_sum(
            device_input,
            device_sum,
            scratch_a,
            scratch_b,
            n
        );
    };
    const auto serial_scan = [&] {
        serial_exclusive_scan_kernel<<<1, 1>>>(device_input, device_scan, n);
    };
    const auto hierarchical_scan = [&] {
        scan_plan.launch(device_input, device_scan);
    };

    auto run_sum_check = [&](const std::function<void()>& launch) {
        launch();
        CHECK_CUDA(cudaGetLastError());
        long long observed = 0;
        CHECK_CUDA(cudaMemcpy(
            &observed,
            device_sum,
            sizeof(long long),
            cudaMemcpyDeviceToHost
        ));
        return std::pair{check_sum(observed, expected_sum), observed};
    };

    auto run_scan_check = [&](const std::function<void()>& launch) {
        launch();
        CHECK_CUDA(cudaGetLastError());
        std::vector<long long> observed(n);
        CHECK_CUDA(cudaMemcpy(
            observed.data(),
            device_scan,
            n * sizeof(long long),
            cudaMemcpyDeviceToHost
        ));
        std::size_t first_bad = 0;
        return std::pair{check_scan(observed, expected_scan, &first_bad), first_bad};
    };

    const auto [serial_sum_ok, serial_sum_value] = run_sum_check(serial_sum);
    const auto [hierarchical_sum_ok, hierarchical_sum_value] =
        run_sum_check(hierarchical_sum);
    const auto [serial_scan_ok, serial_scan_bad] = run_scan_check(serial_scan);
    const auto [hierarchical_scan_ok, hierarchical_scan_bad] =
        run_scan_check(hierarchical_scan);

    if (!(serial_sum_ok && hierarchical_sum_ok && serial_scan_ok && hierarchical_scan_ok)) {
        std::cerr << "Correctness failed; timing skipped. "
                  << "sum serial=" << serial_sum_value
                  << " hierarchical=" << hierarchical_sum_value
                  << " expected=" << expected_sum
                  << "; scan first_bad serial=" << serial_scan_bad
                  << " hierarchical=" << hierarchical_scan_bad << '\n';
        return EXIT_FAILURE;
    }

    const float serial_sum_ms = measure_ms(serial_sum, iterations);
    const float hierarchical_sum_ms = measure_ms(hierarchical_sum, iterations);
    const float serial_scan_ms = measure_ms(serial_scan, iterations);
    const float hierarchical_scan_ms = measure_ms(hierarchical_scan, iterations);

    std::cout << "device=" << properties.name << '\n';
    std::cout << "compute_capability=" << properties.major << '.' << properties.minor << '\n';
    std::cout << "driver_api_version=" << driver_version << '\n';
    std::cout << "runtime_api_version=" << runtime_version << '\n';
    std::cout << "n=" << n << '\n';
    std::cout << "iterations=" << iterations << '\n';
    std::cout << "pattern=3,-1,4,1,5,-9,2,6\n";
    std::cout << "reference_sum=" << expected_sum << '\n';
    std::cout << "timing=CUDA events, 5 warmups, one default stream\n";
    std::cout << "operation,variant,correct,detail,average_ms,logical_gb_s\n";
    std::cout << std::fixed << std::setprecision(6);

    const auto print_row = [&](const std::string& operation,
                               const std::string& variant,
                               bool correct,
                               const std::string& detail,
                               float average_ms,
                               std::size_t logical_bytes) {
        std::cout << operation << ',' << variant << ','
                  << (correct ? "true" : "false") << ',' << detail << ','
                  << average_ms << ',' << logical_gb_s(logical_bytes, average_ms)
                  << '\n';
    };

    print_row(
        "reduce",
        "serial",
        serial_sum_ok,
        "sum=" + std::to_string(serial_sum_value),
        serial_sum_ms,
        n * sizeof(int)
    );
    print_row(
        "reduce",
        "hierarchical",
        hierarchical_sum_ok,
        "sum=" + std::to_string(hierarchical_sum_value),
        hierarchical_sum_ms,
        n * sizeof(int)
    );
    print_row(
        "exclusive_scan",
        "serial",
        serial_scan_ok,
        serial_scan_ok ? "all_prefixes_match"
                       : "first_bad=" + std::to_string(serial_scan_bad),
        serial_scan_ms,
        n * (sizeof(int) + sizeof(long long))
    );
    print_row(
        "exclusive_scan",
        "hierarchical",
        hierarchical_scan_ok,
        hierarchical_scan_ok
            ? "all_prefixes_match"
            : "first_bad=" + std::to_string(hierarchical_scan_bad),
        hierarchical_scan_ms,
        n * (sizeof(int) + sizeof(long long))
    );

    CHECK_CUDA(cudaFree(scratch_b));
    CHECK_CUDA(cudaFree(scratch_a));
    CHECK_CUDA(cudaFree(device_scan));
    CHECK_CUDA(cudaFree(device_sum));
    CHECK_CUDA(cudaFree(device_input));

    return serial_sum_ok && hierarchical_sum_ok && serial_scan_ok &&
                   hierarchical_scan_ok
               ? EXIT_SUCCESS
               : EXIT_FAILURE;
}
