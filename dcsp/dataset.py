"""Phase 3 — ML training dataset via controlled (counterfactual) experiments.

For every change event we compute features for every variable, then pick a sample of
variables. For each sampled variable v we run the same repair three times — identical
P1, identical old solution, identical reference policy for every *other* variable — and
only switch v's action between retain / verify / discard. The label is the action with
the lowest repair cost (search nodes + changed variables); ties go to the cheaper action
in the order retain < verify < discard. Per-action costs are kept for regret analysis.
"""
from __future__ import annotations

import random

from .env import SolverState, replay, touched_nodes
from .features import FEATURES, compute_features
from .repair import ACTIONS, fixed_policy_actions, policy_repair, cold_restart

LAMBDA_CHANGED = 1.0


def repair_cost(r: dict) -> float:
    if not r["success"]:
        return float(r["nodes"]) * 2 + 1e5
    return r["nodes"] + LAMBDA_CHANGED * r["changed"]


def label_sequence(seq: dict, seq_id: int, n_near: int = 12, n_far: int = 8,
                   ref_radius: int = 1, budget: int = 5_000, seed: int = 0,
                   cold_budget: int = 30_000) -> list[dict]:
    rng = random.Random(seed)
    state = SolverState(dict(seq["s0"]))
    rows = []
    for t, before, after, src, batch in replay(seq):
        old = state.solution
        order, feats, dist = compute_features(before, after, state, src, batch)
        ref = fixed_policy_actions(after, dist, ref_radius)
        base = policy_repair(after, old, ref, dist=dist, budget=budget, cold_budget=cold_budget)
        base_cost = repair_cost(base)
        valid = [v for v in order if after.value_ok(v, old.get(v))]
        near = [v for v in valid if dist[v] <= 2]
        far = [v for v in valid if dist[v] > 2]
        sample = rng.sample(near, min(n_near, len(near))) + rng.sample(far, min(n_far, len(far)))
        if base.get("cold_fallback"):
            sample = []  # event so disruptive that the reference needed a cold restart: no
            # single-variable action can be credited, so the event is not labelled
        idx = {v: i for i, v in enumerate(order)}
        for v in sample:
            costs = {}
            for a in ACTIONS:
                if ref[v] == a:
                    costs[a] = base_cost
                    continue
                act = dict(ref)
                act[v] = a
                costs[a] = repair_cost(policy_repair(after, old, act, dist=dist, budget=budget,
                                                   cold_budget=cold_budget))
            best = min(ACTIONS, key=lambda a: (costs[a], ACTIONS.index(a)))
            row = dict(zip(FEATURES, feats[idx[v]]))
            row.update({"seq": seq_id, "t": t, "var": v, "label": best,
                        "cost_retain": costs["retain"], "cost_verify": costs["verify"],
                        "cost_discard": costs["discard"],
                        "n": seq["meta"]["n"]})
            rows.append(row)
        new = base["solution"] if base["success"] else cold_restart(after, old)["solution"]
        if new is None:  # reference chain must continue: fall back to the planted colouring
            new = {v: after.hidden[v] for v in after.adj}
        state.update(after, new)
    return rows
