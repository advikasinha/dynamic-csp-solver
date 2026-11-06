"""Phase 1 — Graph-colouring CSP model and planted-instance generator.

A graph-colouring CSP has one variable per node, the domain {0..k-1} minus any
unary bans, and a binary "not-equal" constraint on every edge.
"""
from __future__ import annotations

import random
from collections import deque


class GraphColoringCSP:
    def __init__(self, k: int):
        self.k = k
        self.adj: dict[int, set[int]] = {}
        self.banned: dict[int, set[int]] = {}
        self._next_id = 0

    # ------------------------------------------------------------------ basics
    def copy(self) -> "GraphColoringCSP":
        c = GraphColoringCSP(self.k)
        c.adj = {v: set(n) for v, n in self.adj.items()}
        c.banned = {v: set(b) for v, b in self.banned.items() if b}
        c._next_id = self._next_id
        return c

    @property
    def nodes(self):
        return list(self.adj.keys())

    def n_nodes(self) -> int:
        return len(self.adj)

    def n_edges(self) -> int:
        return sum(len(n) for n in self.adj.values()) // 2

    def edges(self):
        return [(u, v) for u, ns in self.adj.items() for v in ns if u < v]

    def degree(self, v) -> int:
        return len(self.adj[v])

    def domain(self, v) -> list[int]:
        b = self.banned.get(v)
        if not b:
            return list(range(self.k))
        return [c for c in range(self.k) if c not in b]

    # -------------------------------------------------------------- mutations
    def add_node(self, neighbors=(), node_id=None) -> int:
        v = self._next_id if node_id is None else node_id
        self._next_id = max(self._next_id, v + 1)
        self.adj[v] = set()
        for u in neighbors:
            if u in self.adj and u != v:
                self.adj[v].add(u)
                self.adj[u].add(v)
        return v

    def remove_node(self, v):
        for u in self.adj.pop(v, set()):
            self.adj[u].discard(v)
        self.banned.pop(v, None)

    def add_edge(self, u, v):
        if u != v and u in self.adj and v in self.adj:
            self.adj[u].add(v)
            self.adj[v].add(u)

    def remove_edge(self, u, v):
        if u in self.adj:
            self.adj[u].discard(v)
        if v in self.adj:
            self.adj[v].discard(u)

    def set_k(self, k: int):
        self.k = k
        for v in list(self.banned):
            self.banned[v] = {c for c in self.banned[v] if c < k}

    def ban_color(self, v, c):
        self.banned.setdefault(v, set()).add(c)

    # ------------------------------------------------------------ evaluation
    def value_ok(self, v, c) -> bool:
        return c is not None and 0 <= c < self.k and c not in self.banned.get(v, ())

    def conflicts(self, assign: dict) -> list[tuple[int, int]]:
        bad = []
        for u, v in self.edges():
            cu, cv = assign.get(u), assign.get(v)
            if cu is not None and cu == cv:
                bad.append((u, v))
        return bad

    def is_solution(self, assign: dict) -> bool:
        for v in self.adj:
            if not self.value_ok(v, assign.get(v)):
                return False
        return not self.conflicts(assign)

    def bfs_distances(self, sources, cap: int = 99) -> dict[int, int]:
        """Hop distance from the nearest source node (cap if unreachable/no source)."""
        dist = {v: cap for v in self.adj}
        q = deque()
        for s in sources:
            if s in self.adj and dist[s] != 0:
                dist[s] = 0
                q.append(s)
        while q:
            u = q.popleft()
            if dist[u] >= cap - 1:
                continue
            for w in self.adj[u]:
                if dist[w] > dist[u] + 1:
                    dist[w] = dist[u] + 1
                    q.append(w)
        return dist


def planted_instance(n: int, k: int, avg_degree: float, seed: int | None = None):
    """Random graph with a hidden (planted) k-colouring, so P0 is guaranteed solvable.

    Edges are only drawn between nodes of different hidden colour, giving a
    k-partite random graph with the requested average degree.
    Returns (csp, hidden_colouring).
    """
    rng = random.Random(seed)
    csp = GraphColoringCSP(k)
    hidden = {}
    for _ in range(n):
        v = csp.add_node()
        hidden[v] = rng.randrange(k)
    target = int(round(n * avg_degree / 2))
    nodes = csp.nodes
    tries = 0
    while csp.n_edges() < target and tries < target * 50:
        tries += 1
        u, v = rng.sample(nodes, 2)
        if hidden[u] != hidden[v] and v not in csp.adj[u]:
            csp.add_edge(u, v)
    return csp, hidden
