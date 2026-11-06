"""Phase 2/4 — Replay identical CSP sequences with every method and record metrics."""
from __future__ import annotations

from .env import SolverState, replay, touched_nodes
from .repair import (cold_restart, fixed_structural_reuse, naive_min_conflicts,
                     warm_start_all_verify)
from .solvers import backtracking_fc


def baseline_methods(fixed_radius=1, budget=5_000, cold_budget=500_000):
    def _dist(after, state, src):
        return after.bfs_distances(touched_nodes(after, state.solution, src))

    return {
        "Cold restart (BT+MRV+FC)":
            lambda b, a, s, src, bt, t: cold_restart(a, s.solution, budget=cold_budget),
        "Naive Min-Conflicts":
            lambda b, a, s, src, bt, t: naive_min_conflicts(a, s.solution, seed=t),
        f"Fixed reuse (r={fixed_radius})":
            lambda b, a, s, src, bt, t: fixed_structural_reuse(
                a, s.solution, _dist(a, s, src), radius=fixed_radius, budget=budget),
        "Warm start (verify all)":
            lambda b, a, s, src, bt, t: warm_start_all_verify(
                a, s.solution, _dist(a, s, src), budget=budget),
    }


def ml_method(policy, budget=5_000, cold_budget=500_000):
    return lambda b, a, s, src, bt, t: policy.repair(b, a, s, src, bt, budget=budget,
                                                     cold_budget=cold_budget)


def run_sequence(seq, seq_id, name, fn):
    """Each method repairs from ITS OWN previous solution over the same P_t sequence.
    If a method fails, the failure is recorded and the chain continues from a reference
    solution (cost of obtaining that reference is not charged to the method)."""
    state = SolverState(dict(seq["s0"]))
    rows = []
    for t, before, after, src, batch in replay(seq):
        r = fn(before, after, state, src, batch, t)
        ok = bool(r["success"]) and after.is_solution(r["solution"])
        rows.append({"method": name, "seq": seq_id, "t": t, "n": seq["meta"]["n"],
                     "batch_size": len(batch), "success": ok,
                     "first_try_success": bool(r.get("first_try_success", ok)),
                     "nodes": r["nodes"], "time": r["time"],
                     "changed": r["changed"] if ok else None,
                     "stage": r.get("stage", 1), "n_retained": r.get("n_retained")})
        if ok:
            new = r["solution"]
        else:
            rr = backtracking_fc(after, hints=state.solution, node_budget=2_000_000)
            new = rr["solution"] if rr["success"] else {v: after.hidden[v] for v in after.adj}
        state.update(after, new)
    return rows
