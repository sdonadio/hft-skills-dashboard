# -*- coding: utf-8 -*-
# Sessions 5-9 of window.FOCUS
S = []

# ===================== SESSION 5 =====================
S.append({
"n": 5,
"focus": "Templates, compile-time & CRTP",
"tagline": "Write it once, let the compiler specialise it per type, and pay nothing at run time — the only kind of abstraction HFT can afford.",
"concepts": [
 {"title": "A template is a recipe, not code",
  "text": "template<typename T> is a blueprint; the compiler instantiates it — generates real machine code — the first time you use it with a concrete type, and then inlines it. That is why a ring<T,N> or a pool<T> costs the same as the version you would have hand-written for that exact type. The price is code bloat: each distinct instantiation is separate code, and definitions must live in headers.",
  "deck": "Deck W5 · slides 5–6"},
 {"title": "Parameter packs and fold expressions",
  "text": "typename... lets one template take any number of arguments of any types, and sizeof...(Ts) gives the count at compile time. A C++17 fold collapses the pack over a binary operator in one line — no recursion, no base case — and the expansion is unrolled and inlined away, which is how one call can serialise a whole message.",
  "code": """template <class... Ts> constexpr auto sum(Ts... xs) { return (xs + ...); }
template <class... Ts> int arity(Ts...)             { return sizeof...(Ts); }
static_assert(sum(1, 2, 3, 4) == 10);        // the compiler did the addition
std::cout << sum(1, 2, 3, 4) << ' ' << sum(0.5, 0.25) << ' '
          << arity(1, 'a', 2.0) << '\\n';
// 10 0.75 3""",
  "deck": "Deck W5 · slides 9–10"},
 {"title": "Traits and if constexpr: branch before the program runs",
  "text": "A type trait is a compile-time question about T — is_integral_v, is_same_v — answered during compilation and costing nothing at run time. Feed one into if constexpr and the untaken arm is discarded before code generation: each instantiation contains exactly one path, so there is no test and nothing to mispredict. Prefer this to raw SFINAE and enable_if in new code.",
  "code": """template <class T> const char* kind(const T&) {
  if constexpr (std::is_integral_v<T>)            return "int";   // only arm compiled
  else if constexpr (std::is_floating_point_v<T>) return "float";
  else                                            return "other";
}
std::cout << kind(3) << ' ' << kind(3.0) << ' ' << kind("x") << '\\n';
// int float other""",
  "deck": "Deck W5 · slides 12–14 · Deck W6 · slide 9"},
 {"title": "What a virtual call actually costs",
  "text": "A polymorphic object carries one hidden vptr to a per-class table of function addresses, so sizeof grows by eight the moment the first virtual appears. The call is two dependent loads plus an indirect branch — but the real bill is the inlining you lose and the branch mispredicts when a loop sees several targets. final or an exact known type lets the compiler devirtualise and inline through it.",
  "code": """struct P { int a; };                              // plain
struct V { int a; virtual ~V() = default; };      // polymorphic: hidden vptr
std::cout << sizeof(P) << ' ' << sizeof(V) << ' ' << alignof(V) << ' '
          << std::is_polymorphic_v<V> << '\\n';
// 4 16 8 1     -- 8B vptr + 4B int + 4B padding""",
  "deck": "Deck W5 · slides 17–20"},
 {"title": "constexpr: make the compiler do the work",
  "text": "A constexpr function can run during compilation when its inputs are constants; consteval must. Build a lookup table that way and the loop runs inside the compiler, the result ships as read-only data in the binary, and the hot path is one indexed load with no initialisation code and no branch. static_assert then checks the table before you ship it.",
  "code": """constexpr std::array<double, 8> make_ticks() {
  std::array<double, 8> t{};
  for (int i = 0; i < 8; ++i) t[i] = (i < 4) ? 0.01 : 0.05;  // runs in the COMPILER
  return t;
}
constexpr auto TICKS = make_ticks();              // read-only data in the binary
static_assert(TICKS[0] == 0.01 && TICKS[7] == 0.05);
std::printf("%.2f %.2f\\n", TICKS[3], TICKS[4]);
// 0.01 0.05""",
  "deck": "Deck W6 · slides 5–6"},
 {"title": "CRTP and policy-based design",
  "text": "The Curiously Recurring Template Pattern templates a base on its own derived type, so the base can static_cast down and call the derived method — dispatch bound at compile time, fully inlinable, and no vptr, so an empty strategy really is one byte. Policy-based design is the same idea composed: pass SignalPolicy, RiskPolicy and ExecPolicy as template parameters and swapping a component is swapping a type.",
  "code": """template <class D> struct Strategy {
  void on_book(double mid) { static_cast<D*>(this)->signal(mid); }   // no vtable
};
struct Momentum : Strategy<Momentum> {
  void signal(double mid) { std::printf("buy %.2f ", mid); }        // inlined
};
Momentum m; m.on_book(100.01);
std::printf("%zu\\n", sizeof(Momentum));           // no vptr at all
// buy 100.01 1""",
  "deck": "Deck W6 · slides 11–12"}
],
"hft": {
 "text": "Why this matters in HFT",
 "paragraphs": [
  "The choice between a template and a virtual is not a style question on the tick-to-trade path, it is the difference you get graded on. A virtual call is two loads plus an indirect branch the CPU can mispredict at 15–20 cycles, and it is an inlining barrier: constant folding and register allocation stop there. A template call compiles to the same machine code you would have written by hand for that exact type.",
  "The deciding question is whether the type set is open or closed. Open — a plugin, or a base that must work with a bot it has never seen — is virtual's job, and the arena client uses it deliberately at exactly one place: hft_bot.hpp declares virtual void on_book(...) at the client boundary. Closed — the handful of message and strategy types you actually ship — means every run-time decision is one you chose not to make: template it, or mirror the wire union as a std::variant and dispatch with a compile-time visitor.",
  "That wire union is the concrete payoff. shared/messages.py is a pydantic discriminated union keyed on a \"type\" field — Handshake, PlaceOrder, OrderAck, BookSnapshot, CancelOrder — and a templated encode<T>/decode<T> plus std::visit over a variant gives you one allocation-free codec with no per-type copy-paste and no run-time branch. The parse boundary turns a tag into a type once; from there everything is static.",
  "constexpr moves work out of the tick entirely. Tick-size bands, fee tables and scaling factors are constants you can compute at build time and ship as read-only data, so the hot path does an indexed load instead of a computation. And static_assert is free insurance on the things that must not drift — struct sizes, alignments, tick grids — turning a wrong assumption into a failed build instead of a wrong quote.",
  "There is a real cost to pay attention to: every instantiation is separate machine code, so templating a fat function over ten types scatters your instruction cache. The habit is to keep the generic layer thin and inlinable and to check that it actually inlined — read the asm, or watch whether the p99.9 on the replay tape moves."
 ],
 "example": {"title": "In the arena",
  "text": "hft/cpp_client/include/hft_bot.hpp — a real template on the real hot path: stamp_and_send takes the send call as a template parameter so the whole latency-stamping wrapper inlines into buy_limit with no indirection and no std::function.",
  "code": """// hft/cpp_client/include/hft_bot.hpp
void buy_limit(const std::string& symbol, int qty, double price) {
    stamp_and_send([&] { place_limit(symbol, "buy", qty, price); });
}

// Time the order send against the current tick's arrival stamp.
template <typename SendFn>
void stamp_and_send(SendFn&& send) {
    if (in_book_call_) {
        send();                                   // inlined; no std::function
        const auto now    = clock::now();
        const auto micros = std::chrono::duration_cast<std::chrono::microseconds>(
                                now - tick_recv_).count();
        record_latency(tick_symbol_, static_cast<long long>(micros));
    } else { send(); }
}"""}
},
"interview": [
 {"q": "Why must a template's definition live in a header?",
  "a": "Because a template is not code until it is instantiated, and the compiler can only instantiate it where it can see the definition. With the body in a separate .cpp, each translation unit that uses it emits a call to a function nobody generated, and you get a link error. The alternatives are to keep the definition in the header (the normal choice) or to explicitly instantiate the specific types you need in one .cpp.",
  "level": "warm-up", "skill": "cpp.templates"},
 {"q": "What is the difference between if and if constexpr?",
  "a": "A plain if is a run-time test: both branches are compiled and the CPU evaluates the condition and may mispredict it. if constexpr is evaluated during compilation and the untaken branch is discarded before code generation — it is not even required to compile for that instantiation. So if constexpr costs nothing at run time and lets you write a branch that would be ill-formed for the other type.",
  "level": "warm-up", "skill": "cpp.type-traits-constraints"},
 {"q": "Precisely what does a virtual call cost, and when does it actually hurt?",
  "a": "Mechanically: load the vptr out of the object, load the slot out of the vtable, then an indirect call — two dependent loads and a branch whose target is not known until the first load returns. On a loop with one hot target the predictor learns it and the marginal cost is a couple of nanoseconds; with several targets in the same loop you get mispredicts at roughly 15–20 cycles each. The larger cost is usually indirect: the compiler cannot inline through it, so constant folding stops at the call, and a fan-out of tiny virtuals scatters your instruction cache.",
  "level": "core", "skill": "perf.virtual-cost"},
 {"q": "Compare CRTP with virtual dispatch. When would you still choose virtual?",
  "a": "CRTP binds the call at compile time — the base static_casts to its derived type — so it inlines completely, adds no vptr and no indirect branch, and an empty policy costs one byte. The catch is that the concrete type must be known at compile time, so it cannot express a set of types decided at run time. I still use virtual where the type set is genuinely open or where flexibility is worth more than nanoseconds: configuration, setup, logging, and the client boundary — never in the tick-to-trade body.",
  "level": "core", "skill": "cpp.crtp-policies"},
 {"q": "You are given a wire protocol with five message types, all known at build time. How do you dispatch on the hot path?",
  "a": "Turn the tag into a type once, at the parse boundary — a switch on the discriminator is a single well-predicted compare and jump — then stay static from there. Model the union as std::variant<A,B,C,D,E> and dispatch with std::visit over a generic visitor that uses if constexpr per type: no vtable, no allocation, and the handlers inline. Reaching for virtual or std::function here would be paying a run-time indirection for a decision the compiler could have made.",
  "level": "core", "skill": "cpp.variant-visit"},
 {"q": "What does std::function cost, and where is it acceptable?",
  "a": "It is type erasure: a call through it is an indirect call the compiler cannot inline, it may heap-allocate if the callable does not fit the small-object buffer, and copying it copies that state. That is fine for a callback installed once at startup, or for cold-path configuration. On a per-tick path I use a template parameter or a plain lambda instead, so the callable's type is known and the whole thing folds into the caller.",
  "level": "core", "skill": "cpp.templates"},
 {"q": "Your templated hot path is suddenly slower after you added a fourth instantiation, and the profiler shows front-end stalls. What is going on and what do you do?",
  "a": "Instantiation is code generation, so four types mean four copies of the function body; if it is large, the working set no longer fits the instruction cache and you become front-end bound rather than data bound. The counters to confirm it are instruction-cache and front-end stall metrics, not cache-miss counts on data. The fix is to split the template into a thin type-dependent shell that inlines and a single shared out-of-line body for the type-independent bulk — keep genericity at the edges, not in the mass of the code.",
  "level": "senior", "skill": "cpp.templates"},
 {"q": "How would you prove a “zero-overhead” abstraction really is zero overhead?",
  "a": "Two ways, both empirical. Read the generated code: build the templated version and a hand-written version at the same optimisation level and compare the disassembly of the hot function — if the abstraction vanished, the instruction sequences match and there is no call left. Then confirm behaviourally on a fixed input: run both through the same recorded tape and compare p50 and p99.9, because an inlining failure shows up as a tail change long before it shows up in a mean. Claiming zero overhead from the language rules alone is how people ship an accidental indirect call.",
  "level": "senior", "skill": "perf.virtual-cost"}
]
})

# ===================== SESSION 6 =====================
S.append({
"n": 6,
"focus": "Data structures: building the order book",
"tagline": "Two sides, resting size at every price, and three operations that must stay O(1) and in cache — add, cancel, and read the touch.",
"concepts": [
 {"title": "Hash tables: chaining versus open addressing",
  "text": "Order-ID and symbol lookups are the workhorse, and both collision strategies are O(1) on average — the constant factor is decided by memory layout. Chaining (what std::unordered_map does) makes each bucket a linked list of heap nodes, so every collision is a pointer chase and a likely cache miss. Open addressing probes the next slot of one flat array, so probes stay in cache and the prefetcher helps.",
  "code": """struct Slot { uint64_t key = 0; uint32_t val = 0; bool used = false; };
std::array<Slot, 8> t{}; const uint64_t mask = 7;      // power of two -> AND, not %
auto put = [&](uint64_t k, uint32_t v) {
  uint64_t i = k & mask;
  while (t[i].used && t[i].key != k) i = (i + 1) & mask;   // walk the NEXT slot
  t[i] = {k, v, true};
};
put(1, 100); put(9, 900);                     // 9 & 7 == 1: they collide
std::cout << t[1].key << ' ' << t[2].key << ' ' << t[2].val << '\\n';
// 1 9 900     -- the collision landed in the adjacent slot, same cache line""",
  "deck": "Deck W7 · slides 5–6"},
 {"title": "Pick the container for the access pattern",
  "text": "Ordered iteration favours a tree, point lookup favours a hash, and best-element access favours a heap — but contiguity beats big-O constants at the sizes a book actually holds. std::map is sorted and O(log n) with heap-scattered nodes; std::unordered_map is O(1) average with chaining and rehashing, so its tail is spiky; a priority_queue is array-backed and cache-friendly. Reserve up front and never rehash on the hot path.",
  "deck": "Deck W7 · slide 7"},
 {"title": "The flat, price-indexed book",
  "text": "Prices live on a fixed tick grid, so an integer index is exact and you do not need a general ordered map at all. Index = (price - base) / tick makes each level a slot in one contiguous array: add and cancel index straight to the level, the touch is a cached index you read with a single load, and matching walks adjacent slots in the direction the prefetcher expects.",
  "code": """const double base = 99.00, tick = 0.01;       // index against a BASE tick
std::array<uint32_t, 256> bid_qty{};
int best = -1;
auto idx = [&](double px) { return int((px - base) / tick + 0.5); };
auto add = [&](double px, uint32_t q) {
  int i = idx(px); bid_qty[i] += q; if (i > best) best = i;   // O(1), one line
};
add(100.00, 800); add(99.99, 600);
std::printf("%d %d %.2f %u\\n", idx(100.00), idx(99.99), base + best * tick, bid_qty[best]);
// 100 99 100.00 800""",
  "deck": "Deck W7 · slides 9–10"},
 {"title": "A flat array is a BAND, not “all prices”",
  "text": "This is the trap the starter header warns about. 65 536 one-cent slots indexed absolutely from $0.00 only covers $0.00–$655.35, and the arena lists names above that — so an absolute index walks off the end, and because the two side arrays are adjacent members it silently corrupts the other side of your own book. AddressSanitizer cannot see it, because it is an intra-object overflow. Index against a base tick and bounds-check both ends.",
  "deck": "Deck W7 · slide 9"},
 {"title": "Add, cancel, match — and where you are allowed to scan",
  "text": "Add indexes the level, bumps the aggregate quantity and order count, and nudges the cached best index if this price is a new touch. Cancel indexes and subtracts — and if the level empties and it was the touch, that is the one place you may scan inward for the next non-empty slot. Match starts at best, consumes size, and steps to the adjacent slot when a level clears: sequential access, O(1) in the common case.",
  "deck": "Deck W7 · slide 11"},
 {"title": "FIFO per level, and knowing your position in it",
  "text": "Within one price, orders fill front-to-back by arrival, keyed on a monotonic sequence number. Your fill probability is set by how much size sits ahead of you, so queue_ahead is a number worth tracking: zero means you are at the front and about to trade. Repricing forfeits all of it — cancel and re-post puts you at the tail — which is why churning quotes is expensive even when sending is cheap.",
  "code": """int ahead = 800, level = 1000;                // you rest behind 800 at 100.00
ahead -= 300;                                 // 300 ahead of you filled: you advance
std::printf("%d %d %s\\n", ahead, level, ahead ? "wait" : "FRONT");
ahead = level;                                // cancel + re-post: BACK of the queue
std::printf("%d\\n", ahead);
// 500 1000 wait
// 1000""",
  "deck": "Deck W7 · slide 13"}
],
"hft": {
 "text": "Why this matters in HFT",
 "paragraphs": [
  "The structure *is* the latency. A cache miss is around 100 ns and the arithmetic on a book update is a nanosecond or two, so the right layout is worth more than a cleverer algorithm. Your job this week is to mirror the exchange's book locally so that on_book can go decode → update → decide entirely in cache, with no allocation and no traversal.",
  "The engine you are mirroring is a CLOB with price-time priority, and it keys each level's queue on a monotonic sequence number rather than a timestamp, so ties are impossible. That means your local model can be exact rather than approximate: the same add/cancel/match rules, the same FIFO per level.",
  "Reading the touch has to be free. Cache best_bid and best_ask as indices and the top of book is a single load with zero search — that is the difference the p99.9 sees, because the touch is read on literally every tick while a cancel that empties a level is rare.",
  "Queue awareness is the strategy payoff of the data structure. OrderAck carries queue_ahead and level_qty when your order rests, and QueueUpdate tells you when a fill or cancel ahead of you has advanced your standing. queue_ahead == 0 means you are about to fill — which is also exactly when adverse selection bites, the thread session 13 picks up.",
  "Do not take any of this on faith: benchmark your flat book and your open-addressing map against std::map and std::unordered_map, and read the tail, not just the median. The std:: containers usually look acceptable on p50 and fall apart on p99.9, because that is where a rehash or a node allocation lands."
 ],
 "example": {"title": "In the arena",
  "text": "course/hft-columbia/project-starter/include/order_book.hpp — the HW7 stub, including the band warning that CI will not catch for you.",
  "code": """// project-starter/include/order_book.hpp
// HW7 - a fast order book (flat, price-indexed) + a fast symbol->id map.
//
// Range warning (see labs/week07.md step 2): a flat array of N one-cent slots
// is a BAND, not "all prices". 1<<16 slots indexed absolutely from $0.00 covers
// only $0.00-$655.35 ... an absolute index walks off the end and, because the
// two side arrays are adjacent members, silently corrupts the OTHER side of
// your own book. ASan cannot see that (it is an intra-object overflow).
struct Book {
    void add(uint64_t id, char side, double px, uint32_t qty);
    void cancel(uint64_t id);
    double best_bid() const;   // TODO(student): O(1)
    double best_ask() const;   // TODO(student): O(1)
};"""}
},
"interview": [
 {"q": "Why is std::unordered_map a risky choice on a latency-critical path?",
  "a": "It is specified with chaining, so buckets are linked lists of separately allocated nodes: a lookup that collides becomes a pointer chase across the heap, and each hop is a likely cache miss. It also allocates a node per insert and rehashes when the load factor is exceeded, which is an O(n) event that lands whenever it lands. Average O(1) is true and irrelevant — the tail is what the venue's busy tick sees.",
  "level": "warm-up", "skill": "cpp.stl-containers"},
 {"q": "Why size an open-addressing hash table to a power of two?",
  "a": "So the modulo becomes a bitwise AND with size - 1, replacing a division (tens of cycles) with a single-cycle instruction on the hottest line of the probe loop. It also makes wrap-around free: i = (i + 1) & mask. The discipline that goes with it is to reserve up front and keep the load factor below roughly 0.7, because probe chains lengthen sharply after that.",
  "level": "warm-up", "skill": "perf.open-addressing-hash"},
 {"q": "Why can a flat price-indexed array beat a std::map for an order book even though the map is O(log n)?",
  "a": "Because prices are discrete: they sit on a tick grid, so (price - base) / tick is an exact integer index and the lookup is arithmetic instead of a search. The map's six or so pointer hops are six likely cache misses at ~100 ns each; the array is one indexed load into a line the prefetcher probably already fetched. Add and cancel become O(1), the touch is a cached index, and matching walks adjacent slots sequentially.",
  "level": "core", "skill": "trading.flat-order-book"},
 {"q": "What is the main hazard of the flat-array book, and how do you handle it?",
  "a": "It covers a price *band*, not all prices, so any price outside the band indexes out of range — and if the two sides are adjacent arrays in one struct, the overflow corrupts your other side rather than segfaulting, which sanitizers will not catch because it is an intra-object overflow. You index relative to a base tick, bounds-check both ends explicitly, and decide a policy for out-of-band prices (re-base the window, or reject and log). Never rely on the test data staying near the middle of the band.",
  "level": "core", "skill": "trading.flat-order-book"},
 {"q": "Which operations on a flat book are O(1), and which one is not?",
  "a": "Add is O(1): index the level, bump the aggregate quantity, and update the cached best index if the price improves the touch. Cancel is O(1) in the body — index and subtract — but if the level empties *and* it was the touch, you must scan inward to find the next non-empty slot, which is O(levels) in the worst case. That is the accepted exception: it is rare, it is sequential and cache-friendly, and the alternative (a heap or tree of non-empty levels) makes the common path slower to speed up the rare one.",
  "level": "core", "skill": "trading.flat-order-book"},
 {"q": "How do you track your own queue position, and why does it matter?",
  "a": "Per price level the exchange holds a FIFO keyed on a monotonic sequence number, so your position is the total remaining size of orders that arrived before yours. In the arena that is handed to you: OrderAck carries queue_ahead and level_qty when your order rests, and QueueUpdate fires when something ahead of you fills or cancels. It matters because fill probability is a function of the size in front of you — and because repricing resets it to the back, so a quote adjustment has a real, measurable cost.",
  "level": "core", "skill": "trading.queue-position"},
 {"q": "Where would you still use std::map or a tree in a trading system?",
  "a": "Off the tick path, where ordered iteration or an unbounded key range is what you actually need: end-of-day reconciliation, a sparse book for an illiquid instrument whose prices span decades of ticks, a schedule of timers keyed by time, or anything whose size you cannot bound at startup. The rule I apply is that the hot path gets bounded, pre-sized, contiguous structures, and everything that is allowed to take a microsecond can use the container with the nicest semantics.",
  "level": "senior", "skill": "cpp.stl-containers"},
 {"q": "Your local book occasionally disagrees with the venue's. How do you find out why?",
  "a": "First decide whether you lost an update or misapplied one, because the fixes are different. Sequence numbers answer the first: track the next-expected value and treat a gap as loss, stop trading that symbol, and recover by re-requesting a snapshot rather than guessing. If there is no gap, the bug is in application, so I replay the recorded tape through the book with a shadow implementation — a simple, slow, obviously-correct map-based book — and diff the two after every message to find the first divergence. Silent staleness is the dangerous failure mode, so the book should refuse to trade rather than trade a state it cannot vouch for.",
  "level": "senior", "skill": "trading.feed-sequencing"}
]
})

# ===================== SESSION 7 =====================
S.append({
"n": 7,
"focus": "Algorithmic complexity & the cache",
"tagline": "Big-O tells you how cost grows and hides the constant — so count cache misses, and update instead of recomputing.",
"concepts": [
 {"title": "Big-O is asymptotic; the constant is your grade",
  "text": "O(1), O(log n) and O(n) describe growth as n goes to infinity and say nothing about the constant that dominates when n is small — and a hot book is small. At HFT scale the operation that costs is the cache miss at roughly 100 ns, not the arithmetic at roughly 1 ns, so the honest unit of complexity is memory accesses rather than instructions.",
  "deck": "Deck W8 · slide 5"},
 {"title": "Why a “slower” array beats a “faster” tree",
  "text": "Finding a value among 64 elements: a red-black tree is O(log n), about six pointer hops, each a likely cache miss — call it 600 ns. A linear scan of 64 contiguous elements is O(n) but touches roughly eight cache lines, is prefetched, and predicts perfectly — tens of nanoseconds. The log-n win never pays off at that size, and the crossover N is something you measure on your machine rather than assume.",
  "deck": "Deck W8 · slide 6"},
 {"title": "Amortized is not worst case",
  "text": "vector::push_back is O(1) amortized: most pushes are a store, and occasionally the vector reallocates and copies everything, O(n). Averaged over many operations that is constant; but p99.9 lives in the worst case, and one reallocation mid-race is the tail. reserve() up front converts a handful of O(n) spikes into zero.",
  "code": """std::vector<int> grow, pre; pre.reserve(1000);
auto count = [](std::vector<int>& v) {
  std::size_t n = 0, cap = v.capacity();
  for (int i = 0; i < 1000; ++i) { v.push_back(i);
    if (v.capacity() != cap) { ++n; cap = v.capacity(); } }
  return n;                                    // how many O(n) reallocations
};
std::cout << count(grow) << ' ' << count(pre) << '\\n';
// 11 0     -- eleven copy-everything events, or none""",
  "deck": "Deck W8 · slide 5"},
 {"title": "The ring buffer: fixed-capacity history",
  "text": "A market feed is an unbounded stream but you only need the recent past, so store it in a fixed-size circular array: allocated once, never grows, O(1) push that overwrites the oldest slot, and contiguous storage the cache likes. The ring *is* the rolling window — the only remaining question is how you compute over it as it slides.",
  "code": """template <class T, std::size_t N> struct Ring {
  std::array<T, N> buf{}; std::size_t head = 0, count = 0;
  void push(T x) { buf[head] = x; head = (head + 1) % N;    // O(1), no alloc
                   if (count < N) ++count; }
  T operator[](std::size_t i) const { return buf[(head - count + i + N) % N]; }
};
Ring<int, 4> r; for (int i = 1; i <= 6; ++i) r.push(i);     // 1 and 2 overwritten
std::cout << r.count << ' ' << r[0] << ' ' << r[3] << '\\n'; // 0 = oldest
// 4 3 6""",
  "deck": "Deck W8 · slide 9"},
 {"title": "Update, don't recompute",
  "text": "Looping the whole window every tick to get a mean or a standard deviation is O(k) work you repeat needlessly — and O(k) per tick across millions of ticks, spiking during the volatile moments, is a blown tail. An online algorithm folds each new observation into a few scalars in constant time: a running mean, Welford's numerically stable variance, and an EMA that needs no buffer at all.",
  "code": """struct Online {                                    // O(1) time, O(1) space
  long n = 0; double mean = 0, m2 = 0, ema = 0, a = 0.2;
  void update(double x) { ++n; double d = x - mean;
    mean += d / n;                                 // running mean
    m2   += d * (x - mean);                        // Welford's M2
    ema   = (n == 1) ? x : a * x + (1 - a) * ema; }
  double var() const { return n > 1 ? m2 / (n - 1) : 0.0; }
};
Online o; for (double x : {2., 4., 4., 4., 5., 5., 7., 9.}) o.update(x);
std::printf("%ld %.2f %.4f %.4f\\n", o.n, o.mean, o.var(), o.ema);
// 8 5.00 4.5714 5.2910""",
  "deck": "Deck W8 · slides 12–13"},
 {"title": "The optimisations that actually move p99.9",
  "text": "They are structural, not micro-tweaks to arithmetic: prefer flat arrays to node-based containers for hot, small collections; reserve and pool up front so nothing allocates mid-tick; do less work by updating incrementally, exiting early and hoisting invariants out of the loop; and profile to find the real hot path before touching anything. Then re-measure the tail, because that is the number you are optimising.",
  "deck": "Deck W8 · slide 7"}
],
"hft": {
 "text": "Why this matters in HFT",
 "paragraphs": [
  "on_book hands you microprice and obi already computed, which makes the trade-off explicit: signal inputs are free, but every microsecond you spend computing on them costs queue position. An incremental estimator costs the same tiny amount on every tick; a windowed recompute costs nothing most of the time and blows out exactly when volatility raises the message rate.",
  "So the shape of a hot-path signal is fixed: ring-buffer the recent tape (allocated once, overwritten in place), fold each tick into scalar online state, and act on the result. A z-score against an EMA and a Welford standard deviation is a few multiply-adds on cache-resident data — no window loop, no allocation, and a flat cost distribution.",
  "The complexity you should be counting is cache misses. An insert into a node-based map is O(log n) hops that each risk 100 ns; the same insert into a pre-sized flat array is one line. That is why session 6's book is flat and why this session insists you redo the complexity analysis of your own add/cancel/match in memory terms, not instruction counts.",
  "There is a deliberate bug on the week-8 slide worth internalising: keying per-symbol state on a std::string hashes the string and chases a node on every tick. The fix is session 6's SymMap — map the symbol to a small integer once, then index flat arrays. Strings on the hot path are a latency decision disguised as convenience.",
  "The starter's RollingCounter is where the theory gets sharp edges: count() takes an unsigned clock, so early on now_ns <= window_ns and the mathematical cutoff now - window is negative, with no uint64_t value that means that and nothing safe to clamp to. Only compute the subtraction when it is meaningful. Correctness under an edge case and O(1) amortized behaviour are both part of the grade."
 ],
 "example": {"title": "In the arena",
  "text": "course/hft-columbia/project-starter/include/rolling_counter.hpp — HW8's sliding-window counter, including the unsigned-clock edge case that costs most people a test.",
  "code": """// project-starter/include/rolling_counter.hpp
// HW8 - sliding-window event counter. count() is called with a
//       non-decreasing clock.
//
// Edge case (see labs/week08.md step 5): ts_ns and now_ns are UNSIGNED. Early
// on, now_ns <= window_ns and the mathematical cutoff (now - window) is
// negative - there is no uint64_t that means that, and no safe value to clamp
// to. Only compute the subtraction when it is meaningful.
struct RollingCounter {
    explicit RollingCounter(uint64_t window_ns);   // ring/deque; amortized O(1)
    void add(uint64_t ts_ns);
    uint64_t count(uint64_t now_ns);   // events with ts > now - window
};"""}
},
"interview": [
 {"q": "What does “amortized O(1)” mean for vector::push_back, and why might that not be good enough?",
  "a": "Most pushes are a single store; when capacity is exhausted the vector allocates a larger buffer and moves every element, which is O(n), and averaging that over the whole sequence gives constant cost per push. It is not good enough on a latency path because you are graded on the worst operation, not the average: that one reallocation is an allocation plus an O(n) copy landing on an arbitrary tick. reserve() the capacity up front and the spikes disappear.",
  "level": "warm-up", "skill": "perf.amortized-reserve"},
 {"q": "Give the recurrence for an exponential moving average and say why it is attractive on a hot path.",
  "a": "ema = alpha * x + (1 - alpha) * ema, with alpha in (0,1] setting how fast old observations decay. It is one multiply-add, it needs O(1) state and no history buffer at all, and there is no window boundary to handle. So the cost is identical on every tick — which is exactly the property a tail-sensitive path wants, unlike a windowed mean whose cost depends on the window.",
  "level": "warm-up", "skill": "perf.incremental-computation"},
 {"q": "A linear scan of a 64-element array beats a balanced tree lookup on the same data. Explain why, and say how you would find the crossover.",
  "a": "The tree is O(log n) — about six comparisons — but each step dereferences a separately allocated node, so it is six probable cache misses at ~100 ns, and the branch on each comparison is data-dependent and mispredicts. The array scan is O(n) in comparisons but touches only about eight 64-byte lines, the prefetcher streams ahead of it, and the loop branch predicts almost perfectly. To find the crossover I would measure both on the real element type across a range of n on the target machine and report percentiles — it is a hardware property, not a theorem.",
  "level": "core", "skill": "perf.complexity-in-cache-terms"},
 {"q": "Why is Welford's algorithm preferred over accumulating sum and sum-of-squares?",
  "a": "The naive formula computes variance as E[x²] - E[x]², and when the mean is large relative to the spread those two terms are nearly equal, so subtracting them cancels most of the significant digits — you can even get a negative variance. Welford updates the mean and a running M2 term using the deviation from the current mean, so no large-magnitude cancellation occurs. It is still a single pass, O(1) per observation and O(1) state.",
  "level": "core", "skill": "perf.incremental-computation"},
 {"q": "How would you maintain a rolling maximum over the last k ticks in better than O(k) per tick?",
  "a": "With a monotonic deque of indices: before pushing a new element, pop from the back every element smaller than it (they can never be the max again), then pop from the front anything that has fallen out of the window. The front is always the current maximum, and because each element is pushed and popped at most once the cost is amortized O(1) per tick. Rolling sum and mean are easier still — add the entering value and subtract the leaving one.",
  "level": "core", "skill": "perf.incremental-computation"},
 {"q": "A sliding-window counter is given an unsigned nanosecond clock and a window. Where is the bug most people write?",
  "a": "In computing the cutoff as now_ns - window_ns unconditionally. Both are unsigned, so while now_ns is still smaller than the window that subtraction wraps to an enormous value and the counter expires every event it holds — and there is no unsigned value that represents the negative cutoff, so clamping is not a fix either. The correct structure is to only compute and apply the cutoff when now_ns > window_ns, and expire nothing before that point.",
  "level": "core", "skill": "cpp.ring-buffer"},
 {"q": "Your per-tick signal is O(1) and the p50 is excellent, but p99.9 is ten times p50. Where do you look?",
  "a": "O(1) arithmetic cannot produce that spread, so the cost is not in the algorithm — it is something rare and expensive on the same path. The usual suspects, in order: an allocation or container growth I did not notice, a first-touch page fault on state that is only used occasionally, a std::string or map lookup keyed on a symbol, and the OS preempting the thread. I would reproduce it on a fixed recorded tape so it is deterministic, then use the profiler and fault/miss counters rather than reasoning, and accept the fix only if p99.9 moves on that same tape.",
  "level": "senior", "skill": "perf.tail-diagnosis"},
 {"q": "When is it worth giving up an O(1) incremental estimator for a windowed recompute?",
  "a": "When the incremental form is not numerically or semantically equivalent to what you actually want. An EMA never forgets an outlier completely, a running variance over the whole session is not the variance of the last 200 ticks, and an incremental median does not exist in constant state. If the strategy genuinely needs an exact windowed quantile, the honest answer is to compute it off the hot path on a second thread and let on_book read the last published value — you keep the tight tail and pay for the statistic in staleness rather than in latency.",
  "level": "senior", "skill": "trading.obi-signal"}
]
})

# ===================== SESSION 8 =====================
S.append({
"n": 8,
"focus": "Atomics & memory models",
"tagline": "Two threads, one address space: reason about what one thread's writes another can see — and keep locks off the path that decides your p99.9.",
"concepts": [
 {"title": "Threads share memory, and a data race is undefined behaviour",
  "text": "A std::thread is an independent instruction stream in the same address space — stacks are private, the heap and globals are shared — and the OS interleaves them arbitrarily, so never assume an ordering you did not enforce. When two threads touch the same location, at least one writes, and nothing synchronises them, that is a data race and the standard makes no guarantee at all: not “a stale value” but torn reads, lost updates, or the optimiser caching the variable in a register and deleting your check. ++counter is load, add, store — interleave two threads and the updates vanish silently.",
  "deck": "Deck W9 · slides 5–6"},
 {"title": "Happens-before is the only rule",
  "text": "Correctness is not about time, it is about the happens-before relation: if A happens-before B then B sees A's writes, and otherwise there is no guarantee whatsoever. Program order gives you sequenced-before within a thread; a release write synchronises-with an acquire read that observes it, across threads; and the relation is transitive, so you chain edges to prove visibility. Never reason “this runs first because it is faster.”",
  "deck": "Deck W9 · slide 7"},
 {"title": "std::atomic does two separate jobs",
  "text": "It gives you an indivisible operation (no torn or lost values) and a knob for ordering (what *other* memory becomes visible along with it) — do not conflate them. atomic<int> and atomic<T*> are lock-free on real hardware; a large T falls back to a lock, which is what is_lock_free() tells you. The default ordering is seq_cst: correct, strongest, priciest.",
  "code": """std::atomic<long> c{0};
auto work = [&] { for (int i = 0; i < 100000; ++i)
                    c.fetch_add(1, std::memory_order_relaxed); };  // atomic, unordered
std::thread t1(work), t2(work); t1.join(); t2.join();
std::cout << c.load() << ' ' << c.is_lock_free() << '\\n';
// 200000 1     -- exact, and no mutex was involved""",
  "deck": "Deck W9 · slide 9"},
 {"title": "The memory_order menu, and why reordering exists",
  "text": "Your source order is a suggestion: the compiler moves non-atomic loads and stores to go faster, and the CPU's store buffers and out-of-order execution commit writes in a different order than issued. Both preserve single-threaded results, so the illusion only breaks when another thread looks. memory_order is the contract that tells both layers which reorderings are forbidden — relaxed for a free-running counter, acquire/release to hand data over, seq_cst when you want one global order and will pay for it.",
  "deck": "Deck W9 · slides 10–11"},
 {"title": "Acquire/release: publishing data safely",
  "text": "This is the pattern under almost every lock-free handoff. Write the payload, then release-store a flag; the consumer acquire-loads the flag and then reads the payload. The release says “everything I did before this is now visible to whoever acquires it”, the acquire says “I see everything the releasing thread did before its store”, and together they build the happens-before edge by hand — no lock required.",
  "code": """int payload = 0; std::atomic<bool> ready{false};
std::thread prod([&] { payload = 42;                            // (1) write
  ready.store(true, std::memory_order_release); });             // (2) publish (1)
std::thread cons([&] {
  while (!ready.load(std::memory_order_acquire)) { }             // (3) acquire
  std::printf("%d\\n", payload); });                             // (4) sees 42
prod.join(); cons.join();
// 42""",
  "deck": "Deck W9 · slide 12"},
 {"title": "Why a mutex on the hot path is a tail bomb",
  "text": "Locks are the easy, correct way to get mutual exclusion, and std::lock_guard makes them RAII-safe — an uncontended lock is cheap. The failure chain is contention: on a busy tick two threads collide, a contended lock can block in the kernel on a futex (a context switch, hundreds of nanoseconds to microseconds), and a low-priority thread holding the lock can stall your hot thread until it is scheduled. Your p50 barely moves; your p99.9 detonates.",
  "deck": "Deck W9 · slides 14–15"}
],
"hft": {
 "text": "Why this matters in HFT",
 "paragraphs": [
  "You already have two threads whether you thought about it or not. IXWebSocket reads the socket and decodes JSON on its own background receive thread, then calls your handlers; your strategy logic runs inside on_book. The moment data crosses from the receiver into your strategy you are in the C++ memory model, and “it worked on my laptop” is not evidence of anything.",
  "The graded constraint for this week is blunt: no mutex on the on_book hot path. Not because locks are wrong, but because their cost is unbounded and scheduler-dependent — the opposite of the determinism the whole course is chasing. Contention and priority inversion show up as a fat p99.9 on exactly the volatile ticks that decide the race.",
  "What you do instead is publish. Write the book payload, then release-store a sequence number; the consumer acquire-loads the sequence, copies the payload, and re-reads the sequence to check it did not change mid-copy — if it did, retry. That gives you a correct, lock-free, single-writer handoff with no kernel involvement, and it is the direct ancestor of session 9's SPSC ring.",
  "Pick the weakest ordering you can *prove* correct, not the one that benchmarks fastest. relaxed is right for a free-running fill counter and catastrophically wrong for handing over data — and a missing barrier often “works” on x86, whose model is strong enough to hide the bug, then fails on ARM. Reason from the model; treat the run as a check, not a proof.",
  "Races are timing-dependent, so tests do not find them — tools do. Build a separate binary with -fsanitize=thread and run the replay through it; TSan names the two conflicting accesses and the missing synchronisation. It is 2–20x slower, so it is a CI gate, never something you ship."
 ],
 "example": {"title": "In the arena",
  "text": "hft/cpp_client/include/arena_client.hpp — the client's own cross-thread state: an atomic session gate the strategy reads on every tick, and a comment that tells you which thread you are on when your handler runs.",
  "code": """// hft/cpp_client/include/arena_client.hpp
//   Subclass it and override the on_* handlers (HFTBot does exactly this). All
//   handlers are invoked on IXWebSocket's receive thread; keep them fast and do
//   not block. The send helpers are thread-safe.
class ArenaClient {
public:
    bool session_open() const { return session_open_.load(); }
private:
    std::atomic<bool> session_open_{false};   // written by the receive thread
    std::atomic<bool> running_{false};        // read by run()/stop()

    std::mutex lat_mtx_;                      // latency stats: OFF the hot path
    long long  lat_count_ = 0, lat_sum_ = 0;
};"""}
},
"interview": [
 {"q": "Define a data race, and say what the standard promises when one occurs.",
  "a": "Two threads access the same memory location, at least one of them writes, and there is no happens-before relation ordering the two accesses. The standard promises nothing at all — it is undefined behaviour, so the legal outcomes include a torn value, a lost update, and the optimiser hoisting the variable into a register and deleting a check you wrote. It is not “you might read a stale value”.",
  "level": "warm-up", "skill": "cpp.data-races"},
 {"q": "Does making a variable volatile fix a data race?",
  "a": "No. volatile tells the compiler not to elide or cache accesses to that object — it was designed for memory-mapped hardware registers. It provides no atomicity, so a read-modify-write can still be lost, and it creates no happens-before edge, so it orders nothing with respect to other memory and does not constrain the CPU. The tool for cross-thread communication is std::atomic with an explicit memory_order.",
  "level": "warm-up", "skill": "cpp.atomics-memory-order"},
 {"q": "Explain the acquire/release pattern and what guarantee it buys.",
  "a": "The producer writes a plain payload and then performs a release store on an atomic flag; the consumer performs an acquire load of that flag and, if it observes the stored value, reads the payload. The release store synchronises-with the acquire load, which makes everything sequenced before the store happen-before everything sequenced after the load — so the payload write is guaranteed visible. It is cheaper than seq_cst because it only forbids the reorderings that would break that one handoff.",
  "level": "core", "skill": "cpp.atomics-memory-order"},
 {"q": "When is memory_order_relaxed appropriate, and when is it a bug?",
  "a": "It is appropriate when you need atomicity but no ordering of surrounding memory: a statistics or fill counter that several threads increment and someone reads later, where only the final total matters. It is a bug whenever the atomic is being used to signal that *other* memory is ready, because relaxed creates no happens-before edge and the consumer may see the flag set while the payload writes are still invisible. Rule of thumb: relaxed for data you read, acquire/release for data you publish.",
  "level": "core", "skill": "cpp.atomics-memory-order"},
 {"q": "Why does an uncontended mutex look cheap in a benchmark and still ruin a latency tail in production?",
  "a": "Uncontended, lock and unlock are an atomic exchange and a store — tens of nanoseconds, which is what the benchmark measures. Contended, the loser may block in the kernel on a futex, which means a context switch and a scheduler wake-up: hundreds of nanoseconds to microseconds, and unbounded if a lower-priority thread holds the lock and is not running. Contention correlates with market activity, so the expensive case lands exactly on the ticks you needed to win.",
  "level": "core", "skill": "perf.lock-tail-cost"},
 {"q": "x86 has a relatively strong memory model. Why not just rely on it?",
  "a": "Because it is strong, not sequentially consistent — StoreLoad reordering is permitted, so some missing-barrier bugs still manifest on x86, and the compiler's reordering of non-atomic accesses happens regardless of the hardware model. More practically, code that relies on the hardware will compile for ARM or POWER, whose models are far weaker, and fail there. Writing the ordering you actually need is also free where the hardware already provides it: the compiler emits no barrier instruction.",
  "level": "core", "skill": "cpp.atomics-memory-order"},
 {"q": "How do you find a data race that only appears under load in production?",
  "a": "Not by testing harder — by using a tool that reasons about happens-before rather than timing. I build a separate binary with -fsanitize=thread and drive it with a recorded tape, which makes TSan report the two conflicting accesses, their stacks and the missing synchronisation even if the bad interleaving never occurred. Because TSan is 2–20x slower it lives in CI on a debug build, never in the shipped binary, and clean TSan on the replay is a merge gate.",
  "level": "senior", "skill": "tools.thread-sanitizer"},
 {"q": "Design a single-writer, single-reader handoff of the latest book snapshot with no locks, and say how the reader detects a torn read.",
  "a": "Use a sequence counter alongside a plain payload: the writer increments the sequence with a release store after writing the payload, and the reader acquire-loads the sequence, copies the payload, then acquire-loads the sequence again and accepts the copy only if the two reads agree. A mismatch means the writer was mid-update, so the reader retries — it never blocks and the writer never waits. The stricter version is the seqlock, where the writer makes the sequence odd before writing and even after, so a reader can also reject while a write is in flight; the trade-off is that the reader can starve under a very hot writer, which is acceptable because staleness, not blocking, is the failure mode you want.",
  "level": "senior", "skill": "cpp.atomics-memory-order"}
]
})

# ===================== SESSION 9 =====================
S.append({
"n": 9,
"focus": "Lock-free pipelines",
"tagline": "Assemble atomics into a real structure: one writer, one reader, a bounded ring, and a tail that holds as the message rate climbs.",
"concepts": [
 {"title": "Compare-and-swap is the atom of lock-free",
  "text": "Every lock-free structure sits on one hardware primitive: an atomic read-modify-write that succeeds only if the value still equals what you expected. You read, compute your update, and retry in a loop if someone changed it underneath you — no thread ever blocks. On failure the expected variable is refreshed with the current value, which is what makes the retry loop work; compare_exchange_weak may fail spuriously and is the cheap choice inside a loop.",
  "code": """std::atomic<int> v{7}; int tries = 0;
int expected = v.load(), desired;
do { desired = expected * 2; ++tries; }        // your update
while (!v.compare_exchange_weak(expected, desired));   // swap only if unchanged
int stale = 99;                                // a CAS with a stale expected FAILS
bool ok = v.compare_exchange_strong(stale, 0); // ...and refreshes `stale`
std::cout << v.load() << ' ' << tries << ' ' << ok << ' ' << stale << '\\n';
// 14 1 0 14""",
  "deck": "Deck W10 · slide 5"},
 {"title": "ABA, and what “lock-free” actually promises",
  "text": "CAS compares a value, not a history: if another thread changes A to B and back to A, your CAS succeeds although the world moved — classically a recycled node in a lock-free stack or queue. The fixes are a version counter next to the value (tagged pointers), hazard pointers, or epoch-based reclamation; memory reclamation is the hard part of lock-free, not the algorithm. And the guarantees are a hierarchy: wait-free means every thread finishes in bounded steps, lock-free means at least one thread always progresses, obstruction-free means a thread run in isolation completes.",
  "deck": "Deck W10 · slide 6"},
 {"title": "The SPSC ring buffer",
  "text": "Single-producer/single-consumer is the sweet spot, because with exactly one writer per index you need no CAS at all — just an atomic head and tail with acquire/release. The producer writes the slot and then release-stores the incremented head; the consumer acquire-loads the head, reads the slot, and release-stores the tail. Power-of-two capacity turns the wrap into a bit mask, and the storage is allocated once.",
  "code": """template <class T, std::size_t N> class Spsc {      // N is a power of two
  std::array<T, N> buf_{};
  alignas(64) std::atomic<std::size_t> head_{0};    // producer owns it
  alignas(64) std::atomic<std::size_t> tail_{0};    // consumer owns it
 public:
  bool push(const T& v) {
    auto h = head_.load(std::memory_order_relaxed);
    if (h - tail_.load(std::memory_order_acquire) == N) return false;  // full
    buf_[h & (N - 1)] = v;                          // write the slot FIRST
    head_.store(h + 1, std::memory_order_release);  // then publish the index
    return true; }                                  // pop() mirrors it with tail_
};  // pushes 1..5 into Spsc<int,4>, then one pop:  1 1 1 1 0 1 192""",
  "deck": "Deck W10 · slides 8, 14"},
 {"title": "alignas(64) on head and tail is not decoration",
  "text": "The producer writes head on every push and the consumer writes tail on every pop. If those two indices share a cache line, the two cores invalidate each other's copy on every single operation and the line ping-pongs between them — false sharing, and the queue gets slower the harder you use it. Padding each index onto its own line is the difference between a pipeline and a bottleneck.",
  "deck": "Deck W10 · slide 14"},
 {"title": "Bounded is a feature: back-pressure",
  "text": "When head catches tail the buffer is full and push fails fast, which forces you to make a decision instead of blocking: drop the oldest, drop the newest, or coalesce stale book snapshots into the latest one. An unbounded queue hides a slow consumer until it converts a throughput problem into a memory-and-latency blowout. The related tail-killer is head-of-line blocking: one fat item delays every tick behind it, so keep messages small and fixed-size and do heavy work off the queue.",
  "deck": "Deck W10 · slide 9"},
 {"title": "The standard coordination primitives",
  "text": "C++20 ships what people used to hand-roll: std::latch is a one-shot gate you count down to zero, std::barrier is a reusable rendezvous for looping workers, and counting_semaphore bounds how many threads hold a resource. Separately, since C++17 the STL algorithms take an execution policy — seq, par, par_unseq — which moves a loop to many cores or to SIMD lanes, but the overhead only pays off on large n, so measure rather than assume.",
  "deck": "Deck W10 · slides 11–12"}
],
"hft": {
 "text": "Why this matters in HFT",
 "paragraphs": [
  "The producer and consumer already exist in your bot. IXWebSocket's background receive thread decodes each inbound frame; your strategy runs in on_book. Session 8 made a single-slot handoff correct; this session makes it a queue, so a burst of updates does not have to be consumed at exactly the rate it arrives — with no lock anywhere on the path.",
  "SPSC is chosen deliberately, not for simplicity. With one writer per index there is no contention on either index and therefore no CAS, so push and pop are a relaxed load, an acquire load, a store to the slot and a release store. MPSC needs CAS on the producer side, and you should pay for that only when you genuinely have several writers.",
  "Bounded capacity is what protects the tail under a storm. Some scenarios deliberately spike the message rate, and a fixed ring with a coalescing policy holds its percentiles as the rate climbs, while a lock or an unbounded queue converts the storm into head-of-line blocking and a p99.9 blowup. Note also that for book data, dropping is usually *better* than queueing: an old snapshot has no value once a newer one exists.",
  "This is also where the shared-memory version appears in the project. Phase 4's ShmRing is the same structure with one extra constraint — it lives entirely in a shared-memory region and must contain no pointers, so it is a POD of atomics plus a fixed array, initialised once by the creator before fork. That is the machinery session 13 uses to let two per-venue processes see one touch cache.",
  "And the correctness bar is tool-enforced, not argued: two threads, millions of items, assert nothing is lost or reordered, and the same test clean under ThreadSanitizer. std::barrier is the tidy way to line the threads up before the timed run so you are measuring the steady state rather than thread startup."
 ],
 "example": {"title": "In the arena",
  "text": "course/hft-columbia/project-starter/include/spsc_ring.hpp — HW10 and project Phase 3. The stub spells out the three requirements that make it correct and fast: power-of-two capacity, acquire/release on the indices, and alignas(64) to stop false sharing.",
  "code": """// project-starter/include/spsc_ring.hpp
// HW10 / Project Phase 3 - single-producer/single-consumer lock-free ring.
struct SPSCRing {
    explicit SPSCRing(std::size_t capacity_pow2) {
        // TODO(student): allocate a power-of-two buffer; atomic head/tail
        // (acquire/release); pad indices (alignas(64)) to avoid false sharing.
    }
    bool push(std::uint64_t v);      // false if full  -> back-pressure
    bool pop(std::uint64_t& out);    // false if empty
    bool empty() const;
    bool full()  const;
};"""}
},
"interview": [
 {"q": "What does compare_exchange do, and why is it always written in a loop?",
  "a": "It atomically compares the object with an expected value and, only if they are equal, replaces it with the desired value; it returns whether it succeeded and, on failure, updates expected with the value actually seen. It lives in a loop because failure means someone else modified the object, so you recompute your update from the refreshed value and try again. That retry-instead-of-block structure is what makes it lock-free.",
  "level": "warm-up", "skill": "cpp.compare-and-swap"},
 {"q": "What is the difference between compare_exchange_weak and compare_exchange_strong?",
  "a": "weak is allowed to fail spuriously — it can return false even when the value did match, typically because the underlying load-linked/store-conditional was interrupted. strong guarantees it only fails on a genuine mismatch, and on some architectures it implements that with its own internal loop. So you use weak inside a retry loop you were writing anyway, and strong for a single one-shot attempt whose result you want to branch on.",
  "level": "warm-up", "skill": "cpp.compare-and-swap"},
 {"q": "Why does a single-producer/single-consumer queue need no CAS?",
  "a": "Because each index has exactly one writer: the producer is the only thread that modifies head and the consumer the only one that modifies tail, so there is no read-modify-write contention to resolve. Each side does a plain load of its own index, an acquire load of the other side's index to check space or availability, the slot access, and a release store of its own index. All the synchronisation you need is the acquire/release pairing that orders the slot access against the index publication.",
  "level": "core", "skill": "perf.spsc-ring"},
 {"q": "In an SPSC ring's push, which memory orders go where, and why?",
  "a": "The producer loads its own head relaxed — nobody else writes it, so no ordering is needed. It acquire-loads tail, so that it observes the consumer's release store and therefore knows the slot it is about to overwrite has really been read. It writes the slot, then release-stores head + 1, so that the slot write cannot be reordered after the index publication — which is what guarantees the consumer never reads a slot before its data is visible. Getting the release on head wrong is the classic bug, and it usually still passes on x86.",
  "level": "core", "skill": "perf.spsc-ring"},
 {"q": "Why must the capacity be a power of two, and why are head and tail alignas(64)?",
  "a": "A power-of-two capacity lets the wrap be pos & (N - 1) instead of pos % N, replacing a division with a single-cycle AND on the hottest line of the queue. The alignment is about false sharing: the producer writes head on every push and the consumer writes tail on every pop, so if they share a 64-byte line the two cores invalidate each other's copy on every operation and the queue degrades the harder you drive it. Padding each index onto its own line removes the coherence traffic entirely.",
  "level": "core", "skill": "perf.false-sharing"},
 {"q": "The queue is full. What are your options, and which one fits market data?",
  "a": "Block the producer (never, on a receive thread), grow without bound (converts latency failure into a memory failure), drop the newest, drop the oldest, or coalesce. For top-of-book snapshots, coalescing is the right answer: a newer snapshot supersedes an older one, so overwriting the pending entry keeps you current and bounded at the same time. For fills or acks, which are not idempotent, you cannot drop — so those go on a separately sized queue, and a full one is an alertable incident rather than a policy decision.",
  "level": "core", "skill": "perf.back-pressure"},
 {"q": "What is the ABA problem, and does it affect an SPSC ring buffer?",
  "a": "ABA is when a CAS succeeds because the value it compares has returned to its original bit pattern even though the structure has changed underneath — classically a freed and recycled node in a lock-free stack, where the old head pointer looks valid but no longer means the same thing. It does not affect an SPSC ring, for two reasons: the ring does no CAS at all, and its indices are monotonically increasing counters rather than recycled pointers, so a stale index is detectably stale rather than accidentally equal. That is a strong argument for preferring index-based bounded structures over pointer-based unbounded ones: you avoid the entire memory-reclamation problem — hazard pointers, epochs, tagged pointers — which is where most real lock-free bugs live.",
  "level": "senior", "skill": "cpp.lock-free-guarantees"},
 {"q": "Is “lock-free” the same as “fast”? When would you deliberately choose a mutex?",
  "a": "No — lock-free is a progress guarantee, not a performance claim: it says no thread's stall can block the whole system, and under heavy contention a CAS retry loop can burn more cycles and cache traffic than a well-behaved lock. I would choose a mutex whenever the section is off the tick path, or when the critical section is long enough that spinning wastes a core, or when the structure needs multiple writers and correctness is easier to prove with exclusion. The rule I apply is that lock-free is for the single path whose tail I am graded on, and correct-and-simple wins everywhere else.",
  "level": "senior", "skill": "cpp.lock-free-guarantees"}
]
})
