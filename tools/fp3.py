# -*- coding: utf-8 -*-
# Sessions 10-13 of window.FOCUS
S = []

# ===================== SESSION 10 =====================
S.append({
"n": 10,
"focus": "Networking, market data & serialization",
"tagline": "Something put those bytes on your socket: know the format, the transport, where a message ends — and stop paying full price to read it.",
"concepts": [
 {"title": "FIX: tag=value, the readable ancestor",
  "text": "FIX is a stream of integer-tagged fields separated by the SOH byte (0x01), with a session layer of sequence numbers, heartbeats and resends on top. It is self-describing and still ubiquitous for order entry — and it is text, so reading it means scanning every byte and converting ASCII digits to numbers. That per-byte scan plus digit math is the slow path this session is about escaping.",
  "code": """const char* msg = "35=D\\00155=NVDA\\00154=1\\00138=200\\00144=182.50\\001";
for (const char* p = msg; *p; ) {
  int tag = 0;
  while (*p != '=') tag = tag * 10 + (*p++ - '0');    // digit math, per byte
  const char* v = ++p;                                // skip '='
  while (*p && *p != '\\001') ++p;                     // scan to the SOH
  if (tag == 55 || tag == 44) std::printf("%d=%.*s ", tag, int(p - v), v);
  if (*p) ++p;                                        // skip the SOH
}
std::puts("");
// 55=NVDA 44=182.50""",
  "deck": "Deck W11 · slides 5, 15"},
 {"title": "Fixed-width binary: decode is a copy, not a parse",
  "text": "Fast venues abandon text. ITCH/OUCH-style messages have a known length and known field offsets, prices are scaled integers rather than ASCII, and the wire is big-endian — so decoding is a memcpy plus a byte swap, with no delimiter scan, no atoi and no allocation. Pack the struct so there is no padding, static_assert its size, and bounds-check the frame before you read it.",
  "code": """#pragma pack(push, 1)
struct AddOrder { uint8_t type; uint64_t id; uint8_t side; uint32_t qty; uint32_t px; };
#pragma pack(pop)
static_assert(sizeof(AddOrder) == 18, "fixed width, no padding");
unsigned char w[18]{}; w[0] = 'A'; w[9] = 'B';
uint64_t id = __builtin_bswap64(7);       std::memcpy(w + 1,  &id, 8);  // big-endian
uint32_t q  = __builtin_bswap32(200);     std::memcpy(w + 10, &q,  4);
uint32_t p  = __builtin_bswap32(1825000); std::memcpy(w + 14, &p,  4);  // scaled int
AddOrder m; std::memcpy(&m, w, sizeof m);              // decode = a copy, no parse
std::printf("%c%c %u %.2f\\n", m.type, m.side, __builtin_bswap32(m.qty),
            __builtin_bswap32(m.px) / 10000.0);
// AB 200 182.50     -- no delimiter scan, no atoi, no allocation""",
  "deck": "Deck W11 · slides 6, 16"},
 {"title": "TCP for orders, UDP multicast for data",
  "text": "The two directions make opposite choices for good reasons. Order entry uses TCP: one stream to the engine, reliable and ordered, because you must not lose an order — and TCP's ordering is also its weakness, since one lost packet stalls everything behind it. Market data ships as UDP multicast: the exchange sends each update once and the network fans it out, fast but lossy, so you detect gaps from sequence numbers and recover yourself. Venues often send two identical A/B streams on separate paths and you take whichever packet arrives first.",
  "deck": "Deck W11 · slide 9"},
 {"title": "Framing: a socket is a byte stream, not a message stream",
  "text": "TCP does not preserve your send boundaries, so recv can return half a message or two and a half. The single most common networking bug is assuming one read equals one message; the correct shape is to accumulate into a reusable buffer, dispatch only complete frames, and keep the partial tail. A length prefix makes the boundary unambiguous and is the venue standard; a delimiter like FIX's SOH means scanning every byte and escaping the delimiter in payloads.",
  "code": """// one recv() delivered 1.5 messages: [len][payload] frames
unsigned char in[] = {3,'a','b','c', 4,'d','e','f'};      // the 2nd frame is short
std::size_t len = sizeof in, off = 0, done = 0;
while (off + 1 <= len && off + 1 + in[off] <= len) {      // a FULL frame present?
  std::printf("%.*s ", int(in[off]), (const char*)&in[off + 1]);
  off += 1 + in[off]; ++done;
}
std::printf("| framed=%zu leftover=%zu\\n", done, len - off);
// abc | framed=1 leftover=4     -- the partial tail waits for the next read""",
  "deck": "Deck W11 · slide 12"},
 {"title": "What a general DOM parser costs you",
  "text": "A library like nlohmann/json is correct and lovely and does far more work than the hot path can afford: it parses the whole frame including fields you never read, builds a tree of heap nodes (maps, vectors, std::strings) — dozens of allocations per message — and copies keys and values out of the wire buffer into owned strings. You control both ends of a handful of message shapes, so scan once for the keys you need, read the number in place, and point string_views at the wire bytes instead of copying.",
  "code": """std::string_view f =
  R"({"type":"book_snapshot","bid":100.00,"ask":100.02,"mid_price":100.01})";
auto num = [f](const char* key) {                     // no DOM, no allocation
  auto k = f.find(key);
  if (k == std::string_view::npos) return 0.0;
  return std::strtod(f.data() + k + std::strlen(key), nullptr);   // parse in place
};
std::printf("%.2f %.2f %.2f\\n", num("\\"bid\\":"), num("\\"ask\\":"), num("\\"mid_price\\":"));
// 100.00 100.02 100.01     -- three fields read, the rest of the frame skipped""",
  "deck": "Deck W12 · slides 10–11, 17"},
 {"title": "Non-blocking I/O, and batching versus latency",
  "text": "A blocking read parks your thread until bytes arrive, which on the hot path is death. Set O_NONBLOCK and read returns EAGAIN immediately when nothing is ready; epoll (Linux) or kqueue (BSD/macOS) then tells you exactly which descriptors became readable, so one thread multiplexes many sockets with no context-switch tax — and with edge-triggered notification you must drain the socket fully. The related trade-off is batching: grouping messages amortises per-message cost and lifts throughput, but every batch you hold is latency you added, which is why TCP_NODELAY belongs on the order path and batching belongs on the cold path.",
  "deck": "Deck W12 · slides 5–6, 8, 15"}
],
"hft": {
 "text": "Why this matters in HFT",
 "paragraphs": [
  "The wire you actually speak in this arena is JSON over WebSocket, which is convenient and the exact opposite of what fast venues do. shared/messages.py is a pydantic discriminated union keyed on a \"type\" field — handshake, place_order, order_ack, book_snapshot, cancel_order — carried by IXWebSocket and decoded today by nlohmann/json. Knowing that is the point: the reference codec is your baseline, and beating it is the assignment.",
  "Codec cost is not a footnote in tick-to-trade, it is a big slice of it. Parse-in plus serialise-out sits between the packet arriving and the order leaving, and a DOM parser touches every byte, allocates a tree and copies strings you will discard. The fast path pulls best bid, best ask and mid straight out of the frame with a single scan, and hand-rolls the send side — you only ever emit PlaceOrder and CancelOrder, a few fields, written as digits straight into a reused buffer.",
  "Buffer reuse is the other half. One recv buffer and one send buffer per connection, allocated at startup and refilled every wakeup, amortises allocation to zero on the hot path — which is session 4's discipline arriving at the socket. Frame in place and dispatch views rather than copies, and the only memory traffic left is the bytes themselves.",
  "Correctness on the wire is worth as much as speed, because a silently wrong book loses money quietly. Track the next-expected sequence number and treat a jump as loss; verify FIX's mod-256 checksum in tag 10 and reject on mismatch; bounds-check every length and offset before you index, because a malformed length prefix is a buffer overrun waiting to happen. On a gap or a bad frame, stop trading that symbol and recover — fail loud and fast.",
  "And prove the win offline. Race your fast path against the nlohmann baseline on the same recorded tape with scripts/latency_replay.py, and report both percentile tables. This is where the gap between a mean and a tail is most visible: a DOM parser's median can look tolerable while its allocating slow path owns the p99.9."
 ],
 "example": {"title": "In the arena",
  "text": "course/hft-columbia/project-starter/include/fix_parser.hpp and u64toa.hpp — the two halves of the week, as stubs: a single-pass parser with no per-message allocation on the way in, and a hand-rolled integer-to-text writer that has to beat snprintf on the way out.",
  "code": """// project-starter/include/fix_parser.hpp
// HW11 - a high-performance FIX parser (SOH-delimited tag=value;
//        tags 11/55/54/38/44).
struct NewOrder {
    const char* clordid; int clordid_len;   // tag 11 - a VIEW, not a copy
    char symbol[16]; char side;             // tags 55, 54
    uint32_t qty; double price;             // tags 38, 44
};
// Single pass, no per-message allocation. Return false on a malformed message.
inline bool parse_new_order(const char* buf, int len, NewOrder& out);

// project-starter/include/u64toa.hpp
// HW12 - fast uint64 -> decimal text. Write the digits into out; return length.
//        Beat snprintf/std::to_string; handle 0 and UINT64_MAX.
inline int u64toa(std::uint64_t v, char* out);"""}
},
"interview": [
 {"q": "Why do venues ship market data over UDP multicast but take orders over TCP?",
  "a": "Multicast means the exchange sends each update once and the network replicates it to every subscriber, which is the only way to fan a firehose out to hundreds of consumers cheaply — and UDP does not retransmit, so one lost packet does not stall the ones behind it. Order entry is a single stream to the engine where losing a message is unacceptable, so TCP's reliability and ordering are worth its head-of-line blocking. The cost of the data choice is that you must detect loss yourself from sequence numbers and recover.",
  "level": "warm-up", "skill": "perf.transport-choice"},
 {"q": "Why is fixed-width binary faster to decode than tag=value text?",
  "a": "Every field is at a known offset in a known-length message, so there is no delimiter to scan for and no ASCII-to-number conversion: you copy the bytes into a packed struct and byte-swap the integers. Prices are scaled integers rather than decimal strings, so there is no atof and no floating-point parse. It is also far fewer bytes on the wire, which matters for a feed measured in millions of messages per second.",
  "level": "warm-up", "skill": "trading.binary-market-data"},
 {"q": "What is wrong with assuming one recv() returns one message?",
  "a": "TCP is a byte stream and does not preserve send boundaries, so a read can deliver half a message, one and a half, or several — it is the most common networking bug there is. The correct structure is to append into a persistent buffer, loop while a complete frame is present, dispatch each one, and compact the partial remainder so the next read continues it. With a length prefix “complete” is a cheap arithmetic check; with a delimiter you must scan.",
  "level": "core", "skill": "tools.message-framing"},
 {"q": "Length-prefix or delimiter framing — which would you choose and why?",
  "a": "Length-prefix, for anything I control. You read the header, learn exactly how many bytes the message is, and you never scan the payload — it is unambiguous, binary-safe, and lets you validate the size before allocating or indexing. Delimiter framing forces a byte-by-byte scan and forces you to escape the delimiter if it can appear in the payload, which is a whole class of bug. The one thing a length prefix demands is that you bounds-check it: a hostile or corrupt length is a buffer overrun.",
  "level": "core", "skill": "tools.message-framing"},
 {"q": "Concretely, what does a DOM-style JSON parser do that a targeted extractor does not?",
  "a": "It parses the entire document, including every field you will never read; it materialises a tree of heap-allocated nodes — maps, vectors, std::strings — which is dozens of allocations per message; and it copies keys and values out of the receive buffer into owned storage. A targeted extractor scans once for the specific keys it wants, converts the number in place, and hands back a string_view aliasing the wire bytes, so it allocates nothing. The trade you accept is that you now own schema assumptions the library would have checked.",
  "level": "core", "skill": "perf.zero-copy-parse"},
 {"q": "What is the difference between level-triggered and edge-triggered readiness, and what must you do differently?",
  "a": "Level-triggered means the event loop keeps reporting the descriptor while data remains, so a partial read is safe and you will simply be told again. Edge-triggered reports only the transition to readable, which means far fewer wakeups but you must drain the socket in a loop until read returns EAGAIN — if you stop early, the remaining bytes sit there and you are never notified again. EAGAIN is therefore not an error in that loop; it is the signal that readiness is exhausted.",
  "level": "core", "skill": "perf.nonblocking-io"},
 {"q": "Your feed's sequence number jumps from 1000 to 1005. What do you do?",
  "a": "Treat the book as untrustworthy immediately and stop trading that instrument — a silently stale book is far more expensive than a missed opportunity. Then recover by the venue's mechanism: request a retransmission of 1001–1004 if the feed supports it, or take a fresh snapshot and replay increments from its sequence onward. If the venue publishes A/B streams, check the other path first, since the packet is often simply not lost on both. Only resume once the next-expected sequence is contiguous again, and count the event so a rising gap rate becomes visible.",
  "level": "senior", "skill": "trading.feed-sequencing"},
 {"q": "You are told to improve throughput by batching outbound orders. What do you say?",
  "a": "That it is the right optimisation applied to the wrong path. Batching amortises the per-message fixed cost — one syscall, one pass — which is exactly right for logging, telemetry and anything nobody is timing, but every message held to form a batch is queueing latency you added, and on the order path that is the number I am graded on. Nagle's algorithm is the same trade made for me by the kernel, which is why TCP_NODELAY goes on the order socket. So: batch the cold path, send the hot path immediately, and if throughput is genuinely the constraint, fix it by shrinking per-message work rather than by grouping.",
  "level": "senior", "skill": "perf.batching-vs-latency"}
]
})

# ===================== SESSION 11 =====================
S.append({
"n": 11,
"focus": "SIMD, kernel bypass & colocation",
"tagline": "The software path is tight; now the machine is the bottleneck — do more per cycle, get the OS out of the way, and buy the rest.",
"concepts": [
 {"title": "The memory wall: cache and TLB",
  "text": "An L1 hit is about four cycles and a main-memory miss is 200 or more, so on the hot path you are memory-bound, not compute-bound. Memory moves in 64-byte lines, so pack the fields you read together and split hot from cold; linear access lets the hardware prefetcher run ahead while pointer-chasing defeats it. Virtual-to-physical translations are cached too, and a TLB miss walks the page table — which is what huge pages are for.",
  "deck": "Deck W13 · slide 5"},
 {"title": "Prefetching: hiding the miss",
  "text": "The hardware prefetcher handles regular strides automatically but cannot see an irregular or data-dependent access coming. __builtin_prefetch(addr, rw, locality) is a hint that pulls a line toward the cache now: no fault, no stall, no effect on correctness — only on timing. The distance is a tuning knob, because too near and the line has not arrived while too far and it is evicted before use, so you measure with cache-miss counters instead of guessing.",
  "code": """constexpr int N = 1 << 16;
std::vector<int> v(N, 1);
long s = 0;
for (int i = 0; i < N; ++i) {
  if (i + 64 < N) __builtin_prefetch(&v[i + 64], 0, 0);   // a hint, not a load
  s += v[i];
}
std::printf("%ld %zu %d\\n", s, 64 / sizeof(int), 64 * int(sizeof(int)));
// 65536 16 256     -- 16 ints per 64B line; this hint runs 256B ahead""",
  "deck": "Deck W13 · slide 6"},
 {"title": "SIMD: one instruction, many lanes",
  "text": "A vector register holds several values at once — an AVX2 register is 256 bits, so eight floats or four doubles per operation, and a single fmadd does a multiply and an add across all lanes. At -O3 -march=native the compiler auto-vectorises clean loops for free, and fails on branches, aliasing and unknown trip counts; intrinsics like _mm256_load_ps give explicit control when it will not. Aligned loads need genuinely aligned data, which is what alignas(32) is for.",
  "code": """alignas(32) float obi[8] = {.6f, -.2f, .1f, .4f, -.5f, .3f, .0f, .2f};
alignas(32) float w[8]   = { 1,   1,    1,   1,  .5f, .5f, .5f, .5f};
float acc = 0;
for (int i = 0; i < 8; ++i) acc += obi[i] * w[i];  // -O3 -march=native: 8 lanes
std::printf("%.3f %d %zu\\n", acc, int((uintptr_t)obi % 32), sizeof(obi));
// 0.900 0 32     -- the 0 is the proof the buffer really is 32-byte aligned""",
  "deck": "Deck W13 · slides 7, 16"},
 {"title": "Syscalls, busy-poll and interrupts",
  "text": "A syscall is a mode switch that flushes pipelines and pollutes caches: hundreds of nanoseconds, sometimes microseconds under load, so the cheapest syscall on the hot path is the one you never make. That is why HFT spins: a dedicated core polling the NIC flat-out gives the lowest and most deterministic latency, at the cost of 100% CPU, while an interrupt-driven design is power-friendly but adds wake-up latency and jitter. An IRQ arriving mid-race preempts you at the worst possible moment.",
  "deck": "Deck W13 · slide 9"},
 {"title": "Kernel bypass: skip the stack",
  "text": "The Linux network stack is general-purpose overhead — it copies, checks and routes every packet through generic layers. Kernel bypass maps the NIC into user space so packets never touch the kernel: DPDK is a poll-mode driver where your process owns the card and busy-polls the RX queues, Solarflare/Onload is an LD_PRELOAD shim that accelerates ordinary BSD sockets with almost no code change, and io_uring is not full bypass but batches syscalls through shared submit/complete rings to cut mode switches.",
  "deck": "Deck W13 · slide 10"},
 {"title": "Own the core, keep memory close",
  "text": "Determinism comes from control. Pin the hot thread to one core so the scheduler cannot migrate it and cool its caches; isolate that core (isolcpus, nohz_full, rcu_nocbs) so nothing else — not even the scheduler tick — runs there. On a multi-socket box, NUMA means remote memory is much slower, so allocate node-local to the socket that owns the NIC. Huge pages cut TLB misses because fewer entries cover more memory, and pre-faulting plus mlock means no page fault ever lands mid-race.",
  "deck": "Deck W13 · slide 11"}
],
"hft": {
 "text": "Why this matters in HFT",
 "paragraphs": [
  "This session is where the three layers meet: SIMD and prefetch on the compute, bypass and pinning on the system, and colocation on the wire. They all move the same percentiles, which means they compete for the same budget — and the honest way to choose between them is to A/B each one on the same recorded tape and keep whatever moves p99.9.",
  "In the arena, colocation is explicitly a purchase rather than a code change: the shop moves you from the default outbound-delay tier to the colocated tier, and the exchange applies that delay to your messages. So there is a real economics question on the table — does the tail improvement from the colocated tier beat what you can win by vectorising and pinning, at its cost? Running that comparison with numbers is part of the grade.",
  "On the compute side the targets are specific. on_book decodes and computes on every tick, so align the buffers it reads, vectorise the reductions, and prefetch the next price level while you consume the current one. Prefetching an order-book walk is the textbook case: you know the next slot's address before you need it, which is precisely the situation the hardware prefetcher cannot always anticipate.",
  "On the system side, minimise syscalls: pre-allocate, reuse buffers, and do no logging on the hot path — every one of those is a mode switch waiting to become a tail event. Pinning is Linux-only (pthread_setaffinity_np or taskset); macOS has no CPU-affinity API, so on a Mac you skip the pin, keep the measurement, and say so in the write-up rather than pretending.",
  "You also cannot measure across machines without a shared clock. NTP is milliseconds and useless here; PTP synchronises to sub-microsecond with hardware assist, and NIC hardware timestamping (SO_TIMESTAMPING) stamps the packet on the wire before any software jitter is added. A steady_clock read in user space includes scheduling noise, so wire-in to wire-out honesty needs hardware stamps at both ends."
 ],
 "example": {"title": "In the arena",
  "text": "course/hft-columbia/starters/hw13/kernel.cpp — the frozen HW13 kernel. You may not touch the source; the assignment is to find the flags that make it fast and explain with perf stat why each one helped.",
  "code": """// starters/hw13/kernel.cpp   >>> DO NOT MODIFY THIS FILE. <<<
//  Your job is to find the COMPILER FLAGS that make it run fastest.
//  The kernel is a floating-point reduction with a data-dependent branch - it
//  responds well to -O2/-O3, -march=native (SIMD), -funroll-loops, -flto, and
//  profile-guided optimization (PGO) on the branch. Try them and measure.
static double kernel(const std::vector<float>& a, const std::vector<float>& b) {
    double acc = 0.0;
    for (int iter = 0; iter < 3000; ++iter) {
        for (std::size_t i = 0; i < a.size(); ++i) {
            float x = a[i] * b[i] + 0.5f * a[i];
            if (x > 0.0f) acc += std::sqrt(x);   // branch a profile can predict
            else          acc -= x;
        }
    }
    return acc;
}"""}
},
"interview": [
 {"q": "Roughly what does an L1 hit cost versus a main-memory miss, and what follows from that?",
  "a": "An L1 hit is a handful of cycles — about a nanosecond — and a miss all the way to DRAM is on the order of 100 ns, or 200-plus cycles, during which the core stalls. Each level of the hierarchy is roughly an order of magnitude slower than the one above. What follows is that on a hot path you are memory-bound: the layout that decides how many lines you touch matters more than the instruction count, and one avoidable miss costs more than a hundred arithmetic operations.",
  "level": "warm-up", "skill": "perf.memory-hierarchy"},
 {"q": "What does __builtin_prefetch do, and can it change your program's behaviour?",
  "a": "It emits a hint asking the hardware to start bringing a cache line toward the cache now, so the data is closer by the time you actually load it. It cannot fault, does not stall, and has no semantic effect at all — only a timing effect, which is why a wrong hint merely wastes memory bandwidth rather than breaking correctness. The distance you prefetch ahead is the tuning parameter, and you validate it with cache-miss counters rather than by reasoning.",
  "level": "warm-up", "skill": "perf.prefetch"},
 {"q": "Why does the compiler fail to auto-vectorise a loop, and what do you do about it?",
  "a": "Usually because it cannot prove the transformation is safe or profitable: data-dependent branches in the body, possible pointer aliasing between input and output, a trip count it cannot reason about, a reduction over floating point where reassociation changes the result, or non-contiguous access. The first step is to ask it why — -Rpass-analysis=loop-vectorize on clang, -fopt-info-vec-missed on gcc — and then remove the obstacle: restrict or __restrict, a known multiple-of-width trip count, hoisting the branch out, or splitting the loop. Writing intrinsics is the last resort, because then you own the layout and the alignment forever.",
  "level": "core", "skill": "perf.simd"},
 {"q": "Why does HFT busy-poll instead of blocking on the socket?",
  "a": "Because blocking means the kernel parks the thread and must wake it when data arrives, and that wake-up path — interrupt, scheduler, context switch — adds both latency and jitter, exactly the variance you are trying to eliminate. A dedicated core spinning on the NIC's receive queue sees the packet as soon as it lands and never leaves user space, so the cost is low and, more importantly, nearly constant. The price is a core burned at 100% and the power that goes with it, which is a trade a trading firm will happily make.",
  "level": "core", "skill": "perf.syscall-cost"},
 {"q": "What does kernel bypass actually change, and what does it cost you?",
  "a": "It maps the NIC's queues into user space so packets skip the kernel's generic network stack entirely — no per-packet copies, no protocol layers, no syscall on the receive path. DPDK gives the most control and the highest throughput but you own the driver-level code and often the protocol handling; an Onload-style LD_PRELOAD shim accelerates the ordinary sockets API with almost no code change but ties you to that vendor's NIC. The costs are vendor lock-in, a dedicated core, losing the kernel's tooling and protection, and a much larger surface you have to get right yourself.",
  "level": "core", "skill": "perf.kernel-bypass"},
 {"q": "Why pin a thread to a core, and why isolate the core as well?",
  "a": "Pinning stops the scheduler migrating the thread to another core, which would leave its warm L1 and L2 behind and restart it cold — a migration mid-race is a visible tail event. Isolating the core goes further and removes everything else from it: isolcpus keeps other tasks off, nohz_full stops the periodic scheduler tick, and moving IRQ affinity elsewhere stops interrupts preempting you. Pinning without isolation still leaves you sharing the core with kernel threads and timers, which is usually where the remaining jitter lives.",
  "level": "core", "skill": "perf.cpu-pinning-numa"},
 {"q": "Why is NTP inadequate for HFT measurement, and what replaces it?",
  "a": "NTP synchronises to milliseconds, and the quantities we care about are single-digit microseconds, so cross-machine timestamps under NTP are noise. PTP (IEEE 1588) uses hardware assistance in NICs and switches to get sub-microsecond alignment from a shared grandmaster, which makes timestamps taken on different boxes comparable. And for wire-honest numbers you want NIC hardware timestamping (SO_TIMESTAMPING), because a user-space clock read already includes scheduling and cache noise that the packet never experienced.",
  "level": "senior", "skill": "perf.hardware-timestamping"},
 {"q": "You have a fixed budget and can either vectorise the hot loop or buy colocation. How do you decide?",
  "a": "By measuring what each one is worth on the same input, in the same units, before spending anything. The code change I can A/B offline: same recorded tape, release build with and without the SIMD path, and compare p99.9 — if the tail does not move, the change did not matter, however elegant it is. Colocation's value is a wire delay the venue applies, so it is an expected p99.9 reduction I can quote from the tier difference, and the question becomes cost per microsecond of tail for each option. Usually the code is cheaper first and the hardware is the tiebreaker once the software path is already lean — spending on colocation while a per-tick allocation sits in on_book is buying nanoseconds to hide microseconds.",
  "level": "senior", "skill": "trading.colocation"}
]
})

# ===================== SESSION 12 =====================
S.append({
"n": 12,
"focus": "Profiling & the latency tail",
"tagline": "Stop guessing. Measure where the cycles and the milliseconds go, kill the spikes, and ship a binary you can prove is fast.",
"concepts": [
 {"title": "Why the mean lies",
  "text": "Latency distributions are not Gaussian — they are heavy-tailed and usually bimodal: a tight fast body plus rare catastrophic stalls from a fault, a miss or a preemption. The mean lands in the valley between the two clusters and describes no tick anyone experienced. Report the distribution; and beware coordinated omission, where a naive timer under-samples slow events and hides the tail it was supposed to find.",
  "code": """std::vector<long> us(1000, 38);                       // the fast body
for (int i = 990; i < 996; ++i) us[i] = 71;
for (int i = 996; i < 999; ++i) us[i] = 210;
us[999] = 5200;                                       // the tick you lost
std::sort(us.begin(), us.end());
double mean = std::accumulate(us.begin(), us.end(), 0.0) / us.size();
auto p = [&](double q) { return us[std::size_t(q * us.size())]; };
std::printf("mean=%.2f p50=%ld p99=%ld p99.9=%ld max=%ld\\n",
            mean, p(.50), p(.99), p(.999), us.back());
// mean=43.88 p50=38 p99=71 p99.9=5200 max=5200""",
  "deck": "Deck W14 · slide 5"},
 {"title": "perf: stat, record, report, annotate",
  "text": "Linux perf is the free, low-overhead sampling profiler and you should know four verbs cold. perf stat gives you totals — cycles, IPC, cache and branch misses — and is always the cheap first move. perf record samples call stacks over time, perf report ranks the hot symbols, and perf annotate shows cost per source line. Because overhead is low it is safe to run near production; you drive it against a deterministic replay so the profile is reproducible.",
  "deck": "Deck W14 · slide 6"},
 {"title": "Flame graphs and hardware counters",
  "text": "A flame graph folds thousands of stacks into one picture where width is time spent, so wide plateaus are the targets and tall spikes are merely deep. Counters then tell you *why* a frame is hot: cache-misses and LLC-load-misses point at a memory problem (a DRAM miss is 200-plus cycles), branch-misses point at an unpredictable branch (a flush is 15–20 cycles), and rdtsc or steady_clock around a micro-section gives you exact in-code timing for the few lines you care most about.",
  "deck": "Deck W14 · slides 7–8"},
 {"title": "Every tail spike has a physical cause",
  "text": "Learn the signatures and each fix becomes targeted and permanent. Allocation stalls: malloc locks, walks free lists or calls the kernel — pre-allocate and pool. Page faults: a first-touch or swapped page traps into the kernel for microseconds — pre-fault and mlock the hot memory. NUMA: a load from another socket's memory costs far more — pin threads and allocate node-local. TLB misses: random access over a large working set forces a page walk — use huge pages.",
  "deck": "Deck W14 · slide 10"},
 {"title": "Jitter is the OS deciding your thread can wait",
  "text": "The rarest and ugliest tail events come from preemption: the scheduler parks your thread and a millisecond disappears. Interrupts, the timer tick and kernel threads steal cycles too. The direct measurement is a jitter probe — a tight loop timing an empty section reveals what the OS takes even when you do nothing — and the remedy is session 11's toolkit: pin, isolate, poll instead of blocking, and warm everything (touch pages, prime caches) before SESSION_OPEN so the first live tick is not the slow one.",
  "deck": "Deck W14 · slide 11"},
 {"title": "Build for the tail, and ship it clean",
  "text": "Once the algorithm is right, let the toolchain finish the job: -O3 for vectorisation and inlining, -march=native for this CPU's instruction set (so the binary is not portable), -flto for whole-program optimisation, -DNDEBUG to strip asserts, and keep -g because symbols cost nothing at run time and make profiles readable. PGO adds real branch data in a second pass, which splits hot from cold code and improves layout. Separately, sanitizer builds (ASan/UBSan, and TSan in its own binary) gate correctness in CI — they are 2–20x slower and must never ship — and logging goes off the hot path: the hot thread pushes a fixed-size binary record into a lock-free ring and a separate thread formats and writes it.",
  "deck": "Deck W14 · slides 12, 14–16"}
],
"hft": {
 "text": "Why this matters in HFT",
 "paragraphs": [
  "The tail is not a proxy for the grade, it *is* the grade: the LATENCY tab ranks bots by p99.9 tick-to-order, not by the mean. What is timed is concrete — steady_clock in microseconds from the moment a book_snapshot is decoded, through your decision and serialisation, to the order leaving — so every microsecond you find in this session is directly a place on the board.",
  "Profile offline first, because a deterministic input is the only way to attribute a change. scripts/latency_replay.py feeds a recorded tape into your bot over stdin and prints p50/p99/p99.9, throughput and the tail bars; because the tape is fixed, a before/after comparison isolates your code from network noise. Note the division of labour in the harness: latency_replay.py drives the offline replay, while latency_report.py parses the LAT lines your bot logs during a live session.",
  "Work the loop, and keep a changelog. Flame-graph the replay, pick the widest plateau or the top tail cause, fix exactly that one thing, re-run the same tape, and record the before/after percentiles. A tail-reduction changelog is more valuable than the fix itself, because it tells you which class of problem your code actually suffers from — allocation, fault, miss or jitter.",
  "Correctness is a precondition, not a parallel track, because the bugs sanitizers find are frequently the same bugs that become tails. A use-after-free that happens to work today is a crash tomorrow; an unsynchronised handoff is a torn read that makes you trade a book that never existed. So the shipping rule is two builds: debug binaries under ASan/UBSan and a separate one under TSan, both clean on the replay, then the graded release binary at -O3 -march=native -flto.",
  "One practical CMake trap costs people an afternoon: passing -DCMAKE_CXX_FLAGS to an existing build directory is ignored because the cache wins, and cmake --build never re-reads -D flags. Use one build directory per flag set (build-asan, build-tsan, build-rel) and --fresh when you change them."
 ],
 "example": {"title": "In the arena",
  "text": "course/hft-columbia/starters/hw14/tail.cpp — the HW14 program whose median is fine and whose tail is ugly, with the pathology sitting in plain sight: a fresh allocation and an O(window) recompute on every single tick.",
  "code": """// starters/hw14/tail.cpp
// Its median is fine, but the TAIL is ugly - there is (at least) one avoidable
// pathology on the hot path that blows up p99.9. PROFILE it, find what spikes
// the tail, and FIX it in a copy. Do NOT just crank compiler flags.
static double signal(const std::vector<double>& prices,
                     std::size_t i, std::size_t window) {
    std::size_t lo = i >= window ? i - window : 0;
    std::vector<double> scratch;            // <-- allocates every single tick
    for (std::size_t k = lo; k <= i; ++k) scratch.push_back(prices[k]);
    double s = 0.0;
    for (double v : scratch) s += v;        // <-- O(window) recompute per tick
    return s / scratch.size();
}"""}
},
"interview": [
 {"q": "Why report percentiles instead of a mean for latency?",
  "a": "Because the distribution is heavy-tailed and usually bimodal — a tight fast body plus rare multi-millisecond stalls — so the mean sits between the two modes and corresponds to no real observation. Percentiles describe the shape: p50 tells you the common case, p99 and p99.9 tell you what happens on the busy ticks that decide races, and the max tells you the worst thing your system did. A 40 µs mean with a 5 ms p99.9 and a 40 µs mean with a 45 µs p99.9 are completely different systems.",
  "level": "warm-up", "skill": "trading.tick-to-trade"},
 {"q": "Which perf command do you run first on a slow binary, and why that one?",
  "a": "perf stat, because it is almost free and immediately tells you what kind of problem you have: cycles and instructions give you IPC, and the cache-miss, branch-miss and page-fault counters say whether you are memory-bound, mispredicting, or faulting. Only then do I sample with perf record -g and read perf report, because sampling tells me *where* while the counters tell me *why*. Going straight to a flame graph without stat often means optimising a wide frame for the wrong reason.",
  "level": "warm-up", "skill": "tools.perf-profiler"},
 {"q": "How do you read a flame graph, and what is the classic misreading?",
  "a": "The x-axis is not time — it is aggregated sample count, sorted for merging — so width means total time attributed to that frame and its children, and the y-axis is stack depth. You look for wide plateaus, because those are where the cycles are. The classic misreading is chasing tall towers: depth only means a deep call stack, and a narrow spike is irrelevant however dramatic it looks. The second trap is profiling a build without frame pointers or symbols, which silently collapses stacks into nonsense.",
  "level": "core", "skill": "tools.flame-graph"},
 {"q": "Name the usual physical causes of a latency tail and how you distinguish them.",
  "a": "Allocation (malloc locking, walking free lists or calling the kernel), page faults on first touch or swapped memory, NUMA-remote loads, TLB misses over a big working set, and OS preemption or interrupts. You distinguish them with counters rather than intuition: minor/major fault counts for faults, cache and LLC miss counters plus NUMA-local vs remote for memory, dTLB-load-misses for the TLB, and a jitter probe — a tight loop timing an empty section — for scheduler noise. Each one has a different fix, which is why naming it first matters.",
  "level": "core", "skill": "perf.tail-diagnosis"},
 {"q": "What is coordinated omission and why does it matter?",
  "a": "It is the bias you get when your measurement loop only starts the next timer after the previous operation finished: while the system is stalled you take no samples, so precisely the slow period is under-represented and the tail you report is far better than the tail your counterparty experienced. The fix is to sample on a fixed schedule — measure against the time the work *should* have started — and to record the backlog rather than skipping it. It is the reason a naive request-to-request benchmark can show a clean p99.9 on a system that visibly stutters.",
  "level": "core", "skill": "perf.tail-diagnosis"},
 {"q": "Why do you keep -g in a release build, and what do -march=native and -flto buy you?",
  "a": "Debug symbols do not change the generated code or slow it down; they just make perf, flame graphs and core dumps readable, so stripping them costs you diagnosis for nothing. -march=native lets the compiler emit this CPU's instruction set — AVX2 and friends — which is a real win for vectorisable loops, at the price of a binary that may illegal-instruction on a different microarchitecture, so you build on the target. -flto defers optimisation to link time so inlining and constant propagation cross translation-unit boundaries, which typically helps the hot path where the codec and the strategy live in different files.",
  "level": "core", "skill": "tools.compiler-flags"},
 {"q": "You must log every decision for post-trade analysis without touching the tail. How?",
  "a": "The hot thread does no I/O and no formatting. It pushes a small fixed-size binary record — event code, symbol id, a few scalars, a timestamp — into a lock-free SPSC ring, which is a couple of stores, and returns. A separate, non-pinned writer thread drains the ring, formats and writes to disk, and if it falls behind the ring's bounded capacity forces an explicit policy (drop and count) rather than blocking the producer. No strings, no printf, no allocation on the producer side, because a synchronous write or a string format is a syscall plus an allocation and therefore a guaranteed tail event mid-race.",
  "level": "senior", "skill": "tools.async-logging"},
 {"q": "Your p99.9 improved by 30% after a change, but p50 got slightly worse. Do you ship it?",
  "a": "Probably yes, because the scoreboard is the tail and a tighter distribution is worth a small median regression — but not before I understand the trade, since “tail better, median worse” is the signature of having moved work from a rare path onto the common one. So I check that the mechanism is the one I intended (for example pre-faulting or reserving up front costs every tick a little and removes the spike), confirm it on more than one tape so I am not fitting to a single recording, and verify throughput did not fall. If the median regression is instead random noise, I need more samples before claiming either result.",
  "level": "senior", "skill": "perf.tail-diagnosis"}
]
})

# ===================== SESSION 13 =====================
S.append({
"n": 13,
"focus": "Latency arbitrage & multi-venue",
"tagline": "The finale: one name on many venues, a quote that has not caught up, and a composite grade that scores your whole term at once.",
"concepts": [
 {"title": "One name, many venues",
  "text": "The same instrument trades on a dozen exchanges simultaneously, each with its own book, its own touch and its own queue. A trade or cancel on one venue takes time to be reflected on another, so for microseconds they genuinely disagree — and that gap is the trade. The consolidated best bid and offer across all venues, the NBBO, is the reference every participant is measured against.",
  "deck": "Deck W15 · slide 5"},
 {"title": "Picking off a stale quote",
  "text": "Consolidate the venues and look for the one whose price has not updated. When the NBBO computes as crossed — one venue's ask below another's bid — the lagging side is stale and a fast bot can lift or hit it before it reprices. The window is microseconds wide and the quote is public, so everybody sees it: this is a pure reaction-time race, not a forecast.",
  "code": """struct Touch { double bid, ask; };
Touch a{100.05, 100.07}, b{100.02, 100.04};     // B has not caught up
double nbbo_bid = std::max(a.bid, b.bid);
double nbbo_ask = std::min(a.ask, b.ask);
std::printf("%.2f %.2f %s\\n", nbbo_bid, nbbo_ask,
            nbbo_ask < nbbo_bid ? "CROSSED: lift B, sell A" : "ok");
// 100.05 100.04 CROSSED: lift B, sell A""",
  "deck": "Deck W15 · slide 6"},
 {"title": "The race and smart order routing",
  "text": "Seeing the opportunity is not winning it: the order that arrives first at that venue gets the fill and everyone else gets nothing. Smart order routing decides where the order goes — split or sweep across venues to capture displayed size at the best net price, taking the stale venue and the next-best levels in one shot before they fade. Net price means fees and rebates and per-venue latency, which can change which route actually wins.",
  "deck": "Deck W15 · slide 7"},
 {"title": "The maker's job: two-sided quotes",
  "text": "A market maker posts a bid below and an ask above fair value, anchors that fair value on the microprice rather than the mid, and earns the spread plus maker rebates over many round trips. Speed is what keeps the quotes honest: a stale quote is a gift to takers, so you must requote faster than the world moves against you.",
  "deck": "Deck W15 · slide 9"},
 {"title": "Queue-aware requoting and inventory skew",
  "text": "Two decisions dominate maker P&L. Inventory skew leans your quotes against your position — long inventory means shading both sides down so you are more likely to sell than buy — so risk management happens in the quote rather than in a separate hedge. Queue awareness decides whether to act at all: cancel-and-repost sends you to the back of the FIFO, so if you are already near the front, or the price change is small, holding your spot beats chasing.",
  "code": """const double half = 0.02, kSkew = 0.01;
int pos = 3;                                  // long 3: lean the quotes DOWN
double fair = 100.010 - kSkew * pos;
std::printf("fair=%.3f bid=%.3f ask=%.3f ", fair, fair - half, fair + half);
int queue_ahead = 4;                          // near the front: keep the spot
std::printf("reprice=%s\\n", queue_ahead < 10 ? "no" : "yes");
// fair=99.980 bid=99.960 ask=100.000 reprice=no""",
  "deck": "Deck W15 · slide 10"},
 {"title": "Adverse selection and markouts",
  "text": "A fast fill can be a bad fill. When an informed trader hits your quote just before the price moves, you did not capture the spread — you bought the top. The measurement is the markout: compare the mid some interval after each fill against your fill price, signed by your side. Persistently negative markouts on a symbol or a counterparty is toxic flow, and the responses are to widen, skew away, or stop quoting it.",
  "code": """double fill_px = 100.04, mid_1s = 100.01;     // the mid one second after the fill
bool bought = true;
double markout = bought ? mid_1s - fill_px : fill_px - mid_1s;
std::printf("%+.3f %s\\n", markout, markout < 0 ? "picked off" : "good fill");
// -0.030 picked off""",
  "deck": "Deck W15 · slide 11"}
],
"hft": {
 "text": "Why this matters in HFT",
 "paragraphs": [
  "The tournament scenario turns every market-structure flag on at once: multi-venue with cross-venue latency arbitrage, futures enabled, the longest opening and closing auctions, the scarcest short locates, the tightest order quota per tick and the widest position limit. There is also an FPGA-maker IPO listing mid-session, so the primary market lands under full speed pressure. Everything from the term is scored simultaneously.",
  "Cross-venue in C++ has a concrete shape here, and it is not the Python one: EXCHANGE_URL is per process, so you run one client per venue and the two processes share a touch cache. That is what the project's Phase 4 shared-memory ring is for — a POD structure with no pointers, living in a shared region, initialised once before fork. Each process writes its own venue's touch and reads the other's; when the NBBO crosses, each trades the side it owns.",
  "The grade is a composite, not just the median: tick-to-trade p50/p99/p99.9 carries the most weight, plus throughput under load (can your pipeline keep up when the whole class fires at once), fill rate (did your fast quotes actually trade), and how often you sat near the front of the FIFO. Colocation matters precisely because it decides who lands first — it cuts the venue's outbound delay, so the same code and the same signal resolve in your favour.",
  "Queue position, which arrived in session 6 as a data-structure problem, is now a P&L problem. Requoting is the most expensive cheap operation in the system: sending is a few microseconds, and losing your place in a 1000-share queue can be the whole edge. So the requote rule is explicit — only move when the expected gain exceeds the queue position you forfeit, and never on a move smaller than your tolerance.",
  "Finally, the honest framing. Speed is legal and it tightens spreads and deepens books, and it is also an arms race that spends real resources to move wealth microseconds earlier, on access that is openly for sale. You should be able to argue both sides — and to write code that respects its risk limits, because fast code that destabilises a book is an engineering failure regardless of its P&L."
 ],
 "example": {"title": "In the arena",
  "text": "course/hft-columbia/project-starter/include/shm_ring.hpp — Phase 4's cross-process ring. The constraint that makes it work is the one in the comment: no pointers, because the same bytes are mapped at different addresses in each process.",
  "code": """// project-starter/include/shm_ring.hpp
// Project Phase 4 - POD ring living entirely in a shared-memory region
// (NO pointers), usable across processes. init() is called once by the
// creator before fork().
struct ShmRing {
    static constexpr uint32_t CAPACITY = 1024;   // power of two
    void init();                       // head/tail (atomics) to 0
    bool push(uint64_t v);             // producer; false if full
    bool pop(uint64_t& out);           // consumer; false if empty
    std::atomic<uint32_t> head, tail;  // offsets, never addresses
    uint64_t buf[CAPACITY];
};"""}
},
"interview": [
 {"q": "What is the NBBO, and what does it mean for it to be crossed or locked?",
  "a": "The NBBO is the consolidated best bid and best offer across all venues trading the name: the maximum bid and the minimum ask. Locked means the best bid equals the best ask — someone is willing to buy at exactly the price someone is willing to sell. Crossed means the best ask is *below* the best bid, which cannot persist: it says one venue's quote has not caught up, and it is the signal a latency arbitrageur is looking for.",
  "level": "warm-up", "skill": "trading.nbbo-latency-arb"},
 {"q": "Why do prices on two venues disagree at all?",
  "a": "Because information propagates at finite speed. A trade or cancel executes on venue A, and the update has to travel to every participant and be acted on before venue B's resting quotes are pulled or repriced — that round trip is tens to hundreds of microseconds depending on distance and technology. During that window venue B's book is genuinely stale, and the gap is not a mispricing anyone believes in, just a queue of events that has not finished.",
  "level": "warm-up", "skill": "trading.nbbo-latency-arb"},
 {"q": "You detect a crossed NBBO. Walk through what you do and what can go wrong.",
  "a": "Take the stale side — lift the low ask on the lagging venue — and simultaneously hedge on the venue that already moved, because holding the position unhedged is directional risk you were not paid for. What goes wrong is leg risk: the stale quote is public, so if you lose the race on the first leg you may still get filled on the second and end up with unwanted inventory at a worse price. Net-of-fees matters too, because a two-cent gross edge can be negative after taker fees on both legs, and displayed size may be smaller than it looks.",
  "level": "core", "skill": "trading.smart-order-routing"},
 {"q": "What is inventory skew and why do market makers do it in the quote rather than by hedging?",
  "a": "Skew means shifting your quoted fair value against your position: if you are long, you lower both your bid and your ask so the ask is more attractive and you are more likely to sell than buy. It pushes your inventory back toward flat using flow you are being paid for, instead of paying the spread to hedge out of it. Mechanically it is one term — fair = microprice - k * position — and k is the knob that trades inventory risk against captured spread.",
  "level": "core", "skill": "trading.queue-aware-requoting"},
 {"q": "What is a markout, and how do you use it operationally?",
  "a": "A markout is the signed P&L of a fill measured against the mid some horizon later: for a buy it is mid_later minus your fill price, for a sell the reverse. It answers whether the fill was actually good, independently of whether the position was later closed well. Operationally you bucket markouts by symbol, counterparty class and time of day, at several horizons — a few hundred milliseconds to a few seconds — and persistent negativity means you are being adversely selected, so you widen, skew away from that side, or stop quoting that name.",
  "level": "core", "skill": "trading.adverse-selection"},
 {"q": "When should a maker requote, given that repricing loses queue position?",
  "a": "When the expected gain from the new price exceeds the option value of the queue spot you are giving up. Concretely that means holding when you are near the front — the fill is imminent and probably profitable — and holding when the price move is inside your tolerance, because a tick of improvement is not worth restarting behind a thousand shares. You requote when fair value has moved enough that your current quote is now the wrong side of the market, since a stale quote is worse than no quote: it is a free option you have written to every taker.",
  "level": "core", "skill": "trading.queue-aware-requoting"},
 {"q": "Two venues, two processes, one shared touch cache. What must the shared structure not contain, and why?",
  "a": "No pointers, and nothing whose representation depends on the process — so no std::string, no vector, no virtual functions, and no references. The same physical pages are mapped at different virtual addresses in each process, so a pointer written by one is meaningless to the other; the structure has to be a POD of scalars, atomics and fixed arrays, with any linkage expressed as offsets or indices. It also has to be initialised exactly once by the creator before the fork, and you still need the same acquire/release discipline as an in-process ring, because the memory model applies across processes just as it does across threads.",
  "level": "senior", "skill": "perf.spsc-ring"},
 {"q": "Make the case for and against latency arbitrage as a business.",
  "a": "For: it is the mechanism that enforces one price across fragmented venues, and the participants doing it are usually also the ones quoting two sides, so the result is tighter spreads, deeper books and lower costs for everyone who trades once a month. Against: the specific trade consists of taking a quote from someone who has not yet been able to withdraw it, so the profit is a transfer from a slower participant rather than new information being priced, and the resources spent to win it — microwave towers, hollow-core fibre, custom silicon — are real capital spent on a purely relative advantage. The fairness question is sharpest about access: colocation and proprietary feeds are openly for sale, so speed is a purchased edge, which is why venues experiment with speed bumps and auction mechanics. My own line is that the liquidity argument is genuine and the arms-race critique is also genuine, and the sensible policy response is about market design rather than about banning speed.",
  "level": "senior", "skill": "trading.hft-ethics"}
]
})
