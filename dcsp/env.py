"""Phase 1 — Dynamic CSP environment.

P0 -> P1 -> P2 ... : each step applies a batch of atomic changes:
  add_edge, remove_edge, add_node, remove_node, add_color, remove_color, restrict_domain.
Changes are kept consistent with the planted colouring, so every P_t stays solvable,
and are biased toward *disrupting* the current solution (that is where repair matters).

SolverState stores the old solution together with the solver information that later
becomes ML features: per-variable conflict history and assignment stability.
"""
from __future__ import annotations

import random
from dataclasses import dataclass, field

from .csp import GraphColoringCSP, planted_instance

CHANGE_TYPES = ["add_edge", "remove_edge", "add_node", "remove_node",
                "add_color", "remove_color", "restrict_domain"]
DEFAULT_MIX = {"add_edge": 0.35, "remove_edge": 0.12, "add_node": 0.12, "remove_node": 0.08,
               "add_color": 0.05, "remove_color": 0.05, "restrict_domain": 0.23}


@dataclass
class Change:
    kind: str
    args: tuple = ()

    def __str__(self):
        return f"{self.kind}{self.args}"


@dataclass
class SolverState:
    """Old solution + solver information carried from P_t to P_{t+1}."""
    solution: dict
    conflict_count: dict = field(default_factory=dict)   # times var was in conflict after a change
    change_count: dict = field(default_factory=dict)     # times var's value was changed by repair
    last_change: dict = field(default_factory=dict)      # step at which value last changed
    step: int = 0

    def copy(self):
        return SolverState(dict(self.solution), dict(self.conflict_count), dict(self.change_count),
                           dict(self.last_change), self.step)

    def update(self, csp_new: GraphColoringCSP, new_solution: dict):
        """Record which vars changed value and which were in conflict before repair."""
        self.step += 1
        old = self.solution
        for v in csp_new.adj:
            c_old = old.get(v)
            in_conf = (not csp_new.value_ok(v, c_old)) or any(old.get(u) == c_old for u in csp_new.adj[v])
            if in_conf:
                self.conflict_count[v] = self.conflict_count.get(v, 0) + 1
            if c_old is not None and new_solution.get(v) != c_old:
                self.change_count[v] = self.change_count.get(v, 0) + 1
                self.last_change[v] = self.step
        self.solution = dict(new_solution)


def apply_change(csp: GraphColoringCSP, hidden: dict, ch: Change) -> set:
    """Apply change in place; returns the set of 'source' nodes touched by it."""
    k = ch.kind
    if k == "add_edge":
        u, v = ch.args
        csp.add_edge(u, v)
        return {u, v}
    if k == "remove_edge":
        u, v = ch.args
        csp.remove_edge(u, v)
        return {u, v}
    if k == "add_node":
        v, hcol, nbrs = ch.args
        csp.add_node(nbrs, node_id=v)
        hidden[v] = hcol
        return {v}
    if k == "remove_node":
        (v,) = ch.args
        nbrs = set(csp.adj.get(v, ()))
        csp.remove_node(v)
        hidden.pop(v, None)
        return nbrs
    if k == "add_color":
        csp.set_k(csp.k + 1)
        return set()
    if k == "remove_color":
        (c,) = ch.args  # always the highest colour index
        csp.set_k(csp.k - 1)
        return set()  # affected nodes are determined from the old solution (see touched_nodes)
    if k == "restrict_domain":
        v, c = ch.args
        csp.ban_color(v, c)
        return {v}
    raise ValueError(k)


class DynamicCSPEnv:
    def __init__(self, n=100, k=4, avg_degree=7.0, seed=0, conflict_bias=0.7, mix=None):
        self.rng = random.Random(seed)
        self.k_planted = k
        self.csp, self.hidden = planted_instance(n, k, avg_degree, seed)
        self.conflict_bias = conflict_bias
        self.mix = mix or DEFAULT_MIX
        self.history: list[list[Change]] = []

    # ------------------------------------------------------------ generation
    def sample_change(self, solution: dict) -> Change | None:
        rng, csp, hidden = self.rng, self.csp, self.hidden
        kinds, w = zip(*self.mix.items())
        kind = rng.choices(kinds, w)[0]
        nodes = csp.nodes
        if kind == "add_edge":
            same = rng.random() < self.conflict_bias
            for _ in range(200):
                u, v = rng.sample(nodes, 2)
                if v in csp.adj[u] or hidden[u] == hidden[v]:
                    continue
                if same and solution.get(u) != solution.get(v):
                    continue
                return Change("add_edge", (u, v))
            return None
        if kind == "remove_edge":
            e = csp.edges()
            return Change("remove_edge", rng.choice(e)) if e else None
        if kind == "add_node":
            v = csp._next_id
            hcol = rng.randrange(self.k_planted)
            deg = max(1, round(2 * csp.n_edges() / max(1, len(nodes))))
            cand = [u for u in nodes if hidden[u] != hcol]
            nbrs = tuple(rng.sample(cand, min(deg, len(cand))))
            return Change("add_node", (v, hcol, nbrs))
        if kind == "remove_node":
            return Change("remove_node", (rng.choice(nodes),)) if len(nodes) > 10 else None
        if kind == "add_color":
            return Change("add_color") if csp.k < self.k_planted + 2 else None
        if kind == "remove_color":
            return Change("remove_color", (csp.k - 1,)) if csp.k > self.k_planted else None
        if kind == "restrict_domain":
            for _ in range(50):
                v = rng.choice(nodes)
                cur = solution.get(v)
                c = cur if (rng.random() < self.conflict_bias and cur is not None) else rng.randrange(csp.k)
                if c != hidden[v] and c < csp.k and len(csp.domain(v)) > 1:
                    return Change("restrict_domain", (v, c))
            return None
        return None

    def sample_batch(self, solution: dict, size: int) -> list[Change]:
        """Sample and apply `size` changes; returns the list (also stored in history)."""
        batch = []
        guard = 0
        while len(batch) < size and guard < size * 20:
            guard += 1
            ch = self.sample_change(solution)
            if ch is None:
                continue
            apply_change(self.csp, self.hidden, ch)
            batch.append(ch)
        self.history.append(batch)
        return batch


def touched_nodes(csp_new: GraphColoringCSP, old_solution: dict, sources: set) -> set:
    """Source set for distance features: structural sources plus every node whose old
    value became invalid (removed colour / banned value / new node)."""
    out = {s for s in sources if s in csp_new.adj}
    for v in csp_new.adj:
        if not csp_new.value_ok(v, old_solution.get(v)):
            out.add(v)
    return out


def build_sequence(n, k, avg_degree, steps, seed, batch_range=(1, 4), conflict_bias=0.7):
    """Generate an identical, replayable CSP sequence.

    Returns dict(p0, hidden0, s0, batches) where batches[t] is the change list producing
    P_{t+1} from P_t. Changes are generated against a reference solution chain
    (repaired with BT warm-start) so they are disruptive; every method later replays
    exactly the same batches from the same P0/S0.
    """
    from .solvers import backtracking_fc
    env = DynamicCSPEnv(n, k, avg_degree, seed, conflict_bias)
    p0 = env.csp.copy()
    hidden0 = dict(env.hidden)
    r = backtracking_fc(p0, node_budget=2_000_000)
    s0 = r["solution"] if r["success"] else dict(hidden0)
    sol = dict(s0)
    batches = []
    for _ in range(steps):
        size = env.rng.randint(*batch_range)
        batch = env.sample_batch(sol, size)
        batches.append(batch)
        rr = backtracking_fc(env.csp, hints=sol, node_budget=500_000)
        sol = rr["solution"] if rr["success"] else {v: env.hidden[v] for v in env.csp.adj}
    return {"p0": p0, "hidden0": hidden0, "s0": s0, "batches": batches,
            "meta": {"n": n, "k": k, "avg_degree": avg_degree, "seed": seed}}


def replay(seq):
    """Iterate (t, csp_before, csp_after, sources, batch) over a stored sequence."""
    csp = seq["p0"].copy()
    hidden = dict(seq["hidden0"])
    for t, batch in enumerate(seq["batches"]):
        before = csp.copy()
        src = set()
        for ch in batch:
            src |= apply_change(csp, hidden, ch)
        after = csp.copy()
        after.hidden = dict(hidden)  # planted colouring of P_{t+1} (emergency fallback only)
        yield t, before, after, src, batch
