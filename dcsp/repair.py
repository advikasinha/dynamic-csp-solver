"""Phase 2 + 4 — Repair methods built on a common retain / verify / discard interface.

For every variable of P1 a reuse policy chooses one action:
  retain  : keep the old value fixed (removed from search; forward-checked once)
  verify  : searched over, but the old value is tried first
  discard : searched over from scratch (no hint)
Variables whose old value is invalid in P1 (new node, banned/removed colour) are always
'discard'. Two adjacent retained variables with the same colour are downgraded to verify.

If the policy's guess is wrong (retained values make P1 infeasible, or budget runs out)
the repair falls back: stage 2 = verify everything, stage 3 = cold restart.
"""
from __future__ import annotations

import random
import time

from .csp import GraphColoringCSP
from .solvers import backtracking_fc, min_conflicts

ACTIONS = ("retain", "verify", "discard")


def sanitize_actions(csp: GraphColoringCSP, old: dict, actions: dict) -> dict:
    act = {}
    for v in csp.adj:
        a = actions.get(v, "verify")
        if not csp.value_ok(v, old.get(v)):
            a = "discard"
        act[v] = a
    for v in csp.adj:
        if act[v] == "retain":
            for u in csp.adj[v]:
                if act[u] == "retain" and old.get(u) == old.get(v):
                    act[v] = act[u] = "verify"
    return act


RELEASE_RADII = (1, 2, 3, 4)


def _run_stage(csp, old, act, budget):
    fixed = {v: old[v] for v, a in act.items() if a == "retain"}
    hints = {v: old[v] for v, a in act.items() if a == "verify"}
    return backtracking_fc(csp, fixed=fixed, hints=hints, node_budget=budget), len(fixed), len(hints)


def policy_repair(csp: GraphColoringCSP, old: dict, actions: dict, dist: dict | None = None,
                  budget: int = 5_000, cold_budget: int = 500_000, fallback: bool = True) -> dict:
    """Repair P1 from the old solution under a per-variable reuse policy.

    Stage 1 uses the policy as given. If it fails (retained values make P1 infeasible or
    the stage budget is exhausted) retained variables are released ring by ring around
    the change (dist <= 1, 2, 3, 4 become 'verify'), then a cold restart is the last resort.
    """
    t0 = time.perf_counter()
    act = sanitize_actions(csp, old, actions)
    first_act = dict(act)
    r, n_ret, n_ver = _run_stage(csp, old, act, budget)
    total_nodes = r["nodes"]
    stage = 1
    if not r["success"] and fallback:
        dist = dist or {}
        for rad in RELEASE_RADII:
            stage += 1
            new_act = {v: ("verify" if a == "retain" and dist.get(v, 99) <= rad else a)
                       for v, a in act.items()}
            new_act = sanitize_actions(csp, old, new_act)
            if new_act == act:
                continue
            act = new_act
            r, _, _ = _run_stage(csp, old, act, budget)
            total_nodes += r["nodes"]
            if r["success"]:
                break
        if not r["success"]:
            stage += 1
            r = backtracking_fc(csp, node_budget=cold_budget)
            total_nodes += r["nodes"]
    sol = r["solution"]
    return {"success": r["success"], "solution": sol, "nodes": total_nodes,
            "time": time.perf_counter() - t0, "stage": stage,
            "first_try_success": stage == 1 and r["success"],
            "cold_fallback": stage == len(RELEASE_RADII) + 2,
            "n_retained": n_ret, "n_verify": n_ver,
            "n_discard": sum(1 for a in first_act.values() if a == "discard"),
            "changed": hamming(old, sol, csp) if sol else None,
            "actions": first_act}


def hamming(old: dict, new: dict, csp: GraphColoringCSP) -> int:
    """Number of persisting variables whose value changed (solution instability)."""
    return sum(1 for v in csp.adj if v in old and old[v] is not None and new.get(v) != old[v])


# ----------------------------------------------------------------- baselines
def cold_restart(csp, old, budget=500_000, **_):
    t0 = time.perf_counter()
    r = backtracking_fc(csp, node_budget=budget)
    return {"success": r["success"], "solution": r["solution"], "nodes": r["nodes"],
            "time": time.perf_counter() - t0, "stage": 1, "first_try_success": r["success"],
            "changed": hamming(old, r["solution"], csp) if r["success"] else None}


def naive_min_conflicts(csp, old, max_steps=None, seed=0, **_):
    max_steps = max_steps or 50 * csp.n_nodes()
    r = min_conflicts(csp, old, max_steps=max_steps, rng=random.Random(seed))
    return {"success": r["success"], "solution": r["solution"], "nodes": r["nodes"],
            "time": r["time"], "stage": 1, "first_try_success": r["success"],
            "changed": hamming(old, r["solution"], csp) if r["success"] else None,
            "final_assignment": r["final_assignment"]}


def fixed_policy_actions(csp, dist: dict, radius: int = 2) -> dict:
    """Fixed structural-reuse policy: retain everything farther than `radius` hops from
    the change, verify (re-search with old value first) inside the radius."""
    return {v: ("retain" if dist.get(v, 99) > radius else "verify") for v in csp.adj}


def fixed_structural_reuse(csp, old, dist, radius=1, budget=5_000, **_):
    return policy_repair(csp, old, fixed_policy_actions(csp, dist, radius), dist=dist, budget=budget)


def warm_start_all_verify(csp, old, dist=None, budget=5_000, **_):
    return policy_repair(csp, old, {v: "verify" for v in csp.adj}, dist=dist, budget=budget)
