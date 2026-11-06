"""Phase 2 — Solvers.

* backtracking_fc : Backtracking + MRV (degree tie-break) + Forward Checking,
                    with optional fixed (retained) variables and value hints.
* min_conflicts   : naive Min-Conflicts local search started from an old assignment.
"""
from __future__ import annotations

import random
import sys
import time

from .csp import GraphColoringCSP

sys.setrecursionlimit(20000)


class _Budget(Exception):
    pass


def backtracking_fc(csp: GraphColoringCSP, fixed: dict | None = None, hints: dict | None = None,
                    node_budget: int = 200_000, rng: random.Random | None = None) -> dict:
    """Solve csp with BT+MRV+FC.

    fixed : var -> value assignments that are retained (not searched over).
    hints : var -> preferred value, tried first ("verify" the old value).
    Returns dict(success, solution, nodes, backtracks, time, status).
    status in {"solved", "infeasible_fixed", "unsat", "budget"}.
    """
    t0 = time.perf_counter()
    fixed = fixed or {}
    hints = hints or {}
    adj = csp.adj
    dom = {v: set(csp.domain(v)) for v in adj}
    assign: dict[int, int] = {}
    stats = {"nodes": 0, "backtracks": 0}

    def result(success, status):
        return {"success": success, "solution": dict(assign) if success else None,
                "nodes": stats["nodes"], "backtracks": stats["backtracks"],
                "time": time.perf_counter() - t0, "status": status}

    # --- place retained variables and propagate (forward check) from them
    for v, c in fixed.items():
        if v not in adj or c not in dom[v]:
            return result(False, "infeasible_fixed")
        assign[v] = c
        dom[v] = {c}
    for v, c in fixed.items():
        for u in adj[v]:
            if u in assign:
                if assign[u] == c:
                    return result(False, "infeasible_fixed")
            else:
                dom[u].discard(c)
                if not dom[u]:
                    return result(False, "infeasible_fixed")

    unassigned = set(adj) - set(assign)

    def select_var():
        best, bkey = None, None
        for v in unassigned:
            d = len(dom[v])
            key = (d, -sum(1 for u in adj[v] if u in unassigned))
            if bkey is None or key < bkey:
                best, bkey = v, key
                if d == 1 and key[1] == 0:
                    break
        return best

    def order_values(v):
        vals = list(dom[v])
        # least-constraining value: fewest unassigned neighbours still allowing it
        vals.sort(key=lambda c: sum(1 for u in adj[v] if u in unassigned and c in dom[u]))
        h = hints.get(v)
        if h in dom[v]:
            vals.remove(h)
            vals.insert(0, h)
        return vals

    def search():
        if not unassigned:
            return True
        v = select_var()
        unassigned.discard(v)
        for c in order_values(v):
            stats["nodes"] += 1
            if stats["nodes"] > node_budget:
                raise _Budget()
            assign[v] = c
            pruned = []
            wipe = False
            for u in adj[v]:
                if u in unassigned and c in dom[u]:
                    dom[u].discard(c)
                    pruned.append(u)
                    if not dom[u]:
                        wipe = True
                        break
            if not wipe and search():
                return True
            for u in pruned:
                dom[u].add(c)
            del assign[v]
            stats["backtracks"] += 1
        unassigned.add(v)
        return False

    try:
        ok = search()
    except _Budget:
        return result(False, "budget")
    return result(ok, "solved" if ok else "unsat")


def min_conflicts(csp: GraphColoringCSP, init: dict, max_steps: int = 5000,
                  rng: random.Random | None = None) -> dict:
    """Naive Min-Conflicts repair starting from `init` (old solution).

    Variables with a missing/invalid old value get a greedy min-conflict value.
    Each step: pick a random conflicted variable, move it to its min-conflict value.
    """
    rng = rng or random.Random(0)
    t0 = time.perf_counter()
    adj = csp.adj
    doms = {v: csp.domain(v) for v in adj}
    a = {}
    init_ops = 0
    for v in adj:
        c = init.get(v)
        if csp.value_ok(v, c):
            a[v] = c
    for v in adj:
        if v not in a:
            counts = {c: 0 for c in doms[v]}
            for u in adj[v]:
                if a.get(u) in counts:
                    counts[a[u]] += 1
            m = min(counts.values())
            a[v] = rng.choice([c for c, x in counts.items() if x == m])
            init_ops += 1
    conf = {v: sum(1 for u in adj[v] if a[u] == a[v]) for v in adj}
    conflicted = {v for v, x in conf.items() if x > 0}
    steps = 0
    while conflicted and steps < max_steps:
        steps += 1
        v = rng.choice(tuple(conflicted))
        counts = {c: 0 for c in doms[v]}
        for u in adj[v]:
            if a[u] in counts:
                counts[a[u]] += 1
        m = min(counts.values())
        choices = [c for c, x in counts.items() if x == m]
        new = rng.choice(choices)
        old = a[v]
        if new == old:
            continue
        a[v] = new
        for u in adj[v]:
            if a[u] == old:
                conf[u] -= 1
                if conf[u] == 0:
                    conflicted.discard(u)
            elif a[u] == new:
                conf[u] += 1
                conflicted.add(u)
        conf[v] = m
        if m == 0:
            conflicted.discard(v)
        else:
            conflicted.add(v)
    ok = not conflicted
    return {"success": ok, "solution": a if ok else None, "nodes": steps + init_ops,
            "steps": steps, "time": time.perf_counter() - t0,
            "status": "solved" if ok else "budget", "final_assignment": a}
