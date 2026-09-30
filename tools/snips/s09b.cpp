// Companion for focus.js S9 concept 3 ("The SPSC ring buffer"): the full class
// the card shows half of, plus the run its trailing comment describes.
#include <array>
#include <atomic>
#include <cstddef>
#include <cstdio>

template <class T, std::size_t N> class Spsc {      // N is a power of two
  static_assert((N & (N - 1)) == 0, "N must be a power of two");
  std::array<T, N> buf_{};
  alignas(64) std::atomic<std::size_t> head_{0};    // producer owns it
  alignas(64) std::atomic<std::size_t> tail_{0};    // consumer owns it
 public:
  bool push(const T& v) {
    auto h = head_.load(std::memory_order_relaxed);
    if (h - tail_.load(std::memory_order_acquire) == N) return false;  // full
    buf_[h & (N - 1)] = v;                          // write the slot FIRST
    head_.store(h + 1, std::memory_order_release);  // then publish the index
    return true; }
  bool pop(T& out) {
    auto t = tail_.load(std::memory_order_relaxed);
    if (head_.load(std::memory_order_acquire) == t) return false;      // empty
    out = buf_[t & (N - 1)];                        // read the slot FIRST
    tail_.store(t + 1, std::memory_order_release);  // then free it
    return true; }
};

int main() {
  Spsc<int, 4> q;
  for (int v = 1; v <= 5; ++v) std::printf("%d ", q.push(v) ? 1 : 0);  // 1 1 1 1 0
  int out = 0;
  q.pop(out);
  std::printf("%d %zu\n", out, sizeof q);           // 1 192
}
