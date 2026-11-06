"""Phase 3 — Per-variable features describing each state component after a change."""
from __future__ import annotations

from collections import Counter

from .csp import GraphColoringCSP
from .env import SolverState

DIST_CAP = 10

FEATURES = [
    "dist", "degree", "delta_degree", "is_new", "old_valid", "in_conflict", "n_conf_nbrs",
    "domain_size", "saturation", "slack", "conf_nbrs_within1", "nbr_mean_degree",
    "conflict_hist", "change_hist", "steps_since_change", "nbr_conflict_hist",
    "k", "density", "n_nodes", "batch_size", "n_sources", "frac_conflicted",
    "ch_add_edge", "ch_remove_edge", "ch_add_node", "ch_remove_node",
    "ch_add_color", "ch_remove_color", "ch_restrict_domain",
]


def compute_features(before: GraphColoringCSP, after: GraphColoringCSP, state: SolverState,
                     sources: set, batch) -> tuple[list[int], list[list[float]], dict]:
    """Returns (node order, feature rows, dist map)."""
    from .env import touched_nodes
    old = state.solution
    src = touched_nodes(after, old, sources)
    dist = after.bfs_distances(src, cap=DIST_CAP)
    adj = after.adj
    in_conf = {}
    for v in adj:
        c = old.get(v)
        valid = after.value_ok(v, c)
        n_conf = sum(1 for u in adj[v] if c is not None and old.get(u) == c)
        in_conf[v] = (not valid) or n_conf > 0
    n = len(adj)
    density = 2 * after.n_edges() / max(1, n)
    frac_conf = sum(in_conf.values()) / max(1, n)
    kinds = Counter(ch.kind for ch in batch)
    glob = [after.k, density, n, len(batch), len(src), frac_conf] + \
           [kinds.get(t, 0) for t in ("add_edge", "remove_edge", "add_node", "remove_node",
                                      "add_color", "remove_color", "restrict_domain")]
    order, rows = [], []
    for v in adj:
        c = old.get(v)
        valid = after.value_ok(v, c)
        deg = len(adj[v])
        deg_before = len(before.adj[v]) if v in before.adj else 0
        n_conf = sum(1 for u in adj[v] if c is not None and old.get(u) == c)
        dom = after.domain(v)
        nbr_cols = {old.get(u) for u in adj[v] if old.get(u) is not None}
        sat = len(nbr_cols)
        slack = sum(1 for x in dom if x not in nbr_cols)
        conf1 = sum(1 for u in adj[v] if in_conf[u])
        nbr_md = (sum(len(adj[u]) for u in adj[v]) / deg) if deg else 0.0
        last = state.last_change.get(v)
        since = min(20, state.step - last) if last is not None else 20
        nbr_ch = (sum(state.conflict_count.get(u, 0) for u in adj[v]) / deg) if deg else 0.0
        row = [dist[v], deg, deg - deg_before, int(v not in before.adj), int(valid),
               int(in_conf[v]), n_conf, len(dom), sat, slack, conf1, nbr_md,
               state.conflict_count.get(v, 0), state.change_count.get(v, 0), since, nbr_ch] + glob
        order.append(v)
        rows.append(row)
    return order, rows, dist
