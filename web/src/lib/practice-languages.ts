export const PRACTICE_LANGUAGES = {
    python3: {
        label: "Python 3",
        runtime: "python3",
        highlighter: "python",
        solutionFence: "python",
        standardPrelude: [
            "from bisect import bisect_left, bisect_right, insort",
            "from collections import Counter, OrderedDict, defaultdict, deque",
            "from concurrent.futures import ThreadPoolExecutor, as_completed",
            "from dataclasses import dataclass, field",
            "from functools import cache, lru_cache, reduce",
            "from heapq import heapify, heappop, heappush, heappushpop, heapreplace, nlargest, nsmallest",
            "from itertools import accumulate, combinations, permutations, product",
            "from queue import PriorityQueue, Queue",
            "from threading import Condition, Event, Lock, RLock",
            "from time import monotonic",
            "from typing import Any, Callable, Iterable, Iterator, Optional",
            "import heapq",
            "import math",
            "import re",
            "import time",
        ].join("\n"),
    },
    java: {
        label: "Java",
        runtime: "java",
        highlighter: "java",
        solutionFence: "java",
        standardPrelude: [
            "import java.util.*;",
            "import java.util.function.*;",
            "import java.util.regex.*;",
        ].join("\n"),
    },
} as const

export type PracticeLanguage = keyof typeof PRACTICE_LANGUAGES

export function getPracticeLanguagePrelude(language: PracticeLanguage): string {
    return PRACTICE_LANGUAGES[language].standardPrelude
}
