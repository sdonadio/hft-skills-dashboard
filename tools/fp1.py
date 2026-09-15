# -*- coding: utf-8 -*-
# Sessions 1-4 of window.FOCUS

S = []

# ===================== SESSION 1 =====================
S.append({
"n": 1,
"focus": "Market microstructure & the limit order book",
"tagline": "Learn the game before you optimise it: two sorted sides, a FIFO queue at every price, and one number that grades you \u2014 p99.9 tick-to-trade.",
"concepts": [
 {"title": "The CLOB is two sorted sides",
  "text": "Every modern venue runs one matching engine over a central limit order book: resting buy orders on the bid side, resting sell orders on the ask side, each side sorted by price. The best bid and the best ask are \u201cthe touch\u201d, and a snapshot of that book is exactly what your on_book hook is handed every tick.",
  "deck": "Deck W1 \u00b7 slide 9"},
 {"title": "Mid, spread, microprice and OBI",
  "text": "Four numbers summarise a book and all four are one line of arithmetic. The mid is the average of the touch; the spread is what it costs to cross; the microprice weights each side's price by the *other* side's size, so it leans toward the side that is about to win; the order-book imbalance is a signed number in [-1, +1] that is positive when the bids are heavy.",
  "code": """double bp = 100.00, ba = 100.02; int bq = 800, aq = 200;
double mid = (bp + ba) / 2, spread = ba - bp;
double micro = (ba * bq + bp * aq) / (bq + aq);
double obi   = double(bq - aq) / (bq + aq);
std::printf("%.4f %.4f %.4f %+.2f\\n", mid, spread, micro, obi);
// 100.0100 0.0200 100.0160 +0.60""",
  "deck": "Deck W1 \u00b7 slide 9"},
 {"title": "Price first, then time",
  "text": "A more aggressive price always executes ahead of a worse one; at the same price, the order that arrived earlier fills first \u2014 a strict FIFO queue per level. That second rule is why speed is money: sitting near the front of the queue means you fill before the price moves, and a cancel-and-repost throws all of that time priority away and restarts you at the tail.",
  "deck": "Deck W1 \u00b7 slide 10"},
 {"title": "A trade prints at the RESTING order's price",
  "text": "A limit order joins the queue and waits; a market order crosses immediately and never rests. When they meet, the trade executes at the price of the order that was already in the book, so an aggressive order that sweeps two levels gets a blended average price, not its own limit.",
  "code": """struct Lvl { double px; int qty; };
Lvl asks[] = {{100.02, 200}, {100.03, 900}};   // the resting side
int want = 300; double cost = 0;               // incoming BUY 300 @ 100.03
for (auto& l : asks) {
  int take = std::min(want, l.qty);
  cost += take * l.px;                         // trade at the RESTING price
  want -= take; if (!want) break;
}
std::printf("filled=%d avg=%.4f left=%d\\n", 300 - want, cost / 300, want);
// filled=300 avg=100.0233 left=0""",
  "deck": "Deck W1 \u00b7 slide 11"},
 {"title": "Maker/taker: who pays and who gets paid",
  "text": "Under a maker/taker schedule the aggressive side pays a fee and the passive side often earns a rebate, both as a fraction of notional. The arena prints its schedule on connect (taker 30 bps, maker rebate 5 bps in the week-1 lab), and the sign of that number is a real part of a market maker's P&L, not an accounting detail.",
  "code": """double px = 182.50; int qty = 200;
double notional = px * qty;
double taker = 0.0030 * notional, maker = 0.0005 * notional;
std::printf("%.2f -%.2f +%.2f\\n", notional, taker, maker);
// 36500.00 -109.50 +18.25   -- cross and you pay; rest and you are paid""",
  "deck": "Deck W1 \u00b7 slide 11"},
 {"title": "Tick-to-trade, and why the grade is p99.9",
  "text": "Tick-to-trade is the time from market data hitting your socket to your order leaving it: parse, decide, serialise, send. We report p50, p99 and p99.9 and grade the last one, because the races that matter are the volatile ticks when everybody fires at once \u2014 exactly when a bad tail shows up. A 40 \u00b5s mean with a 5 ms p99.9 is a losing bot.",
  "deck": "Deck W1 \u00b7 slide 12"}
],
"hft": {
 "text": "Why this matters in HFT",
 "paragraphs": [
  "Everything in the next twelve sessions shortens one path. A book_snapshot lands on your socket; you decode it, decide, serialise an order and put it on the wire. That is tick-to-trade, and the arena client stamps it for you: arena_client.cpp records the instant a snapshot is decoded, and hft_bot.hpp times every order you send from inside on_book against that stamp.",
  "The book is not a loose abstraction here \u2014 it is a data structure with a layout. Prices live on a discrete tick grid, which is why from session 6 onward you hold your local book as a flat array of one-cent slots indexed by arithmetic (slot = tick - base_tick) instead of a tree you have to search. The microstructure fact (ticks are discrete) is what licenses the performance decision (index, don't chase).",
  "Queue position is the alpha that latency actually buys. The engine keys each price level on a monotonic sequence number, so your standing is a real quantity you can read: OrderAck and QueueUpdate carry queue_ahead and level_qty, and queue_ahead == 0 means you are at the front and about to fill. Repricing costs you that spot, which is why sessions 6 and 13 spend time on when *not* to requote.",
  "We grade the tail, not the mean, and you can measure it before you ever go live. scripts/latency_replay.py feeds a recorded tape into your bot over stdin and scripts/latency_report.py turns the stamps into p50 / p99 / p99.9 plus a tail histogram \u2014 the same instrument that ranks you on the dashboard's LATENCY tab.",
  "Some of the last microseconds are bought rather than coded. The exchange adds an outbound delay per team, and colocation in the shop moves you to a cheaper tier. That is the arena's model of the real arms race: rack space, then kernel bypass, then FPGAs \u2014 each rung a smaller slice of latency at a steeper price."
 ],
 "example": {"title": "In the arena",
  "text": "hft/cpp_client/src/main.cpp \u2014 the SpreadCaptureBot that ships working: this on_book body is the edge you replace, and orders sent from here are the ones that get latency-stamped.",
  "code": """// hft/cpp_client/src/main.cpp
void on_book(const std::string& symbol, double bid, double ask, double mid,
             double microprice, double obi) override {
  if (bid <= 0.0 || ask <= 0.0) return;          // need a two-sided book
  const double spread   = ask - bid;
  const double last_mid = last_mid_.count(symbol) ? last_mid_[symbol] : mid;
  last_mid_[symbol]     = mid;
  if (spread < kEdge) return;                    // too tight to bother
  if (mid > last_mid && pos < kMaxPos)       buy_limit (symbol, kClip, ask);
  else if (mid < last_mid && pos > -kMaxPos) sell_limit(symbol, kClip, bid);
}"""}
},
"interview": [
 {"q": "What is the difference between a limit order and a market order?",
  "a": "A limit order carries a price and rests in the book until it is filled or cancelled \u2014 it joins the FIFO queue at that price and provides liquidity. A market order carries no price: it crosses immediately against the best available resting orders and never rests, so any unfilled remainder is cancelled rather than queued. The limit order is the maker's tool, the market order is the taker's.",
  "level": "warm-up", "skill": "trading.lob"},
 {"q": "A book shows 100.00 \u00d7 800 on the bid and 100.02 \u00d7 200 on the ask. Give the mid, the spread, the microprice and the order-book imbalance.",
  "a": "Mid = (100.00 + 100.02)/2 = 100.01 and spread = 0.02. The microprice weights each price by the opposite side's size: (100.02\u00b7800 + 100.00\u00b7200)/1000 = 100.016, i.e. pulled up toward the ask because the bid is heavy. OBI = (800 - 200)/(800 + 200) = +0.60, positive meaning bid-heavy.",
  "level": "warm-up", "skill": "trading.lob"},
 {"q": "Two orders rest at the same price. What decides which fills first, and what happens to your priority if you move your price?",
  "a": "At equal price it is strict time priority: the order that arrived earlier fills first, and real engines key the queue on a monotonic sequence number rather than a wall-clock timestamp so ties cannot happen. Moving your price is a cancel plus a new order, so you lose all accumulated time priority and join at the back of the queue at the new level. That is why a good maker only requotes when the expected edge exceeds the queue position it is giving up.",
  "level": "core", "skill": "trading.price-time-priority"},
 {"q": "At what price does a trade execute when an aggressive order crosses the book?",
  "a": "At the resting order's price, not the incoming order's limit. A buy limit at 100.03 hitting an ask of 100.02 trades at 100.02, and if it sweeps several levels each slice prints at that level's price, giving a blended average. This is also why a taker's realised cost is the average fill price plus fees, not the touch it saw when it decided.",
  "level": "core", "skill": "trading.lob"},
 {"q": "You are quoting two sides and your bids fill almost instantly, every time. Why might that be bad news?",
  "a": "Instant fills usually mean you are being adversely selected: someone with fresher information is hitting a quote you have not updated yet, so your fastest fills are systematically your worst. The diagnostic is a markout \u2014 compare the mid a second after each fill against your fill price; persistently negative markouts mean you are being picked off. The responses are to widen, skew away from the toxic side, or requote faster.",
  "level": "core", "skill": "trading.adverse-selection"},
 {"q": "Why does the industry quote latency as p99.9 rather than as a mean?",
  "a": "Latency distributions are heavy-tailed and often bimodal: a tight fast body plus rare catastrophic stalls from allocation, page faults or preemption. The mean lands in the valley between the two and describes no tick anyone actually experienced. The races that decide P&L are the busy ticks when everyone fires at once, which is exactly when the tail fires, so the tail percentile is the number that predicts whether you win.",
  "level": "core", "skill": "trading.tick-to-trade"},
 {"q": "Under a maker/taker schedule, when is it rational to cross the spread and pay the taker fee instead of posting passively?",
  "a": "When the expected adverse move over your expected queue wait exceeds the round-trip cost of crossing, which is the spread you give up plus the taker fee plus the forgone maker rebate. A stale quote you can pick off, or a signal with a short half-life, is worth taking immediately; a slow mean-reversion view is worth posting. Concretely, if a fill is worth 3 bps of edge and taker-minus-rebate costs 3.5 bps, posting is the only profitable way to express it.",
  "level": "senior", "skill": "trading.fees-maker-taker"},
 {"q": "Your bot reports a 40 \u00b5s mean and a 5 ms p99.9. Where do you look first, and what do you measure?",
  "a": "A three-orders-of-magnitude gap is a stall, not slow arithmetic, so I look for things that are usually free and occasionally enormous: a heap allocation on the hot path, a first-touch page fault, a contended lock, or the scheduler preempting the hot thread. First I reproduce it deterministically on a recorded tape so network noise cannot hide it, then I profile that run and check hardware counters and fault counts rather than guessing. The fix is judged only by whether p99.9 moves on the same tape.",
  "level": "senior", "skill": "perf.tail-diagnosis"}
]
})

# ===================== SESSION 2 =====================
S.append({
"n": 2,
"focus": "Pointers & memory",
"tagline": "Addresses, arithmetic and layout \u2014 the vocabulary every other week builds on, and the first place microseconds hide.",
"concepts": [
 {"title": "A pointer is an address",
  "text": "A pointer is a number that says where a value lives \u2014 eight bytes on x86-64 and on Apple silicon, whatever it points at. The & operator makes one, * follows it, and writing through a pointer writes the original object. nullptr means \u201cnowhere\u201d, and dereferencing it is undefined behaviour rather than a crash you can rely on.",
  "code": """int x = 42;
int* p = &x;                   // & : address-of
std::cout << *p << ' ';        // * : dereference
*p = 7;                        // write THROUGH p
std::cout << x << ' ' << sizeof(x) << ' ' << sizeof(p) << '\\n';
// 42 7 4 8""",
  "deck": "Deck W2 \u00b7 slide 7"},
 {"title": "Pointer or reference? Ask whether \u201cabsent\u201d is legal",
  "text": "A reference is an alias bound at birth: it can never be rebound, and assigning to it writes the object it names. A pointer is a value you can reseat and set to null, and it supports arithmetic. The rule of thumb is const& by default, and a pointer when \u201cmaybe nothing\u201d is a legal answer \u2014 neither of them owns anything, which is session 3's job.",
  "code": """int a = 1, b = 2;
int& r = a;        // alias, bound at birth
int* q = &a;       // a value you can reseat
r = 9;             // writes through the alias  -> a == 9
q = &b;            // reseats the pointer; a untouched
std::cout << a << ' ' << *q << ' ' << (q == &a) << '\\n';
// 9 2 0""",
  "deck": "Deck W2 \u00b7 slide 8"},
 {"title": "p + 1 moves one ELEMENT, not one byte",
  "text": "Pointer arithmetic counts elements and the pointed-to type is the scale, so an int* steps four bytes and a char* steps one. p[i] is literally *(p + i), and subtracting two pointers gives a count of elements as a ptrdiff_t \u2014 which is exactly how iterators work.",
  "code": """int a[5] = {10,20,30,40,50};
int* p = a;                                 // array DECAYS to &a[0]
char* c = reinterpret_cast<char*>(a);
std::cout << *(p + 2) << ' ' << p[2] << ' ';
std::cout << (reinterpret_cast<char*>(p + 1) - c) << ' ';
std::cout << ((c + 1) - c) << ' ' << ((a + 5) - a) << '\\n';
// 30 30 4 1 5""",
  "deck": "Deck W2 \u00b7 slides 9\u201310"},
 {"title": "One past the end, and the array that forgot its length",
  "text": "You may form and compare a pointer one past the end of an array, but never dereference it; computing anything beyond that is undefined behaviour, not wrap-around, and the optimiser is allowed to assume it cannot happen. And when an array is passed to a function it decays to a bare pointer \u2014 the length is gone, so sizeof no longer tells you anything about it.",
  "code": """int v[4] = {0,1,2,3};
int* e = v + 4;                                 // one-past-the-end: legal to FORM
std::cout << (e - v) << ' ';
std::cout << sizeof(v) / sizeof(v[0]) << ' ';   // the array: the real length
std::cout << sizeof(int*) / sizeof(int) << '\\n';// after decay: the classic bug
// 4 4 2""",
  "deck": "Deck W2 \u00b7 slide 10"},
 {"title": "Layout is a latency decision: AoS vs SoA",
  "text": "The CPU is fast and memory is far: an L1 hit is about a nanosecond and a miss to RAM is about a hundred. Memory also moves in 64-byte lines, so scanning one hot field out of a fat struct drags cold bytes along for the ride. Packing the hot fields into their own contiguous array (struct of arrays) turns the same scan into a fraction of the cache lines.",
  "code": """struct Quote { double px; int qty; char tag[40]; };   // AoS
std::cout << sizeof(Quote) << ' ' << 64 / sizeof(double) << ' ';
std::cout << (1024 * sizeof(Quote) + 63) / 64 << ' ';   // lines to scan 1024 prices
std::cout << (1024 * sizeof(double) + 63) / 64 << '\\n'; // the same scan, SoA
// 56 8 896 128     -- 7x fewer cache lines, identical arithmetic""",
  "deck": "Deck W2 \u00b7 slides 15\u201318"},
 {"title": "The 64-byte cache line and false sharing",
  "text": "Because the line is the unit of transfer, two variables written by two different threads that happen to share one line make the cores invalidate each other's copy and ping-pong it between them. The symptom is a threaded version that is slower than the single-threaded one, the cause is invisible in the source, and the fix is alignas(64) so each hot variable owns its line.",
  "code": """struct Bad  { std::atomic<long> a, b; };
struct Good { alignas(64) std::atomic<long> a; alignas(64) std::atomic<long> b; };
std::cout << sizeof(Bad) << ' ' << sizeof(Good) << ' ';
std::cout << (offsetof(Bad, b) / 64 == 0 ? "same line" : "own line") << '\\n';
// 16 128 same line     -- Bad shares one line; Good pays 112B to stop it""",
  "deck": "Deck W2 \u00b7 slides 21\u201322"}
],
"hft": {
 "text": "Why this matters in HFT",
 "paragraphs": [
  "Microseconds do not hide in your algebra, they hide in memory access. On the tick-to-trade path the arithmetic of a signal costs a nanosecond or two; one cache miss to DRAM costs about a hundred, and one page fault costs microseconds. That is why session 2 is about addresses and layout rather than about clever code: the decisions that move your p99.9 are where the bytes are, not how many instructions you executed.",
  "Pointer arithmetic is the whole reason a flat order book is fast. Prices sit on a tick grid, so a level is a slot: slot = (px - base) / tick, and the level you want is one indexed load rather than six pointer hops through a red-black tree. p + 1 moving one element is not trivia \u2014 it is the operation the book performs on every add, cancel and match, and it is what lets the hardware prefetcher run ahead of your match loop.",
  "Layout buys you cache lines, and cache lines are your budget. A 32-byte order struct means two orders per line; a 56-byte one means one order and eight wasted bytes. Reordering members widest-first and splitting the fields on_book actually reads from the cold bookkeeping is a free, measurable win \u2014 and static_assert on sizeof is how you stop a future std::string member from silently undoing it.",
  "False sharing is not hypothetical in this client. The transport runs its own receive thread and your strategy runs in on_book, so any counter or flag the two of them write will share a line unless you say otherwise. From session 9 onward your SPSC ring's head and tail indices are alignas(64) for exactly this reason.",
  "None of this counts until you measure it honestly: a release build, a warm-up, a sink the optimiser cannot delete, and a sorted sample reported as p50 / p99 / p99.9 rather than a mean. This week you establish the baseline p99.9 that every later week is judged against \u2014 run scripts/latency_replay.py against a recorded tape and write the number down."
 ],
 "example": {"title": "In the arena",
  "text": "hft/cpp_client/include/hft_bot.hpp \u2014 the client remembers the address of the tick's arrival stamp for the duration of your on_book call, then times every order you send against it. This is the clock your layout decisions move.",
  "code": """// hft/cpp_client/include/hft_bot.hpp
void on_book_snapshot(const BookView& bv, time_point recv_time) override {
  tick_recv_    = recv_time;        // stamped when the frame was decoded
  tick_symbol_  = bv.symbol;
  in_book_call_ = true;
  if (session_open())
    on_book(bv.symbol, bv.best_bid, bv.best_ask, bv.mid, bv.microprice, bv.obi);
  in_book_call_ = false;
}
template <typename SendFn> void stamp_and_send(SendFn&& send) {
  if (in_book_call_) { send();
    const auto micros = std::chrono::duration_cast<std::chrono::microseconds>(
                            clock::now() - tick_recv_).count();
    record_latency(tick_symbol_, static_cast<long long>(micros)); } else send();
}"""}
},
"interview": [
 {"q": "What does p + 1 do for an int* on x86-64, and what does it do for a char*?",
  "a": "Pointer arithmetic is in units of the pointed-to type, so int* advances by sizeof(int) = 4 bytes and char* advances by 1. The same rule makes p[i] exactly *(p + i), and makes end - begin a count of elements (a ptrdiff_t), not a count of bytes. If you genuinely mean bytes, cast to char* (or std::byte*) first and say so.",
  "level": "warm-up", "skill": "cpp.pointers"},
 {"q": "When would you take a parameter as const T& rather than by value?",
  "a": "When T is expensive to copy and the function only needs to read it: const& passes eight bytes, copies nothing, cannot be null and cannot modify the caller's object. For small trivially copyable types \u2014 an int, a double, a 16-byte POD \u2014 by value is as cheap or cheaper and avoids an indirection, so returning a double by const& is strictly worse. Use a pointer instead of a reference only when \u201cabsent\u201d is a legal argument.",
  "level": "warm-up", "skill": "cpp.pointers-vs-references"},
 {"q": "Inside void f(int* arr), why is sizeof(arr) / sizeof(arr[0]) not the array length?",
  "a": "Because the array decayed to a pointer at the call, so sizeof(arr) is sizeof(int*) = 8 and sizeof(arr[0]) is 4 \u2014 the expression is always 2 on this ABI, whatever was passed. The length information exists only where the array itself is in scope. The fix is to pass the length alongside the pointer, or to take a std::span / std::array reference so the size travels with the data.",
  "level": "core", "skill": "cpp.pointers"},
 {"q": "Is it legal to form a pointer one past the end of an array? Is it legal to dereference it?",
  "a": "Forming and comparing a one-past-the-end pointer is legal and is what makes the it != end() loop idiom well defined. Dereferencing it is undefined behaviour, and so is even computing an address two or more past the end. This matters practically because the optimiser assumes UB cannot occur, so an out-of-range index does not wrap \u2014 it licenses the compiler to delete your bounds check.",
  "level": "core", "skill": "cpp.pointers"},
 {"q": "A scan over std::vector<Quote> is several times slower than the same scan over a std::vector<double> of just the prices, with identical arithmetic. Explain.",
  "a": "Memory moves in 64-byte lines, so the cost of a scan is the number of lines touched, not the number of adds. With a 56-byte Quote you pull 56 bytes to use 8, so 1024 prices cost about 896 lines; with a packed array of doubles you get 8 useful prices per line and the same scan costs 128. Splitting hot fields into their own contiguous array (SoA) also gives the hardware prefetcher a regular stride to run ahead on.",
  "level": "core", "skill": "perf.data-layout"},
 {"q": "What is false sharing, how would you recognise it, and how do you fix it?",
  "a": "Two threads writing *different* variables that happen to occupy the same 64-byte cache line: each write invalidates the other core's copy, so the line ping-pongs over the coherence protocol. The signature is a multithreaded version that is slower than single-threaded, with high cache-coherence traffic and no logical contention in the source. The fix is to give each hot variable its own line with alignas(64) \u2014 or to stop sharing and keep per-thread state.",
  "level": "core", "skill": "perf.false-sharing"},
 {"q": "A colleague's micro-benchmark reports that a function takes 0 ns. What went wrong, and how would you fix the measurement?",
  "a": "The result was unused, so dead-code elimination deleted the work \u2014 you timed nothing. Consume the result with a sink the compiler cannot see through (an empty asm volatile with a \"memory\" clobber, or a benchmark library's DoNotOptimize). While you are there, fix the other three classic errors: measure a release build, warm up so caches and the branch predictor are primed, and report a sorted sample as p50 / p99 / p99.9 with the machine stated instead of a single mean.",
  "level": "senior", "skill": "tools.benchmarking"},
 {"q": "You need a function that receives a 4096-element price grid, and the caller may legitimately have no grid at all. What signature do you choose and why?",
  "a": "I would take const std::span<const double> (or a pointer plus a length, pre-C++20) and treat an empty span as \u201cno grid\u201d, because the size then travels with the data and there is no decay bug to make. If \u201cabsent\u201d must be distinguishable from \u201cpresent but empty\u201d, a const double* plus a length says \u201cthis may be null\u201d at the call site in a way a reference cannot. What I would not do is pass it by value \u2014 that is 32 KB of copying for a read-only scan.",
  "level": "senior", "skill": "cpp.pointers-vs-references"}
]
})

# ===================== SESSION 3 =====================
S.append({
"n": 3,
"focus": "Object-oriented C++: classes, RAII & smart pointers",
"tagline": "Who owns this object, and when does it die? Make the answer a compile-time contract instead of a comment.",
"concepts": [
 {"title": "A class is data plus the functions that keep it valid",
  "text": "struct and class are the same feature and differ only in default access: public is the interface, private protects the invariant. The constructor's job is to hand back an object that is already valid — initialise in the member-initialiser list, because the body can only assign afterwards — and if an Order with qty == 0 cannot be constructed, nothing downstream has to check for one.",
  "deck": "Deck W3 · slides 9–10, 15"},
 {"title": "Destructors run by themselves, in reverse order",
  "text": "~T() runs at scope exit, on delete, and while a throw unwinds the stack — you never call it. Objects are destroyed last-built-first, so a later object may safely depend on an earlier one. If the object owns something, the destructor is where it gives it back; nothing else belongs there, and it must never throw.",
  "code": """struct Tagged {
  const char* n;
  explicit Tagged(const char* s) : n(s) { std::printf("+%s ", n); }  // ACQUIRE
  ~Tagged()                              { std::printf("-%s ", n); } // RELEASE
};
int main(){
  { Tagged a("a"); Tagged b("b"); }      // you never call ~Tagged
  std::puts("");
}
// +a +b -b -a""",
  "deck": "Deck W3 · slide 11"},
 {"title": "RAII: acquire in the constructor, release in the destructor",
  "text": "Tie a resource's lifetime to an object's scope and the compiler guarantees the cleanup, on every exit path including an exception. That is the whole idea behind lock_guard, unique_ptr, a file handle wrapper and a timer that reports its own elapsed time — deterministic cleanup at the closing brace, with no garbage collector and no forgotten free.",
  "deck": "Deck W3 · slide 19"},
 {"title": "Rule of zero, rule of five",
  "text": "Five special members travel together: destructor, copy constructor, copy assignment, move constructor, move assignment. Declaring one changes what the compiler gives you for the others — a lone destructor silently kills the implicit moves, so your vector starts deep-copying. Own nothing raw and write none of them (rule of zero); own a raw resource and write all five, or = delete the copies outright.",
  "code": """std::vector<double> a(4, 1.0);
std::vector<double> b = a;              // COPY: a second buffer
std::vector<double> c = std::move(a);   // MOVE: steal the pointer, blank a
std::printf("%zu %zu %zu\\n", a.size(), b.size(), c.size());
// 0 4 4     -- a is a valid-but-empty husk: destroy it, don't read it""",
  "deck": "Deck W3 · slides 12–14, 25"},
 {"title": "unique_ptr by default, shared_ptr only when you mean it",
  "text": "unique_ptr is sole ownership, move-only, and the same size and speed as a raw pointer — reach for it first. shared_ptr is reference-counted shared ownership, and the refcount is atomic: every copy and destroy is a synchronising read-modify-write that bounces a cache line between cores. weak_ptr observes without owning and is how you break a cycle.",
  "code": """auto u = std::make_unique<int>(7);        // sole owner, move-only
auto s = std::make_shared<int>(7);        // refcounted, ATOMIC inc/dec
{ auto s2 = s; std::cout << s.use_count() << ' '; }
std::cout << s.use_count() << ' ' << sizeof(u) << ' ' << sizeof(s) << '\\n';
// 2 1 8 16     -- unique_ptr is a pointer; shared_ptr is two""",
  "deck": "Deck W3 · slides 21–23"},
 {"title": "sizeof, padding and member order",
  "text": "Every member is placed on a multiple of its own alignment, so declaration order decides how much padding you pay for. Declaring the same five fields widest-first collapses the holes from 40 bytes to 32 — which is two orders per 64-byte cache line instead of one. static_assert the size so that adding a std::string member breaks the build instead of your tail.",
  "code": """struct Naive { char side; uint64_t id; double px; uint32_t qty; char sym[8]; };
struct Order { uint64_t id; double px; char sym[8]; uint32_t qty; char side; };
static_assert(sizeof(Order) == 32, "layout drift");
std::cout << sizeof(Naive) << ' ' << sizeof(Order) << ' ' << alignof(Order) << '\\n';
// 40 32 8     -- same five fields, 20% smaller""",
  "deck": "Deck W3 · slide 17"}
],
"hft": {
 "text": "Why this matters in HFT",
 "paragraphs": [
  "There is no garbage collector to blame, so ownership is a latency property, not just a correctness one. A leak grows your working set until you fault; a dangling pointer corrupts whatever moved in; a double free scrambles the allocator's bookkeeping and crashes somewhere else entirely. RAII removes all four by construction, which is why the discipline arrives before the performance work rather than after it.",
  "The rule for the hot path is blunt: on_book must not allocate. No new, no make_shared, no growing a vector, no string concatenation. The general allocator may take a lock, walk a free list, split a block or call the kernel for a fresh page, and the same call that costs 20 ns on a quiet tick costs 20 µs on a busy one. That variance *is* your p99.9, and the busy tick is precisely the one you needed to win.",
  "Own state off the path and borrow it on the path. Build the book cache, the pools and the buffers at startup with unique_ptr or plain members, then pass non-owning references into on_book. Specifically avoid shared_ptr there: its atomic refcount is a hidden cross-core cost on every copy, and it is one of the few overheads you can see in the tail histogram after you remove it.",
  "Hot-path message and order types should be flat value structs — trivially copyable, nothing to steal, nothing to free. That is what lets you memcpy them into a ring buffer in session 9 and reinterpret them off the wire in session 10, and static_assert(std::is_trivially_copyable_v<Order>) is the guard that keeps them that way.",
  "This week is also where the tools come in. A planted leak or use-after-free is found with ASan/LSan on a debug build, not by staring; a shared_ptr-versus-unique_ptr copy benchmark makes the atomic cost a number rather than an opinion. Then you re-run the replay harness and show a tighter p99.9 than your session-2 baseline."
 ],
 "example": {"title": "In the arena",
  "text": "hft/cpp_client/include/arena_client.hpp — the transport layer owns its book cache behind a mutex, and every handler runs on IXWebSocket's receive thread. That is correct plumbing, and it is exactly the shape (node-based map, lock, shared state) you must not copy into your own on_book.",
  "code": """// hft/cpp_client/include/arena_client.hpp
//   All handlers are invoked on IXWebSocket's receive thread; keep them fast
//   and do not block. The send helpers are thread-safe.
private:
    ClientConfig      cfg_;
    ix::WebSocket     ws_;
    std::atomic<bool> session_open_{false};
    std::atomic<bool> running_{false};

    mutable std::mutex              book_mtx_;
    std::map<std::string, BookView> books_;   // owned once, not per tick"""}
},
"interview": [
 {"q": "What is RAII, and name two things in the standard library that are examples of it.",
  "a": "RAII means a resource is acquired in a constructor and released in the matching destructor, so its lifetime is tied to a scope and the compiler guarantees the release on every exit path — including during exception unwinding. std::lock_guard (acquires a mutex, unlocks in its destructor) and std::unique_ptr (owns heap memory, deletes it in its destructor) are the canonical examples; std::fstream and std::vector are two more.",
  "level": "warm-up", "skill": "cpp.raii"},
 {"q": "What is the difference between unique_ptr and shared_ptr, and which is your default?",
  "a": "unique_ptr expresses sole ownership: it is move-only, occupies exactly one pointer, and deleting it destroys the object — zero overhead versus a raw pointer. shared_ptr is reference-counted shared ownership with a separate control block, and the count is atomic so every copy and destruction is a synchronising operation. unique_ptr is the default; shared_ptr is only correct when the lifetime is genuinely shared and nobody can say who outlives whom.",
  "level": "warm-up", "skill": "cpp.smart-pointers"},
 {"q": "A class owns a raw new[] buffer and declares only a destructor. What has the compiler silently done to you?",
  "a": "Declaring a destructor suppresses the implicit move constructor and move assignment, so every “move” of the type falls back to the copy operations — and the implicit copies are member-by-member, meaning they copy the pointer, not the buffer. The result is two destructors freeing one allocation: a double free. Either write all five special members (with a self-assignment guard) or hold the buffer in a vector/unique_ptr and write none of them.",
  "level": "core", "skill": "cpp.rule-of-five"},
 {"q": "Why does std::vector only move its elements during reallocation if the move constructor is noexcept?",
  "a": "Reallocation must be all-or-nothing: if a move threw halfway through, the old buffer has already been pillaged and the vector could not restore its previous state. So vector checks std::is_nothrow_move_constructible and falls back to copying when the move might throw, because a copy leaves the source intact and is therefore recoverable. Practically: mark your move constructor and move assignment noexcept or your “movable” type quietly deep-copies on every growth.",
  "level": "core", "skill": "cpp.move-semantics"},
 {"q": "What does std::move actually do?",
  "a": "Nothing at run time — it is a cast that produces an rvalue reference, which changes overload resolution so a move constructor or move assignment is selected instead of the copy. The moving is done by that constructor, which typically steals a pointer and blanks the source. After a move the source is valid but unspecified: you may destroy it or assign to it, but you must not read its value.",
  "level": "core", "skill": "cpp.move-semantics"},
 {"q": "Why would you avoid shared_ptr on a microsecond-scale hot path?",
  "a": "The reference count is atomic, so each copy or destruction is a read-modify-write that must be coherent across cores; under sharing that bounces the control block's cache line between them, and the cost is variable rather than fixed. It also adds an extra indirection and, with shared_ptr(new T), a second allocation. On the hot path I own with unique_ptr off the path and pass a plain reference in — the reference cannot be null and costs nothing.",
  "level": "core", "skill": "cpp.smart-pointers"},
 {"q": "Why is a class with virtual functions but a non-virtual destructor a bug, and what exactly goes wrong?",
  "a": "Deleting a derived object through a base pointer with a non-virtual destructor is undefined behaviour: in practice only the base destructor runs, so any derived member is never destroyed and whatever it owned leaks. It will usually appear to work, which is worse than crashing. The rule is that any class with a virtual function gets a virtual destructor — or you never delete through the base at all.",
  "level": "senior", "skill": "cpp.classes-invariants"},
 {"q": "How would you design an order type so a heap touch on the hot path becomes impossible rather than merely discouraged?",
  "a": "Make it a flat value struct — fixed-size char arrays and scalars, no std::string, no owning pointer — and enforce it with static_assert(std::is_trivially_copyable_v<Order>) plus a static_assert on sizeof so a future member cannot drift the layout. Then hand them out from a pre-sized pool and give the pool's type deleted copy operations so nobody can accidentally duplicate it. The invariant is now checked by the build rather than by code review.",
  "level": "senior", "skill": "perf.object-layout"}
]
})

# ===================== SESSION 4 =====================
S.append({
"n": 4,
"focus": "Custom allocators & memory pools",
"tagline": "“Don't allocate” is not enough — sooner or later you need a fresh object per tick, so make the allocation itself O(1) and deterministic.",
"concepts": [
 {"title": "What new and malloc really cost",
  "text": "The default allocator is a general-purpose, thread-safe service, and every one of those properties is wrong for a microsecond path. It guards its free lists with a lock, it calls brk or mmap into the kernel when it runs out, variable-size requests fragment it over a session, and so the same call is 20 ns on one tick and 20 µs on the next. That variance is the whole problem.",
  "deck": "Deck W4 · slide 5"},
 {"title": "What the hot path actually needs",
  "text": "Flip every property of the general-purpose allocator and you get the specification: no locks, because there is one pool per thread; no syscalls, because the memory is reserved before the session opens; O(1) always, because allocation is a pointer bump or a free-list pop with no search and no coalescing; and bounded, because you sized it at startup for the worst tick. Same cost every time is what collapses the tail toward the median.",
  "deck": "Deck W4 \u00b7 slide 6"},
 {"title": "The fixed-size object pool",
  "text": "Give up flexibility and buy determinism: one block size, one pre-owned slab, and a free list threaded through the unused slots so the free slots *are* the list and cost no extra memory. Allocation pops the head, deallocation pushes it back, both O(1) with no search and no coalescing — and because slots get reused in cycles they stay hot in L1.",
  "code": """struct Node { Node* next; };
Node slab[3];                                  // ONE pre-owned block
Node* free_ = nullptr;
for (auto& s : slab) { s.next = free_; free_ = &s; }   // thread the free-list
Node* a = free_; free_ = a->next;              // alloc: O(1) pop
Node* b = free_; free_ = b->next;              // alloc: O(1) pop
b->next = free_; free_ = b;                    // free:  O(1) push
std::cout << (a != b) << ' ' << (free_ == b) << '\\n';
// 1 1""",
  "deck": "Deck W4 · slides 8, 10"},
 {"title": "Placement new and explicit destruction",
  "text": "C++ separates “get raw bytes” from “construct an object”. new (ptr) T{...} runs a constructor in memory you already own and allocates nothing; the price is that nobody will run the destructor for you, so you call p->~T() yourself before you hand the slot back. This is the mechanism every pool is built on — and alignment is your responsibility.",
  "code": """struct Order {
  double px; int qty;
  Order(double p, int q) : px(p), qty(q) { std::printf("ctor "); }
  ~Order()                               { std::printf("dtor "); }
};
alignas(Order) char buf[sizeof(Order)];        // memory you already own
Order* o = new (buf) Order(101.5, 200);        // placement new: construct only
std::printf("%.1f %d ", o->px, o->qty);
o->~Order();                                   // YOU destroy it
std::puts("");
// ctor 101.5 200 dtor""",
  "deck": "Deck W4 · slide 9"},
 {"title": "The arena / bump allocator: per-tick scratch",
  "text": "When a group of objects shares a lifetime, stop freeing them one at a time. Keep a single offset into a slab, return it and advance by the aligned size, and reclaim everything at once with one reset. You cannot free an individual object — which is exactly right for a tick's working set: allocate freely inside the tick, reset at the end, no leaks and no fragmentation.",
  "deck": "Deck W4 · slide 9"},
 {"title": "std::pmr: the standard version of all this",
  "text": "C++17 standardises the pattern. A memory_resource is an abstract source of bytes; monotonic_buffer_resource is a bump allocator over a buffer you supply; unsynchronized_pool_resource is a lock-free pooled resource; and a polymorphic_allocator lets std::pmr::vector and friends take a resource pointer at construction. Same container type, your memory underneath.",
  "code": """std::byte buf[1024];                                   // stack scratch slab
std::pmr::monotonic_buffer_resource rsrc{buf, sizeof buf};
std::pmr::vector<int> v{&rsrc};                        // std container, YOUR memory
v.reserve(8); v.push_back(1); v.push_back(2);
auto* d = reinterpret_cast<const std::byte*>(v.data());
std::cout << v.size() << ' ' << (d >= buf && d < buf + sizeof buf) << '\\n';
rsrc.release();                                        // O(1) reset, per tick
// 2 1     -- the vector's storage really is inside buf; the heap is untouched""",
  "deck": "Deck W4 · slides 12–13"}
],
"hft": {
 "text": "Why this matters in HFT",
 "paragraphs": [
  "Session 3 gave you the rule — do not allocate on the hot path — and this session gives you the machinery to obey it at full speed. The targets are concrete: anywhere on_book or on_fill creates an order, a message or a book node is a hidden new. Pre-size a pool per struct type at startup, put the per-tick working set on a monotonic buffer, and the p99.9 in the harness histogram drops against your session-2 baseline. That drop is the entire point.",
  "The properties you are buying are the mirror image of malloc's: no lock because the pool is per-thread, no syscall because the memory is reserved before SESSION_OPEN, O(1) because allocation is a pointer bump or a free-list pop, and bounded because you sized the slab for the worst tick. Same cost every time means the tail collapses toward the median.",
  "Two operational details bite people. First, a pool is big — ObjectPool<Order, 4096> is on the order of 128 KB, so it must be a member or a static, never a local, or you blow a worker thread's stack. Second, every alloc needs its free: forget it and the pool is silently exhausted at tick 4096, alloc() starts returning null, and your bot goes quiet without crashing. Log exhaustion loudly.",
  "Ordering matters with a bump allocator. The pmr container that borrowed from the arena must be destroyed *before* you call release(), which in practice means putting the scratch container in an inner scope and resetting after it dies. Getting that backwards is a use-after-reset that no test will reliably catch.",
  "Determinism, not throughput, is the deliverable. Benchmark pool alloc/free against new/delete in a tight loop and report both the median and the tail: the median improves a little, and the tail improves a lot. The tail is the number the LATENCY tab ranks you on."
 ],
 "example": {"title": "In the arena",
  "text": "course/hft-columbia/project-starter/include/pool.hpp — the HW4 stub you fill in. The whole contract is in the comments: one pre-allocated buffer, a free list, and O(1) in both directions.",
  "code": """// project-starter/include/pool.hpp
// HW4 - a high-performance fixed-size object pool
//       (O(1) alloc/free, placement new).
struct Pool {
    Pool(std::size_t obj_size, std::size_t capacity) {
        // TODO(student): back this with ONE pre-allocated buffer + a free-list.
    }
    void* alloc() { return nullptr;   // TODO: pop a free slot, O(1)
    }
    void  free(void* p) {             // TODO: return the slot, O(1)
    }
};"""}
},
"interview": [
 {"q": "Why is the general-purpose allocator a problem on a low-latency path?",
  "a": "Because its cost is unbounded and unpredictable rather than merely large. It may take a lock on a shared free list, search or split blocks, coalesce on free, or fall through to brk/mmap and a page fault in the kernel. The median call is fast, which is why the mean looks fine, but the occasional slow call lands on a busy tick and becomes your p99.9.",
  "level": "warm-up", "skill": "perf.heap-nondeterminism"},
 {"q": "Sketch a fixed-size object pool and state the complexity of alloc and free.",
  "a": "One contiguous slab of N slots, each slot big enough and aligned for T, plus a head pointer to a singly linked free list threaded through the *unused* slots — so the list costs no extra memory. alloc pops the head and returns it; free pushes the slot back on the head. Both are O(1) with no search, and reusing slots in cycles keeps them cache-warm.",
  "level": "warm-up", "skill": "perf.object-pool"},
 {"q": "What does placement new do, and what obligation does it create?",
  "a": "new (ptr) T{args...} constructs a T in storage you already own: it runs the constructor and allocates nothing. The obligation is symmetry — no operator delete will ever be called for it, so you must invoke p->~T() explicitly before reusing or releasing the storage. You are also responsible for the storage being correctly sized and aligned for T, which is why pool slots are declared with alignas(T).",
  "level": "core", "skill": "cpp.placement-new"},
 {"q": "When is a bump (arena) allocator the right choice, and what does it give up?",
  "a": "When a group of objects shares a lifetime — classically everything a single tick needs. You keep one offset into a slab, return it and advance by the size rounded up to alignof(T), and reclaim everything with a single reset in O(1). What you give up is individual deallocation: you cannot free one object, so it is wrong for anything whose lifetime outlives the batch.",
  "level": "core", "skill": "perf.arena-allocator"},
 {"q": "What does std::pmr add over writing your own allocator, and which resource fits a per-tick scratch buffer?",
  "a": "pmr makes the allocator a run-time value instead of part of the container's type, so std::pmr::vector<T> is one type whose memory comes from whatever memory_resource you hand it — no template plumbing through your call graph. For per-tick scratch the fit is monotonic_buffer_resource over a stack or member byte array: pure bump allocation with no heap traffic, then release() to reclaim the whole thing at tick end. For recycled fixed-size objects, unsynchronized_pool_resource.",
  "level": "core", "skill": "cpp.pmr"},
 {"q": "Your pool's alloc() starts returning nullptr an hour into the session and the bot silently stops trading. What happened?",
  "a": "A leak in pool terms: some path allocated a slot and never returned it, so after N ticks the free list is empty. It is not a crash and ASan cannot see it, because the memory is still validly owned by the pool. The fixes are structural — hand slots out through an RAII handle so the return happens in a destructor on every exit path, and instrument the pool so exhaustion is a loud, counted event rather than a quiet null.",
  "level": "senior", "skill": "perf.object-pool"},
 {"q": "Your pool hands out raw storage. How do you keep construction and destruction honest?",
  "a": "Pair placement new with an explicit destructor call, and hide the pair behind an RAII handle so neither can be forgotten. alloc() returns raw bytes, the handle's constructor runs new (slot) T{args...}, and the handle's destructor calls p->~T() and pushes the slot back on the free list \u2014 so every exit path, including an exception, returns the slot exactly once. Without that, the two failure modes are a slot returned without its destructor running (a leak of whatever T owned) and a destructor run twice on a recycled slot.",
  "level": "core", "skill": "cpp.placement-new"},
 {"q": "You put a pmr::vector on a monotonic_buffer_resource inside on_book and call release() at the end. Where is the trap?",
  "a": "Lifetime order. release() reclaims the whole slab, so the container that borrowed from it must be destroyed *before* the reset — otherwise its destructor touches memory the resource has already handed back, and a later tick will overwrite live data. The idiom is to scope the scratch container in an inner block and call release() after that block closes. A second trap is overflow: if the working set exceeds the buffer, monotonic_buffer_resource quietly falls back to the upstream heap resource, so you are allocating again without noticing.",
  "level": "senior", "skill": "perf.arena-allocator"}
]
})
