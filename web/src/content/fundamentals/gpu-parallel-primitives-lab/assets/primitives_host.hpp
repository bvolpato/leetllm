#pragma once

#include <algorithm>
#include <charconv>
#include <cstddef>
#include <limits>
#include <stdexcept>
#include <string_view>

namespace primitives_lab {

inline std::size_t div_up(std::size_t value, std::size_t divisor) {
    if (divisor == 0) {
        throw std::invalid_argument("Zero divisor");
    }
    return value / divisor + (value % divisor != 0);
}

// The input pattern's absolute values are <= 9. Guard every possible partial,
// not just its smaller final sum. Also protect n * (sizeof(int) + sizeof(long long)).
inline std::size_t max_items() {
    return static_cast<std::size_t>(std::min<unsigned long long>(
        std::numeric_limits<std::size_t>::max() / 12,
        std::numeric_limits<long long>::max() / 9
    ));
}

inline std::size_t positive_count(std::string_view text, std::size_t maximum) {
    if (text.empty() || text.front() < '0' || text.front() > '9') {
        throw std::invalid_argument("Expected positive decimal digits");
    }
    std::size_t value = 0;
    const auto result = std::from_chars(text.data(), text.data() + text.size(), value);
    if (result.ec != std::errc{} || result.ptr != text.data() + text.size()
        || value == 0 || value > maximum) {
        throw std::invalid_argument("Count out of range or contains trailing text");
    }
    return value;
}

}  // namespace primitives_lab
