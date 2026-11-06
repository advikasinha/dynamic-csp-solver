"""Phase 4 — Learned reuse policy: predicts retain / verify / discard for every variable."""
from __future__ import annotations

import numpy as np

from .features import compute_features
from .repair import ACTIONS, policy_repair


class MLReusePolicy:
    """Wraps a fitted classifier (classes encoded 0=retain, 1=verify, 2=discard).

    threshold : if set, a variable is retained only when P(retain) >= threshold;
                otherwise it gets the most likely of verify/discard. None = argmax.
    """

    def __init__(self, model, name="ml", threshold=None):
        self.model = model
        self.name = name
        self.threshold = threshold

    def decide(self, before, after, state, sources, batch):
        order, feats, dist = compute_features(before, after, state, sources, batch)
        X = np.asarray(feats, dtype=float)
        proba = self.model.predict_proba(X)
        full = np.zeros((len(order), 3))
        for j, c in enumerate(self.model.classes_):
            full[:, int(c)] = proba[:, j]
        if self.threshold is None:
            idx = full.argmax(1)
        else:
            idx = np.where(full[:, 0] >= self.threshold, 0, 1 + full[:, 1:].argmax(1))
        actions = {v: ACTIONS[i] for v, i in zip(order, idx)}
        return actions, dist, {v: float(p) for v, p in zip(order, full[:, 0])}

    def repair(self, before, after, state, sources, batch, budget=5_000, cold_budget=500_000):
        actions, dist, p_retain = self.decide(before, after, state, sources, batch)
        r = policy_repair(after, state.solution, actions, dist=dist, budget=budget,
                          cold_budget=cold_budget)
        r["p_retain"] = p_retain
        r["dist"] = dist
        return r
