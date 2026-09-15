window.SKILLS = {
  "course": {
    "code": "IEOR E4741",
    "title": "High-Frequency Trading in C++",
    "institution": "Columbia University",
    "term": "Fall 2026",
    "sessions_url": "https://courseworks2.columbia.edu/courses/252758",
    "starter_url": "https://github.com/sdonadio/hft-cpp-starter-columbia",
    "companion_url": "https://sdonadio.github.io/low-latency-trading-arena/"
  },
  "categories": [
    {
      "id": "cpp",
      "name": "C++ language",
      "color": "#1D4F91"
    },
    {
      "id": "perf",
      "name": "Systems & performance",
      "color": "#C8102E"
    },
    {
      "id": "tools",
      "name": "Tooling & engineering",
      "color": "#2E8B57"
    },
    {
      "id": "trading",
      "name": "Trading & microstructure",
      "color": "#B8860B"
    }
  ],
  "sessions": [
    {
      "n": 1,
      "date": "2026-09-09",
      "title": "HFT Landscape & Market Microstructure",
      "decks": [
        "w1"
      ],
      "lab": {
        "label": "Lab — Week 1",
        "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week01.md"
      },
      "hw": {
        "label": "HW 1 — Order-book metrics in C++",
        "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714425",
        "due": "2026-09-19"
      },
      "project": {
        "label": "Project — Phase 0: Connect & Baseline",
        "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714412",
        "due": "2026-09-23"
      },
      "exam": null,
      "companion_url": "https://sdonadio.github.io/low-latency-trading-arena/week1.html",
      "skills": [
        "trading.lob",
        "trading.price-time-priority",
        "trading.tick-to-trade",
        "trading.fees-maker-taker",
        "trading.colocation",
        "tools.cmake-build",
        "tools.arena-client",
        "tools.replay-harness"
      ]
    },
    {
      "n": 2,
      "date": "2026-09-16",
      "title": "C++ Performance Foundations",
      "decks": [
        "w2"
      ],
      "lab": {
        "label": "Lab — Week 2",
        "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week02.md"
      },
      "hw": {
        "label": "HW 2 — Pointers, references & the cost of a copy",
        "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714426",
        "due": "2026-09-26"
      },
      "project": {
        "label": "Project — Phase 0: Connect & Baseline",
        "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714412",
        "due": "2026-09-23"
      },
      "exam": null,
      "companion_url": "https://sdonadio.github.io/low-latency-trading-arena/week2.html",
      "skills": [
        "cpp.pointers",
        "cpp.pointers-vs-references",
        "cpp.raw-allocation",
        "perf.memory-hierarchy",
        "perf.cache-line-alignment",
        "perf.false-sharing",
        "perf.data-layout",
        "perf.branch-prediction",
        "tools.benchmarking"
      ]
    },
    {
      "n": 3,
      "date": "2026-09-23",
      "title": "Memory Management & Smart Pointers",
      "decks": [
        "w3"
      ],
      "lab": {
        "label": "Lab — Week 3",
        "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week03.md"
      },
      "hw": {
        "label": "HW 3 — Dynamic allocation, RAII & smart pointers",
        "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714427",
        "due": "2026-10-03"
      },
      "project": {
        "label": "Project — Phase 1: The Fast Hot Path",
        "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714413",
        "due": "2026-10-14"
      },
      "exam": null,
      "companion_url": "https://sdonadio.github.io/low-latency-trading-arena/week3.html",
      "skills": [
        "cpp.classes-invariants",
        "cpp.rule-of-five",
        "cpp.move-semantics",
        "cpp.raii",
        "cpp.smart-pointers",
        "perf.object-layout",
        "perf.heap-nondeterminism",
        "cpp.pointers-vs-references",
        "cpp.raw-allocation"
      ]
    },
    {
      "n": 4,
      "date": "2026-09-30",
      "title": "Custom Allocators & Memory Pools",
      "decks": [
        "w4"
      ],
      "lab": {
        "label": "Lab — Week 4",
        "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week04.md"
      },
      "hw": {
        "label": "HW 4 — A high-performance allocator (Memory Triathlon)",
        "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714428",
        "due": "2026-10-10"
      },
      "project": {
        "label": "Project — Phase 1: The Fast Hot Path",
        "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714413",
        "due": "2026-10-14"
      },
      "exam": null,
      "companion_url": "https://sdonadio.github.io/low-latency-trading-arena/week4.html",
      "skills": [
        "perf.object-pool",
        "cpp.placement-new",
        "perf.arena-allocator",
        "cpp.pmr",
        "tools.replay-harness",
        "tools.benchmarking",
        "perf.heap-nondeterminism"
      ]
    },
    {
      "n": 5,
      "date": "2026-10-07",
      "title": "Templates & Generic Programming + Compile-Time & Policy-Based Design (CRTP)",
      "decks": [
        "w5",
        "w6"
      ],
      "lab": {
        "label": "Lab — Week 5",
        "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week05.md"
      },
      "hw": {
        "label": "HW 5 — Generic programming with the STL",
        "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714429",
        "due": "2026-10-17"
      },
      "project": {
        "label": "Project — Phase 1: The Fast Hot Path",
        "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714413",
        "due": "2026-10-14"
      },
      "exam": null,
      "companion_url": "https://sdonadio.github.io/low-latency-trading-arena/week5.html",
      "skills": [
        "cpp.templates",
        "cpp.variadic-templates",
        "cpp.type-traits-constraints",
        "cpp.virtual-dispatch",
        "perf.virtual-cost",
        "cpp.constexpr",
        "cpp.crtp-policies",
        "cpp.variant-visit",
        "cpp.classes-invariants"
      ]
    },
    {
      "n": 6,
      "date": "2026-10-14",
      "title": "Data Structures for HFT — The Order Book",
      "decks": [
        "w7"
      ],
      "lab": {
        "label": "Lab — Week 7",
        "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week07.md"
      },
      "hw": {
        "label": "HW 7 — A fast order book + a fast symbol map",
        "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714431",
        "due": "2026-10-24"
      },
      "project": {
        "label": "Project — Phase 2: The Local Order Book",
        "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714414",
        "due": "2026-10-28"
      },
      "exam": null,
      "companion_url": "https://sdonadio.github.io/low-latency-trading-arena/week7.html",
      "skills": [
        "perf.open-addressing-hash",
        "cpp.stl-containers",
        "trading.flat-order-book",
        "trading.queue-position",
        "trading.lob",
        "trading.price-time-priority",
        "tools.arena-client",
        "perf.data-layout",
        "tools.benchmarking"
      ]
    },
    {
      "n": 7,
      "date": "2026-10-21",
      "title": "Algorithmic Complexity & Time-Series",
      "decks": [
        "w8"
      ],
      "lab": {
        "label": "Lab — Week 8",
        "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week08.md"
      },
      "hw": {
        "label": "HW 8 — Rolling event counter (sliding window)",
        "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714432",
        "due": "2026-10-31"
      },
      "project": {
        "label": "Project — Phase 2: The Local Order Book",
        "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714414",
        "due": "2026-10-28"
      },
      "exam": null,
      "companion_url": "https://sdonadio.github.io/low-latency-trading-arena/week8.html",
      "skills": [
        "perf.complexity-in-cache-terms",
        "perf.amortized-reserve",
        "cpp.ring-buffer",
        "perf.incremental-computation",
        "trading.obi-signal",
        "perf.data-layout",
        "perf.object-pool",
        "perf.open-addressing-hash",
        "cpp.stl-containers"
      ]
    },
    {
      "n": 8,
      "date": "2026-10-28",
      "title": "Concurrency I — Atomics & Memory Models · Midterm",
      "decks": [
        "w9"
      ],
      "lab": {
        "label": "Lab — Week 9",
        "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week09.md"
      },
      "hw": {
        "label": "HW 9 — A seqlock (one writer, many readers)",
        "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714433",
        "due": "2026-11-07"
      },
      "project": {
        "label": "Project — Phase 3: Threading to Accelerate",
        "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714415",
        "due": "2026-11-11"
      },
      "exam": "midterm",
      "companion_url": "https://sdonadio.github.io/low-latency-trading-arena/week9.html",
      "skills": [
        "cpp.threads",
        "cpp.data-races",
        "cpp.atomics-memory-order",
        "cpp.mutex-toolbox",
        "perf.lock-tail-cost",
        "tools.thread-sanitizer",
        "tools.benchmarking"
      ]
    },
    {
      "n": 9,
      "date": "2026-11-04",
      "title": "Concurrency II — Lock-Free Pipelines",
      "decks": [
        "w10"
      ],
      "lab": {
        "label": "Lab — Week 10",
        "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week10.md"
      },
      "hw": {
        "label": "HW 10 — An SPSC lock-free ring buffer",
        "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714434",
        "due": "2026-11-14"
      },
      "project": {
        "label": "Project — Phase 3: Threading to Accelerate",
        "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714415",
        "due": "2026-11-11"
      },
      "exam": null,
      "companion_url": "https://sdonadio.github.io/low-latency-trading-arena/week10.html",
      "skills": [
        "cpp.compare-and-swap",
        "cpp.lock-free-guarantees",
        "perf.spsc-ring",
        "perf.back-pressure",
        "cpp.cpp20-coordination",
        "perf.false-sharing",
        "tools.benchmarking",
        "cpp.atomics-memory-order",
        "tools.thread-sanitizer"
      ]
    },
    {
      "n": 10,
      "date": "2026-11-11",
      "title": "Network Protocols & Market Data + Async I/O & Serialization",
      "decks": [
        "w11",
        "w12"
      ],
      "lab": {
        "label": "Lab — Week 11",
        "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week11.md"
      },
      "hw": {
        "label": "HW 11 — A high-performance FIX parser",
        "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714435",
        "due": "2026-11-21"
      },
      "project": {
        "label": "Project — Phase 4: Multi-Process System with Shared-Memory Lock-Free IPC",
        "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714416",
        "due": "2026-11-21"
      },
      "exam": null,
      "companion_url": "https://sdonadio.github.io/low-latency-trading-arena/week11.html",
      "skills": [
        "trading.fix-protocol",
        "trading.binary-market-data",
        "tools.message-framing",
        "trading.feed-sequencing",
        "perf.transport-choice",
        "perf.nonblocking-io",
        "perf.zero-copy-parse",
        "perf.batching-vs-latency",
        "perf.back-pressure"
      ]
    },
    {
      "n": 11,
      "date": "2026-11-18",
      "title": "Low-Latency Design — SIMD, Kernel Bypass & Colocation",
      "decks": [
        "w13"
      ],
      "lab": {
        "label": "Lab — Week 13",
        "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week13.md"
      },
      "hw": {
        "label": "HW 13 — Build Optimization (flags only)",
        "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714437",
        "due": "2026-11-28"
      },
      "project": {
        "label": "Project — Phase 5: Wire & Hardware Tuning",
        "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714417",
        "due": "2026-11-28"
      },
      "exam": null,
      "companion_url": "https://sdonadio.github.io/low-latency-trading-arena/week13.html",
      "skills": [
        "perf.simd",
        "perf.prefetch",
        "perf.syscall-cost",
        "perf.kernel-bypass",
        "perf.cpu-pinning-numa",
        "tools.compiler-flags",
        "perf.hardware-timestamping",
        "trading.colocation",
        "tools.replay-harness"
      ]
    },
    {
      "n": 12,
      "date": "2026-12-02",
      "title": "Profiling, the Tail & Production",
      "decks": [
        "w14"
      ],
      "lab": {
        "label": "Lab — Week 14",
        "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week14.md"
      },
      "hw": {
        "label": "HW 14 — Profile and kill a latency tail",
        "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714438",
        "due": "2026-12-12"
      },
      "project": {
        "label": "Project — Phase 6: Profile & Kill the Tail",
        "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714418",
        "due": "2026-12-09"
      },
      "exam": null,
      "companion_url": "https://sdonadio.github.io/low-latency-trading-arena/week14.html",
      "skills": [
        "tools.perf-profiler",
        "tools.flame-graph",
        "perf.tail-diagnosis",
        "tools.sanitizers",
        "tools.async-logging",
        "trading.tick-to-trade",
        "perf.branch-prediction",
        "tools.thread-sanitizer",
        "tools.compiler-flags"
      ]
    },
    {
      "n": 13,
      "date": "2026-12-09",
      "title": "Latency Arbitrage, Multi-Venue & the Tournament · Final",
      "decks": [
        "w15"
      ],
      "lab": {
        "label": "Lab — Week 15",
        "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week15.md"
      },
      "hw": {
        "label": "HW 15 — Cross-venue stale-quote detector",
        "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714439",
        "due": "2026-12-19"
      },
      "project": {
        "label": "Project — Phase 7: The Tournament",
        "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714419",
        "due": "2026-12-22"
      },
      "exam": "final",
      "companion_url": "https://sdonadio.github.io/low-latency-trading-arena/week15.html",
      "skills": [
        "trading.nbbo-latency-arb",
        "trading.smart-order-routing",
        "trading.market-making",
        "trading.queue-aware-requoting",
        "trading.adverse-selection",
        "trading.hft-ethics",
        "trading.price-time-priority",
        "trading.fees-maker-taker",
        "trading.queue-position"
      ]
    }
  ],
  "skills": [
    {
      "id": "trading.lob",
      "category": "trading",
      "name": "The central limit order book",
      "can": "You can read a two-sided limit order book and compute the spread, mid, microprice and order-book imbalance from the top-of-book prices and sizes.",
      "introduced": 1,
      "practised": [
        6
      ],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 1,
          "label": "Deck W1 · slides 9–11"
        },
        {
          "type": "deck",
          "session": 6,
          "label": "Deck W7 · slide 14"
        },
        {
          "type": "lab",
          "session": 1,
          "label": "Lab week 1 · step 4 and the hand-computed book in Your turn",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week01.md"
        },
        {
          "type": "hw",
          "label": "HW 1 — Order-book metrics in C++",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714425"
        },
        {
          "type": "exam",
          "label": "Final · group: Low-Latency System Design: Allocators, Order Books & Timing"
        }
      ],
      "interview": true
    },
    {
      "id": "trading.price-time-priority",
      "category": "trading",
      "name": "Price-time priority & the FIFO queue",
      "can": "You can apply price-then-time priority to say which resting order fills first, and explain why a cancel-and-repost sends you to the back of the queue.",
      "introduced": 1,
      "practised": [
        6,
        13
      ],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 1,
          "label": "Deck W1 · slide 10"
        },
        {
          "type": "deck",
          "session": 6,
          "label": "Deck W7 · slide 13"
        },
        {
          "type": "deck",
          "session": 13,
          "label": "Deck W15 · slide 10"
        },
        {
          "type": "hw",
          "label": "HW 1 — Order-book metrics in C++",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714425"
        },
        {
          "type": "exam",
          "label": "Final · group: Low-Latency System Design: Allocators, Order Books & Timing"
        }
      ],
      "interview": true
    },
    {
      "id": "trading.tick-to-trade",
      "category": "trading",
      "name": "Tick-to-trade latency & the tail",
      "can": "You can define tick-to-trade latency, report it as p50/p99/p99.9 instead of a mean, and explain why the tail is what decides an HFT race.",
      "introduced": 1,
      "practised": [
        12
      ],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 1,
          "label": "Deck W1 · slides 12, 18"
        },
        {
          "type": "deck",
          "session": 12,
          "label": "Deck W14 · slides 5, 17"
        },
        {
          "type": "lab",
          "session": 1,
          "label": "Lab week 1 · step 3 — the tick->order print",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week01.md"
        },
        {
          "type": "project",
          "label": "Project — Phase 0: Connect & Baseline",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714412"
        },
        {
          "type": "exam",
          "label": "Final · group: Measurement, Tail Latency & Production Practice"
        }
      ],
      "interview": true
    },
    {
      "id": "trading.fees-maker-taker",
      "category": "trading",
      "name": "Maker/taker fees & rebates",
      "can": "You can work out whether a fill was actually profitable once the taker fee or maker rebate is applied to the notional.",
      "introduced": 1,
      "practised": [
        13
      ],
      "depth": 2,
      "where": [
        {
          "type": "deck",
          "session": 1,
          "label": "Deck W1 · slide 11"
        },
        {
          "type": "deck",
          "session": 13,
          "label": "Deck W15 · slide 9"
        },
        {
          "type": "lab",
          "session": 1,
          "label": "Lab week 1 · step 3 — the FEE_SCHEDULE line",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week01.md"
        }
      ],
      "interview": false
    },
    {
      "id": "trading.colocation",
      "category": "trading",
      "name": "Colocation & the latency arms race",
      "can": "You can explain what colocation buys and weigh a reduced venue latency tier against its cost using measured percentiles.",
      "introduced": 1,
      "practised": [
        11
      ],
      "depth": 2,
      "where": [
        {
          "type": "deck",
          "session": 1,
          "label": "Deck W1 · slides 7, 13"
        },
        {
          "type": "deck",
          "session": 11,
          "label": "Deck W13 · slides 11, 15"
        },
        {
          "type": "lab",
          "session": 11,
          "label": "Lab week 13 · step 7 — colocation economics",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week13.md"
        },
        {
          "type": "project",
          "label": "Project — Phase 5: Wire & Hardware Tuning",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714417"
        }
      ],
      "interview": false
    },
    {
      "id": "tools.cmake-build",
      "category": "tools",
      "name": "Building a C++ project with CMake",
      "can": "You can configure and build a C++ target with CMake and keep one build directory per flag set, so a cached flag never lies to you about what you measured.",
      "introduced": 1,
      "practised": [],
      "depth": 2,
      "where": [
        {
          "type": "deck",
          "session": 1,
          "label": "Deck W1 · slide 17"
        },
        {
          "type": "lab",
          "session": 1,
          "label": "Lab week 1 · step 2 — build the arena C++ client",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week01.md"
        },
        {
          "type": "project",
          "label": "Project — Phase 0: Connect & Baseline",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714412"
        }
      ],
      "interview": false
    },
    {
      "id": "tools.arena-client",
      "category": "tools",
      "name": "Writing a bot on the arena C++ client",
      "can": "You can subclass the arena WebSocket bot client, override on_book/on_fill/on_ack, and place or cancel orders from the hot path.",
      "introduced": 1,
      "practised": [
        6
      ],
      "depth": 2,
      "where": [
        {
          "type": "deck",
          "session": 1,
          "label": "Deck W1 · slides 16–17"
        },
        {
          "type": "deck",
          "session": 6,
          "label": "Deck W7 · slide 15"
        },
        {
          "type": "lab",
          "session": 1,
          "label": "Lab week 1 · step 3 — connect and get on the board",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week01.md"
        },
        {
          "type": "project",
          "label": "Project — Phase 0: Connect & Baseline",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714412"
        }
      ],
      "interview": false
    },
    {
      "id": "tools.replay-harness",
      "category": "tools",
      "name": "Offline replay & percentile reporting",
      "can": "You can replay a recorded tape through your bot offline and read the p50/p99/p99.9 table it prints, so an A/B change is measured rather than guessed.",
      "introduced": 1,
      "practised": [
        4,
        11
      ],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 1,
          "label": "Deck W1 · slide 18"
        },
        {
          "type": "deck",
          "session": 4,
          "label": "Deck W4 · slide 16"
        },
        {
          "type": "deck",
          "session": 11,
          "label": "Deck W13 · slide 17"
        },
        {
          "type": "project",
          "label": "Project — Phase 0: Connect & Baseline",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714412"
        },
        {
          "type": "exam",
          "label": "Final · group: Measurement, Tail Latency & Production Practice"
        }
      ],
      "interview": false
    },
    {
      "id": "cpp.pointers",
      "category": "cpp",
      "name": "Pointers & pointer arithmetic",
      "can": "You can walk an array with a raw pointer, explain why p + 1 advances by sizeof(*p), and say why one-past-the-end may be formed but never dereferenced.",
      "introduced": 2,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 2,
          "label": "Deck W2 · slides 7, 9–10"
        },
        {
          "type": "hw",
          "label": "HW 2 — Pointers, references & the cost of a copy",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714426"
        },
        {
          "type": "exam",
          "label": "Midterm · group: Pointers, References & Memory Layout"
        }
      ],
      "interview": true
    },
    {
      "id": "cpp.pointers-vs-references",
      "category": "cpp",
      "name": "Pointers vs references, and const&",
      "can": "You can choose between a pointer and a reference by asking whether 'absent' is a legal answer, and pass a large struct by const reference instead of by value.",
      "introduced": 2,
      "practised": [
        3
      ],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 2,
          "label": "Deck W2 · slide 8"
        },
        {
          "type": "deck",
          "session": 3,
          "label": "Deck W3 · slides 15, 26"
        },
        {
          "type": "lab",
          "session": 2,
          "label": "Lab week 2 · step 2 — stack vs heap and the honest sink",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week02.md"
        },
        {
          "type": "hw",
          "label": "HW 2 — Pointers, references & the cost of a copy",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714426"
        },
        {
          "type": "exam",
          "label": "Midterm · group: Pointers, References & Memory Layout"
        }
      ],
      "interview": false
    },
    {
      "id": "cpp.raw-allocation",
      "category": "cpp",
      "name": "malloc / calloc / new and the pairing rule",
      "can": "You can pick between malloc, calloc, new and new[] for a given need and pair every allocation with its matching free, delete or delete[].",
      "introduced": 2,
      "practised": [
        3
      ],
      "depth": 2,
      "where": [
        {
          "type": "deck",
          "session": 2,
          "label": "Deck W2 · slides 11–13, 17"
        },
        {
          "type": "deck",
          "session": 3,
          "label": "Deck W3 · slide 6"
        },
        {
          "type": "lab",
          "session": 3,
          "label": "Lab week 3 · step 1 — the raw new/delete bug",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week03.md"
        },
        {
          "type": "hw",
          "label": "HW 3 — Dynamic allocation, RAII & smart pointers",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714427"
        },
        {
          "type": "exam",
          "label": "Midterm · group: Allocation, RAII & Smart Pointers"
        }
      ],
      "interview": false
    },
    {
      "id": "perf.memory-hierarchy",
      "category": "perf",
      "name": "The memory hierarchy",
      "can": "You can put rough numbers on a register, L1, L2, L3 and DRAM access and explain why a single miss to main memory costs about as much as a hundred L1 hits.",
      "introduced": 2,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 2,
          "label": "Deck W2 · slides 5–6"
        },
        {
          "type": "exam",
          "label": "Midterm · group: Complexity, Cache & Performance Basics"
        },
        {
          "type": "exam",
          "label": "Final · group: Cache Effects, False Sharing & Data Layout"
        }
      ],
      "interview": true
    },
    {
      "id": "perf.cache-line-alignment",
      "category": "perf",
      "name": "The 64-byte cache line & alignment",
      "can": "You can pack the fields a hot function reads onto one 64-byte cache line and use alignas to stop a hot object straddling two of them.",
      "introduced": 2,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 2,
          "label": "Deck W2 · slide 21"
        },
        {
          "type": "lab",
          "session": 2,
          "label": "Lab week 2 · step 4 — alignas(64)",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week02.md"
        },
        {
          "type": "exam",
          "label": "Final · group: Cache Effects, False Sharing & Data Layout"
        }
      ],
      "interview": true
    },
    {
      "id": "perf.false-sharing",
      "category": "perf",
      "name": "False sharing between cores",
      "can": "You can recognise false sharing from a threaded version being slower than a single-threaded one, and fix it by giving each hot variable its own cache line.",
      "introduced": 2,
      "practised": [
        9
      ],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 2,
          "label": "Deck W2 · slide 22"
        },
        {
          "type": "deck",
          "session": 9,
          "label": "Deck W10 · slide 14"
        },
        {
          "type": "lab",
          "session": 2,
          "label": "Lab week 2 · step 4 — reproduce then fix false sharing",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week02.md"
        },
        {
          "type": "exam",
          "label": "Final · group: Cache Effects, False Sharing & Data Layout"
        }
      ],
      "interview": true
    },
    {
      "id": "perf.data-layout",
      "category": "perf",
      "name": "Data layout: contiguous, row-major, SoA vs AoS",
      "can": "You can choose a contiguous layout over pointer chasing, order a nested loop so it walks memory in stride, and split the hot fields out of a struct a scan only partly reads.",
      "introduced": 2,
      "practised": [
        6,
        7
      ],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 2,
          "label": "Deck W2 · slides 14–16, 18"
        },
        {
          "type": "deck",
          "session": 6,
          "label": "Deck W7 · slide 9"
        },
        {
          "type": "deck",
          "session": 7,
          "label": "Deck W8 · slide 6"
        },
        {
          "type": "lab",
          "session": 2,
          "label": "Lab week 2 · step 3 — cache-friendly vs pointer-chasing",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week02.md"
        },
        {
          "type": "hw",
          "label": "HW 2 — Pointers, references & the cost of a copy",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714426"
        },
        {
          "type": "exam",
          "label": "Final · group: Cache Effects, False Sharing & Data Layout"
        }
      ],
      "interview": true
    },
    {
      "id": "perf.branch-prediction",
      "category": "perf",
      "name": "Branch prediction & the pipeline",
      "can": "You can explain what a mispredicted branch costs on a deep pipeline and name ways to make a hot branch predictable or remove it.",
      "introduced": 2,
      "practised": [
        12
      ],
      "depth": 2,
      "where": [
        {
          "type": "deck",
          "session": 2,
          "label": "Deck W2 · slide 19"
        },
        {
          "type": "deck",
          "session": 12,
          "label": "Deck W14 · slide 7"
        },
        {
          "type": "exam",
          "label": "Final · group: Branch Prediction, SIMD & Compiler Optimisation"
        }
      ],
      "interview": true
    },
    {
      "id": "tools.benchmarking",
      "category": "tools",
      "name": "Honest micro-benchmarking",
      "can": "You can time a hot function with steady_clock in a release build, warm up first, keep the optimiser from deleting the work, and report percentiles rather than one mean.",
      "introduced": 2,
      "practised": [
        4,
        6,
        8,
        9
      ],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 2,
          "label": "Deck W2 · slides 24, 26, 28"
        },
        {
          "type": "lab",
          "session": 2,
          "label": "Lab week 2 · step 1 — your first honest micro-benchmark",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week02.md"
        },
        {
          "type": "hw",
          "label": "HW 2 — Pointers, references & the cost of a copy",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714426"
        },
        {
          "type": "exam",
          "label": "Final · group: Measurement, Tail Latency & Production Practice"
        }
      ],
      "interview": true
    },
    {
      "id": "cpp.classes-invariants",
      "category": "cpp",
      "name": "Classes, constructors & destructors",
      "can": "You can establish a class invariant in the member-initialiser list, mark a converting constructor explicit, and predict construction and destruction order.",
      "introduced": 3,
      "practised": [
        5
      ],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 3,
          "label": "Deck W3 · slides 9–11, 18"
        },
        {
          "type": "deck",
          "session": 5,
          "label": "Deck W5 · slides 16, 24"
        },
        {
          "type": "hw",
          "label": "HW 3 — Dynamic allocation, RAII & smart pointers",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714427"
        },
        {
          "type": "exam",
          "label": "Midterm · group: OOP, Virtual Dispatch & Object Model"
        }
      ],
      "interview": false
    },
    {
      "id": "cpp.rule-of-five",
      "category": "cpp",
      "name": "Rule of zero, rule of five",
      "can": "You can decide whether a type needs none or all five special members, and explain why declaring a destructor alone silently kills the implicit moves.",
      "introduced": 3,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 3,
          "label": "Deck W3 · slides 12–14"
        },
        {
          "type": "lab",
          "session": 3,
          "label": "Lab week 3 · step 3 — the Rule of Three (and Five)",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week03.md"
        },
        {
          "type": "hw",
          "label": "HW 3 — Dynamic allocation, RAII & smart pointers",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714427"
        },
        {
          "type": "exam",
          "label": "Midterm · group: Allocation, RAII & Smart Pointers"
        },
        {
          "type": "exam",
          "label": "Final · group: Core C++: Memory, RAII & Object Model"
        }
      ],
      "interview": true
    },
    {
      "id": "cpp.move-semantics",
      "category": "cpp",
      "name": "Move semantics & std::move",
      "can": "You can write a noexcept move constructor that steals and then blanks the source, and say what std::move actually does at the call site.",
      "introduced": 3,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 3,
          "label": "Deck W3 · slides 13, 25"
        },
        {
          "type": "hw",
          "label": "HW 3 — Dynamic allocation, RAII & smart pointers",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714427"
        },
        {
          "type": "exam",
          "label": "Midterm · group: Allocation, RAII & Smart Pointers"
        },
        {
          "type": "exam",
          "label": "Final · group: Core C++: Memory, RAII & Object Model"
        }
      ],
      "interview": true
    },
    {
      "id": "cpp.raii",
      "category": "cpp",
      "name": "RAII — scope-bound resource management",
      "can": "You can wrap a resource in a type that acquires in its constructor and releases in its destructor, so cleanup happens on every exit path including a throw.",
      "introduced": 3,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 3,
          "label": "Deck W3 · slides 19, 26"
        },
        {
          "type": "lab",
          "session": 3,
          "label": "Lab week 3 · step 4 — a small RAII guard",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week03.md"
        },
        {
          "type": "hw",
          "label": "HW 3 — Dynamic allocation, RAII & smart pointers",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714427"
        },
        {
          "type": "exam",
          "label": "Midterm · group: Allocation, RAII & Smart Pointers"
        },
        {
          "type": "exam",
          "label": "Final · group: Core C++: Memory, RAII & Object Model"
        }
      ],
      "interview": true
    },
    {
      "id": "cpp.smart-pointers",
      "category": "cpp",
      "name": "unique_ptr, shared_ptr, weak_ptr",
      "can": "You can own an object with unique_ptr by default, justify shared_ptr only for genuinely shared lifetime, and say why its atomic refcount does not belong on a hot path.",
      "introduced": 3,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 3,
          "label": "Deck W3 · slides 21–23"
        },
        {
          "type": "lab",
          "session": 3,
          "label": "Lab week 3 · steps 2 and 5 — unique_ptr and the refcount tax",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week03.md"
        },
        {
          "type": "hw",
          "label": "HW 3 — Dynamic allocation, RAII & smart pointers",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714427"
        },
        {
          "type": "exam",
          "label": "Midterm · group: Allocation, RAII & Smart Pointers"
        },
        {
          "type": "exam",
          "label": "Final · group: Core C++: Memory, RAII & Object Model"
        }
      ],
      "interview": true
    },
    {
      "id": "perf.object-layout",
      "category": "perf",
      "name": "sizeof, padding & member ordering",
      "can": "You can compute a struct's size from its members' alignment, shrink it by declaring the widest members first, and lock the layout in with static_assert.",
      "introduced": 3,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 3,
          "label": "Deck W3 · slide 17"
        },
        {
          "type": "exam",
          "label": "Midterm · group: Pointers, References & Memory Layout"
        },
        {
          "type": "exam",
          "label": "Final · group: Cache Effects, False Sharing & Data Layout"
        }
      ],
      "interview": false
    },
    {
      "id": "perf.heap-nondeterminism",
      "category": "perf",
      "name": "Why the general allocator is non-deterministic",
      "can": "You can explain why the same new call can take 20 ns or 20 µs — a lock, a free-list walk, fragmentation or a page fault — and why that variance lands in p99.9.",
      "introduced": 3,
      "practised": [
        4
      ],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 3,
          "label": "Deck W3 · slides 8, 27"
        },
        {
          "type": "deck",
          "session": 4,
          "label": "Deck W4 · slide 5"
        },
        {
          "type": "lab",
          "session": 3,
          "label": "Lab week 3 · step 6 — why on_book must not allocate",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week03.md"
        },
        {
          "type": "exam",
          "label": "Final · group: Low-Latency System Design: Allocators, Order Books & Timing"
        }
      ],
      "interview": false
    },
    {
      "id": "perf.object-pool",
      "category": "perf",
      "name": "Fixed-size object pools",
      "can": "You can implement a fixed-size object pool whose free slots hold the free-list, so allocate and free are O(1) pointer swaps that never call the system allocator.",
      "introduced": 4,
      "practised": [
        7
      ],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 4,
          "label": "Deck W4 · slides 8, 10, 15"
        },
        {
          "type": "deck",
          "session": 7,
          "label": "Deck W8 · slide 7"
        },
        {
          "type": "lab",
          "session": 4,
          "label": "Lab week 4 · steps 3–4 — alloc and free in O(1)",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week04.md"
        },
        {
          "type": "hw",
          "label": "HW 4 — A high-performance allocator (Memory Triathlon)",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714428"
        },
        {
          "type": "project",
          "label": "Project — Phase 1: The Fast Hot Path",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714413"
        },
        {
          "type": "exam",
          "label": "Final · group: Low-Latency System Design: Allocators, Order Books & Timing"
        }
      ],
      "interview": true
    },
    {
      "id": "cpp.placement-new",
      "category": "cpp",
      "name": "Placement new & explicit destruction",
      "can": "You can construct an object into storage you already own with placement new, and destroy it by calling its destructor explicitly before reusing the slot.",
      "introduced": 4,
      "practised": [],
      "depth": 2,
      "where": [
        {
          "type": "deck",
          "session": 4,
          "label": "Deck W4 · slides 9–10"
        },
        {
          "type": "lab",
          "session": 4,
          "label": "Lab week 4 · step 5 — placement new + explicit dtor",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week04.md"
        },
        {
          "type": "hw",
          "label": "HW 4 — A high-performance allocator (Memory Triathlon)",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714428"
        },
        {
          "type": "exam",
          "label": "Midterm · group: Allocation, RAII & Smart Pointers"
        }
      ],
      "interview": false
    },
    {
      "id": "perf.arena-allocator",
      "category": "perf",
      "name": "Arena / bump allocation and per-tick scratch",
      "can": "You can allocate a tick's scratch from a bump pointer over a pre-owned slab, align each request, and reclaim everything with one O(1) reset.",
      "introduced": 4,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 4,
          "label": "Deck W4 · slides 9, 13, 15"
        },
        {
          "type": "hw",
          "label": "HW 4 — A high-performance allocator (Memory Triathlon)",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714428"
        },
        {
          "type": "project",
          "label": "Project — Phase 1: The Fast Hot Path",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714413"
        },
        {
          "type": "exam",
          "label": "Final · group: Low-Latency System Design: Allocators, Order Books & Timing"
        }
      ],
      "interview": false
    },
    {
      "id": "cpp.pmr",
      "category": "cpp",
      "name": "std::pmr memory resources",
      "can": "You can hand a standard container your own memory by constructing a pmr container over a monotonic_buffer_resource on a stack buffer.",
      "introduced": 4,
      "practised": [],
      "depth": 2,
      "where": [
        {
          "type": "deck",
          "session": 4,
          "label": "Deck W4 · slides 12–13, 15"
        },
        {
          "type": "hw",
          "label": "HW 4 — A high-performance allocator (Memory Triathlon)",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714428"
        }
      ],
      "interview": false
    },
    {
      "id": "cpp.templates",
      "category": "cpp",
      "name": "Function & class templates",
      "can": "You can write a function or class template, let the compiler deduce its arguments, specialise the one type that deserves hand-tuning, and say why templates live in headers.",
      "introduced": 5,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 5,
          "label": "Deck W5 · slides 5–7, 15"
        },
        {
          "type": "lab",
          "session": 5,
          "label": "Lab week 5 · steps 1–2 — a code stamp and a generic container",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week05.md"
        },
        {
          "type": "hw",
          "label": "HW 5 — Generic programming with the STL",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714429"
        },
        {
          "type": "exam",
          "label": "Midterm · group: Templates, CRTP & Compile-Time"
        },
        {
          "type": "exam",
          "label": "Final · group: Templates, STL & Complexity"
        }
      ],
      "interview": true
    },
    {
      "id": "cpp.variadic-templates",
      "category": "cpp",
      "name": "Parameter packs, folds & perfect forwarding",
      "can": "You can take an arbitrary argument list with a parameter pack, collapse it with a fold expression, and forward each argument on without adding a copy.",
      "introduced": 5,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 5,
          "label": "Deck W5 · slides 9–10, 27"
        },
        {
          "type": "lab",
          "session": 5,
          "label": "Lab week 5 · step 3 — variadic template + fold expression",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week05.md"
        },
        {
          "type": "hw",
          "label": "HW 5 — Generic programming with the STL",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714429"
        },
        {
          "type": "exam",
          "label": "Midterm · group: Templates, CRTP & Compile-Time"
        }
      ],
      "interview": false
    },
    {
      "id": "cpp.type-traits-constraints",
      "category": "cpp",
      "name": "Type traits, SFINAE, if constexpr & concepts",
      "can": "You can ask a question about a type at compile time and use the answer to select or reject an overload — with enable_if, if constexpr, or a named C++20 concept.",
      "introduced": 5,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 5,
          "label": "Deck W5 · slides 12–14"
        },
        {
          "type": "deck",
          "session": 5,
          "label": "Deck W6 · slides 8–9"
        },
        {
          "type": "lab",
          "session": 5,
          "label": "Lab week 5 · steps 4–5 — if constexpr and SFINAE",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week05.md"
        },
        {
          "type": "hw",
          "label": "HW 5 — Generic programming with the STL",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714429"
        },
        {
          "type": "exam",
          "label": "Midterm · group: Templates, CRTP & Compile-Time"
        }
      ],
      "interview": false
    },
    {
      "id": "cpp.virtual-dispatch",
      "category": "cpp",
      "name": "Inheritance, virtual functions & abstract interfaces",
      "can": "You can define an abstract interface with pure virtual functions and a virtual destructor, use override and final correctly, and spot the slicing and delete-through-a-non-virtual-base bugs.",
      "introduced": 5,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 5,
          "label": "Deck W5 · slides 16–18, 24"
        },
        {
          "type": "lab",
          "session": 5,
          "label": "Lab week 6 · step 1 — the virtual version we replace",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week06.md"
        },
        {
          "type": "exam",
          "label": "Midterm · group: OOP, Virtual Dispatch & Object Model"
        },
        {
          "type": "exam",
          "label": "Final · group: Core C++: Memory, RAII & Object Model"
        }
      ],
      "interview": true
    },
    {
      "id": "perf.virtual-cost",
      "category": "perf",
      "name": "What a virtual call costs",
      "can": "You can describe the vptr/vtable indirection, explain that the real bill is the indirect branch and the inlining you lose, and say where a virtual still belongs in a trading system.",
      "introduced": 5,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 5,
          "label": "Deck W5 · slides 19–23, 25"
        },
        {
          "type": "lab",
          "session": 5,
          "label": "Lab week 6 · step 2 — CRTP against the virtual baseline",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week06.md"
        },
        {
          "type": "exam",
          "label": "Midterm · group: OOP, Virtual Dispatch & Object Model"
        },
        {
          "type": "exam",
          "label": "Final · group: Core C++: Memory, RAII & Object Model"
        }
      ],
      "interview": true
    },
    {
      "id": "cpp.constexpr",
      "category": "cpp",
      "name": "constexpr, consteval & static_assert",
      "can": "You can compute a lookup table at compile time, check an assumption with static_assert so a violated invariant fails the build, and say what consteval forbids.",
      "introduced": 5,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 5,
          "label": "Deck W6 · slides 5–6"
        },
        {
          "type": "lab",
          "session": 5,
          "label": "Lab week 6 · step 3 — a constexpr lookup table",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week06.md"
        },
        {
          "type": "hw",
          "label": "HW 6 — CRTP & compile-time computation",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714430"
        },
        {
          "type": "exam",
          "label": "Midterm · group: Templates, CRTP & Compile-Time"
        }
      ],
      "interview": true
    },
    {
      "id": "cpp.crtp-policies",
      "category": "cpp",
      "name": "CRTP & policy-based design",
      "can": "You can replace a virtual hierarchy with a base templated on its derived type, and compose behaviour from policy template parameters that cost nothing at run time.",
      "introduced": 5,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 5,
          "label": "Deck W6 · slides 11–12"
        },
        {
          "type": "lab",
          "session": 5,
          "label": "Lab week 6 · steps 2 and 4 — CRTP and policies",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week06.md"
        },
        {
          "type": "hw",
          "label": "HW 6 — CRTP & compile-time computation",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714430"
        },
        {
          "type": "exam",
          "label": "Midterm · group: Templates, CRTP & Compile-Time"
        },
        {
          "type": "exam",
          "label": "Final · group: Templates, STL & Complexity"
        }
      ],
      "interview": true
    },
    {
      "id": "cpp.variant-visit",
      "category": "cpp",
      "name": "std::variant + compile-time visitor dispatch",
      "can": "You can mirror a tagged wire union as a std::variant and dispatch it with a visitor whose dead branches are discarded at compile time — no vtable, no allocation.",
      "introduced": 5,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 5,
          "label": "Deck W5 · slide 22"
        },
        {
          "type": "deck",
          "session": 5,
          "label": "Deck W6 · slides 13–14"
        },
        {
          "type": "lab",
          "session": 5,
          "label": "Lab week 6 · step 5 — variant + visitor dispatch",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week06.md"
        },
        {
          "type": "hw",
          "label": "HW 6 — CRTP & compile-time computation",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714430"
        },
        {
          "type": "project",
          "label": "Project — Phase 1: The Fast Hot Path",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714413"
        }
      ],
      "interview": false
    },
    {
      "id": "perf.open-addressing-hash",
      "category": "perf",
      "name": "Open-addressing hash maps",
      "can": "You can implement a flat open-addressing hash map with a power-of-two mask and linear probing, and explain why it beats a chaining map in cache.",
      "introduced": 6,
      "practised": [
        7
      ],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 6,
          "label": "Deck W7 · slides 5–6"
        },
        {
          "type": "deck",
          "session": 7,
          "label": "Deck W8 · slide 15"
        },
        {
          "type": "lab",
          "session": 6,
          "label": "Lab week 7 · step 7 — SymMap, open addressing",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week07.md"
        },
        {
          "type": "hw",
          "label": "HW 7 — A fast order book + a fast symbol map",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714431"
        },
        {
          "type": "exam",
          "label": "Final · group: Low-Latency System Design: Allocators, Order Books & Timing"
        }
      ],
      "interview": true
    },
    {
      "id": "cpp.stl-containers",
      "category": "cpp",
      "name": "Choosing an STL container for an access pattern",
      "can": "You can choose between std::map, std::unordered_map and a heap for ordered iteration, point lookup or best-element access, and state the cache cost of each.",
      "introduced": 6,
      "practised": [
        7
      ],
      "depth": 2,
      "where": [
        {
          "type": "deck",
          "session": 6,
          "label": "Deck W7 · slide 7"
        },
        {
          "type": "deck",
          "session": 7,
          "label": "Deck W8 · slide 6"
        },
        {
          "type": "lab",
          "session": 6,
          "label": "Lab week 7 · step 1 — why not just std::map",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week07.md"
        },
        {
          "type": "hw",
          "label": "HW 7 — A fast order book + a fast symbol map",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714431"
        },
        {
          "type": "exam",
          "label": "Midterm · group: STL Containers & Algorithms"
        },
        {
          "type": "exam",
          "label": "Final · group: Templates, STL & Complexity"
        }
      ],
      "interview": false
    },
    {
      "id": "trading.flat-order-book",
      "category": "trading",
      "name": "A flat, price-indexed local order book",
      "can": "You can mirror an exchange book as a contiguous price-indexed level array with a cached top-of-book, so add, cancel and reading the touch stay O(1).",
      "introduced": 6,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 6,
          "label": "Deck W7 · slides 9–11, 15"
        },
        {
          "type": "lab",
          "session": 6,
          "label": "Lab week 7 · steps 2–6 — the level array, best_bid/best_ask, cancel",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week07.md"
        },
        {
          "type": "hw",
          "label": "HW 7 — A fast order book + a fast symbol map",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714431"
        },
        {
          "type": "project",
          "label": "Project — Phase 2: The Local Order Book",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714414"
        },
        {
          "type": "exam",
          "label": "Final · group: Low-Latency System Design: Allocators, Order Books & Timing"
        }
      ],
      "interview": false
    },
    {
      "id": "trading.queue-position",
      "category": "trading",
      "name": "Tracking your queue position",
      "can": "You can track how much size rests ahead of your order at a price level and use that queue_ahead to judge your fill probability.",
      "introduced": 6,
      "practised": [
        13
      ],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 6,
          "label": "Deck W7 · slides 13–15"
        },
        {
          "type": "deck",
          "session": 13,
          "label": "Deck W15 · slide 10"
        },
        {
          "type": "hw",
          "label": "HW 7 — A fast order book + a fast symbol map",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714431"
        },
        {
          "type": "project",
          "label": "Project — Phase 2: The Local Order Book",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714414"
        },
        {
          "type": "exam",
          "label": "Final · group: Low-Latency System Design: Allocators, Order Books & Timing"
        }
      ],
      "interview": false
    },
    {
      "id": "perf.complexity-in-cache-terms",
      "category": "perf",
      "name": "Complexity counted in cache misses",
      "can": "You can argue about cost in memory accesses rather than instructions, and show why a linear scan over a small contiguous array beats an O(log n) walk over heap nodes.",
      "introduced": 7,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 7,
          "label": "Deck W8 · slides 5–7"
        },
        {
          "type": "lab",
          "session": 7,
          "label": "Lab week 8 · step 1 — the complexity framing",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week08.md"
        },
        {
          "type": "exam",
          "label": "Midterm · group: Complexity, Cache & Performance Basics"
        },
        {
          "type": "exam",
          "label": "Final · group: Templates, STL & Complexity"
        }
      ],
      "interview": false
    },
    {
      "id": "perf.amortized-reserve",
      "category": "perf",
      "name": "Amortized cost & reserving up front",
      "can": "You can explain why vector push_back is O(1) amortized and why reserving up front removes the occasional reallocation from your tail.",
      "introduced": 7,
      "practised": [],
      "depth": 2,
      "where": [
        {
          "type": "deck",
          "session": 7,
          "label": "Deck W8 · slides 5, 7"
        },
        {
          "type": "exam",
          "label": "Midterm · group: STL Containers & Algorithms"
        },
        {
          "type": "exam",
          "label": "Final · group: Measurement, Tail Latency & Production Practice"
        }
      ],
      "interview": false
    },
    {
      "id": "cpp.ring-buffer",
      "category": "cpp",
      "name": "A fixed-capacity ring buffer",
      "can": "You can implement a fixed-capacity ring buffer over inline array storage with O(1) push, overwriting or expiring the oldest entry and never allocating.",
      "introduced": 7,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 7,
          "label": "Deck W8 · slides 9–10"
        },
        {
          "type": "lab",
          "session": 7,
          "label": "Lab week 8 · steps 2–5 — a ring of timestamps",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week08.md"
        },
        {
          "type": "hw",
          "label": "HW 8 — Rolling event counter (sliding window)",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714432"
        },
        {
          "type": "exam",
          "label": "Final · group: Low-Latency System Design: Allocators, Order Books & Timing"
        }
      ],
      "interview": false
    },
    {
      "id": "perf.incremental-computation",
      "category": "perf",
      "name": "Update, don't recompute",
      "can": "You can replace a windowed recompute with an online update — a running mean, Welford variance or EMA — so every tick costs the same O(1) and the tail stays flat.",
      "introduced": 7,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 7,
          "label": "Deck W8 · slides 12–13"
        },
        {
          "type": "lab",
          "session": 7,
          "label": "Lab week 8 · step 7 — Welford's online mean/variance",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week08.md"
        },
        {
          "type": "hw",
          "label": "HW 8 — Rolling event counter (sliding window)",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714432"
        },
        {
          "type": "exam",
          "label": "Final · group: Measurement, Tail Latency & Production Practice"
        }
      ],
      "interview": false
    },
    {
      "id": "trading.obi-signal",
      "category": "trading",
      "name": "Turning microprice and imbalance into a signal",
      "can": "You can fold microprice and order-book imbalance into online state and gate an order on a z-score, without looping a window on the hot path.",
      "introduced": 7,
      "practised": [],
      "depth": 2,
      "where": [
        {
          "type": "deck",
          "session": 7,
          "label": "Deck W8 · slides 14–15"
        },
        {
          "type": "hw",
          "label": "HW 8 — Rolling event counter (sliding window)",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714432"
        },
        {
          "type": "project",
          "label": "Project — Phase 2: The Local Order Book",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714414"
        }
      ],
      "interview": false
    },
    {
      "id": "cpp.threads",
      "category": "cpp",
      "name": "std::thread and shared state",
      "can": "You can start and join a std::thread and say which state is private to a thread and which is shared through the address space.",
      "introduced": 8,
      "practised": [],
      "depth": 2,
      "where": [
        {
          "type": "deck",
          "session": 8,
          "label": "Deck W9 · slide 5"
        },
        {
          "type": "lab",
          "session": 8,
          "label": "Lab week 9 · step 1 — reproduce the race",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week09.md"
        },
        {
          "type": "exam",
          "label": "Final · group: Threads, Mutexes & Condition Variables"
        }
      ],
      "interview": false
    },
    {
      "id": "cpp.data-races",
      "category": "cpp",
      "name": "Data races & happens-before",
      "can": "You can identify a data race, explain that it is undefined behaviour rather than merely a wrong value, and name the happens-before edge that would make the access legal.",
      "introduced": 8,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 8,
          "label": "Deck W9 · slides 6–7"
        },
        {
          "type": "lab",
          "session": 8,
          "label": "Lab week 9 · steps 1–3 — the race, TSan, and the volatile non-fix",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week09.md"
        },
        {
          "type": "hw",
          "label": "HW 9 — A seqlock (one writer, many readers)",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714433"
        },
        {
          "type": "exam",
          "label": "Final · group: Threads, Mutexes & Condition Variables"
        }
      ],
      "interview": true
    },
    {
      "id": "cpp.atomics-memory-order",
      "category": "cpp",
      "name": "std::atomic & memory ordering",
      "can": "You can choose relaxed, acquire/release or seq_cst for each atomic operation and justify it with the happens-before edge you actually need.",
      "introduced": 8,
      "practised": [
        9
      ],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 8,
          "label": "Deck W9 · slides 9–12, 17"
        },
        {
          "type": "deck",
          "session": 9,
          "label": "Deck W10 · slide 14"
        },
        {
          "type": "lab",
          "session": 8,
          "label": "Lab week 9 · steps 4–5 — atomic, then acquire/release",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week09.md"
        },
        {
          "type": "hw",
          "label": "HW 9 — A seqlock (one writer, many readers)",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714433"
        },
        {
          "type": "exam",
          "label": "Final · group: Atomics, Memory Ordering & Lock-Free Queues"
        }
      ],
      "interview": true
    },
    {
      "id": "cpp.mutex-toolbox",
      "category": "cpp",
      "name": "Mutexes, shared_mutex & condition variables",
      "can": "You can take a mutex through a lock_guard, pick shared_mutex for read-mostly state, and wait on a condition variable with a predicate.",
      "introduced": 8,
      "practised": [],
      "depth": 2,
      "where": [
        {
          "type": "deck",
          "session": 8,
          "label": "Deck W9 · slide 14"
        },
        {
          "type": "lab",
          "session": 8,
          "label": "Lab week 9 · step 6 — the mutex answer, correct but slow",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week09.md"
        },
        {
          "type": "exam",
          "label": "Final · group: Threads, Mutexes & Condition Variables"
        }
      ],
      "interview": false
    },
    {
      "id": "perf.lock-tail-cost",
      "category": "perf",
      "name": "Why a lock on the hot path is a tail bomb",
      "can": "You can trace how a contended mutex becomes a kernel wait or a priority inversion, and show the damage in p99.9 rather than in the median.",
      "introduced": 8,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 8,
          "label": "Deck W9 · slides 15–16"
        },
        {
          "type": "lab",
          "session": 8,
          "label": "Lab week 9 · step 6 — mutex against the atomic version",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week09.md"
        },
        {
          "type": "hw",
          "label": "HW 9 — A seqlock (one writer, many readers)",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714433"
        },
        {
          "type": "exam",
          "label": "Final · group: Atomics, Memory Ordering & Lock-Free Queues"
        }
      ],
      "interview": true
    },
    {
      "id": "tools.thread-sanitizer",
      "category": "tools",
      "name": "Finding races with ThreadSanitizer",
      "can": "You can build a target with -fsanitize=thread, run it under load, and use the report to name the two accesses that race.",
      "introduced": 8,
      "practised": [
        9,
        12
      ],
      "depth": 2,
      "where": [
        {
          "type": "deck",
          "session": 12,
          "label": "Deck W14 · slide 15"
        },
        {
          "type": "lab",
          "session": 8,
          "label": "Lab week 9 · step 2 — let ThreadSanitizer name it",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week09.md"
        },
        {
          "type": "lab",
          "session": 9,
          "label": "Lab week 10 · step 8 — two threads + ThreadSanitizer",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week10.md"
        },
        {
          "type": "project",
          "label": "Project — Phase 3: Threading to Accelerate",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714415"
        },
        {
          "type": "exam",
          "label": "Final · group: Measurement, Tail Latency & Production Practice"
        }
      ],
      "interview": false
    },
    {
      "id": "cpp.compare-and-swap",
      "category": "cpp",
      "name": "Compare-and-swap retry loops",
      "can": "You can write a compare_exchange retry loop, explain why the expected value is refreshed on failure, and choose weak over strong inside a loop.",
      "introduced": 9,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 9,
          "label": "Deck W10 · slide 5"
        },
        {
          "type": "exam",
          "label": "Final · group: Atomics, Memory Ordering & Lock-Free Queues"
        }
      ],
      "interview": true
    },
    {
      "id": "cpp.lock-free-guarantees",
      "category": "cpp",
      "name": "ABA & progress guarantees",
      "can": "You can describe the ABA problem and distinguish wait-free, lock-free and obstruction-free progress guarantees.",
      "introduced": 9,
      "practised": [],
      "depth": 2,
      "where": [
        {
          "type": "deck",
          "session": 9,
          "label": "Deck W10 · slide 6"
        },
        {
          "type": "exam",
          "label": "Final · group: Atomics, Memory Ordering & Lock-Free Queues"
        }
      ],
      "interview": false
    },
    {
      "id": "perf.spsc-ring",
      "category": "perf",
      "name": "A lock-free SPSC ring buffer",
      "can": "You can build a bounded single-producer/single-consumer ring with atomic head and tail, a power-of-two mask, release/acquire publication, and the two indices on separate cache lines.",
      "introduced": 9,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 9,
          "label": "Deck W10 · slides 8, 14"
        },
        {
          "type": "lab",
          "session": 9,
          "label": "Lab week 10 · steps 2–6 — mask, alignas(64), push and pop",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week10.md"
        },
        {
          "type": "hw",
          "label": "HW 10 — An SPSC lock-free ring buffer",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714434"
        },
        {
          "type": "project",
          "label": "Project — Phase 3: Threading to Accelerate",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714415"
        },
        {
          "type": "exam",
          "label": "Final · group: Atomics, Memory Ordering & Lock-Free Queues"
        }
      ],
      "interview": true
    },
    {
      "id": "perf.back-pressure",
      "category": "perf",
      "name": "Bounded queues & back-pressure",
      "can": "You can make a full queue a decision — drop, coalesce or shed — instead of a stall, and explain how head-of-line blocking turns one fat message into a tail.",
      "introduced": 9,
      "practised": [
        10
      ],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 9,
          "label": "Deck W10 · slide 9"
        },
        {
          "type": "deck",
          "session": 10,
          "label": "Deck W12 · slide 14"
        },
        {
          "type": "hw",
          "label": "HW 10 — An SPSC lock-free ring buffer",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714434"
        },
        {
          "type": "project",
          "label": "Project — Phase 3: Threading to Accelerate",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714415"
        },
        {
          "type": "exam",
          "label": "Final · group: Atomics, Memory Ordering & Lock-Free Queues"
        }
      ],
      "interview": false
    },
    {
      "id": "cpp.cpp20-coordination",
      "category": "cpp",
      "name": "C++20 coordination & execution policies",
      "can": "You can line threads up with a latch or barrier instead of a hand-rolled condition variable, and say when an execution policy on an STL algorithm is worth its overhead.",
      "introduced": 9,
      "practised": [],
      "depth": 2,
      "where": [
        {
          "type": "deck",
          "session": 9,
          "label": "Deck W10 · slides 11–12"
        },
        {
          "type": "lab",
          "session": 9,
          "label": "Lab week 10 · step 8 — the two-thread timed run",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week10.md"
        },
        {
          "type": "exam",
          "label": "Final · group: Threads, Mutexes & Condition Variables"
        }
      ],
      "interview": false
    },
    {
      "id": "trading.fix-protocol",
      "category": "trading",
      "name": "Parsing FIX tag=value messages",
      "can": "You can pull the fields you need out of a SOH-delimited FIX message in one forward scan and reject the message on a bad mod-256 checksum.",
      "introduced": 10,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 10,
          "label": "Deck W11 · slides 5, 13, 15"
        },
        {
          "type": "lab",
          "session": 10,
          "label": "Lab week 11 · steps 1–4 — one forward scan, dispatch on the tag",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week11.md"
        },
        {
          "type": "hw",
          "label": "HW 11 — A high-performance FIX parser",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714435"
        },
        {
          "type": "exam",
          "label": "Final · group: Networking: Sockets, Kernel Bypass & Protocol Parsing"
        }
      ],
      "interview": false
    },
    {
      "id": "trading.binary-market-data",
      "category": "trading",
      "name": "Fixed-width binary market data",
      "can": "You can decode an ITCH/OUCH-style fixed-width message by reading fields at known offsets, byte-swapping from network order and scaling integer prices, with no digit parsing.",
      "introduced": 10,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 10,
          "label": "Deck W11 · slides 6–7, 16"
        },
        {
          "type": "lab",
          "session": 10,
          "label": "Lab week 11 · step 6 — why fixed-width binary beats text",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week11.md"
        },
        {
          "type": "hw",
          "label": "HW 11 — A high-performance FIX parser",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714435"
        },
        {
          "type": "exam",
          "label": "Final · group: Networking: Sockets, Kernel Bypass & Protocol Parsing"
        }
      ],
      "interview": false
    },
    {
      "id": "tools.message-framing",
      "category": "tools",
      "name": "Framing a byte stream into messages",
      "can": "You can recover message boundaries from a stream with a length prefix or a delimiter, buffer a partial read, and bounds-check a length before you index with it.",
      "introduced": 10,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 10,
          "label": "Deck W11 · slides 12–13"
        },
        {
          "type": "deck",
          "session": 10,
          "label": "Deck W12 · slides 8, 14"
        },
        {
          "type": "hw",
          "label": "HW 11 — A high-performance FIX parser",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714435"
        },
        {
          "type": "exam",
          "label": "Final · group: Networking: Sockets, Kernel Bypass & Protocol Parsing"
        }
      ],
      "interview": false
    },
    {
      "id": "trading.feed-sequencing",
      "category": "trading",
      "name": "Sequence numbers, gaps & snapshot-plus-increment",
      "can": "You can rebuild a book from a snapshot plus increments, detect a sequence gap, and treat the book as untradeable until the feed has recovered.",
      "introduced": 10,
      "practised": [],
      "depth": 2,
      "where": [
        {
          "type": "deck",
          "session": 10,
          "label": "Deck W11 · slides 10, 13"
        },
        {
          "type": "exam",
          "label": "Final · group: Networking: Sockets, Kernel Bypass & Protocol Parsing"
        }
      ],
      "interview": false
    },
    {
      "id": "perf.transport-choice",
      "category": "perf",
      "name": "TCP vs UDP multicast for market data",
      "can": "You can say why venues ship market data over UDP multicast and take order entry over TCP, and what head-of-line blocking and A/B feed arbitration mean for each.",
      "introduced": 10,
      "practised": [],
      "depth": 2,
      "where": [
        {
          "type": "deck",
          "session": 10,
          "label": "Deck W11 · slide 9"
        },
        {
          "type": "lab",
          "session": 10,
          "label": "Lab week 11 · step 5 — TCP vs UDP semantics",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week11.md"
        },
        {
          "type": "exam",
          "label": "Final · group: Networking: Sockets, Kernel Bypass & Protocol Parsing"
        }
      ],
      "interview": false
    },
    {
      "id": "perf.nonblocking-io",
      "category": "perf",
      "name": "Non-blocking sockets & readiness event loops",
      "can": "You can drain a non-blocking socket until EAGAIN inside an epoll or kqueue readiness loop, and explain what edge-triggered mode obliges you to do.",
      "introduced": 10,
      "practised": [],
      "depth": 2,
      "where": [
        {
          "type": "deck",
          "session": 10,
          "label": "Deck W12 · slides 5–8"
        },
        {
          "type": "lab",
          "session": 10,
          "label": "Lab week 12 · step 5 — a non-blocking read loop",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week12.md"
        },
        {
          "type": "exam",
          "label": "Final · group: Networking: Sockets, Kernel Bypass & Protocol Parsing"
        }
      ],
      "interview": false
    },
    {
      "id": "perf.zero-copy-parse",
      "category": "perf",
      "name": "Zero-copy parse & hand-rolled serialization",
      "can": "You can pull only the fields you use straight out of a frame with a view instead of building a DOM, write digits into a reused buffer on the send path, and show the p99.9 win on a replay tape.",
      "introduced": 10,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 10,
          "label": "Deck W12 · slides 10–12, 17"
        },
        {
          "type": "lab",
          "session": 10,
          "label": "Lab week 12 · steps 1–4 and 6 — fast integer-to-decimal and targeted JSON extract",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week12.md"
        },
        {
          "type": "hw",
          "label": "HW 12 — Fast uint64 -> decimal (and a field encoder)",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714436"
        },
        {
          "type": "project",
          "label": "Project — Phase 4: Multi-Process System with Shared-Memory Lock-Free IPC",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714416"
        },
        {
          "type": "exam",
          "label": "Final · group: Networking: Sockets, Kernel Bypass & Protocol Parsing"
        }
      ],
      "interview": false
    },
    {
      "id": "perf.batching-vs-latency",
      "category": "perf",
      "name": "Batching vs latency",
      "can": "You can explain why batching buys throughput at the cost of the tail you are graded on, and why TCP_NODELAY belongs on an order path.",
      "introduced": 10,
      "practised": [],
      "depth": 2,
      "where": [
        {
          "type": "deck",
          "session": 10,
          "label": "Deck W12 · slide 15"
        },
        {
          "type": "exam",
          "label": "Final · group: Measurement, Tail Latency & Production Practice"
        }
      ],
      "interview": false
    },
    {
      "id": "perf.simd",
      "category": "perf",
      "name": "SIMD & vectorization",
      "can": "You can vectorize a hot reduction with AVX2 intrinsics over 32-byte-aligned data, or get the compiler to do it with -O3 -march=native, and check that it really vectorized.",
      "introduced": 11,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 11,
          "label": "Deck W13 · slides 7, 16"
        },
        {
          "type": "lab",
          "session": 11,
          "label": "Lab week 13 · steps 2 and 5 — the winning build, then the intrinsics by hand",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week13.md"
        },
        {
          "type": "hw",
          "label": "HW 13 — Build Optimization (flags only)",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714437"
        },
        {
          "type": "project",
          "label": "Project — Phase 5: Wire & Hardware Tuning",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714417"
        },
        {
          "type": "exam",
          "label": "Final · group: Branch Prediction, SIMD & Compiler Optimisation"
        }
      ],
      "interview": true
    },
    {
      "id": "perf.prefetch",
      "category": "perf",
      "name": "Software prefetching & the TLB",
      "can": "You can issue a __builtin_prefetch hint ahead of an irregular walk, tune the distance by measurement, and say how huge pages cut TLB misses.",
      "introduced": 11,
      "practised": [],
      "depth": 2,
      "where": [
        {
          "type": "deck",
          "session": 11,
          "label": "Deck W13 · slides 5–6, 16"
        },
        {
          "type": "lab",
          "session": 11,
          "label": "Lab week 13 · step 6 — alignas and __builtin_prefetch",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week13.md"
        },
        {
          "type": "project",
          "label": "Project — Phase 5: Wire & Hardware Tuning",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714417"
        },
        {
          "type": "exam",
          "label": "Final · group: Branch Prediction, SIMD & Compiler Optimisation"
        }
      ],
      "interview": false
    },
    {
      "id": "perf.syscall-cost",
      "category": "perf",
      "name": "Syscalls, busy-poll & interrupt jitter",
      "can": "You can explain what a trip into the kernel costs on a hot path and when busy-polling a queue beats waiting to be woken.",
      "introduced": 11,
      "practised": [],
      "depth": 2,
      "where": [
        {
          "type": "deck",
          "session": 11,
          "label": "Deck W13 · slide 9"
        },
        {
          "type": "exam",
          "label": "Final · group: Networking: Sockets, Kernel Bypass & Protocol Parsing"
        }
      ],
      "interview": false
    },
    {
      "id": "perf.kernel-bypass",
      "category": "perf",
      "name": "What kernel bypass changes",
      "can": "You can explain what kernel bypass changes — DPDK, an Onload-style shim, or io_uring's batched syscalls — and which per-packet kernel costs each one removes.",
      "introduced": 11,
      "practised": [],
      "depth": 1,
      "where": [
        {
          "type": "deck",
          "session": 11,
          "label": "Deck W13 · slide 10"
        },
        {
          "type": "exam",
          "label": "Final · group: Networking: Sockets, Kernel Bypass & Protocol Parsing"
        }
      ],
      "interview": true
    },
    {
      "id": "perf.cpu-pinning-numa",
      "category": "perf",
      "name": "CPU pinning, core isolation & NUMA",
      "can": "You can pin a hot thread to a core, say what isolcpus and nohz_full add, and keep its memory node-local and pre-faulted so no page fault lands mid-race.",
      "introduced": 11,
      "practised": [],
      "depth": 2,
      "where": [
        {
          "type": "deck",
          "session": 11,
          "label": "Deck W13 · slides 11, 15"
        },
        {
          "type": "lab",
          "session": 11,
          "label": "Lab week 13 · step 7 — connect it to the arena",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week13.md"
        },
        {
          "type": "project",
          "label": "Project — Phase 5: Wire & Hardware Tuning",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714417"
        },
        {
          "type": "exam",
          "label": "Final · group: Low-Latency System Design: Allocators, Order Books & Timing"
        }
      ],
      "interview": false
    },
    {
      "id": "tools.compiler-flags",
      "category": "tools",
      "name": "Release flags, LTO & PGO",
      "can": "You can justify -O3, -march=native, -flto and -DNDEBUG on a graded binary, keep -g for the profiler, and run the two-pass profile-guided build.",
      "introduced": 11,
      "practised": [
        12
      ],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 11,
          "label": "Deck W13 · slide 16"
        },
        {
          "type": "deck",
          "session": 12,
          "label": "Deck W14 · slides 12, 14"
        },
        {
          "type": "lab",
          "session": 11,
          "label": "Lab week 13 · steps 2–4 — the winning build and PGO",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week13.md"
        },
        {
          "type": "hw",
          "label": "HW 13 — Build Optimization (flags only)",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714437"
        },
        {
          "type": "exam",
          "label": "Final · group: Branch Prediction, SIMD & Compiler Optimisation"
        }
      ],
      "interview": false
    },
    {
      "id": "perf.hardware-timestamping",
      "category": "perf",
      "name": "PTP & hardware timestamping",
      "can": "You can explain why NTP is too coarse for microsecond work and what a NIC hardware timestamp measures that a user-space clock read cannot.",
      "introduced": 11,
      "practised": [],
      "depth": 1,
      "where": [
        {
          "type": "deck",
          "session": 11,
          "label": "Deck W13 · slides 13–14"
        },
        {
          "type": "exam",
          "label": "Final · group: Measurement, Tail Latency & Production Practice"
        }
      ],
      "interview": false
    },
    {
      "id": "tools.perf-profiler",
      "category": "tools",
      "name": "Profiling with perf",
      "can": "You can go from perf stat to perf record to perf report and annotate, and read cache-miss and branch-miss counters to say why a hot line is hot.",
      "introduced": 12,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 12,
          "label": "Deck W14 · slides 6–8"
        },
        {
          "type": "lab",
          "session": 12,
          "label": "Lab week 14 · step 3 — perf record then perf report",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week14.md"
        },
        {
          "type": "hw",
          "label": "HW 14 — Profile and kill a latency tail",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714438"
        },
        {
          "type": "project",
          "label": "Project — Phase 6: Profile & Kill the Tail",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714418"
        },
        {
          "type": "exam",
          "label": "Final · group: Measurement, Tail Latency & Production Practice"
        }
      ],
      "interview": true
    },
    {
      "id": "tools.flame-graph",
      "category": "tools",
      "name": "Reading a flame graph",
      "can": "You can fold sampled stacks into a flame graph and read it by width, so the wide plateaus rather than the tall spikes set your next fix.",
      "introduced": 12,
      "practised": [],
      "depth": 2,
      "where": [
        {
          "type": "deck",
          "session": 12,
          "label": "Deck W14 · slide 7"
        },
        {
          "type": "hw",
          "label": "HW 14 — Profile and kill a latency tail",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714438"
        },
        {
          "type": "project",
          "label": "Project — Phase 6: Profile & Kill the Tail",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714418"
        },
        {
          "type": "exam",
          "label": "Final · group: Measurement, Tail Latency & Production Practice"
        }
      ],
      "interview": false
    },
    {
      "id": "perf.tail-diagnosis",
      "category": "perf",
      "name": "Diagnosing a latency tail",
      "can": "You can attribute a tail spike to allocation, a page fault, a TLB miss, NUMA locality or scheduler preemption from its signature, then fix it and prove the p99.9 moved.",
      "introduced": 12,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 12,
          "label": "Deck W14 · slides 5, 10–11, 17"
        },
        {
          "type": "lab",
          "session": 12,
          "label": "Lab week 14 · steps 1–5 — read the tail, hypothesise, fix, watch it collapse",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week14.md"
        },
        {
          "type": "hw",
          "label": "HW 14 — Profile and kill a latency tail",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714438"
        },
        {
          "type": "project",
          "label": "Project — Phase 6: Profile & Kill the Tail",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714418"
        },
        {
          "type": "exam",
          "label": "Final · group: Measurement, Tail Latency & Production Practice"
        }
      ],
      "interview": true
    },
    {
      "id": "tools.sanitizers",
      "category": "tools",
      "name": "AddressSanitizer & UBSan",
      "can": "You can build with -fsanitize=address,undefined, read the report back to the offending line, and explain why a sanitizer build is never the one you ship.",
      "introduced": 12,
      "practised": [],
      "depth": 2,
      "where": [
        {
          "type": "deck",
          "session": 12,
          "label": "Deck W14 · slides 15, 18"
        },
        {
          "type": "lab",
          "session": 12,
          "label": "Lab week 14 · step 6 — the bugs that become tails",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week14.md"
        },
        {
          "type": "hw",
          "label": "HW 14 — Profile and kill a latency tail",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714438"
        },
        {
          "type": "exam",
          "label": "Final · group: Measurement, Tail Latency & Production Practice"
        }
      ],
      "interview": false
    },
    {
      "id": "tools.async-logging",
      "category": "tools",
      "name": "Logging & monitoring off the hot path",
      "can": "You can keep observability off the hot path by pushing fixed-size records into a lock-free ring for another thread to format, and watch p99.9 live instead of only at session end.",
      "introduced": 12,
      "practised": [],
      "depth": 2,
      "where": [
        {
          "type": "deck",
          "session": 12,
          "label": "Deck W14 · slide 16"
        },
        {
          "type": "project",
          "label": "Project — Phase 6: Profile & Kill the Tail",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714418"
        },
        {
          "type": "exam",
          "label": "Final · group: Measurement, Tail Latency & Production Practice"
        }
      ],
      "interview": false
    },
    {
      "id": "trading.nbbo-latency-arb",
      "category": "trading",
      "name": "The NBBO & picking off a stale quote",
      "can": "You can consolidate two venues into an NBBO, detect the crossed state that means one side is stale, and explain why only the first order to reach that venue is paid.",
      "introduced": 13,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 13,
          "label": "Deck W15 · slides 5–6, 17"
        },
        {
          "type": "lab",
          "session": 13,
          "label": "Lab week 15 · step 2 — the cross-venue stale-quote detector",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week15.md"
        },
        {
          "type": "hw",
          "label": "HW 15 — Cross-venue stale-quote detector",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714439"
        },
        {
          "type": "project",
          "label": "Project — Phase 7: The Tournament",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714419"
        },
        {
          "type": "exam",
          "label": "Final · group: Low-Latency System Design: Allocators, Order Books & Timing"
        }
      ],
      "interview": false
    },
    {
      "id": "trading.smart-order-routing",
      "category": "trading",
      "name": "Smart order routing & sweeping",
      "can": "You can split or sweep an order across venues for displayed size and account for fees, rebates and per-venue latency in the route you pick.",
      "introduced": 13,
      "practised": [],
      "depth": 2,
      "where": [
        {
          "type": "deck",
          "session": 13,
          "label": "Deck W15 · slide 7"
        },
        {
          "type": "project",
          "label": "Project — Phase 7: The Tournament",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714419"
        },
        {
          "type": "exam",
          "label": "Final · group: Low-Latency System Design: Allocators, Order Books & Timing"
        }
      ],
      "interview": false
    },
    {
      "id": "trading.market-making",
      "category": "trading",
      "name": "Quoting two sides at speed",
      "can": "You can quote a bid and an ask around a fair value anchored on the microprice, and explain how spread plus rebates pay for the risk of a stale quote.",
      "introduced": 13,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 13,
          "label": "Deck W15 · slide 9"
        },
        {
          "type": "lab",
          "session": 13,
          "label": "Lab week 15 · step 4 — map strategy to the composite grade",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week15.md"
        },
        {
          "type": "project",
          "label": "Project — Phase 7: The Tournament",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714419"
        },
        {
          "type": "exam",
          "label": "Final · group: Low-Latency System Design: Allocators, Order Books & Timing"
        }
      ],
      "interview": false
    },
    {
      "id": "trading.queue-aware-requoting",
      "category": "trading",
      "name": "Queue-aware requoting & inventory skew",
      "can": "You can decide when a requote is worth losing your place in the FIFO queue, and lean your quotes against the inventory you are carrying.",
      "introduced": 13,
      "practised": [],
      "depth": 2,
      "where": [
        {
          "type": "deck",
          "session": 13,
          "label": "Deck W15 · slide 10"
        },
        {
          "type": "lab",
          "session": 13,
          "label": "Lab week 15 · step 3 — sketch the queue-aware requote",
          "url": "https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week15.md"
        },
        {
          "type": "project",
          "label": "Project — Phase 7: The Tournament",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714419"
        },
        {
          "type": "exam",
          "label": "Final · group: Low-Latency System Design: Allocators, Order Books & Timing"
        }
      ],
      "interview": false
    },
    {
      "id": "trading.adverse-selection",
      "category": "trading",
      "name": "Adverse selection & markouts",
      "can": "You can mark a fill out against the mid a moment later and use a persistently negative markout to widen, skew away from, or stop quoting a name.",
      "introduced": 13,
      "practised": [],
      "depth": 3,
      "where": [
        {
          "type": "deck",
          "session": 13,
          "label": "Deck W15 · slide 11"
        },
        {
          "type": "hw",
          "label": "HW 15 — Cross-venue stale-quote detector",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714439"
        },
        {
          "type": "project",
          "label": "Project — Phase 7: The Tournament",
          "url": "https://courseworks2.columbia.edu/courses/252758/assignments/1714419"
        },
        {
          "type": "exam",
          "label": "Final · group: Low-Latency System Design: Allocators, Order Books & Timing"
        }
      ],
      "interview": false
    },
    {
      "id": "trading.hft-ethics",
      "category": "trading",
      "name": "The frontier and the ethics of speed",
      "can": "You can argue both sides of paid speed — tighter spreads and deeper books against a pay-to-win arms race — and name the rules that shape it.",
      "introduced": 13,
      "practised": [],
      "depth": 1,
      "where": [
        {
          "type": "deck",
          "session": 13,
          "label": "Deck W15 · slides 13–14"
        }
      ],
      "interview": false
    }
  ]
};
