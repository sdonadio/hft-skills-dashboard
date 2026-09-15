window.FOCUS = {
  "sessions": [
    {
      "n": 1,
      "focus": "Market microstructure & the limit order book",
      "tagline": "Learn the game before you optimise it: two sorted sides, a FIFO queue at every price, and one number that grades you — p99.9 tick-to-trade.",
      "concepts": [
        {
          "title": "The CLOB is two sorted sides",
          "text": "Every modern venue runs one matching engine over a central limit order book: resting buy orders on the bid side, resting sell orders on the ask side, each side sorted by price. The best bid and the best ask are “the touch”, and a snapshot of that book is exactly what your on_book hook is handed every tick.",
          "deck": "Deck W1 · slide 9"
        },
        {
          "title": "Mid, spread, microprice and OBI",
          "text": "Four numbers summarise a book and all four are one line of arithmetic. The mid is the average of the touch; the spread is what it costs to cross; the microprice weights each side's price by the *other* side's size, so it leans toward the side that is about to win; the order-book imbalance is a signed number in [-1, +1] that is positive when the bids are heavy.",
          "code": "double bp = 100.00, ba = 100.02; int bq = 800, aq = 200;\ndouble mid = (bp + ba) / 2, spread = ba - bp;\ndouble micro = (ba * bq + bp * aq) / (bq + aq);\ndouble obi   = double(bq - aq) / (bq + aq);\nstd::printf(\"%.4f %.4f %.4f %+.2f\\n\", mid, spread, micro, obi);\n// 100.0100 0.0200 100.0160 +0.60",
          "deck": "Deck W1 · slide 9"
        },
        {
          "title": "Price first, then time",
          "text": "A more aggressive price always executes ahead of a worse one; at the same price, the order that arrived earlier fills first — a strict FIFO queue per level. That second rule is why speed is money: sitting near the front of the queue means you fill before the price moves, and a cancel-and-repost throws all of that time priority away and restarts you at the tail.",
          "deck": "Deck W1 · slide 10"
        },
        {
          "title": "A trade prints at the RESTING order's price",
          "text": "A limit order joins the queue and waits; a market order crosses immediately and never rests. When they meet, the trade executes at the price of the order that was already in the book, so an aggressive order that sweeps two levels gets a blended average price, not its own limit.",
          "code": "struct Lvl { double px; int qty; };\nLvl asks[] = {{100.02, 200}, {100.03, 900}};   // the resting side\nint want = 300; double cost = 0;               // incoming BUY 300 @ 100.03\nfor (auto& l : asks) {\n  int take = std::min(want, l.qty);\n  cost += take * l.px;                         // trade at the RESTING price\n  want -= take; if (!want) break;\n}\nstd::printf(\"filled=%d avg=%.4f left=%d\\n\", 300 - want, cost / 300, want);\n// filled=300 avg=100.0233 left=0",
          "deck": "Deck W1 · slide 11"
        },
        {
          "title": "Maker/taker: who pays and who gets paid",
          "text": "Under a maker/taker schedule the aggressive side pays a fee and the passive side often earns a rebate, both as a fraction of notional. The arena prints its schedule on connect (taker 30 bps, maker rebate 5 bps in the week-1 lab), and the sign of that number is a real part of a market maker's P&L, not an accounting detail.",
          "code": "double px = 182.50; int qty = 200;\ndouble notional = px * qty;\ndouble taker = 0.0030 * notional, maker = 0.0005 * notional;\nstd::printf(\"%.2f -%.2f +%.2f\\n\", notional, taker, maker);\n// 36500.00 -109.50 +18.25   -- cross and you pay; rest and you are paid",
          "deck": "Deck W1 · slide 11"
        },
        {
          "title": "Tick-to-trade, and why the grade is p99.9",
          "text": "Tick-to-trade is the time from market data hitting your socket to your order leaving it: parse, decide, serialise, send. We report p50, p99 and p99.9 and grade the last one, because the races that matter are the volatile ticks when everybody fires at once — exactly when a bad tail shows up. A 40 µs mean with a 5 ms p99.9 is a losing bot.",
          "deck": "Deck W1 · slide 12"
        }
      ],
      "hft": {
        "text": "Why this matters in HFT",
        "paragraphs": [
          "Everything in the next twelve sessions shortens one path. A book_snapshot lands on your socket; you decode it, decide, serialise an order and put it on the wire. That is tick-to-trade, and the arena client stamps it for you: arena_client.cpp records the instant a snapshot is decoded, and hft_bot.hpp times every order you send from inside on_book against that stamp.",
          "The book is not a loose abstraction here — it is a data structure with a layout. Prices live on a discrete tick grid, which is why from session 6 onward you hold your local book as a flat array of one-cent slots indexed by arithmetic (slot = tick - base_tick) instead of a tree you have to search. The microstructure fact (ticks are discrete) is what licenses the performance decision (index, don't chase).",
          "Queue position is the alpha that latency actually buys. The engine keys each price level on a monotonic sequence number, so your standing is a real quantity you can read: OrderAck and QueueUpdate carry queue_ahead and level_qty, and queue_ahead == 0 means you are at the front and about to fill. Repricing costs you that spot, which is why sessions 6 and 13 spend time on when *not* to requote.",
          "We grade the tail, not the mean, and you can measure it before you ever go live. scripts/latency_replay.py feeds a recorded tape into your bot over stdin and scripts/latency_report.py turns the stamps into p50 / p99 / p99.9 plus a tail histogram — the same instrument that ranks you on the dashboard's LATENCY tab.",
          "Some of the last microseconds are bought rather than coded. The exchange adds an outbound delay per team, and colocation in the shop moves you to a cheaper tier. That is the arena's model of the real arms race: rack space, then kernel bypass, then FPGAs — each rung a smaller slice of latency at a steeper price."
        ],
        "example": {
          "title": "In the arena",
          "text": "hft/cpp_client/src/main.cpp — the SpreadCaptureBot that ships working: this on_book body is the edge you replace, and orders sent from here are the ones that get latency-stamped.",
          "code": "// hft/cpp_client/src/main.cpp\nvoid on_book(const std::string& symbol, double bid, double ask, double mid,\n             double microprice, double obi) override {\n  if (bid <= 0.0 || ask <= 0.0) return;          // need a two-sided book\n  const double spread   = ask - bid;\n  const double last_mid = last_mid_.count(symbol) ? last_mid_[symbol] : mid;\n  last_mid_[symbol]     = mid;\n  if (spread < kEdge) return;                    // too tight to bother\n  if (mid > last_mid && pos < kMaxPos)       buy_limit (symbol, kClip, ask);\n  else if (mid < last_mid && pos > -kMaxPos) sell_limit(symbol, kClip, bid);\n}"
        }
      },
      "interview": [
        {
          "q": "What is the difference between a limit order and a market order?",
          "a": "A limit order carries a price and rests in the book until it is filled or cancelled — it joins the FIFO queue at that price and provides liquidity. A market order carries no price: it crosses immediately against the best available resting orders and never rests, so any unfilled remainder is cancelled rather than queued. The limit order is the maker's tool, the market order is the taker's.",
          "level": "warm-up",
          "skill": "trading.lob"
        },
        {
          "q": "A book shows 100.00 × 800 on the bid and 100.02 × 200 on the ask. Give the mid, the spread, the microprice and the order-book imbalance.",
          "a": "Mid = (100.00 + 100.02)/2 = 100.01 and spread = 0.02. The microprice weights each price by the opposite side's size: (100.02·800 + 100.00·200)/1000 = 100.016, i.e. pulled up toward the ask because the bid is heavy. OBI = (800 - 200)/(800 + 200) = +0.60, positive meaning bid-heavy.",
          "level": "warm-up",
          "skill": "trading.lob"
        },
        {
          "q": "Two orders rest at the same price. What decides which fills first, and what happens to your priority if you move your price?",
          "a": "At equal price it is strict time priority: the order that arrived earlier fills first, and real engines key the queue on a monotonic sequence number rather than a wall-clock timestamp so ties cannot happen. Moving your price is a cancel plus a new order, so you lose all accumulated time priority and join at the back of the queue at the new level. That is why a good maker only requotes when the expected edge exceeds the queue position it is giving up.",
          "level": "core",
          "skill": "trading.price-time-priority"
        },
        {
          "q": "At what price does a trade execute when an aggressive order crosses the book?",
          "a": "At the resting order's price, not the incoming order's limit. A buy limit at 100.03 hitting an ask of 100.02 trades at 100.02, and if it sweeps several levels each slice prints at that level's price, giving a blended average. This is also why a taker's realised cost is the average fill price plus fees, not the touch it saw when it decided.",
          "level": "core",
          "skill": "trading.lob"
        },
        {
          "q": "You are quoting two sides and your bids fill almost instantly, every time. Why might that be bad news?",
          "a": "Instant fills usually mean you are being adversely selected: someone with fresher information is hitting a quote you have not updated yet, so your fastest fills are systematically your worst. The diagnostic is a markout — compare the mid a second after each fill against your fill price; persistently negative markouts mean you are being picked off. The responses are to widen, skew away from the toxic side, or requote faster.",
          "level": "core",
          "skill": "trading.adverse-selection"
        },
        {
          "q": "Why does the industry quote latency as p99.9 rather than as a mean?",
          "a": "Latency distributions are heavy-tailed and often bimodal: a tight fast body plus rare catastrophic stalls from allocation, page faults or preemption. The mean lands in the valley between the two and describes no tick anyone actually experienced. The races that decide P&L are the busy ticks when everyone fires at once, which is exactly when the tail fires, so the tail percentile is the number that predicts whether you win.",
          "level": "core",
          "skill": "trading.tick-to-trade"
        },
        {
          "q": "Under a maker/taker schedule, when is it rational to cross the spread and pay the taker fee instead of posting passively?",
          "a": "When the expected adverse move over your expected queue wait exceeds the round-trip cost of crossing, which is the spread you give up plus the taker fee plus the forgone maker rebate. A stale quote you can pick off, or a signal with a short half-life, is worth taking immediately; a slow mean-reversion view is worth posting. Concretely, if a fill is worth 3 bps of edge and taker-minus-rebate costs 3.5 bps, posting is the only profitable way to express it.",
          "level": "senior",
          "skill": "trading.fees-maker-taker"
        },
        {
          "q": "Your bot reports a 40 µs mean and a 5 ms p99.9. Where do you look first, and what do you measure?",
          "a": "A three-orders-of-magnitude gap is a stall, not slow arithmetic, so I look for things that are usually free and occasionally enormous: a heap allocation on the hot path, a first-touch page fault, a contended lock, or the scheduler preempting the hot thread. First I reproduce it deterministically on a recorded tape so network noise cannot hide it, then I profile that run and check hardware counters and fault counts rather than guessing. The fix is judged only by whether p99.9 moves on the same tape.",
          "level": "senior",
          "skill": "perf.tail-diagnosis"
        }
      ]
    },
    {
      "n": 2,
      "focus": "Pointers & memory",
      "tagline": "Addresses, arithmetic and layout — the vocabulary every other week builds on, and the first place microseconds hide.",
      "concepts": [
        {
          "title": "A pointer is an address",
          "text": "A pointer is a number that says where a value lives — eight bytes on x86-64 and on Apple silicon, whatever it points at. The & operator makes one, * follows it, and writing through a pointer writes the original object. nullptr means “nowhere”, and dereferencing it is undefined behaviour rather than a crash you can rely on.",
          "code": "int x = 42;\nint* p = &x;                   // & : address-of\nstd::cout << *p << ' ';        // * : dereference\n*p = 7;                        // write THROUGH p\nstd::cout << x << ' ' << sizeof(x) << ' ' << sizeof(p) << '\\n';\n// 42 7 4 8",
          "deck": "Deck W2 · slide 7"
        },
        {
          "title": "Pointer or reference? Ask whether “absent” is legal",
          "text": "A reference is an alias bound at birth: it can never be rebound, and assigning to it writes the object it names. A pointer is a value you can reseat and set to null, and it supports arithmetic. The rule of thumb is const& by default, and a pointer when “maybe nothing” is a legal answer — neither of them owns anything, which is session 3's job.",
          "code": "int a = 1, b = 2;\nint& r = a;        // alias, bound at birth\nint* q = &a;       // a value you can reseat\nr = 9;             // writes through the alias  -> a == 9\nq = &b;            // reseats the pointer; a untouched\nstd::cout << a << ' ' << *q << ' ' << (q == &a) << '\\n';\n// 9 2 0",
          "deck": "Deck W2 · slide 8"
        },
        {
          "title": "p + 1 moves one ELEMENT, not one byte",
          "text": "Pointer arithmetic counts elements and the pointed-to type is the scale, so an int* steps four bytes and a char* steps one. p[i] is literally *(p + i), and subtracting two pointers gives a count of elements as a ptrdiff_t — which is exactly how iterators work.",
          "code": "int a[5] = {10,20,30,40,50};\nint* p = a;                                 // array DECAYS to &a[0]\nchar* c = reinterpret_cast<char*>(a);\nstd::cout << *(p + 2) << ' ' << p[2] << ' ';\nstd::cout << (reinterpret_cast<char*>(p + 1) - c) << ' ';\nstd::cout << ((c + 1) - c) << ' ' << ((a + 5) - a) << '\\n';\n// 30 30 4 1 5",
          "deck": "Deck W2 · slides 9–10"
        },
        {
          "title": "One past the end, and the array that forgot its length",
          "text": "You may form and compare a pointer one past the end of an array, but never dereference it; computing anything beyond that is undefined behaviour, not wrap-around, and the optimiser is allowed to assume it cannot happen. And when an array is passed to a function it decays to a bare pointer — the length is gone, so sizeof no longer tells you anything about it.",
          "code": "int v[4] = {0,1,2,3};\nint* e = v + 4;                                 // one-past-the-end: legal to FORM\nstd::cout << (e - v) << ' ';\nstd::cout << sizeof(v) / sizeof(v[0]) << ' ';   // the array: the real length\nstd::cout << sizeof(int*) / sizeof(int) << '\\n';// after decay: the classic bug\n// 4 4 2",
          "deck": "Deck W2 · slide 10"
        },
        {
          "title": "Layout is a latency decision: AoS vs SoA",
          "text": "The CPU is fast and memory is far: an L1 hit is about a nanosecond and a miss to RAM is about a hundred. Memory also moves in 64-byte lines, so scanning one hot field out of a fat struct drags cold bytes along for the ride. Packing the hot fields into their own contiguous array (struct of arrays) turns the same scan into a fraction of the cache lines.",
          "code": "struct Quote { double px; int qty; char tag[40]; };   // AoS\nstd::cout << sizeof(Quote) << ' ' << 64 / sizeof(double) << ' ';\nstd::cout << (1024 * sizeof(Quote) + 63) / 64 << ' ';   // lines to scan 1024 prices\nstd::cout << (1024 * sizeof(double) + 63) / 64 << '\\n'; // the same scan, SoA\n// 56 8 896 128     -- 7x fewer cache lines, identical arithmetic",
          "deck": "Deck W2 · slides 15–18"
        },
        {
          "title": "The 64-byte cache line and false sharing",
          "text": "Because the line is the unit of transfer, two variables written by two different threads that happen to share one line make the cores invalidate each other's copy and ping-pong it between them. The symptom is a threaded version that is slower than the single-threaded one, the cause is invisible in the source, and the fix is alignas(64) so each hot variable owns its line.",
          "code": "struct Bad  { std::atomic<long> a, b; };\nstruct Good { alignas(64) std::atomic<long> a; alignas(64) std::atomic<long> b; };\nstd::cout << sizeof(Bad) << ' ' << sizeof(Good) << ' ';\nstd::cout << (offsetof(Bad, b) / 64 == 0 ? \"same line\" : \"own line\") << '\\n';\n// 16 128 same line     -- Bad shares one line; Good pays 112B to stop it",
          "deck": "Deck W2 · slides 21–22"
        }
      ],
      "hft": {
        "text": "Why this matters in HFT",
        "paragraphs": [
          "Microseconds do not hide in your algebra, they hide in memory access. On the tick-to-trade path the arithmetic of a signal costs a nanosecond or two; one cache miss to DRAM costs about a hundred, and one page fault costs microseconds. That is why session 2 is about addresses and layout rather than about clever code: the decisions that move your p99.9 are where the bytes are, not how many instructions you executed.",
          "Pointer arithmetic is the whole reason a flat order book is fast. Prices sit on a tick grid, so a level is a slot: slot = (px - base) / tick, and the level you want is one indexed load rather than six pointer hops through a red-black tree. p + 1 moving one element is not trivia — it is the operation the book performs on every add, cancel and match, and it is what lets the hardware prefetcher run ahead of your match loop.",
          "Layout buys you cache lines, and cache lines are your budget. A 32-byte order struct means two orders per line; a 56-byte one means one order and eight wasted bytes. Reordering members widest-first and splitting the fields on_book actually reads from the cold bookkeeping is a free, measurable win — and static_assert on sizeof is how you stop a future std::string member from silently undoing it.",
          "False sharing is not hypothetical in this client. The transport runs its own receive thread and your strategy runs in on_book, so any counter or flag the two of them write will share a line unless you say otherwise. From session 9 onward your SPSC ring's head and tail indices are alignas(64) for exactly this reason.",
          "None of this counts until you measure it honestly: a release build, a warm-up, a sink the optimiser cannot delete, and a sorted sample reported as p50 / p99 / p99.9 rather than a mean. This week you establish the baseline p99.9 that every later week is judged against — run scripts/latency_replay.py against a recorded tape and write the number down."
        ],
        "example": {
          "title": "In the arena",
          "text": "hft/cpp_client/include/hft_bot.hpp — the client remembers the address of the tick's arrival stamp for the duration of your on_book call, then times every order you send against it. This is the clock your layout decisions move.",
          "code": "// hft/cpp_client/include/hft_bot.hpp\nvoid on_book_snapshot(const BookView& bv, time_point recv_time) override {\n  tick_recv_    = recv_time;        // stamped when the frame was decoded\n  tick_symbol_  = bv.symbol;\n  in_book_call_ = true;\n  if (session_open())\n    on_book(bv.symbol, bv.best_bid, bv.best_ask, bv.mid, bv.microprice, bv.obi);\n  in_book_call_ = false;\n}\ntemplate <typename SendFn> void stamp_and_send(SendFn&& send) {\n  if (in_book_call_) { send();\n    const auto micros = std::chrono::duration_cast<std::chrono::microseconds>(\n                            clock::now() - tick_recv_).count();\n    record_latency(tick_symbol_, static_cast<long long>(micros)); } else send();\n}"
        }
      },
      "interview": [
        {
          "q": "What does p + 1 do for an int* on x86-64, and what does it do for a char*?",
          "a": "Pointer arithmetic is in units of the pointed-to type, so int* advances by sizeof(int) = 4 bytes and char* advances by 1. The same rule makes p[i] exactly *(p + i), and makes end - begin a count of elements (a ptrdiff_t), not a count of bytes. If you genuinely mean bytes, cast to char* (or std::byte*) first and say so.",
          "level": "warm-up",
          "skill": "cpp.pointers"
        },
        {
          "q": "When would you take a parameter as const T& rather than by value?",
          "a": "When T is expensive to copy and the function only needs to read it: const& passes eight bytes, copies nothing, cannot be null and cannot modify the caller's object. For small trivially copyable types — an int, a double, a 16-byte POD — by value is as cheap or cheaper and avoids an indirection, so returning a double by const& is strictly worse. Use a pointer instead of a reference only when “absent” is a legal argument.",
          "level": "warm-up",
          "skill": "cpp.pointers-vs-references"
        },
        {
          "q": "Inside void f(int* arr), why is sizeof(arr) / sizeof(arr[0]) not the array length?",
          "a": "Because the array decayed to a pointer at the call, so sizeof(arr) is sizeof(int*) = 8 and sizeof(arr[0]) is 4 — the expression is always 2 on this ABI, whatever was passed. The length information exists only where the array itself is in scope. The fix is to pass the length alongside the pointer, or to take a std::span / std::array reference so the size travels with the data.",
          "level": "core",
          "skill": "cpp.pointers"
        },
        {
          "q": "Is it legal to form a pointer one past the end of an array? Is it legal to dereference it?",
          "a": "Forming and comparing a one-past-the-end pointer is legal and is what makes the it != end() loop idiom well defined. Dereferencing it is undefined behaviour, and so is even computing an address two or more past the end. This matters practically because the optimiser assumes UB cannot occur, so an out-of-range index does not wrap — it licenses the compiler to delete your bounds check.",
          "level": "core",
          "skill": "cpp.pointers"
        },
        {
          "q": "A scan over std::vector<Quote> is several times slower than the same scan over a std::vector<double> of just the prices, with identical arithmetic. Explain.",
          "a": "Memory moves in 64-byte lines, so the cost of a scan is the number of lines touched, not the number of adds. With a 56-byte Quote you pull 56 bytes to use 8, so 1024 prices cost about 896 lines; with a packed array of doubles you get 8 useful prices per line and the same scan costs 128. Splitting hot fields into their own contiguous array (SoA) also gives the hardware prefetcher a regular stride to run ahead on.",
          "level": "core",
          "skill": "perf.data-layout"
        },
        {
          "q": "What is false sharing, how would you recognise it, and how do you fix it?",
          "a": "Two threads writing *different* variables that happen to occupy the same 64-byte cache line: each write invalidates the other core's copy, so the line ping-pongs over the coherence protocol. The signature is a multithreaded version that is slower than single-threaded, with high cache-coherence traffic and no logical contention in the source. The fix is to give each hot variable its own line with alignas(64) — or to stop sharing and keep per-thread state.",
          "level": "core",
          "skill": "perf.false-sharing"
        },
        {
          "q": "A colleague's micro-benchmark reports that a function takes 0 ns. What went wrong, and how would you fix the measurement?",
          "a": "The result was unused, so dead-code elimination deleted the work — you timed nothing. Consume the result with a sink the compiler cannot see through (an empty asm volatile with a \"memory\" clobber, or a benchmark library's DoNotOptimize). While you are there, fix the other three classic errors: measure a release build, warm up so caches and the branch predictor are primed, and report a sorted sample as p50 / p99 / p99.9 with the machine stated instead of a single mean.",
          "level": "senior",
          "skill": "tools.benchmarking"
        },
        {
          "q": "You need a function that receives a 4096-element price grid, and the caller may legitimately have no grid at all. What signature do you choose and why?",
          "a": "I would take const std::span<const double> (or a pointer plus a length, pre-C++20) and treat an empty span as “no grid”, because the size then travels with the data and there is no decay bug to make. If “absent” must be distinguishable from “present but empty”, a const double* plus a length says “this may be null” at the call site in a way a reference cannot. What I would not do is pass it by value — that is 32 KB of copying for a read-only scan.",
          "level": "senior",
          "skill": "cpp.pointers-vs-references"
        }
      ]
    },
    {
      "n": 3,
      "focus": "Object-oriented C++: classes, RAII & smart pointers",
      "tagline": "Who owns this object, and when does it die? Make the answer a compile-time contract instead of a comment.",
      "concepts": [
        {
          "title": "A class is data plus the functions that keep it valid",
          "text": "struct and class are the same feature and differ only in default access: public is the interface, private protects the invariant. The constructor's job is to hand back an object that is already valid — initialise in the member-initialiser list, because the body can only assign afterwards — and if an Order with qty == 0 cannot be constructed, nothing downstream has to check for one.",
          "deck": "Deck W3 · slides 9–10, 15"
        },
        {
          "title": "Destructors run by themselves, in reverse order",
          "text": "~T() runs at scope exit, on delete, and while a throw unwinds the stack — you never call it. Objects are destroyed last-built-first, so a later object may safely depend on an earlier one. If the object owns something, the destructor is where it gives it back; nothing else belongs there, and it must never throw.",
          "code": "struct Tagged {\n  const char* n;\n  explicit Tagged(const char* s) : n(s) { std::printf(\"+%s \", n); }  // ACQUIRE\n  ~Tagged()                              { std::printf(\"-%s \", n); } // RELEASE\n};\nint main(){\n  { Tagged a(\"a\"); Tagged b(\"b\"); }      // you never call ~Tagged\n  std::puts(\"\");\n}\n// +a +b -b -a",
          "deck": "Deck W3 · slide 11"
        },
        {
          "title": "RAII: acquire in the constructor, release in the destructor",
          "text": "Tie a resource's lifetime to an object's scope and the compiler guarantees the cleanup, on every exit path including an exception. That is the whole idea behind lock_guard, unique_ptr, a file handle wrapper and a timer that reports its own elapsed time — deterministic cleanup at the closing brace, with no garbage collector and no forgotten free.",
          "deck": "Deck W3 · slide 19"
        },
        {
          "title": "Rule of zero, rule of five",
          "text": "Five special members travel together: destructor, copy constructor, copy assignment, move constructor, move assignment. Declaring one changes what the compiler gives you for the others — a lone destructor silently kills the implicit moves, so your vector starts deep-copying. Own nothing raw and write none of them (rule of zero); own a raw resource and write all five, or = delete the copies outright.",
          "code": "std::vector<double> a(4, 1.0);\nstd::vector<double> b = a;              // COPY: a second buffer\nstd::vector<double> c = std::move(a);   // MOVE: steal the pointer, blank a\nstd::printf(\"%zu %zu %zu\\n\", a.size(), b.size(), c.size());\n// 0 4 4     -- a is a valid-but-empty husk: destroy it, don't read it",
          "deck": "Deck W3 · slides 12–14, 25"
        },
        {
          "title": "unique_ptr by default, shared_ptr only when you mean it",
          "text": "unique_ptr is sole ownership, move-only, and the same size and speed as a raw pointer — reach for it first. shared_ptr is reference-counted shared ownership, and the refcount is atomic: every copy and destroy is a synchronising read-modify-write that bounces a cache line between cores. weak_ptr observes without owning and is how you break a cycle.",
          "code": "auto u = std::make_unique<int>(7);        // sole owner, move-only\nauto s = std::make_shared<int>(7);        // refcounted, ATOMIC inc/dec\n{ auto s2 = s; std::cout << s.use_count() << ' '; }\nstd::cout << s.use_count() << ' ' << sizeof(u) << ' ' << sizeof(s) << '\\n';\n// 2 1 8 16     -- unique_ptr is a pointer; shared_ptr is two",
          "deck": "Deck W3 · slides 21–23"
        },
        {
          "title": "sizeof, padding and member order",
          "text": "Every member is placed on a multiple of its own alignment, so declaration order decides how much padding you pay for. Declaring the same five fields widest-first collapses the holes from 40 bytes to 32 — which is two orders per 64-byte cache line instead of one. static_assert the size so that adding a std::string member breaks the build instead of your tail.",
          "code": "struct Naive { char side; uint64_t id; double px; uint32_t qty; char sym[8]; };\nstruct Order { uint64_t id; double px; char sym[8]; uint32_t qty; char side; };\nstatic_assert(sizeof(Order) == 32, \"layout drift\");\nstd::cout << sizeof(Naive) << ' ' << sizeof(Order) << ' ' << alignof(Order) << '\\n';\n// 40 32 8     -- same five fields, 20% smaller",
          "deck": "Deck W3 · slide 17"
        }
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
        "example": {
          "title": "In the arena",
          "text": "hft/cpp_client/include/arena_client.hpp — the transport layer owns its book cache behind a mutex, and every handler runs on IXWebSocket's receive thread. That is correct plumbing, and it is exactly the shape (node-based map, lock, shared state) you must not copy into your own on_book.",
          "code": "// hft/cpp_client/include/arena_client.hpp\n//   All handlers are invoked on IXWebSocket's receive thread; keep them fast\n//   and do not block. The send helpers are thread-safe.\nprivate:\n    ClientConfig      cfg_;\n    ix::WebSocket     ws_;\n    std::atomic<bool> session_open_{false};\n    std::atomic<bool> running_{false};\n\n    mutable std::mutex              book_mtx_;\n    std::map<std::string, BookView> books_;   // owned once, not per tick"
        }
      },
      "interview": [
        {
          "q": "What is RAII, and name two things in the standard library that are examples of it.",
          "a": "RAII means a resource is acquired in a constructor and released in the matching destructor, so its lifetime is tied to a scope and the compiler guarantees the release on every exit path — including during exception unwinding. std::lock_guard (acquires a mutex, unlocks in its destructor) and std::unique_ptr (owns heap memory, deletes it in its destructor) are the canonical examples; std::fstream and std::vector are two more.",
          "level": "warm-up",
          "skill": "cpp.raii"
        },
        {
          "q": "What is the difference between unique_ptr and shared_ptr, and which is your default?",
          "a": "unique_ptr expresses sole ownership: it is move-only, occupies exactly one pointer, and deleting it destroys the object — zero overhead versus a raw pointer. shared_ptr is reference-counted shared ownership with a separate control block, and the count is atomic so every copy and destruction is a synchronising operation. unique_ptr is the default; shared_ptr is only correct when the lifetime is genuinely shared and nobody can say who outlives whom.",
          "level": "warm-up",
          "skill": "cpp.smart-pointers"
        },
        {
          "q": "A class owns a raw new[] buffer and declares only a destructor. What has the compiler silently done to you?",
          "a": "Declaring a destructor suppresses the implicit move constructor and move assignment, so every “move” of the type falls back to the copy operations — and the implicit copies are member-by-member, meaning they copy the pointer, not the buffer. The result is two destructors freeing one allocation: a double free. Either write all five special members (with a self-assignment guard) or hold the buffer in a vector/unique_ptr and write none of them.",
          "level": "core",
          "skill": "cpp.rule-of-five"
        },
        {
          "q": "Why does std::vector only move its elements during reallocation if the move constructor is noexcept?",
          "a": "Reallocation must be all-or-nothing: if a move threw halfway through, the old buffer has already been pillaged and the vector could not restore its previous state. So vector checks std::is_nothrow_move_constructible and falls back to copying when the move might throw, because a copy leaves the source intact and is therefore recoverable. Practically: mark your move constructor and move assignment noexcept or your “movable” type quietly deep-copies on every growth.",
          "level": "core",
          "skill": "cpp.move-semantics"
        },
        {
          "q": "What does std::move actually do?",
          "a": "Nothing at run time — it is a cast that produces an rvalue reference, which changes overload resolution so a move constructor or move assignment is selected instead of the copy. The moving is done by that constructor, which typically steals a pointer and blanks the source. After a move the source is valid but unspecified: you may destroy it or assign to it, but you must not read its value.",
          "level": "core",
          "skill": "cpp.move-semantics"
        },
        {
          "q": "Why would you avoid shared_ptr on a microsecond-scale hot path?",
          "a": "The reference count is atomic, so each copy or destruction is a read-modify-write that must be coherent across cores; under sharing that bounces the control block's cache line between them, and the cost is variable rather than fixed. It also adds an extra indirection and, with shared_ptr(new T), a second allocation. On the hot path I own with unique_ptr off the path and pass a plain reference in — the reference cannot be null and costs nothing.",
          "level": "core",
          "skill": "cpp.smart-pointers"
        },
        {
          "q": "Why is a class with virtual functions but a non-virtual destructor a bug, and what exactly goes wrong?",
          "a": "Deleting a derived object through a base pointer with a non-virtual destructor is undefined behaviour: in practice only the base destructor runs, so any derived member is never destroyed and whatever it owned leaks. It will usually appear to work, which is worse than crashing. The rule is that any class with a virtual function gets a virtual destructor — or you never delete through the base at all.",
          "level": "senior",
          "skill": "cpp.classes-invariants"
        },
        {
          "q": "How would you design an order type so a heap touch on the hot path becomes impossible rather than merely discouraged?",
          "a": "Make it a flat value struct — fixed-size char arrays and scalars, no std::string, no owning pointer — and enforce it with static_assert(std::is_trivially_copyable_v<Order>) plus a static_assert on sizeof so a future member cannot drift the layout. Then hand them out from a pre-sized pool and give the pool's type deleted copy operations so nobody can accidentally duplicate it. The invariant is now checked by the build rather than by code review.",
          "level": "senior",
          "skill": "perf.object-layout"
        }
      ]
    },
    {
      "n": 4,
      "focus": "Custom allocators & memory pools",
      "tagline": "“Don't allocate” is not enough — sooner or later you need a fresh object per tick, so make the allocation itself O(1) and deterministic.",
      "concepts": [
        {
          "title": "What new and malloc really cost",
          "text": "The default allocator is a general-purpose, thread-safe service, and every one of those properties is wrong for a microsecond path. It guards its free lists with a lock, it calls brk or mmap into the kernel when it runs out, variable-size requests fragment it over a session, and so the same call is 20 ns on one tick and 20 µs on the next. That variance is the whole problem.",
          "deck": "Deck W4 · slide 5"
        },
        {
          "title": "What the hot path actually needs",
          "text": "Flip every property of the general-purpose allocator and you get the specification: no locks, because there is one pool per thread; no syscalls, because the memory is reserved before the session opens; O(1) always, because allocation is a pointer bump or a free-list pop with no search and no coalescing; and bounded, because you sized it at startup for the worst tick. Same cost every time is what collapses the tail toward the median.",
          "deck": "Deck W4 · slide 6"
        },
        {
          "title": "The fixed-size object pool",
          "text": "Give up flexibility and buy determinism: one block size, one pre-owned slab, and a free list threaded through the unused slots so the free slots *are* the list and cost no extra memory. Allocation pops the head, deallocation pushes it back, both O(1) with no search and no coalescing — and because slots get reused in cycles they stay hot in L1.",
          "code": "struct Node { Node* next; };\nNode slab[3];                                  // ONE pre-owned block\nNode* free_ = nullptr;\nfor (auto& s : slab) { s.next = free_; free_ = &s; }   // thread the free-list\nNode* a = free_; free_ = a->next;              // alloc: O(1) pop\nNode* b = free_; free_ = b->next;              // alloc: O(1) pop\nb->next = free_; free_ = b;                    // free:  O(1) push\nstd::cout << (a != b) << ' ' << (free_ == b) << '\\n';\n// 1 1",
          "deck": "Deck W4 · slides 8, 10"
        },
        {
          "title": "Placement new and explicit destruction",
          "text": "C++ separates “get raw bytes” from “construct an object”. new (ptr) T{...} runs a constructor in memory you already own and allocates nothing; the price is that nobody will run the destructor for you, so you call p->~T() yourself before you hand the slot back. This is the mechanism every pool is built on — and alignment is your responsibility.",
          "code": "struct Order {\n  double px; int qty;\n  Order(double p, int q) : px(p), qty(q) { std::printf(\"ctor \"); }\n  ~Order()                               { std::printf(\"dtor \"); }\n};\nalignas(Order) char buf[sizeof(Order)];        // memory you already own\nOrder* o = new (buf) Order(101.5, 200);        // placement new: construct only\nstd::printf(\"%.1f %d \", o->px, o->qty);\no->~Order();                                   // YOU destroy it\nstd::puts(\"\");\n// ctor 101.5 200 dtor",
          "deck": "Deck W4 · slide 9"
        },
        {
          "title": "The arena / bump allocator: per-tick scratch",
          "text": "When a group of objects shares a lifetime, stop freeing them one at a time. Keep a single offset into a slab, return it and advance by the aligned size, and reclaim everything at once with one reset. You cannot free an individual object — which is exactly right for a tick's working set: allocate freely inside the tick, reset at the end, no leaks and no fragmentation.",
          "deck": "Deck W4 · slide 9"
        },
        {
          "title": "std::pmr: the standard version of all this",
          "text": "C++17 standardises the pattern. A memory_resource is an abstract source of bytes; monotonic_buffer_resource is a bump allocator over a buffer you supply; unsynchronized_pool_resource is a lock-free pooled resource; and a polymorphic_allocator lets std::pmr::vector and friends take a resource pointer at construction. Same container type, your memory underneath.",
          "code": "std::byte buf[1024];                                   // stack scratch slab\nstd::pmr::monotonic_buffer_resource rsrc{buf, sizeof buf};\nstd::pmr::vector<int> v{&rsrc};                        // std container, YOUR memory\nv.reserve(8); v.push_back(1); v.push_back(2);\nauto* d = reinterpret_cast<const std::byte*>(v.data());\nstd::cout << v.size() << ' ' << (d >= buf && d < buf + sizeof buf) << '\\n';\nrsrc.release();                                        // O(1) reset, per tick\n// 2 1     -- the vector's storage really is inside buf; the heap is untouched",
          "deck": "Deck W4 · slides 12–13"
        }
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
        "example": {
          "title": "In the arena",
          "text": "course/hft-columbia/project-starter/include/pool.hpp — the HW4 stub you fill in. The whole contract is in the comments: one pre-allocated buffer, a free list, and O(1) in both directions.",
          "code": "// project-starter/include/pool.hpp\n// HW4 - a high-performance fixed-size object pool\n//       (O(1) alloc/free, placement new).\nstruct Pool {\n    Pool(std::size_t obj_size, std::size_t capacity) {\n        // TODO(student): back this with ONE pre-allocated buffer + a free-list.\n    }\n    void* alloc() { return nullptr;   // TODO: pop a free slot, O(1)\n    }\n    void  free(void* p) {             // TODO: return the slot, O(1)\n    }\n};"
        }
      },
      "interview": [
        {
          "q": "Why is the general-purpose allocator a problem on a low-latency path?",
          "a": "Because its cost is unbounded and unpredictable rather than merely large. It may take a lock on a shared free list, search or split blocks, coalesce on free, or fall through to brk/mmap and a page fault in the kernel. The median call is fast, which is why the mean looks fine, but the occasional slow call lands on a busy tick and becomes your p99.9.",
          "level": "warm-up",
          "skill": "perf.heap-nondeterminism"
        },
        {
          "q": "Sketch a fixed-size object pool and state the complexity of alloc and free.",
          "a": "One contiguous slab of N slots, each slot big enough and aligned for T, plus a head pointer to a singly linked free list threaded through the *unused* slots — so the list costs no extra memory. alloc pops the head and returns it; free pushes the slot back on the head. Both are O(1) with no search, and reusing slots in cycles keeps them cache-warm.",
          "level": "warm-up",
          "skill": "perf.object-pool"
        },
        {
          "q": "What does placement new do, and what obligation does it create?",
          "a": "new (ptr) T{args...} constructs a T in storage you already own: it runs the constructor and allocates nothing. The obligation is symmetry — no operator delete will ever be called for it, so you must invoke p->~T() explicitly before reusing or releasing the storage. You are also responsible for the storage being correctly sized and aligned for T, which is why pool slots are declared with alignas(T).",
          "level": "core",
          "skill": "cpp.placement-new"
        },
        {
          "q": "When is a bump (arena) allocator the right choice, and what does it give up?",
          "a": "When a group of objects shares a lifetime — classically everything a single tick needs. You keep one offset into a slab, return it and advance by the size rounded up to alignof(T), and reclaim everything with a single reset in O(1). What you give up is individual deallocation: you cannot free one object, so it is wrong for anything whose lifetime outlives the batch.",
          "level": "core",
          "skill": "perf.arena-allocator"
        },
        {
          "q": "What does std::pmr add over writing your own allocator, and which resource fits a per-tick scratch buffer?",
          "a": "pmr makes the allocator a run-time value instead of part of the container's type, so std::pmr::vector<T> is one type whose memory comes from whatever memory_resource you hand it — no template plumbing through your call graph. For per-tick scratch the fit is monotonic_buffer_resource over a stack or member byte array: pure bump allocation with no heap traffic, then release() to reclaim the whole thing at tick end. For recycled fixed-size objects, unsynchronized_pool_resource.",
          "level": "core",
          "skill": "cpp.pmr"
        },
        {
          "q": "Your pool's alloc() starts returning nullptr an hour into the session and the bot silently stops trading. What happened?",
          "a": "A leak in pool terms: some path allocated a slot and never returned it, so after N ticks the free list is empty. It is not a crash and ASan cannot see it, because the memory is still validly owned by the pool. The fixes are structural — hand slots out through an RAII handle so the return happens in a destructor on every exit path, and instrument the pool so exhaustion is a loud, counted event rather than a quiet null.",
          "level": "senior",
          "skill": "perf.object-pool"
        },
        {
          "q": "Your pool hands out raw storage. How do you keep construction and destruction honest?",
          "a": "Pair placement new with an explicit destructor call, and hide the pair behind an RAII handle so neither can be forgotten. alloc() returns raw bytes, the handle's constructor runs new (slot) T{args...}, and the handle's destructor calls p->~T() and pushes the slot back on the free list — so every exit path, including an exception, returns the slot exactly once. Without that, the two failure modes are a slot returned without its destructor running (a leak of whatever T owned) and a destructor run twice on a recycled slot.",
          "level": "core",
          "skill": "cpp.placement-new"
        },
        {
          "q": "You put a pmr::vector on a monotonic_buffer_resource inside on_book and call release() at the end. Where is the trap?",
          "a": "Lifetime order. release() reclaims the whole slab, so the container that borrowed from it must be destroyed *before* the reset — otherwise its destructor touches memory the resource has already handed back, and a later tick will overwrite live data. The idiom is to scope the scratch container in an inner block and call release() after that block closes. A second trap is overflow: if the working set exceeds the buffer, monotonic_buffer_resource quietly falls back to the upstream heap resource, so you are allocating again without noticing.",
          "level": "senior",
          "skill": "perf.arena-allocator"
        }
      ]
    },
    {
      "n": 5,
      "focus": "Templates, compile-time & CRTP",
      "tagline": "Write it once, let the compiler specialise it per type, and pay nothing at run time — the only kind of abstraction HFT can afford.",
      "concepts": [
        {
          "title": "A template is a recipe, not code",
          "text": "template<typename T> is a blueprint; the compiler instantiates it — generates real machine code — the first time you use it with a concrete type, and then inlines it. That is why a ring<T,N> or a pool<T> costs the same as the version you would have hand-written for that exact type. The price is code bloat: each distinct instantiation is separate code, and definitions must live in headers.",
          "deck": "Deck W5 · slides 5–6"
        },
        {
          "title": "Parameter packs and fold expressions",
          "text": "typename... lets one template take any number of arguments of any types, and sizeof...(Ts) gives the count at compile time. A C++17 fold collapses the pack over a binary operator in one line — no recursion, no base case — and the expansion is unrolled and inlined away, which is how one call can serialise a whole message.",
          "code": "template <class... Ts> constexpr auto sum(Ts... xs) { return (xs + ...); }\ntemplate <class... Ts> int arity(Ts...)             { return sizeof...(Ts); }\nstatic_assert(sum(1, 2, 3, 4) == 10);        // the compiler did the addition\nstd::cout << sum(1, 2, 3, 4) << ' ' << sum(0.5, 0.25) << ' '\n          << arity(1, 'a', 2.0) << '\\n';\n// 10 0.75 3",
          "deck": "Deck W5 · slides 9–10"
        },
        {
          "title": "Traits and if constexpr: branch before the program runs",
          "text": "A type trait is a compile-time question about T — is_integral_v, is_same_v — answered during compilation and costing nothing at run time. Feed one into if constexpr and the untaken arm is discarded before code generation: each instantiation contains exactly one path, so there is no test and nothing to mispredict. Prefer this to raw SFINAE and enable_if in new code.",
          "code": "template <class T> const char* kind(const T&) {\n  if constexpr (std::is_integral_v<T>)            return \"int\";   // only arm compiled\n  else if constexpr (std::is_floating_point_v<T>) return \"float\";\n  else                                            return \"other\";\n}\nstd::cout << kind(3) << ' ' << kind(3.0) << ' ' << kind(\"x\") << '\\n';\n// int float other",
          "deck": "Deck W5 · slides 12–14 · Deck W6 · slide 9"
        },
        {
          "title": "What a virtual call actually costs",
          "text": "A polymorphic object carries one hidden vptr to a per-class table of function addresses, so sizeof grows by eight the moment the first virtual appears. The call is two dependent loads plus an indirect branch — but the real bill is the inlining you lose and the branch mispredicts when a loop sees several targets. final or an exact known type lets the compiler devirtualise and inline through it.",
          "code": "struct P { int a; };                              // plain\nstruct V { int a; virtual ~V() = default; };      // polymorphic: hidden vptr\nstd::cout << sizeof(P) << ' ' << sizeof(V) << ' ' << alignof(V) << ' '\n          << std::is_polymorphic_v<V> << '\\n';\n// 4 16 8 1     -- 8B vptr + 4B int + 4B padding",
          "deck": "Deck W5 · slides 17–20"
        },
        {
          "title": "constexpr: make the compiler do the work",
          "text": "A constexpr function can run during compilation when its inputs are constants; consteval must. Build a lookup table that way and the loop runs inside the compiler, the result ships as read-only data in the binary, and the hot path is one indexed load with no initialisation code and no branch. static_assert then checks the table before you ship it.",
          "code": "constexpr std::array<double, 8> make_ticks() {\n  std::array<double, 8> t{};\n  for (int i = 0; i < 8; ++i) t[i] = (i < 4) ? 0.01 : 0.05;  // runs in the COMPILER\n  return t;\n}\nconstexpr auto TICKS = make_ticks();              // read-only data in the binary\nstatic_assert(TICKS[0] == 0.01 && TICKS[7] == 0.05);\nstd::printf(\"%.2f %.2f\\n\", TICKS[3], TICKS[4]);\n// 0.01 0.05",
          "deck": "Deck W6 · slides 5–6"
        },
        {
          "title": "CRTP and policy-based design",
          "text": "The Curiously Recurring Template Pattern templates a base on its own derived type, so the base can static_cast down and call the derived method — dispatch bound at compile time, fully inlinable, and no vptr, so an empty strategy really is one byte. Policy-based design is the same idea composed: pass SignalPolicy, RiskPolicy and ExecPolicy as template parameters and swapping a component is swapping a type.",
          "code": "template <class D> struct Strategy {\n  void on_book(double mid) { static_cast<D*>(this)->signal(mid); }   // no vtable\n};\nstruct Momentum : Strategy<Momentum> {\n  void signal(double mid) { std::printf(\"buy %.2f \", mid); }        // inlined\n};\nMomentum m; m.on_book(100.01);\nstd::printf(\"%zu\\n\", sizeof(Momentum));           // no vptr at all\n// buy 100.01 1",
          "deck": "Deck W6 · slides 11–12"
        }
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
        "example": {
          "title": "In the arena",
          "text": "hft/cpp_client/include/hft_bot.hpp — a real template on the real hot path: stamp_and_send takes the send call as a template parameter so the whole latency-stamping wrapper inlines into buy_limit with no indirection and no std::function.",
          "code": "// hft/cpp_client/include/hft_bot.hpp\nvoid buy_limit(const std::string& symbol, int qty, double price) {\n    stamp_and_send([&] { place_limit(symbol, \"buy\", qty, price); });\n}\n\n// Time the order send against the current tick's arrival stamp.\ntemplate <typename SendFn>\nvoid stamp_and_send(SendFn&& send) {\n    if (in_book_call_) {\n        send();                                   // inlined; no std::function\n        const auto now    = clock::now();\n        const auto micros = std::chrono::duration_cast<std::chrono::microseconds>(\n                                now - tick_recv_).count();\n        record_latency(tick_symbol_, static_cast<long long>(micros));\n    } else { send(); }\n}"
        }
      },
      "interview": [
        {
          "q": "Why must a template's definition live in a header?",
          "a": "Because a template is not code until it is instantiated, and the compiler can only instantiate it where it can see the definition. With the body in a separate .cpp, each translation unit that uses it emits a call to a function nobody generated, and you get a link error. The alternatives are to keep the definition in the header (the normal choice) or to explicitly instantiate the specific types you need in one .cpp.",
          "level": "warm-up",
          "skill": "cpp.templates"
        },
        {
          "q": "What is the difference between if and if constexpr?",
          "a": "A plain if is a run-time test: both branches are compiled and the CPU evaluates the condition and may mispredict it. if constexpr is evaluated during compilation and the untaken branch is discarded before code generation — it is not even required to compile for that instantiation. So if constexpr costs nothing at run time and lets you write a branch that would be ill-formed for the other type.",
          "level": "warm-up",
          "skill": "cpp.type-traits-constraints"
        },
        {
          "q": "Precisely what does a virtual call cost, and when does it actually hurt?",
          "a": "Mechanically: load the vptr out of the object, load the slot out of the vtable, then an indirect call — two dependent loads and a branch whose target is not known until the first load returns. On a loop with one hot target the predictor learns it and the marginal cost is a couple of nanoseconds; with several targets in the same loop you get mispredicts at roughly 15–20 cycles each. The larger cost is usually indirect: the compiler cannot inline through it, so constant folding stops at the call, and a fan-out of tiny virtuals scatters your instruction cache.",
          "level": "core",
          "skill": "perf.virtual-cost"
        },
        {
          "q": "Compare CRTP with virtual dispatch. When would you still choose virtual?",
          "a": "CRTP binds the call at compile time — the base static_casts to its derived type — so it inlines completely, adds no vptr and no indirect branch, and an empty policy costs one byte. The catch is that the concrete type must be known at compile time, so it cannot express a set of types decided at run time. I still use virtual where the type set is genuinely open or where flexibility is worth more than nanoseconds: configuration, setup, logging, and the client boundary — never in the tick-to-trade body.",
          "level": "core",
          "skill": "cpp.crtp-policies"
        },
        {
          "q": "You are given a wire protocol with five message types, all known at build time. How do you dispatch on the hot path?",
          "a": "Turn the tag into a type once, at the parse boundary — a switch on the discriminator is a single well-predicted compare and jump — then stay static from there. Model the union as std::variant<A,B,C,D,E> and dispatch with std::visit over a generic visitor that uses if constexpr per type: no vtable, no allocation, and the handlers inline. Reaching for virtual or std::function here would be paying a run-time indirection for a decision the compiler could have made.",
          "level": "core",
          "skill": "cpp.variant-visit"
        },
        {
          "q": "What does std::function cost, and where is it acceptable?",
          "a": "It is type erasure: a call through it is an indirect call the compiler cannot inline, it may heap-allocate if the callable does not fit the small-object buffer, and copying it copies that state. That is fine for a callback installed once at startup, or for cold-path configuration. On a per-tick path I use a template parameter or a plain lambda instead, so the callable's type is known and the whole thing folds into the caller.",
          "level": "core",
          "skill": "cpp.templates"
        },
        {
          "q": "Your templated hot path is suddenly slower after you added a fourth instantiation, and the profiler shows front-end stalls. What is going on and what do you do?",
          "a": "Instantiation is code generation, so four types mean four copies of the function body; if it is large, the working set no longer fits the instruction cache and you become front-end bound rather than data bound. The counters to confirm it are instruction-cache and front-end stall metrics, not cache-miss counts on data. The fix is to split the template into a thin type-dependent shell that inlines and a single shared out-of-line body for the type-independent bulk — keep genericity at the edges, not in the mass of the code.",
          "level": "senior",
          "skill": "cpp.templates"
        },
        {
          "q": "How would you prove a “zero-overhead” abstraction really is zero overhead?",
          "a": "Two ways, both empirical. Read the generated code: build the templated version and a hand-written version at the same optimisation level and compare the disassembly of the hot function — if the abstraction vanished, the instruction sequences match and there is no call left. Then confirm behaviourally on a fixed input: run both through the same recorded tape and compare p50 and p99.9, because an inlining failure shows up as a tail change long before it shows up in a mean. Claiming zero overhead from the language rules alone is how people ship an accidental indirect call.",
          "level": "senior",
          "skill": "perf.virtual-cost"
        }
      ]
    },
    {
      "n": 6,
      "focus": "Data structures: building the order book",
      "tagline": "Two sides, resting size at every price, and three operations that must stay O(1) and in cache — add, cancel, and read the touch.",
      "concepts": [
        {
          "title": "Hash tables: chaining versus open addressing",
          "text": "Order-ID and symbol lookups are the workhorse, and both collision strategies are O(1) on average — the constant factor is decided by memory layout. Chaining (what std::unordered_map does) makes each bucket a linked list of heap nodes, so every collision is a pointer chase and a likely cache miss. Open addressing probes the next slot of one flat array, so probes stay in cache and the prefetcher helps.",
          "code": "struct Slot { uint64_t key = 0; uint32_t val = 0; bool used = false; };\nstd::array<Slot, 8> t{}; const uint64_t mask = 7;      // power of two -> AND, not %\nauto put = [&](uint64_t k, uint32_t v) {\n  uint64_t i = k & mask;\n  while (t[i].used && t[i].key != k) i = (i + 1) & mask;   // walk the NEXT slot\n  t[i] = {k, v, true};\n};\nput(1, 100); put(9, 900);                     // 9 & 7 == 1: they collide\nstd::cout << t[1].key << ' ' << t[2].key << ' ' << t[2].val << '\\n';\n// 1 9 900     -- the collision landed in the adjacent slot, same cache line",
          "deck": "Deck W7 · slides 5–6"
        },
        {
          "title": "Pick the container for the access pattern",
          "text": "Ordered iteration favours a tree, point lookup favours a hash, and best-element access favours a heap — but contiguity beats big-O constants at the sizes a book actually holds. std::map is sorted and O(log n) with heap-scattered nodes; std::unordered_map is O(1) average with chaining and rehashing, so its tail is spiky; a priority_queue is array-backed and cache-friendly. Reserve up front and never rehash on the hot path.",
          "deck": "Deck W7 · slide 7"
        },
        {
          "title": "The flat, price-indexed book",
          "text": "Prices live on a fixed tick grid, so an integer index is exact and you do not need a general ordered map at all. Index = (price - base) / tick makes each level a slot in one contiguous array: add and cancel index straight to the level, the touch is a cached index you read with a single load, and matching walks adjacent slots in the direction the prefetcher expects.",
          "code": "const double base = 99.00, tick = 0.01;       // index against a BASE tick\nstd::array<uint32_t, 256> bid_qty{};\nint best = -1;\nauto idx = [&](double px) { return int((px - base) / tick + 0.5); };\nauto add = [&](double px, uint32_t q) {\n  int i = idx(px); bid_qty[i] += q; if (i > best) best = i;   // O(1), one line\n};\nadd(100.00, 800); add(99.99, 600);\nstd::printf(\"%d %d %.2f %u\\n\", idx(100.00), idx(99.99), base + best * tick, bid_qty[best]);\n// 100 99 100.00 800",
          "deck": "Deck W7 · slides 9–10"
        },
        {
          "title": "A flat array is a BAND, not “all prices”",
          "text": "This is the trap the starter header warns about. 65 536 one-cent slots indexed absolutely from $0.00 only covers $0.00–$655.35, and the arena lists names above that — so an absolute index walks off the end, and because the two side arrays are adjacent members it silently corrupts the other side of your own book. AddressSanitizer cannot see it, because it is an intra-object overflow. Index against a base tick and bounds-check both ends.",
          "deck": "Deck W7 · slide 9"
        },
        {
          "title": "Add, cancel, match — and where you are allowed to scan",
          "text": "Add indexes the level, bumps the aggregate quantity and order count, and nudges the cached best index if this price is a new touch. Cancel indexes and subtracts — and if the level empties and it was the touch, that is the one place you may scan inward for the next non-empty slot. Match starts at best, consumes size, and steps to the adjacent slot when a level clears: sequential access, O(1) in the common case.",
          "deck": "Deck W7 · slide 11"
        },
        {
          "title": "FIFO per level, and knowing your position in it",
          "text": "Within one price, orders fill front-to-back by arrival, keyed on a monotonic sequence number. Your fill probability is set by how much size sits ahead of you, so queue_ahead is a number worth tracking: zero means you are at the front and about to trade. Repricing forfeits all of it — cancel and re-post puts you at the tail — which is why churning quotes is expensive even when sending is cheap.",
          "code": "int ahead = 800, level = 1000;                // you rest behind 800 at 100.00\nahead -= 300;                                 // 300 ahead of you filled: you advance\nstd::printf(\"%d %d %s\\n\", ahead, level, ahead ? \"wait\" : \"FRONT\");\nahead = level;                                // cancel + re-post: BACK of the queue\nstd::printf(\"%d\\n\", ahead);\n// 500 1000 wait\n// 1000",
          "deck": "Deck W7 · slide 13"
        }
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
        "example": {
          "title": "In the arena",
          "text": "course/hft-columbia/project-starter/include/order_book.hpp — the HW7 stub, including the band warning that CI will not catch for you.",
          "code": "// project-starter/include/order_book.hpp\n// HW7 - a fast order book (flat, price-indexed) + a fast symbol->id map.\n//\n// Range warning (see labs/week07.md step 2): a flat array of N one-cent slots\n// is a BAND, not \"all prices\". 1<<16 slots indexed absolutely from $0.00 covers\n// only $0.00-$655.35 ... an absolute index walks off the end and, because the\n// two side arrays are adjacent members, silently corrupts the OTHER side of\n// your own book. ASan cannot see that (it is an intra-object overflow).\nstruct Book {\n    void add(uint64_t id, char side, double px, uint32_t qty);\n    void cancel(uint64_t id);\n    double best_bid() const;   // TODO(student): O(1)\n    double best_ask() const;   // TODO(student): O(1)\n};"
        }
      },
      "interview": [
        {
          "q": "Why is std::unordered_map a risky choice on a latency-critical path?",
          "a": "It is specified with chaining, so buckets are linked lists of separately allocated nodes: a lookup that collides becomes a pointer chase across the heap, and each hop is a likely cache miss. It also allocates a node per insert and rehashes when the load factor is exceeded, which is an O(n) event that lands whenever it lands. Average O(1) is true and irrelevant — the tail is what the venue's busy tick sees.",
          "level": "warm-up",
          "skill": "cpp.stl-containers"
        },
        {
          "q": "Why size an open-addressing hash table to a power of two?",
          "a": "So the modulo becomes a bitwise AND with size - 1, replacing a division (tens of cycles) with a single-cycle instruction on the hottest line of the probe loop. It also makes wrap-around free: i = (i + 1) & mask. The discipline that goes with it is to reserve up front and keep the load factor below roughly 0.7, because probe chains lengthen sharply after that.",
          "level": "warm-up",
          "skill": "perf.open-addressing-hash"
        },
        {
          "q": "Why can a flat price-indexed array beat a std::map for an order book even though the map is O(log n)?",
          "a": "Because prices are discrete: they sit on a tick grid, so (price - base) / tick is an exact integer index and the lookup is arithmetic instead of a search. The map's six or so pointer hops are six likely cache misses at ~100 ns each; the array is one indexed load into a line the prefetcher probably already fetched. Add and cancel become O(1), the touch is a cached index, and matching walks adjacent slots sequentially.",
          "level": "core",
          "skill": "trading.flat-order-book"
        },
        {
          "q": "What is the main hazard of the flat-array book, and how do you handle it?",
          "a": "It covers a price *band*, not all prices, so any price outside the band indexes out of range — and if the two sides are adjacent arrays in one struct, the overflow corrupts your other side rather than segfaulting, which sanitizers will not catch because it is an intra-object overflow. You index relative to a base tick, bounds-check both ends explicitly, and decide a policy for out-of-band prices (re-base the window, or reject and log). Never rely on the test data staying near the middle of the band.",
          "level": "core",
          "skill": "trading.flat-order-book"
        },
        {
          "q": "Which operations on a flat book are O(1), and which one is not?",
          "a": "Add is O(1): index the level, bump the aggregate quantity, and update the cached best index if the price improves the touch. Cancel is O(1) in the body — index and subtract — but if the level empties *and* it was the touch, you must scan inward to find the next non-empty slot, which is O(levels) in the worst case. That is the accepted exception: it is rare, it is sequential and cache-friendly, and the alternative (a heap or tree of non-empty levels) makes the common path slower to speed up the rare one.",
          "level": "core",
          "skill": "trading.flat-order-book"
        },
        {
          "q": "How do you track your own queue position, and why does it matter?",
          "a": "Per price level the exchange holds a FIFO keyed on a monotonic sequence number, so your position is the total remaining size of orders that arrived before yours. In the arena that is handed to you: OrderAck carries queue_ahead and level_qty when your order rests, and QueueUpdate fires when something ahead of you fills or cancels. It matters because fill probability is a function of the size in front of you — and because repricing resets it to the back, so a quote adjustment has a real, measurable cost.",
          "level": "core",
          "skill": "trading.queue-position"
        },
        {
          "q": "Where would you still use std::map or a tree in a trading system?",
          "a": "Off the tick path, where ordered iteration or an unbounded key range is what you actually need: end-of-day reconciliation, a sparse book for an illiquid instrument whose prices span decades of ticks, a schedule of timers keyed by time, or anything whose size you cannot bound at startup. The rule I apply is that the hot path gets bounded, pre-sized, contiguous structures, and everything that is allowed to take a microsecond can use the container with the nicest semantics.",
          "level": "senior",
          "skill": "cpp.stl-containers"
        },
        {
          "q": "Your local book occasionally disagrees with the venue's. How do you find out why?",
          "a": "First decide whether you lost an update or misapplied one, because the fixes are different. Sequence numbers answer the first: track the next-expected value and treat a gap as loss, stop trading that symbol, and recover by re-requesting a snapshot rather than guessing. If there is no gap, the bug is in application, so I replay the recorded tape through the book with a shadow implementation — a simple, slow, obviously-correct map-based book — and diff the two after every message to find the first divergence. Silent staleness is the dangerous failure mode, so the book should refuse to trade rather than trade a state it cannot vouch for.",
          "level": "senior",
          "skill": "trading.feed-sequencing"
        }
      ]
    },
    {
      "n": 7,
      "focus": "Algorithmic complexity & the cache",
      "tagline": "Big-O tells you how cost grows and hides the constant — so count cache misses, and update instead of recomputing.",
      "concepts": [
        {
          "title": "Big-O is asymptotic; the constant is your grade",
          "text": "O(1), O(log n) and O(n) describe growth as n goes to infinity and say nothing about the constant that dominates when n is small — and a hot book is small. At HFT scale the operation that costs is the cache miss at roughly 100 ns, not the arithmetic at roughly 1 ns, so the honest unit of complexity is memory accesses rather than instructions.",
          "deck": "Deck W8 · slide 5"
        },
        {
          "title": "Why a “slower” array beats a “faster” tree",
          "text": "Finding a value among 64 elements: a red-black tree is O(log n), about six pointer hops, each a likely cache miss — call it 600 ns. A linear scan of 64 contiguous elements is O(n) but touches roughly eight cache lines, is prefetched, and predicts perfectly — tens of nanoseconds. The log-n win never pays off at that size, and the crossover N is something you measure on your machine rather than assume.",
          "deck": "Deck W8 · slide 6"
        },
        {
          "title": "Amortized is not worst case",
          "text": "vector::push_back is O(1) amortized: most pushes are a store, and occasionally the vector reallocates and copies everything, O(n). Averaged over many operations that is constant; but p99.9 lives in the worst case, and one reallocation mid-race is the tail. reserve() up front converts a handful of O(n) spikes into zero.",
          "code": "std::vector<int> grow, pre; pre.reserve(1000);\nauto count = [](std::vector<int>& v) {\n  std::size_t n = 0, cap = v.capacity();\n  for (int i = 0; i < 1000; ++i) { v.push_back(i);\n    if (v.capacity() != cap) { ++n; cap = v.capacity(); } }\n  return n;                                    // how many O(n) reallocations\n};\nstd::cout << count(grow) << ' ' << count(pre) << '\\n';\n// 11 0     -- eleven copy-everything events, or none",
          "deck": "Deck W8 · slide 5"
        },
        {
          "title": "The ring buffer: fixed-capacity history",
          "text": "A market feed is an unbounded stream but you only need the recent past, so store it in a fixed-size circular array: allocated once, never grows, O(1) push that overwrites the oldest slot, and contiguous storage the cache likes. The ring *is* the rolling window — the only remaining question is how you compute over it as it slides.",
          "code": "template <class T, std::size_t N> struct Ring {\n  std::array<T, N> buf{}; std::size_t head = 0, count = 0;\n  void push(T x) { buf[head] = x; head = (head + 1) % N;    // O(1), no alloc\n                   if (count < N) ++count; }\n  T operator[](std::size_t i) const { return buf[(head - count + i + N) % N]; }\n};\nRing<int, 4> r; for (int i = 1; i <= 6; ++i) r.push(i);     // 1 and 2 overwritten\nstd::cout << r.count << ' ' << r[0] << ' ' << r[3] << '\\n'; // 0 = oldest\n// 4 3 6",
          "deck": "Deck W8 · slide 9"
        },
        {
          "title": "Update, don't recompute",
          "text": "Looping the whole window every tick to get a mean or a standard deviation is O(k) work you repeat needlessly — and O(k) per tick across millions of ticks, spiking during the volatile moments, is a blown tail. An online algorithm folds each new observation into a few scalars in constant time: a running mean, Welford's numerically stable variance, and an EMA that needs no buffer at all.",
          "code": "struct Online {                                    // O(1) time, O(1) space\n  long n = 0; double mean = 0, m2 = 0, ema = 0, a = 0.2;\n  void update(double x) { ++n; double d = x - mean;\n    mean += d / n;                                 // running mean\n    m2   += d * (x - mean);                        // Welford's M2\n    ema   = (n == 1) ? x : a * x + (1 - a) * ema; }\n  double var() const { return n > 1 ? m2 / (n - 1) : 0.0; }\n};\nOnline o; for (double x : {2., 4., 4., 4., 5., 5., 7., 9.}) o.update(x);\nstd::printf(\"%ld %.2f %.4f %.4f\\n\", o.n, o.mean, o.var(), o.ema);\n// 8 5.00 4.5714 5.2910",
          "deck": "Deck W8 · slides 12–13"
        },
        {
          "title": "The optimisations that actually move p99.9",
          "text": "They are structural, not micro-tweaks to arithmetic: prefer flat arrays to node-based containers for hot, small collections; reserve and pool up front so nothing allocates mid-tick; do less work by updating incrementally, exiting early and hoisting invariants out of the loop; and profile to find the real hot path before touching anything. Then re-measure the tail, because that is the number you are optimising.",
          "deck": "Deck W8 · slide 7"
        }
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
        "example": {
          "title": "In the arena",
          "text": "course/hft-columbia/project-starter/include/rolling_counter.hpp — HW8's sliding-window counter, including the unsigned-clock edge case that costs most people a test.",
          "code": "// project-starter/include/rolling_counter.hpp\n// HW8 - sliding-window event counter. count() is called with a\n//       non-decreasing clock.\n//\n// Edge case (see labs/week08.md step 5): ts_ns and now_ns are UNSIGNED. Early\n// on, now_ns <= window_ns and the mathematical cutoff (now - window) is\n// negative - there is no uint64_t that means that, and no safe value to clamp\n// to. Only compute the subtraction when it is meaningful.\nstruct RollingCounter {\n    explicit RollingCounter(uint64_t window_ns);   // ring/deque; amortized O(1)\n    void add(uint64_t ts_ns);\n    uint64_t count(uint64_t now_ns);   // events with ts > now - window\n};"
        }
      },
      "interview": [
        {
          "q": "What does “amortized O(1)” mean for vector::push_back, and why might that not be good enough?",
          "a": "Most pushes are a single store; when capacity is exhausted the vector allocates a larger buffer and moves every element, which is O(n), and averaging that over the whole sequence gives constant cost per push. It is not good enough on a latency path because you are graded on the worst operation, not the average: that one reallocation is an allocation plus an O(n) copy landing on an arbitrary tick. reserve() the capacity up front and the spikes disappear.",
          "level": "warm-up",
          "skill": "perf.amortized-reserve"
        },
        {
          "q": "Give the recurrence for an exponential moving average and say why it is attractive on a hot path.",
          "a": "ema = alpha * x + (1 - alpha) * ema, with alpha in (0,1] setting how fast old observations decay. It is one multiply-add, it needs O(1) state and no history buffer at all, and there is no window boundary to handle. So the cost is identical on every tick — which is exactly the property a tail-sensitive path wants, unlike a windowed mean whose cost depends on the window.",
          "level": "warm-up",
          "skill": "perf.incremental-computation"
        },
        {
          "q": "A linear scan of a 64-element array beats a balanced tree lookup on the same data. Explain why, and say how you would find the crossover.",
          "a": "The tree is O(log n) — about six comparisons — but each step dereferences a separately allocated node, so it is six probable cache misses at ~100 ns, and the branch on each comparison is data-dependent and mispredicts. The array scan is O(n) in comparisons but touches only about eight 64-byte lines, the prefetcher streams ahead of it, and the loop branch predicts almost perfectly. To find the crossover I would measure both on the real element type across a range of n on the target machine and report percentiles — it is a hardware property, not a theorem.",
          "level": "core",
          "skill": "perf.complexity-in-cache-terms"
        },
        {
          "q": "Why is Welford's algorithm preferred over accumulating sum and sum-of-squares?",
          "a": "The naive formula computes variance as E[x²] - E[x]², and when the mean is large relative to the spread those two terms are nearly equal, so subtracting them cancels most of the significant digits — you can even get a negative variance. Welford updates the mean and a running M2 term using the deviation from the current mean, so no large-magnitude cancellation occurs. It is still a single pass, O(1) per observation and O(1) state.",
          "level": "core",
          "skill": "perf.incremental-computation"
        },
        {
          "q": "How would you maintain a rolling maximum over the last k ticks in better than O(k) per tick?",
          "a": "With a monotonic deque of indices: before pushing a new element, pop from the back every element smaller than it (they can never be the max again), then pop from the front anything that has fallen out of the window. The front is always the current maximum, and because each element is pushed and popped at most once the cost is amortized O(1) per tick. Rolling sum and mean are easier still — add the entering value and subtract the leaving one.",
          "level": "core",
          "skill": "perf.incremental-computation"
        },
        {
          "q": "A sliding-window counter is given an unsigned nanosecond clock and a window. Where is the bug most people write?",
          "a": "In computing the cutoff as now_ns - window_ns unconditionally. Both are unsigned, so while now_ns is still smaller than the window that subtraction wraps to an enormous value and the counter expires every event it holds — and there is no unsigned value that represents the negative cutoff, so clamping is not a fix either. The correct structure is to only compute and apply the cutoff when now_ns > window_ns, and expire nothing before that point.",
          "level": "core",
          "skill": "cpp.ring-buffer"
        },
        {
          "q": "Your per-tick signal is O(1) and the p50 is excellent, but p99.9 is ten times p50. Where do you look?",
          "a": "O(1) arithmetic cannot produce that spread, so the cost is not in the algorithm — it is something rare and expensive on the same path. The usual suspects, in order: an allocation or container growth I did not notice, a first-touch page fault on state that is only used occasionally, a std::string or map lookup keyed on a symbol, and the OS preempting the thread. I would reproduce it on a fixed recorded tape so it is deterministic, then use the profiler and fault/miss counters rather than reasoning, and accept the fix only if p99.9 moves on that same tape.",
          "level": "senior",
          "skill": "perf.tail-diagnosis"
        },
        {
          "q": "When is it worth giving up an O(1) incremental estimator for a windowed recompute?",
          "a": "When the incremental form is not numerically or semantically equivalent to what you actually want. An EMA never forgets an outlier completely, a running variance over the whole session is not the variance of the last 200 ticks, and an incremental median does not exist in constant state. If the strategy genuinely needs an exact windowed quantile, the honest answer is to compute it off the hot path on a second thread and let on_book read the last published value — you keep the tight tail and pay for the statistic in staleness rather than in latency.",
          "level": "senior",
          "skill": "trading.obi-signal"
        }
      ]
    },
    {
      "n": 8,
      "focus": "Atomics & memory models",
      "tagline": "Two threads, one address space: reason about what one thread's writes another can see — and keep locks off the path that decides your p99.9.",
      "concepts": [
        {
          "title": "Threads share memory, and a data race is undefined behaviour",
          "text": "A std::thread is an independent instruction stream in the same address space — stacks are private, the heap and globals are shared — and the OS interleaves them arbitrarily, so never assume an ordering you did not enforce. When two threads touch the same location, at least one writes, and nothing synchronises them, that is a data race and the standard makes no guarantee at all: not “a stale value” but torn reads, lost updates, or the optimiser caching the variable in a register and deleting your check. ++counter is load, add, store — interleave two threads and the updates vanish silently.",
          "deck": "Deck W9 · slides 5–6"
        },
        {
          "title": "Happens-before is the only rule",
          "text": "Correctness is not about time, it is about the happens-before relation: if A happens-before B then B sees A's writes, and otherwise there is no guarantee whatsoever. Program order gives you sequenced-before within a thread; a release write synchronises-with an acquire read that observes it, across threads; and the relation is transitive, so you chain edges to prove visibility. Never reason “this runs first because it is faster.”",
          "deck": "Deck W9 · slide 7"
        },
        {
          "title": "std::atomic does two separate jobs",
          "text": "It gives you an indivisible operation (no torn or lost values) and a knob for ordering (what *other* memory becomes visible along with it) — do not conflate them. atomic<int> and atomic<T*> are lock-free on real hardware; a large T falls back to a lock, which is what is_lock_free() tells you. The default ordering is seq_cst: correct, strongest, priciest.",
          "code": "std::atomic<long> c{0};\nauto work = [&] { for (int i = 0; i < 100000; ++i)\n                    c.fetch_add(1, std::memory_order_relaxed); };  // atomic, unordered\nstd::thread t1(work), t2(work); t1.join(); t2.join();\nstd::cout << c.load() << ' ' << c.is_lock_free() << '\\n';\n// 200000 1     -- exact, and no mutex was involved",
          "deck": "Deck W9 · slide 9"
        },
        {
          "title": "The memory_order menu, and why reordering exists",
          "text": "Your source order is a suggestion: the compiler moves non-atomic loads and stores to go faster, and the CPU's store buffers and out-of-order execution commit writes in a different order than issued. Both preserve single-threaded results, so the illusion only breaks when another thread looks. memory_order is the contract that tells both layers which reorderings are forbidden — relaxed for a free-running counter, acquire/release to hand data over, seq_cst when you want one global order and will pay for it.",
          "deck": "Deck W9 · slides 10–11"
        },
        {
          "title": "Acquire/release: publishing data safely",
          "text": "This is the pattern under almost every lock-free handoff. Write the payload, then release-store a flag; the consumer acquire-loads the flag and then reads the payload. The release says “everything I did before this is now visible to whoever acquires it”, the acquire says “I see everything the releasing thread did before its store”, and together they build the happens-before edge by hand — no lock required.",
          "code": "int payload = 0; std::atomic<bool> ready{false};\nstd::thread prod([&] { payload = 42;                            // (1) write\n  ready.store(true, std::memory_order_release); });             // (2) publish (1)\nstd::thread cons([&] {\n  while (!ready.load(std::memory_order_acquire)) { }             // (3) acquire\n  std::printf(\"%d\\n\", payload); });                             // (4) sees 42\nprod.join(); cons.join();\n// 42",
          "deck": "Deck W9 · slide 12"
        },
        {
          "title": "Why a mutex on the hot path is a tail bomb",
          "text": "Locks are the easy, correct way to get mutual exclusion, and std::lock_guard makes them RAII-safe — an uncontended lock is cheap. The failure chain is contention: on a busy tick two threads collide, a contended lock can block in the kernel on a futex (a context switch, hundreds of nanoseconds to microseconds), and a low-priority thread holding the lock can stall your hot thread until it is scheduled. Your p50 barely moves; your p99.9 detonates.",
          "deck": "Deck W9 · slides 14–15"
        }
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
        "example": {
          "title": "In the arena",
          "text": "hft/cpp_client/include/arena_client.hpp — the client's own cross-thread state: an atomic session gate the strategy reads on every tick, and a comment that tells you which thread you are on when your handler runs.",
          "code": "// hft/cpp_client/include/arena_client.hpp\n//   Subclass it and override the on_* handlers (HFTBot does exactly this). All\n//   handlers are invoked on IXWebSocket's receive thread; keep them fast and do\n//   not block. The send helpers are thread-safe.\nclass ArenaClient {\npublic:\n    bool session_open() const { return session_open_.load(); }\nprivate:\n    std::atomic<bool> session_open_{false};   // written by the receive thread\n    std::atomic<bool> running_{false};        // read by run()/stop()\n\n    std::mutex lat_mtx_;                      // latency stats: OFF the hot path\n    long long  lat_count_ = 0, lat_sum_ = 0;\n};"
        }
      },
      "interview": [
        {
          "q": "Define a data race, and say what the standard promises when one occurs.",
          "a": "Two threads access the same memory location, at least one of them writes, and there is no happens-before relation ordering the two accesses. The standard promises nothing at all — it is undefined behaviour, so the legal outcomes include a torn value, a lost update, and the optimiser hoisting the variable into a register and deleting a check you wrote. It is not “you might read a stale value”.",
          "level": "warm-up",
          "skill": "cpp.data-races"
        },
        {
          "q": "Does making a variable volatile fix a data race?",
          "a": "No. volatile tells the compiler not to elide or cache accesses to that object — it was designed for memory-mapped hardware registers. It provides no atomicity, so a read-modify-write can still be lost, and it creates no happens-before edge, so it orders nothing with respect to other memory and does not constrain the CPU. The tool for cross-thread communication is std::atomic with an explicit memory_order.",
          "level": "warm-up",
          "skill": "cpp.atomics-memory-order"
        },
        {
          "q": "Explain the acquire/release pattern and what guarantee it buys.",
          "a": "The producer writes a plain payload and then performs a release store on an atomic flag; the consumer performs an acquire load of that flag and, if it observes the stored value, reads the payload. The release store synchronises-with the acquire load, which makes everything sequenced before the store happen-before everything sequenced after the load — so the payload write is guaranteed visible. It is cheaper than seq_cst because it only forbids the reorderings that would break that one handoff.",
          "level": "core",
          "skill": "cpp.atomics-memory-order"
        },
        {
          "q": "When is memory_order_relaxed appropriate, and when is it a bug?",
          "a": "It is appropriate when you need atomicity but no ordering of surrounding memory: a statistics or fill counter that several threads increment and someone reads later, where only the final total matters. It is a bug whenever the atomic is being used to signal that *other* memory is ready, because relaxed creates no happens-before edge and the consumer may see the flag set while the payload writes are still invisible. Rule of thumb: relaxed for data you read, acquire/release for data you publish.",
          "level": "core",
          "skill": "cpp.atomics-memory-order"
        },
        {
          "q": "Why does an uncontended mutex look cheap in a benchmark and still ruin a latency tail in production?",
          "a": "Uncontended, lock and unlock are an atomic exchange and a store — tens of nanoseconds, which is what the benchmark measures. Contended, the loser may block in the kernel on a futex, which means a context switch and a scheduler wake-up: hundreds of nanoseconds to microseconds, and unbounded if a lower-priority thread holds the lock and is not running. Contention correlates with market activity, so the expensive case lands exactly on the ticks you needed to win.",
          "level": "core",
          "skill": "perf.lock-tail-cost"
        },
        {
          "q": "x86 has a relatively strong memory model. Why not just rely on it?",
          "a": "Because it is strong, not sequentially consistent — StoreLoad reordering is permitted, so some missing-barrier bugs still manifest on x86, and the compiler's reordering of non-atomic accesses happens regardless of the hardware model. More practically, code that relies on the hardware will compile for ARM or POWER, whose models are far weaker, and fail there. Writing the ordering you actually need is also free where the hardware already provides it: the compiler emits no barrier instruction.",
          "level": "core",
          "skill": "cpp.atomics-memory-order"
        },
        {
          "q": "How do you find a data race that only appears under load in production?",
          "a": "Not by testing harder — by using a tool that reasons about happens-before rather than timing. I build a separate binary with -fsanitize=thread and drive it with a recorded tape, which makes TSan report the two conflicting accesses, their stacks and the missing synchronisation even if the bad interleaving never occurred. Because TSan is 2–20x slower it lives in CI on a debug build, never in the shipped binary, and clean TSan on the replay is a merge gate.",
          "level": "senior",
          "skill": "tools.thread-sanitizer"
        },
        {
          "q": "Design a single-writer, single-reader handoff of the latest book snapshot with no locks, and say how the reader detects a torn read.",
          "a": "Use a sequence counter alongside a plain payload: the writer increments the sequence with a release store after writing the payload, and the reader acquire-loads the sequence, copies the payload, then acquire-loads the sequence again and accepts the copy only if the two reads agree. A mismatch means the writer was mid-update, so the reader retries — it never blocks and the writer never waits. The stricter version is the seqlock, where the writer makes the sequence odd before writing and even after, so a reader can also reject while a write is in flight; the trade-off is that the reader can starve under a very hot writer, which is acceptable because staleness, not blocking, is the failure mode you want.",
          "level": "senior",
          "skill": "cpp.atomics-memory-order"
        }
      ]
    },
    {
      "n": 9,
      "focus": "Lock-free pipelines",
      "tagline": "Assemble atomics into a real structure: one writer, one reader, a bounded ring, and a tail that holds as the message rate climbs.",
      "concepts": [
        {
          "title": "Compare-and-swap is the atom of lock-free",
          "text": "Every lock-free structure sits on one hardware primitive: an atomic read-modify-write that succeeds only if the value still equals what you expected. You read, compute your update, and retry in a loop if someone changed it underneath you — no thread ever blocks. On failure the expected variable is refreshed with the current value, which is what makes the retry loop work; compare_exchange_weak may fail spuriously and is the cheap choice inside a loop.",
          "code": "std::atomic<int> v{7}; int tries = 0;\nint expected = v.load(), desired;\ndo { desired = expected * 2; ++tries; }        // your update\nwhile (!v.compare_exchange_weak(expected, desired));   // swap only if unchanged\nint stale = 99;                                // a CAS with a stale expected FAILS\nbool ok = v.compare_exchange_strong(stale, 0); // ...and refreshes `stale`\nstd::cout << v.load() << ' ' << tries << ' ' << ok << ' ' << stale << '\\n';\n// 14 1 0 14",
          "deck": "Deck W10 · slide 5"
        },
        {
          "title": "ABA, and what “lock-free” actually promises",
          "text": "CAS compares a value, not a history: if another thread changes A to B and back to A, your CAS succeeds although the world moved — classically a recycled node in a lock-free stack or queue. The fixes are a version counter next to the value (tagged pointers), hazard pointers, or epoch-based reclamation; memory reclamation is the hard part of lock-free, not the algorithm. And the guarantees are a hierarchy: wait-free means every thread finishes in bounded steps, lock-free means at least one thread always progresses, obstruction-free means a thread run in isolation completes.",
          "deck": "Deck W10 · slide 6"
        },
        {
          "title": "The SPSC ring buffer",
          "text": "Single-producer/single-consumer is the sweet spot, because with exactly one writer per index you need no CAS at all — just an atomic head and tail with acquire/release. The producer writes the slot and then release-stores the incremented head; the consumer acquire-loads the head, reads the slot, and release-stores the tail. Power-of-two capacity turns the wrap into a bit mask, and the storage is allocated once.",
          "code": "template <class T, std::size_t N> class Spsc {      // N is a power of two\n  std::array<T, N> buf_{};\n  alignas(64) std::atomic<std::size_t> head_{0};    // producer owns it\n  alignas(64) std::atomic<std::size_t> tail_{0};    // consumer owns it\n public:\n  bool push(const T& v) {\n    auto h = head_.load(std::memory_order_relaxed);\n    if (h - tail_.load(std::memory_order_acquire) == N) return false;  // full\n    buf_[h & (N - 1)] = v;                          // write the slot FIRST\n    head_.store(h + 1, std::memory_order_release);  // then publish the index\n    return true; }                                  // pop() mirrors it with tail_\n};  // pushes 1..5 into Spsc<int,4>, then one pop:  1 1 1 1 0 1 192",
          "deck": "Deck W10 · slides 8, 14"
        },
        {
          "title": "alignas(64) on head and tail is not decoration",
          "text": "The producer writes head on every push and the consumer writes tail on every pop. If those two indices share a cache line, the two cores invalidate each other's copy on every single operation and the line ping-pongs between them — false sharing, and the queue gets slower the harder you use it. Padding each index onto its own line is the difference between a pipeline and a bottleneck.",
          "deck": "Deck W10 · slide 14"
        },
        {
          "title": "Bounded is a feature: back-pressure",
          "text": "When head catches tail the buffer is full and push fails fast, which forces you to make a decision instead of blocking: drop the oldest, drop the newest, or coalesce stale book snapshots into the latest one. An unbounded queue hides a slow consumer until it converts a throughput problem into a memory-and-latency blowout. The related tail-killer is head-of-line blocking: one fat item delays every tick behind it, so keep messages small and fixed-size and do heavy work off the queue.",
          "deck": "Deck W10 · slide 9"
        },
        {
          "title": "The standard coordination primitives",
          "text": "C++20 ships what people used to hand-roll: std::latch is a one-shot gate you count down to zero, std::barrier is a reusable rendezvous for looping workers, and counting_semaphore bounds how many threads hold a resource. Separately, since C++17 the STL algorithms take an execution policy — seq, par, par_unseq — which moves a loop to many cores or to SIMD lanes, but the overhead only pays off on large n, so measure rather than assume.",
          "deck": "Deck W10 · slides 11–12"
        }
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
        "example": {
          "title": "In the arena",
          "text": "course/hft-columbia/project-starter/include/spsc_ring.hpp — HW10 and project Phase 3. The stub spells out the three requirements that make it correct and fast: power-of-two capacity, acquire/release on the indices, and alignas(64) to stop false sharing.",
          "code": "// project-starter/include/spsc_ring.hpp\n// HW10 / Project Phase 3 - single-producer/single-consumer lock-free ring.\nstruct SPSCRing {\n    explicit SPSCRing(std::size_t capacity_pow2) {\n        // TODO(student): allocate a power-of-two buffer; atomic head/tail\n        // (acquire/release); pad indices (alignas(64)) to avoid false sharing.\n    }\n    bool push(std::uint64_t v);      // false if full  -> back-pressure\n    bool pop(std::uint64_t& out);    // false if empty\n    bool empty() const;\n    bool full()  const;\n};"
        }
      },
      "interview": [
        {
          "q": "What does compare_exchange do, and why is it always written in a loop?",
          "a": "It atomically compares the object with an expected value and, only if they are equal, replaces it with the desired value; it returns whether it succeeded and, on failure, updates expected with the value actually seen. It lives in a loop because failure means someone else modified the object, so you recompute your update from the refreshed value and try again. That retry-instead-of-block structure is what makes it lock-free.",
          "level": "warm-up",
          "skill": "cpp.compare-and-swap"
        },
        {
          "q": "What is the difference between compare_exchange_weak and compare_exchange_strong?",
          "a": "weak is allowed to fail spuriously — it can return false even when the value did match, typically because the underlying load-linked/store-conditional was interrupted. strong guarantees it only fails on a genuine mismatch, and on some architectures it implements that with its own internal loop. So you use weak inside a retry loop you were writing anyway, and strong for a single one-shot attempt whose result you want to branch on.",
          "level": "warm-up",
          "skill": "cpp.compare-and-swap"
        },
        {
          "q": "Why does a single-producer/single-consumer queue need no CAS?",
          "a": "Because each index has exactly one writer: the producer is the only thread that modifies head and the consumer the only one that modifies tail, so there is no read-modify-write contention to resolve. Each side does a plain load of its own index, an acquire load of the other side's index to check space or availability, the slot access, and a release store of its own index. All the synchronisation you need is the acquire/release pairing that orders the slot access against the index publication.",
          "level": "core",
          "skill": "perf.spsc-ring"
        },
        {
          "q": "In an SPSC ring's push, which memory orders go where, and why?",
          "a": "The producer loads its own head relaxed — nobody else writes it, so no ordering is needed. It acquire-loads tail, so that it observes the consumer's release store and therefore knows the slot it is about to overwrite has really been read. It writes the slot, then release-stores head + 1, so that the slot write cannot be reordered after the index publication — which is what guarantees the consumer never reads a slot before its data is visible. Getting the release on head wrong is the classic bug, and it usually still passes on x86.",
          "level": "core",
          "skill": "perf.spsc-ring"
        },
        {
          "q": "Why must the capacity be a power of two, and why are head and tail alignas(64)?",
          "a": "A power-of-two capacity lets the wrap be pos & (N - 1) instead of pos % N, replacing a division with a single-cycle AND on the hottest line of the queue. The alignment is about false sharing: the producer writes head on every push and the consumer writes tail on every pop, so if they share a 64-byte line the two cores invalidate each other's copy on every operation and the queue degrades the harder you drive it. Padding each index onto its own line removes the coherence traffic entirely.",
          "level": "core",
          "skill": "perf.false-sharing"
        },
        {
          "q": "The queue is full. What are your options, and which one fits market data?",
          "a": "Block the producer (never, on a receive thread), grow without bound (converts latency failure into a memory failure), drop the newest, drop the oldest, or coalesce. For top-of-book snapshots, coalescing is the right answer: a newer snapshot supersedes an older one, so overwriting the pending entry keeps you current and bounded at the same time. For fills or acks, which are not idempotent, you cannot drop — so those go on a separately sized queue, and a full one is an alertable incident rather than a policy decision.",
          "level": "core",
          "skill": "perf.back-pressure"
        },
        {
          "q": "What is the ABA problem, and does it affect an SPSC ring buffer?",
          "a": "ABA is when a CAS succeeds because the value it compares has returned to its original bit pattern even though the structure has changed underneath — classically a freed and recycled node in a lock-free stack, where the old head pointer looks valid but no longer means the same thing. It does not affect an SPSC ring, for two reasons: the ring does no CAS at all, and its indices are monotonically increasing counters rather than recycled pointers, so a stale index is detectably stale rather than accidentally equal. That is a strong argument for preferring index-based bounded structures over pointer-based unbounded ones: you avoid the entire memory-reclamation problem — hazard pointers, epochs, tagged pointers — which is where most real lock-free bugs live.",
          "level": "senior",
          "skill": "cpp.lock-free-guarantees"
        },
        {
          "q": "Is “lock-free” the same as “fast”? When would you deliberately choose a mutex?",
          "a": "No — lock-free is a progress guarantee, not a performance claim: it says no thread's stall can block the whole system, and under heavy contention a CAS retry loop can burn more cycles and cache traffic than a well-behaved lock. I would choose a mutex whenever the section is off the tick path, or when the critical section is long enough that spinning wastes a core, or when the structure needs multiple writers and correctness is easier to prove with exclusion. The rule I apply is that lock-free is for the single path whose tail I am graded on, and correct-and-simple wins everywhere else.",
          "level": "senior",
          "skill": "cpp.lock-free-guarantees"
        }
      ]
    },
    {
      "n": 10,
      "focus": "Networking, market data & serialization",
      "tagline": "Something put those bytes on your socket: know the format, the transport, where a message ends — and stop paying full price to read it.",
      "concepts": [
        {
          "title": "FIX: tag=value, the readable ancestor",
          "text": "FIX is a stream of integer-tagged fields separated by the SOH byte (0x01), with a session layer of sequence numbers, heartbeats and resends on top. It is self-describing and still ubiquitous for order entry — and it is text, so reading it means scanning every byte and converting ASCII digits to numbers. That per-byte scan plus digit math is the slow path this session is about escaping.",
          "code": "const char* msg = \"35=D\\00155=NVDA\\00154=1\\00138=200\\00144=182.50\\001\";\nfor (const char* p = msg; *p; ) {\n  int tag = 0;\n  while (*p != '=') tag = tag * 10 + (*p++ - '0');    // digit math, per byte\n  const char* v = ++p;                                // skip '='\n  while (*p && *p != '\\001') ++p;                     // scan to the SOH\n  if (tag == 55 || tag == 44) std::printf(\"%d=%.*s \", tag, int(p - v), v);\n  if (*p) ++p;                                        // skip the SOH\n}\nstd::puts(\"\");\n// 55=NVDA 44=182.50",
          "deck": "Deck W11 · slides 5, 15"
        },
        {
          "title": "Fixed-width binary: decode is a copy, not a parse",
          "text": "Fast venues abandon text. ITCH/OUCH-style messages have a known length and known field offsets, prices are scaled integers rather than ASCII, and the wire is big-endian — so decoding is a memcpy plus a byte swap, with no delimiter scan, no atoi and no allocation. Pack the struct so there is no padding, static_assert its size, and bounds-check the frame before you read it.",
          "code": "#pragma pack(push, 1)\nstruct AddOrder { uint8_t type; uint64_t id; uint8_t side; uint32_t qty; uint32_t px; };\n#pragma pack(pop)\nstatic_assert(sizeof(AddOrder) == 18, \"fixed width, no padding\");\nunsigned char w[18]{}; w[0] = 'A'; w[9] = 'B';\nuint64_t id = __builtin_bswap64(7);       std::memcpy(w + 1,  &id, 8);  // big-endian\nuint32_t q  = __builtin_bswap32(200);     std::memcpy(w + 10, &q,  4);\nuint32_t p  = __builtin_bswap32(1825000); std::memcpy(w + 14, &p,  4);  // scaled int\nAddOrder m; std::memcpy(&m, w, sizeof m);              // decode = a copy, no parse\nstd::printf(\"%c%c %u %.2f\\n\", m.type, m.side, __builtin_bswap32(m.qty),\n            __builtin_bswap32(m.px) / 10000.0);\n// AB 200 182.50     -- no delimiter scan, no atoi, no allocation",
          "deck": "Deck W11 · slides 6, 16"
        },
        {
          "title": "TCP for orders, UDP multicast for data",
          "text": "The two directions make opposite choices for good reasons. Order entry uses TCP: one stream to the engine, reliable and ordered, because you must not lose an order — and TCP's ordering is also its weakness, since one lost packet stalls everything behind it. Market data ships as UDP multicast: the exchange sends each update once and the network fans it out, fast but lossy, so you detect gaps from sequence numbers and recover yourself. Venues often send two identical A/B streams on separate paths and you take whichever packet arrives first.",
          "deck": "Deck W11 · slide 9"
        },
        {
          "title": "Framing: a socket is a byte stream, not a message stream",
          "text": "TCP does not preserve your send boundaries, so recv can return half a message or two and a half. The single most common networking bug is assuming one read equals one message; the correct shape is to accumulate into a reusable buffer, dispatch only complete frames, and keep the partial tail. A length prefix makes the boundary unambiguous and is the venue standard; a delimiter like FIX's SOH means scanning every byte and escaping the delimiter in payloads.",
          "code": "// one recv() delivered 1.5 messages: [len][payload] frames\nunsigned char in[] = {3,'a','b','c', 4,'d','e','f'};      // the 2nd frame is short\nstd::size_t len = sizeof in, off = 0, done = 0;\nwhile (off + 1 <= len && off + 1 + in[off] <= len) {      // a FULL frame present?\n  std::printf(\"%.*s \", int(in[off]), (const char*)&in[off + 1]);\n  off += 1 + in[off]; ++done;\n}\nstd::printf(\"| framed=%zu leftover=%zu\\n\", done, len - off);\n// abc | framed=1 leftover=4     -- the partial tail waits for the next read",
          "deck": "Deck W11 · slide 12"
        },
        {
          "title": "What a general DOM parser costs you",
          "text": "A library like nlohmann/json is correct and lovely and does far more work than the hot path can afford: it parses the whole frame including fields you never read, builds a tree of heap nodes (maps, vectors, std::strings) — dozens of allocations per message — and copies keys and values out of the wire buffer into owned strings. You control both ends of a handful of message shapes, so scan once for the keys you need, read the number in place, and point string_views at the wire bytes instead of copying.",
          "code": "std::string_view f =\n  R\"({\"type\":\"book_snapshot\",\"bid\":100.00,\"ask\":100.02,\"mid_price\":100.01})\";\nauto num = [f](const char* key) {                     // no DOM, no allocation\n  auto k = f.find(key);\n  if (k == std::string_view::npos) return 0.0;\n  return std::strtod(f.data() + k + std::strlen(key), nullptr);   // parse in place\n};\nstd::printf(\"%.2f %.2f %.2f\\n\", num(\"\\\"bid\\\":\"), num(\"\\\"ask\\\":\"), num(\"\\\"mid_price\\\":\"));\n// 100.00 100.02 100.01     -- three fields read, the rest of the frame skipped",
          "deck": "Deck W12 · slides 10–11, 17"
        },
        {
          "title": "Non-blocking I/O, and batching versus latency",
          "text": "A blocking read parks your thread until bytes arrive, which on the hot path is death. Set O_NONBLOCK and read returns EAGAIN immediately when nothing is ready; epoll (Linux) or kqueue (BSD/macOS) then tells you exactly which descriptors became readable, so one thread multiplexes many sockets with no context-switch tax — and with edge-triggered notification you must drain the socket fully. The related trade-off is batching: grouping messages amortises per-message cost and lifts throughput, but every batch you hold is latency you added, which is why TCP_NODELAY belongs on the order path and batching belongs on the cold path.",
          "deck": "Deck W12 · slides 5–6, 8, 15"
        }
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
        "example": {
          "title": "In the arena",
          "text": "course/hft-columbia/project-starter/include/fix_parser.hpp and u64toa.hpp — the two halves of the week, as stubs: a single-pass parser with no per-message allocation on the way in, and a hand-rolled integer-to-text writer that has to beat snprintf on the way out.",
          "code": "// project-starter/include/fix_parser.hpp\n// HW11 - a high-performance FIX parser (SOH-delimited tag=value;\n//        tags 11/55/54/38/44).\nstruct NewOrder {\n    const char* clordid; int clordid_len;   // tag 11 - a VIEW, not a copy\n    char symbol[16]; char side;             // tags 55, 54\n    uint32_t qty; double price;             // tags 38, 44\n};\n// Single pass, no per-message allocation. Return false on a malformed message.\ninline bool parse_new_order(const char* buf, int len, NewOrder& out);\n\n// project-starter/include/u64toa.hpp\n// HW12 - fast uint64 -> decimal text. Write the digits into out; return length.\n//        Beat snprintf/std::to_string; handle 0 and UINT64_MAX.\ninline int u64toa(std::uint64_t v, char* out);"
        }
      },
      "interview": [
        {
          "q": "Why do venues ship market data over UDP multicast but take orders over TCP?",
          "a": "Multicast means the exchange sends each update once and the network replicates it to every subscriber, which is the only way to fan a firehose out to hundreds of consumers cheaply — and UDP does not retransmit, so one lost packet does not stall the ones behind it. Order entry is a single stream to the engine where losing a message is unacceptable, so TCP's reliability and ordering are worth its head-of-line blocking. The cost of the data choice is that you must detect loss yourself from sequence numbers and recover.",
          "level": "warm-up",
          "skill": "perf.transport-choice"
        },
        {
          "q": "Why is fixed-width binary faster to decode than tag=value text?",
          "a": "Every field is at a known offset in a known-length message, so there is no delimiter to scan for and no ASCII-to-number conversion: you copy the bytes into a packed struct and byte-swap the integers. Prices are scaled integers rather than decimal strings, so there is no atof and no floating-point parse. It is also far fewer bytes on the wire, which matters for a feed measured in millions of messages per second.",
          "level": "warm-up",
          "skill": "trading.binary-market-data"
        },
        {
          "q": "What is wrong with assuming one recv() returns one message?",
          "a": "TCP is a byte stream and does not preserve send boundaries, so a read can deliver half a message, one and a half, or several — it is the most common networking bug there is. The correct structure is to append into a persistent buffer, loop while a complete frame is present, dispatch each one, and compact the partial remainder so the next read continues it. With a length prefix “complete” is a cheap arithmetic check; with a delimiter you must scan.",
          "level": "core",
          "skill": "tools.message-framing"
        },
        {
          "q": "Length-prefix or delimiter framing — which would you choose and why?",
          "a": "Length-prefix, for anything I control. You read the header, learn exactly how many bytes the message is, and you never scan the payload — it is unambiguous, binary-safe, and lets you validate the size before allocating or indexing. Delimiter framing forces a byte-by-byte scan and forces you to escape the delimiter if it can appear in the payload, which is a whole class of bug. The one thing a length prefix demands is that you bounds-check it: a hostile or corrupt length is a buffer overrun.",
          "level": "core",
          "skill": "tools.message-framing"
        },
        {
          "q": "Concretely, what does a DOM-style JSON parser do that a targeted extractor does not?",
          "a": "It parses the entire document, including every field you will never read; it materialises a tree of heap-allocated nodes — maps, vectors, std::strings — which is dozens of allocations per message; and it copies keys and values out of the receive buffer into owned storage. A targeted extractor scans once for the specific keys it wants, converts the number in place, and hands back a string_view aliasing the wire bytes, so it allocates nothing. The trade you accept is that you now own schema assumptions the library would have checked.",
          "level": "core",
          "skill": "perf.zero-copy-parse"
        },
        {
          "q": "What is the difference between level-triggered and edge-triggered readiness, and what must you do differently?",
          "a": "Level-triggered means the event loop keeps reporting the descriptor while data remains, so a partial read is safe and you will simply be told again. Edge-triggered reports only the transition to readable, which means far fewer wakeups but you must drain the socket in a loop until read returns EAGAIN — if you stop early, the remaining bytes sit there and you are never notified again. EAGAIN is therefore not an error in that loop; it is the signal that readiness is exhausted.",
          "level": "core",
          "skill": "perf.nonblocking-io"
        },
        {
          "q": "Your feed's sequence number jumps from 1000 to 1005. What do you do?",
          "a": "Treat the book as untrustworthy immediately and stop trading that instrument — a silently stale book is far more expensive than a missed opportunity. Then recover by the venue's mechanism: request a retransmission of 1001–1004 if the feed supports it, or take a fresh snapshot and replay increments from its sequence onward. If the venue publishes A/B streams, check the other path first, since the packet is often simply not lost on both. Only resume once the next-expected sequence is contiguous again, and count the event so a rising gap rate becomes visible.",
          "level": "senior",
          "skill": "trading.feed-sequencing"
        },
        {
          "q": "You are told to improve throughput by batching outbound orders. What do you say?",
          "a": "That it is the right optimisation applied to the wrong path. Batching amortises the per-message fixed cost — one syscall, one pass — which is exactly right for logging, telemetry and anything nobody is timing, but every message held to form a batch is queueing latency you added, and on the order path that is the number I am graded on. Nagle's algorithm is the same trade made for me by the kernel, which is why TCP_NODELAY goes on the order socket. So: batch the cold path, send the hot path immediately, and if throughput is genuinely the constraint, fix it by shrinking per-message work rather than by grouping.",
          "level": "senior",
          "skill": "perf.batching-vs-latency"
        }
      ]
    },
    {
      "n": 11,
      "focus": "SIMD, kernel bypass & colocation",
      "tagline": "The software path is tight; now the machine is the bottleneck — do more per cycle, get the OS out of the way, and buy the rest.",
      "concepts": [
        {
          "title": "The memory wall: cache and TLB",
          "text": "An L1 hit is about four cycles and a main-memory miss is 200 or more, so on the hot path you are memory-bound, not compute-bound. Memory moves in 64-byte lines, so pack the fields you read together and split hot from cold; linear access lets the hardware prefetcher run ahead while pointer-chasing defeats it. Virtual-to-physical translations are cached too, and a TLB miss walks the page table — which is what huge pages are for.",
          "deck": "Deck W13 · slide 5"
        },
        {
          "title": "Prefetching: hiding the miss",
          "text": "The hardware prefetcher handles regular strides automatically but cannot see an irregular or data-dependent access coming. __builtin_prefetch(addr, rw, locality) is a hint that pulls a line toward the cache now: no fault, no stall, no effect on correctness — only on timing. The distance is a tuning knob, because too near and the line has not arrived while too far and it is evicted before use, so you measure with cache-miss counters instead of guessing.",
          "code": "constexpr int N = 1 << 16;\nstd::vector<int> v(N, 1);\nlong s = 0;\nfor (int i = 0; i < N; ++i) {\n  if (i + 64 < N) __builtin_prefetch(&v[i + 64], 0, 0);   // a hint, not a load\n  s += v[i];\n}\nstd::printf(\"%ld %zu %d\\n\", s, 64 / sizeof(int), 64 * int(sizeof(int)));\n// 65536 16 256     -- 16 ints per 64B line; this hint runs 256B ahead",
          "deck": "Deck W13 · slide 6"
        },
        {
          "title": "SIMD: one instruction, many lanes",
          "text": "A vector register holds several values at once — an AVX2 register is 256 bits, so eight floats or four doubles per operation, and a single fmadd does a multiply and an add across all lanes. At -O3 -march=native the compiler auto-vectorises clean loops for free, and fails on branches, aliasing and unknown trip counts; intrinsics like _mm256_load_ps give explicit control when it will not. Aligned loads need genuinely aligned data, which is what alignas(32) is for.",
          "code": "alignas(32) float obi[8] = {.6f, -.2f, .1f, .4f, -.5f, .3f, .0f, .2f};\nalignas(32) float w[8]   = { 1,   1,    1,   1,  .5f, .5f, .5f, .5f};\nfloat acc = 0;\nfor (int i = 0; i < 8; ++i) acc += obi[i] * w[i];  // -O3 -march=native: 8 lanes\nstd::printf(\"%.3f %d %zu\\n\", acc, int((uintptr_t)obi % 32), sizeof(obi));\n// 0.900 0 32     -- the 0 is the proof the buffer really is 32-byte aligned",
          "deck": "Deck W13 · slides 7, 16"
        },
        {
          "title": "Syscalls, busy-poll and interrupts",
          "text": "A syscall is a mode switch that flushes pipelines and pollutes caches: hundreds of nanoseconds, sometimes microseconds under load, so the cheapest syscall on the hot path is the one you never make. That is why HFT spins: a dedicated core polling the NIC flat-out gives the lowest and most deterministic latency, at the cost of 100% CPU, while an interrupt-driven design is power-friendly but adds wake-up latency and jitter. An IRQ arriving mid-race preempts you at the worst possible moment.",
          "deck": "Deck W13 · slide 9"
        },
        {
          "title": "Kernel bypass: skip the stack",
          "text": "The Linux network stack is general-purpose overhead — it copies, checks and routes every packet through generic layers. Kernel bypass maps the NIC into user space so packets never touch the kernel: DPDK is a poll-mode driver where your process owns the card and busy-polls the RX queues, Solarflare/Onload is an LD_PRELOAD shim that accelerates ordinary BSD sockets with almost no code change, and io_uring is not full bypass but batches syscalls through shared submit/complete rings to cut mode switches.",
          "deck": "Deck W13 · slide 10"
        },
        {
          "title": "Own the core, keep memory close",
          "text": "Determinism comes from control. Pin the hot thread to one core so the scheduler cannot migrate it and cool its caches; isolate that core (isolcpus, nohz_full, rcu_nocbs) so nothing else — not even the scheduler tick — runs there. On a multi-socket box, NUMA means remote memory is much slower, so allocate node-local to the socket that owns the NIC. Huge pages cut TLB misses because fewer entries cover more memory, and pre-faulting plus mlock means no page fault ever lands mid-race.",
          "deck": "Deck W13 · slide 11"
        }
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
        "example": {
          "title": "In the arena",
          "text": "course/hft-columbia/starters/hw13/kernel.cpp — the frozen HW13 kernel. You may not touch the source; the assignment is to find the flags that make it fast and explain with perf stat why each one helped.",
          "code": "// starters/hw13/kernel.cpp   >>> DO NOT MODIFY THIS FILE. <<<\n//  Your job is to find the COMPILER FLAGS that make it run fastest.\n//  The kernel is a floating-point reduction with a data-dependent branch - it\n//  responds well to -O2/-O3, -march=native (SIMD), -funroll-loops, -flto, and\n//  profile-guided optimization (PGO) on the branch. Try them and measure.\nstatic double kernel(const std::vector<float>& a, const std::vector<float>& b) {\n    double acc = 0.0;\n    for (int iter = 0; iter < 3000; ++iter) {\n        for (std::size_t i = 0; i < a.size(); ++i) {\n            float x = a[i] * b[i] + 0.5f * a[i];\n            if (x > 0.0f) acc += std::sqrt(x);   // branch a profile can predict\n            else          acc -= x;\n        }\n    }\n    return acc;\n}"
        }
      },
      "interview": [
        {
          "q": "Roughly what does an L1 hit cost versus a main-memory miss, and what follows from that?",
          "a": "An L1 hit is a handful of cycles — about a nanosecond — and a miss all the way to DRAM is on the order of 100 ns, or 200-plus cycles, during which the core stalls. Each level of the hierarchy is roughly an order of magnitude slower than the one above. What follows is that on a hot path you are memory-bound: the layout that decides how many lines you touch matters more than the instruction count, and one avoidable miss costs more than a hundred arithmetic operations.",
          "level": "warm-up",
          "skill": "perf.memory-hierarchy"
        },
        {
          "q": "What does __builtin_prefetch do, and can it change your program's behaviour?",
          "a": "It emits a hint asking the hardware to start bringing a cache line toward the cache now, so the data is closer by the time you actually load it. It cannot fault, does not stall, and has no semantic effect at all — only a timing effect, which is why a wrong hint merely wastes memory bandwidth rather than breaking correctness. The distance you prefetch ahead is the tuning parameter, and you validate it with cache-miss counters rather than by reasoning.",
          "level": "warm-up",
          "skill": "perf.prefetch"
        },
        {
          "q": "Why does the compiler fail to auto-vectorise a loop, and what do you do about it?",
          "a": "Usually because it cannot prove the transformation is safe or profitable: data-dependent branches in the body, possible pointer aliasing between input and output, a trip count it cannot reason about, a reduction over floating point where reassociation changes the result, or non-contiguous access. The first step is to ask it why — -Rpass-analysis=loop-vectorize on clang, -fopt-info-vec-missed on gcc — and then remove the obstacle: restrict or __restrict, a known multiple-of-width trip count, hoisting the branch out, or splitting the loop. Writing intrinsics is the last resort, because then you own the layout and the alignment forever.",
          "level": "core",
          "skill": "perf.simd"
        },
        {
          "q": "Why does HFT busy-poll instead of blocking on the socket?",
          "a": "Because blocking means the kernel parks the thread and must wake it when data arrives, and that wake-up path — interrupt, scheduler, context switch — adds both latency and jitter, exactly the variance you are trying to eliminate. A dedicated core spinning on the NIC's receive queue sees the packet as soon as it lands and never leaves user space, so the cost is low and, more importantly, nearly constant. The price is a core burned at 100% and the power that goes with it, which is a trade a trading firm will happily make.",
          "level": "core",
          "skill": "perf.syscall-cost"
        },
        {
          "q": "What does kernel bypass actually change, and what does it cost you?",
          "a": "It maps the NIC's queues into user space so packets skip the kernel's generic network stack entirely — no per-packet copies, no protocol layers, no syscall on the receive path. DPDK gives the most control and the highest throughput but you own the driver-level code and often the protocol handling; an Onload-style LD_PRELOAD shim accelerates the ordinary sockets API with almost no code change but ties you to that vendor's NIC. The costs are vendor lock-in, a dedicated core, losing the kernel's tooling and protection, and a much larger surface you have to get right yourself.",
          "level": "core",
          "skill": "perf.kernel-bypass"
        },
        {
          "q": "Why pin a thread to a core, and why isolate the core as well?",
          "a": "Pinning stops the scheduler migrating the thread to another core, which would leave its warm L1 and L2 behind and restart it cold — a migration mid-race is a visible tail event. Isolating the core goes further and removes everything else from it: isolcpus keeps other tasks off, nohz_full stops the periodic scheduler tick, and moving IRQ affinity elsewhere stops interrupts preempting you. Pinning without isolation still leaves you sharing the core with kernel threads and timers, which is usually where the remaining jitter lives.",
          "level": "core",
          "skill": "perf.cpu-pinning-numa"
        },
        {
          "q": "Why is NTP inadequate for HFT measurement, and what replaces it?",
          "a": "NTP synchronises to milliseconds, and the quantities we care about are single-digit microseconds, so cross-machine timestamps under NTP are noise. PTP (IEEE 1588) uses hardware assistance in NICs and switches to get sub-microsecond alignment from a shared grandmaster, which makes timestamps taken on different boxes comparable. And for wire-honest numbers you want NIC hardware timestamping (SO_TIMESTAMPING), because a user-space clock read already includes scheduling and cache noise that the packet never experienced.",
          "level": "senior",
          "skill": "perf.hardware-timestamping"
        },
        {
          "q": "You have a fixed budget and can either vectorise the hot loop or buy colocation. How do you decide?",
          "a": "By measuring what each one is worth on the same input, in the same units, before spending anything. The code change I can A/B offline: same recorded tape, release build with and without the SIMD path, and compare p99.9 — if the tail does not move, the change did not matter, however elegant it is. Colocation's value is a wire delay the venue applies, so it is an expected p99.9 reduction I can quote from the tier difference, and the question becomes cost per microsecond of tail for each option. Usually the code is cheaper first and the hardware is the tiebreaker once the software path is already lean — spending on colocation while a per-tick allocation sits in on_book is buying nanoseconds to hide microseconds.",
          "level": "senior",
          "skill": "trading.colocation"
        }
      ]
    },
    {
      "n": 12,
      "focus": "Profiling & the latency tail",
      "tagline": "Stop guessing. Measure where the cycles and the milliseconds go, kill the spikes, and ship a binary you can prove is fast.",
      "concepts": [
        {
          "title": "Why the mean lies",
          "text": "Latency distributions are not Gaussian — they are heavy-tailed and usually bimodal: a tight fast body plus rare catastrophic stalls from a fault, a miss or a preemption. The mean lands in the valley between the two clusters and describes no tick anyone experienced. Report the distribution; and beware coordinated omission, where a naive timer under-samples slow events and hides the tail it was supposed to find.",
          "code": "std::vector<long> us(1000, 38);                       // the fast body\nfor (int i = 990; i < 996; ++i) us[i] = 71;\nfor (int i = 996; i < 999; ++i) us[i] = 210;\nus[999] = 5200;                                       // the tick you lost\nstd::sort(us.begin(), us.end());\ndouble mean = std::accumulate(us.begin(), us.end(), 0.0) / us.size();\nauto p = [&](double q) { return us[std::size_t(q * us.size())]; };\nstd::printf(\"mean=%.2f p50=%ld p99=%ld p99.9=%ld max=%ld\\n\",\n            mean, p(.50), p(.99), p(.999), us.back());\n// mean=43.88 p50=38 p99=71 p99.9=5200 max=5200",
          "deck": "Deck W14 · slide 5"
        },
        {
          "title": "perf: stat, record, report, annotate",
          "text": "Linux perf is the free, low-overhead sampling profiler and you should know four verbs cold. perf stat gives you totals — cycles, IPC, cache and branch misses — and is always the cheap first move. perf record samples call stacks over time, perf report ranks the hot symbols, and perf annotate shows cost per source line. Because overhead is low it is safe to run near production; you drive it against a deterministic replay so the profile is reproducible.",
          "deck": "Deck W14 · slide 6"
        },
        {
          "title": "Flame graphs and hardware counters",
          "text": "A flame graph folds thousands of stacks into one picture where width is time spent, so wide plateaus are the targets and tall spikes are merely deep. Counters then tell you *why* a frame is hot: cache-misses and LLC-load-misses point at a memory problem (a DRAM miss is 200-plus cycles), branch-misses point at an unpredictable branch (a flush is 15–20 cycles), and rdtsc or steady_clock around a micro-section gives you exact in-code timing for the few lines you care most about.",
          "deck": "Deck W14 · slides 7–8"
        },
        {
          "title": "Every tail spike has a physical cause",
          "text": "Learn the signatures and each fix becomes targeted and permanent. Allocation stalls: malloc locks, walks free lists or calls the kernel — pre-allocate and pool. Page faults: a first-touch or swapped page traps into the kernel for microseconds — pre-fault and mlock the hot memory. NUMA: a load from another socket's memory costs far more — pin threads and allocate node-local. TLB misses: random access over a large working set forces a page walk — use huge pages.",
          "deck": "Deck W14 · slide 10"
        },
        {
          "title": "Jitter is the OS deciding your thread can wait",
          "text": "The rarest and ugliest tail events come from preemption: the scheduler parks your thread and a millisecond disappears. Interrupts, the timer tick and kernel threads steal cycles too. The direct measurement is a jitter probe — a tight loop timing an empty section reveals what the OS takes even when you do nothing — and the remedy is session 11's toolkit: pin, isolate, poll instead of blocking, and warm everything (touch pages, prime caches) before SESSION_OPEN so the first live tick is not the slow one.",
          "deck": "Deck W14 · slide 11"
        },
        {
          "title": "Build for the tail, and ship it clean",
          "text": "Once the algorithm is right, let the toolchain finish the job: -O3 for vectorisation and inlining, -march=native for this CPU's instruction set (so the binary is not portable), -flto for whole-program optimisation, -DNDEBUG to strip asserts, and keep -g because symbols cost nothing at run time and make profiles readable. PGO adds real branch data in a second pass, which splits hot from cold code and improves layout. Separately, sanitizer builds (ASan/UBSan, and TSan in its own binary) gate correctness in CI — they are 2–20x slower and must never ship — and logging goes off the hot path: the hot thread pushes a fixed-size binary record into a lock-free ring and a separate thread formats and writes it.",
          "deck": "Deck W14 · slides 12, 14–16"
        }
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
        "example": {
          "title": "In the arena",
          "text": "course/hft-columbia/starters/hw14/tail.cpp — the HW14 program whose median is fine and whose tail is ugly, with the pathology sitting in plain sight: a fresh allocation and an O(window) recompute on every single tick.",
          "code": "// starters/hw14/tail.cpp\n// Its median is fine, but the TAIL is ugly - there is (at least) one avoidable\n// pathology on the hot path that blows up p99.9. PROFILE it, find what spikes\n// the tail, and FIX it in a copy. Do NOT just crank compiler flags.\nstatic double signal(const std::vector<double>& prices,\n                     std::size_t i, std::size_t window) {\n    std::size_t lo = i >= window ? i - window : 0;\n    std::vector<double> scratch;            // <-- allocates every single tick\n    for (std::size_t k = lo; k <= i; ++k) scratch.push_back(prices[k]);\n    double s = 0.0;\n    for (double v : scratch) s += v;        // <-- O(window) recompute per tick\n    return s / scratch.size();\n}"
        }
      },
      "interview": [
        {
          "q": "Why report percentiles instead of a mean for latency?",
          "a": "Because the distribution is heavy-tailed and usually bimodal — a tight fast body plus rare multi-millisecond stalls — so the mean sits between the two modes and corresponds to no real observation. Percentiles describe the shape: p50 tells you the common case, p99 and p99.9 tell you what happens on the busy ticks that decide races, and the max tells you the worst thing your system did. A 40 µs mean with a 5 ms p99.9 and a 40 µs mean with a 45 µs p99.9 are completely different systems.",
          "level": "warm-up",
          "skill": "trading.tick-to-trade"
        },
        {
          "q": "Which perf command do you run first on a slow binary, and why that one?",
          "a": "perf stat, because it is almost free and immediately tells you what kind of problem you have: cycles and instructions give you IPC, and the cache-miss, branch-miss and page-fault counters say whether you are memory-bound, mispredicting, or faulting. Only then do I sample with perf record -g and read perf report, because sampling tells me *where* while the counters tell me *why*. Going straight to a flame graph without stat often means optimising a wide frame for the wrong reason.",
          "level": "warm-up",
          "skill": "tools.perf-profiler"
        },
        {
          "q": "How do you read a flame graph, and what is the classic misreading?",
          "a": "The x-axis is not time — it is aggregated sample count, sorted for merging — so width means total time attributed to that frame and its children, and the y-axis is stack depth. You look for wide plateaus, because those are where the cycles are. The classic misreading is chasing tall towers: depth only means a deep call stack, and a narrow spike is irrelevant however dramatic it looks. The second trap is profiling a build without frame pointers or symbols, which silently collapses stacks into nonsense.",
          "level": "core",
          "skill": "tools.flame-graph"
        },
        {
          "q": "Name the usual physical causes of a latency tail and how you distinguish them.",
          "a": "Allocation (malloc locking, walking free lists or calling the kernel), page faults on first touch or swapped memory, NUMA-remote loads, TLB misses over a big working set, and OS preemption or interrupts. You distinguish them with counters rather than intuition: minor/major fault counts for faults, cache and LLC miss counters plus NUMA-local vs remote for memory, dTLB-load-misses for the TLB, and a jitter probe — a tight loop timing an empty section — for scheduler noise. Each one has a different fix, which is why naming it first matters.",
          "level": "core",
          "skill": "perf.tail-diagnosis"
        },
        {
          "q": "What is coordinated omission and why does it matter?",
          "a": "It is the bias you get when your measurement loop only starts the next timer after the previous operation finished: while the system is stalled you take no samples, so precisely the slow period is under-represented and the tail you report is far better than the tail your counterparty experienced. The fix is to sample on a fixed schedule — measure against the time the work *should* have started — and to record the backlog rather than skipping it. It is the reason a naive request-to-request benchmark can show a clean p99.9 on a system that visibly stutters.",
          "level": "core",
          "skill": "perf.tail-diagnosis"
        },
        {
          "q": "Why do you keep -g in a release build, and what do -march=native and -flto buy you?",
          "a": "Debug symbols do not change the generated code or slow it down; they just make perf, flame graphs and core dumps readable, so stripping them costs you diagnosis for nothing. -march=native lets the compiler emit this CPU's instruction set — AVX2 and friends — which is a real win for vectorisable loops, at the price of a binary that may illegal-instruction on a different microarchitecture, so you build on the target. -flto defers optimisation to link time so inlining and constant propagation cross translation-unit boundaries, which typically helps the hot path where the codec and the strategy live in different files.",
          "level": "core",
          "skill": "tools.compiler-flags"
        },
        {
          "q": "You must log every decision for post-trade analysis without touching the tail. How?",
          "a": "The hot thread does no I/O and no formatting. It pushes a small fixed-size binary record — event code, symbol id, a few scalars, a timestamp — into a lock-free SPSC ring, which is a couple of stores, and returns. A separate, non-pinned writer thread drains the ring, formats and writes to disk, and if it falls behind the ring's bounded capacity forces an explicit policy (drop and count) rather than blocking the producer. No strings, no printf, no allocation on the producer side, because a synchronous write or a string format is a syscall plus an allocation and therefore a guaranteed tail event mid-race.",
          "level": "senior",
          "skill": "tools.async-logging"
        },
        {
          "q": "Your p99.9 improved by 30% after a change, but p50 got slightly worse. Do you ship it?",
          "a": "Probably yes, because the scoreboard is the tail and a tighter distribution is worth a small median regression — but not before I understand the trade, since “tail better, median worse” is the signature of having moved work from a rare path onto the common one. So I check that the mechanism is the one I intended (for example pre-faulting or reserving up front costs every tick a little and removes the spike), confirm it on more than one tape so I am not fitting to a single recording, and verify throughput did not fall. If the median regression is instead random noise, I need more samples before claiming either result.",
          "level": "senior",
          "skill": "perf.tail-diagnosis"
        }
      ]
    },
    {
      "n": 13,
      "focus": "Latency arbitrage & multi-venue",
      "tagline": "The finale: one name on many venues, a quote that has not caught up, and a composite grade that scores your whole term at once.",
      "concepts": [
        {
          "title": "One name, many venues",
          "text": "The same instrument trades on a dozen exchanges simultaneously, each with its own book, its own touch and its own queue. A trade or cancel on one venue takes time to be reflected on another, so for microseconds they genuinely disagree — and that gap is the trade. The consolidated best bid and offer across all venues, the NBBO, is the reference every participant is measured against.",
          "deck": "Deck W15 · slide 5"
        },
        {
          "title": "Picking off a stale quote",
          "text": "Consolidate the venues and look for the one whose price has not updated. When the NBBO computes as crossed — one venue's ask below another's bid — the lagging side is stale and a fast bot can lift or hit it before it reprices. The window is microseconds wide and the quote is public, so everybody sees it: this is a pure reaction-time race, not a forecast.",
          "code": "struct Touch { double bid, ask; };\nTouch a{100.05, 100.07}, b{100.02, 100.04};     // B has not caught up\ndouble nbbo_bid = std::max(a.bid, b.bid);\ndouble nbbo_ask = std::min(a.ask, b.ask);\nstd::printf(\"%.2f %.2f %s\\n\", nbbo_bid, nbbo_ask,\n            nbbo_ask < nbbo_bid ? \"CROSSED: lift B, sell A\" : \"ok\");\n// 100.05 100.04 CROSSED: lift B, sell A",
          "deck": "Deck W15 · slide 6"
        },
        {
          "title": "The race and smart order routing",
          "text": "Seeing the opportunity is not winning it: the order that arrives first at that venue gets the fill and everyone else gets nothing. Smart order routing decides where the order goes — split or sweep across venues to capture displayed size at the best net price, taking the stale venue and the next-best levels in one shot before they fade. Net price means fees and rebates and per-venue latency, which can change which route actually wins.",
          "deck": "Deck W15 · slide 7"
        },
        {
          "title": "The maker's job: two-sided quotes",
          "text": "A market maker posts a bid below and an ask above fair value, anchors that fair value on the microprice rather than the mid, and earns the spread plus maker rebates over many round trips. Speed is what keeps the quotes honest: a stale quote is a gift to takers, so you must requote faster than the world moves against you.",
          "deck": "Deck W15 · slide 9"
        },
        {
          "title": "Queue-aware requoting and inventory skew",
          "text": "Two decisions dominate maker P&L. Inventory skew leans your quotes against your position — long inventory means shading both sides down so you are more likely to sell than buy — so risk management happens in the quote rather than in a separate hedge. Queue awareness decides whether to act at all: cancel-and-repost sends you to the back of the FIFO, so if you are already near the front, or the price change is small, holding your spot beats chasing.",
          "code": "const double half = 0.02, kSkew = 0.01;\nint pos = 3;                                  // long 3: lean the quotes DOWN\ndouble fair = 100.010 - kSkew * pos;\nstd::printf(\"fair=%.3f bid=%.3f ask=%.3f \", fair, fair - half, fair + half);\nint queue_ahead = 4;                          // near the front: keep the spot\nstd::printf(\"reprice=%s\\n\", queue_ahead < 10 ? \"no\" : \"yes\");\n// fair=99.980 bid=99.960 ask=100.000 reprice=no",
          "deck": "Deck W15 · slide 10"
        },
        {
          "title": "Adverse selection and markouts",
          "text": "A fast fill can be a bad fill. When an informed trader hits your quote just before the price moves, you did not capture the spread — you bought the top. The measurement is the markout: compare the mid some interval after each fill against your fill price, signed by your side. Persistently negative markouts on a symbol or a counterparty is toxic flow, and the responses are to widen, skew away, or stop quoting it.",
          "code": "double fill_px = 100.04, mid_1s = 100.01;     // the mid one second after the fill\nbool bought = true;\ndouble markout = bought ? mid_1s - fill_px : fill_px - mid_1s;\nstd::printf(\"%+.3f %s\\n\", markout, markout < 0 ? \"picked off\" : \"good fill\");\n// -0.030 picked off",
          "deck": "Deck W15 · slide 11"
        }
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
        "example": {
          "title": "In the arena",
          "text": "course/hft-columbia/project-starter/include/shm_ring.hpp — Phase 4's cross-process ring. The constraint that makes it work is the one in the comment: no pointers, because the same bytes are mapped at different addresses in each process.",
          "code": "// project-starter/include/shm_ring.hpp\n// Project Phase 4 - POD ring living entirely in a shared-memory region\n// (NO pointers), usable across processes. init() is called once by the\n// creator before fork().\nstruct ShmRing {\n    static constexpr uint32_t CAPACITY = 1024;   // power of two\n    void init();                       // head/tail (atomics) to 0\n    bool push(uint64_t v);             // producer; false if full\n    bool pop(uint64_t& out);           // consumer; false if empty\n    std::atomic<uint32_t> head, tail;  // offsets, never addresses\n    uint64_t buf[CAPACITY];\n};"
        }
      },
      "interview": [
        {
          "q": "What is the NBBO, and what does it mean for it to be crossed or locked?",
          "a": "The NBBO is the consolidated best bid and best offer across all venues trading the name: the maximum bid and the minimum ask. Locked means the best bid equals the best ask — someone is willing to buy at exactly the price someone is willing to sell. Crossed means the best ask is *below* the best bid, which cannot persist: it says one venue's quote has not caught up, and it is the signal a latency arbitrageur is looking for.",
          "level": "warm-up",
          "skill": "trading.nbbo-latency-arb"
        },
        {
          "q": "Why do prices on two venues disagree at all?",
          "a": "Because information propagates at finite speed. A trade or cancel executes on venue A, and the update has to travel to every participant and be acted on before venue B's resting quotes are pulled or repriced — that round trip is tens to hundreds of microseconds depending on distance and technology. During that window venue B's book is genuinely stale, and the gap is not a mispricing anyone believes in, just a queue of events that has not finished.",
          "level": "warm-up",
          "skill": "trading.nbbo-latency-arb"
        },
        {
          "q": "You detect a crossed NBBO. Walk through what you do and what can go wrong.",
          "a": "Take the stale side — lift the low ask on the lagging venue — and simultaneously hedge on the venue that already moved, because holding the position unhedged is directional risk you were not paid for. What goes wrong is leg risk: the stale quote is public, so if you lose the race on the first leg you may still get filled on the second and end up with unwanted inventory at a worse price. Net-of-fees matters too, because a two-cent gross edge can be negative after taker fees on both legs, and displayed size may be smaller than it looks.",
          "level": "core",
          "skill": "trading.smart-order-routing"
        },
        {
          "q": "What is inventory skew and why do market makers do it in the quote rather than by hedging?",
          "a": "Skew means shifting your quoted fair value against your position: if you are long, you lower both your bid and your ask so the ask is more attractive and you are more likely to sell than buy. It pushes your inventory back toward flat using flow you are being paid for, instead of paying the spread to hedge out of it. Mechanically it is one term — fair = microprice - k * position — and k is the knob that trades inventory risk against captured spread.",
          "level": "core",
          "skill": "trading.queue-aware-requoting"
        },
        {
          "q": "What is a markout, and how do you use it operationally?",
          "a": "A markout is the signed P&L of a fill measured against the mid some horizon later: for a buy it is mid_later minus your fill price, for a sell the reverse. It answers whether the fill was actually good, independently of whether the position was later closed well. Operationally you bucket markouts by symbol, counterparty class and time of day, at several horizons — a few hundred milliseconds to a few seconds — and persistent negativity means you are being adversely selected, so you widen, skew away from that side, or stop quoting that name.",
          "level": "core",
          "skill": "trading.adverse-selection"
        },
        {
          "q": "When should a maker requote, given that repricing loses queue position?",
          "a": "When the expected gain from the new price exceeds the option value of the queue spot you are giving up. Concretely that means holding when you are near the front — the fill is imminent and probably profitable — and holding when the price move is inside your tolerance, because a tick of improvement is not worth restarting behind a thousand shares. You requote when fair value has moved enough that your current quote is now the wrong side of the market, since a stale quote is worse than no quote: it is a free option you have written to every taker.",
          "level": "core",
          "skill": "trading.queue-aware-requoting"
        },
        {
          "q": "Two venues, two processes, one shared touch cache. What must the shared structure not contain, and why?",
          "a": "No pointers, and nothing whose representation depends on the process — so no std::string, no vector, no virtual functions, and no references. The same physical pages are mapped at different virtual addresses in each process, so a pointer written by one is meaningless to the other; the structure has to be a POD of scalars, atomics and fixed arrays, with any linkage expressed as offsets or indices. It also has to be initialised exactly once by the creator before the fork, and you still need the same acquire/release discipline as an in-process ring, because the memory model applies across processes just as it does across threads.",
          "level": "senior",
          "skill": "perf.spsc-ring"
        },
        {
          "q": "Make the case for and against latency arbitrage as a business.",
          "a": "For: it is the mechanism that enforces one price across fragmented venues, and the participants doing it are usually also the ones quoting two sides, so the result is tighter spreads, deeper books and lower costs for everyone who trades once a month. Against: the specific trade consists of taking a quote from someone who has not yet been able to withdraw it, so the profit is a transfer from a slower participant rather than new information being priced, and the resources spent to win it — microwave towers, hollow-core fibre, custom silicon — are real capital spent on a purely relative advantage. The fairness question is sharpest about access: colocation and proprietary feeds are openly for sale, so speed is a purchased edge, which is why venues experiment with speed bumps and auction mechanics. My own line is that the liquidity argument is genuine and the arms-race critique is also genuine, and the sensible policy response is about market design rather than about banning speed.",
          "level": "senior",
          "skill": "trading.hft-ethics"
        }
      ]
    }
  ]
};
