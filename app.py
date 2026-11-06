"""Phase 5 — Interactive Dynamic-CSP repair simulator.

    streamlit run app.py
"""
from __future__ import annotations

import os
import random
import sys

import networkx as nx
import pandas as pd
import plotly.graph_objects as go
import streamlit as st

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)

from dcsp.csp import planted_instance  # noqa: E402
from dcsp.env import Change, DynamicCSPEnv, SolverState, apply_change, touched_nodes  # noqa: E402
from dcsp.repair import (cold_restart, fixed_structural_reuse, naive_min_conflicts,  # noqa: E402
                         warm_start_all_verify)
from dcsp.solvers import backtracking_fc  # noqa: E402

PALETTE = ["#4C78A8", "#F58518", "#54A24B", "#E45756", "#B279A2", "#9D755D", "#72B7B2", "#EECA3B"]
MODEL_FILES = {"ML: Logistic Regression": "logistic_regression.joblib",
               "ML: Random Forest": "random_forest.joblib",
               "ML: XGBoost": "xgboost.joblib"}
# Models retrained under the versions pinned in requirements.txt
# (the originals in models/ include an xgboost pickle that no longer loads).
MODEL_DIR = os.path.join(ROOT, "retrain", "models")

st.set_page_config(page_title="Dynamic CSP Repair Lab", layout="wide")


# ------------------------------------------------------------------ helpers
@st.cache_resource
def load_models():
    import joblib
    out = {}
    for label, fn in MODEL_FILES.items():
        p = os.path.join(MODEL_DIR, fn)
        if os.path.exists(p):
            out[label] = joblib.load(p)
    return out


def new_problem(n, k, deg, seed):
    env = DynamicCSPEnv(n, k, deg, seed)
    r = backtracking_fc(env.csp, node_budget=2_000_000)
    sol = r["solution"] if r["success"] else {v: env.hidden[v] for v in env.csp.adj}
    G = nx.Graph()
    G.add_nodes_from(env.csp.adj)
    G.add_edges_from(env.csp.edges())
    pos = nx.spring_layout(G, seed=seed, k=1.6 / max(1, n) ** 0.5)
    st.session_state.update(env=env, state=SolverState(sol), pos=pos, pending=[], p1=None,
                            last=None, compare=None, step=0, log=[])


def ensure_pos(csp):
    pos = st.session_state.pos
    rng = random.Random(len(pos))
    for v in csp.adj:
        if v not in pos:
            nb = [pos[u] for u in csp.adj[v] if u in pos]
            if nb:
                x = sum(p[0] for p in nb) / len(nb) + rng.uniform(-.05, .05)
                y = sum(p[1] for p in nb) / len(nb) + rng.uniform(-.05, .05)
            else:
                x, y = rng.uniform(-1, 1), rng.uniform(-1, 1)
            pos[v] = (x, y)
    return pos


def build_p1():
    env = st.session_state.env
    p1 = env.csp.copy()
    hidden = dict(env.hidden)
    src = set()
    for ch in st.session_state.pending:
        src |= apply_change(p1, hidden, ch)
    p1.hidden = hidden
    old = st.session_state.state.solution
    dist = p1.bfs_distances(touched_nodes(p1, old, src))
    return p1, src, dist


def run_solver(name, p1, src, dist, radius, thr):
    state = st.session_state.state
    old = state.solution
    if name == "Cold restart (BT+MRV+FC)":
        return cold_restart(p1, old)
    if name == "Naive Min-Conflicts":
        return naive_min_conflicts(p1, old, seed=st.session_state.step)
    if name == "Fixed structural reuse":
        return fixed_structural_reuse(p1, old, dist, radius=radius)
    if name == "Warm start (verify all)":
        return warm_start_all_verify(p1, old, dist)
    from dcsp.policies import MLReusePolicy
    pol = MLReusePolicy(load_models()[name], name, threshold=thr)
    return pol.repair(st.session_state.env.csp, p1, state, src, st.session_state.pending)


def draw(csp, assign, old, dist, actions=None, color_by="Colour", highlight_changed=True,
         height=620):
    pos = ensure_pos(csp)
    ex, ey, cx, cy = [], [], [], []
    for u, v in csp.edges():
        tgt = (cx, cy) if (assign and assign.get(u) is not None and assign.get(u) == assign.get(v)) else (ex, ey)
        tgt[0].extend([pos[u][0], pos[v][0], None])
        tgt[1].extend([pos[u][1], pos[v][1], None])
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=ex, y=ey, mode="lines", line=dict(width=0.6, color="#BBBBBB"),
                             hoverinfo="skip", name="constraint"))
    if cx:
        fig.add_trace(go.Scatter(x=cx, y=cy, mode="lines", line=dict(width=2.5, color="#D62728"),
                                 hoverinfo="skip", name="violated"))
    nodes = list(csp.adj)
    act_col = {"retain": "#9E9E9E", "verify": "#F2A93B", "discard": "#D62728"}
    colors, lines, sizes, text = [], [], [], []
    for v in nodes:
        a = assign.get(v) if assign else None
        if color_by == "Reuse action" and actions:
            colors.append(act_col.get(actions.get(v), "#CCCCCC"))
        elif color_by == "Distance to change":
            colors.append(dist.get(v, 10))
        else:
            colors.append(PALETTE[a % len(PALETTE)] if a is not None else "#FFFFFF")
        changed = highlight_changed and old.get(v) is not None and a is not None and a != old.get(v)
        lines.append(3 if changed else 0.5)
        sizes.append(15 if changed else 10)
        text.append(f"node {v}<br>colour {a} (was {old.get(v)})<br>domain {csp.domain(v)}"
                    f"<br>dist {dist.get(v, '-')}"
                    + (f"<br>action {actions.get(v)}" if actions else ""))
    marker = dict(size=sizes, line=dict(width=lines, color="#111111"))
    if color_by == "Distance to change":
        marker.update(color=colors, colorscale="Viridis_r", cmin=0, cmax=5, showscale=True,
                      colorbar=dict(title="hops"))
    else:
        marker.update(color=colors)
    fig.add_trace(go.Scatter(x=[pos[v][0] for v in nodes], y=[pos[v][1] for v in nodes],
                             mode="markers", marker=marker, text=text, hoverinfo="text",
                             name="variables"))
    fig.update_layout(height=height, showlegend=False, margin=dict(l=0, r=0, t=10, b=0),
                      xaxis=dict(visible=False), yaxis=dict(visible=False),
                      plot_bgcolor="rgba(0,0,0,0)")
    return fig


# ------------------------------------------------------------------ sidebar
with st.sidebar:
    st.header("1 · Problem P₀")
    n = st.slider("Variables (nodes)", 20, 200, 80, 10)
    k = st.slider("Colours k", 3, 6, 4)
    deg = st.slider("Average degree", 3.0, 9.0, 7.0, 0.5)
    seed = st.number_input("Seed", 0, 10_000, 7)
    if st.button("Generate & solve P₀", type="primary") or "env" not in st.session_state:
        new_problem(n, k, deg, int(seed))

    st.header("3 · Solver")
    models = load_models()
    solver_names = ["Cold restart (BT+MRV+FC)", "Naive Min-Conflicts", "Fixed structural reuse",
                    "Warm start (verify all)"] + list(models)
    solver = st.selectbox("Repair method", solver_names,
                          index=len(solver_names) - 1 if models else 2)
    radius = st.slider("Fixed-reuse radius (hops)", 0, 4, 1)
    thr = st.slider("ML retain threshold (0 = argmax)", 0.0, 0.99, 0.0, 0.05)
    thr = None if thr == 0 else thr
    if not models:
        st.info("No trained models found in retrain/models/. Run experiments/run_all.py to enable ML policies.")

env = st.session_state.env
state: SolverState = st.session_state.state
csp = env.csp

st.title("Dynamic CSP Repair Lab")
st.caption("Graph colouring under change: modify P₀, inspect which variables are affected, "
           "and compare how each repair strategy reuses the old solution.")
c1, c2, c3, c4 = st.columns(4)
c1.metric("Variables", csp.n_nodes())
c2.metric("Constraints (edges)", csp.n_edges())
c3.metric("Colours k", csp.k)
c4.metric("Step", st.session_state.step)

# ------------------------------------------------------------------ changes
st.subheader("2 · Modify constraints")
left, right = st.columns([2, 3])
with left:
    kind = st.selectbox("Change type", ["add_edge", "remove_edge", "add_node", "remove_node",
                                        "add_color", "remove_color", "restrict_domain"])
    nodes = sorted(csp.adj)
    if kind == "add_edge":
        u = st.selectbox("From node", nodes, key="ae_u")
        v = st.selectbox("To node", [x for x in nodes if x != u and x not in csp.adj[u]], key="ae_v")
        ch = Change("add_edge", (u, v))
    elif kind == "remove_edge":
        e = st.selectbox("Edge", csp.edges(), format_func=lambda e: f"{e[0]} – {e[1]}")
        ch = Change("remove_edge", tuple(e))
    elif kind == "add_node":
        d = st.slider("Random neighbours", 1, 12, int(round(2 * csp.n_edges() / max(1, len(nodes)))))
        rng = random.Random(st.session_state.step * 31 + len(st.session_state.pending))
        hcol = rng.randrange(env.k_planted)
        cand = [x for x in nodes if env.hidden.get(x) != hcol]
        ch = Change("add_node", (csp._next_id + sum(1 for c in st.session_state.pending if c.kind == "add_node"),
                                 hcol, tuple(rng.sample(cand, min(d, len(cand))))))
    elif kind == "remove_node":
        ch = Change("remove_node", (st.selectbox("Node", nodes),))
    elif kind == "add_color":
        ch = Change("add_color")
    elif kind == "remove_color":
        ch = Change("remove_color", (csp.k - 1,))
    else:
        v = st.selectbox("Node", nodes, key="rd_v")
        c = st.selectbox("Colour to forbid", csp.domain(v), key="rd_c",
                         index=csp.domain(v).index(state.solution.get(v)) if state.solution.get(v) in csp.domain(v) else 0)
        ch = Change("restrict_domain", (v, c))
    b1, b2, b3 = st.columns(3)
    if b1.button("Add change"):
        st.session_state.pending.append(ch)
        st.session_state.p1 = None
    bs = b2.number_input("Random batch size", 1, 10, 3)
    if b2.button("Add random batch"):
        tmp = DynamicCSPEnv.__new__(DynamicCSPEnv)
        tmp.__dict__.update(env.__dict__)
        tmp.csp, tmp.hidden = csp.copy(), dict(env.hidden)
        tmp.rng = random.Random(st.session_state.step * 997 + len(st.session_state.pending))
        tmp.history = []
        st.session_state.pending += tmp.sample_batch(state.solution, int(bs))
        st.session_state.p1 = None
    if b3.button("Clear"):
        st.session_state.pending = []
        st.session_state.p1 = None
with right:
    if st.session_state.pending:
        st.write("**Pending changes → P₁**")
        st.code("\n".join(str(c) for c in st.session_state.pending))
    else:
        st.write("No pending changes. P₁ = P₀.")
    st.caption("Random batches respect the planted colouring (P₁ stays solvable); hand-made "
               "changes may make P₁ unsatisfiable, which the solvers will report.")

# ------------------------------------------------------------------ repair
st.subheader("4 · Repair")
colA, colB, colC = st.columns([1, 1, 2])
run = colA.button("Apply changes & repair", type="primary", disabled=not st.session_state.pending)
compare = colB.button("Compare all solvers", disabled=not st.session_state.pending)
color_by = colC.radio("Colour nodes by", ["Colour", "Reuse action", "Distance to change"],
                      horizontal=True)

if run or compare:
    p1, src, dist = build_p1()
    st.session_state.p1 = (p1, src, dist)
    if run:
        r = run_solver(solver, p1, src, dist, radius, thr)
        st.session_state.last = (solver, r)
    if compare:
        rows = []
        for nm in solver_names:
            r = run_solver(nm, p1, src, dist, radius, thr)
            rows.append({"solver": nm, "success": r["success"], "search nodes / steps": r["nodes"],
                         "time (ms)": round(r["time"] * 1000, 2), "vars changed": r.get("changed"),
                         "fallback stage": r.get("stage", 1)})
            if nm == solver:
                st.session_state.last = (nm, r)
        st.session_state.compare = pd.DataFrame(rows)

p1_info = st.session_state.p1
if p1_info:
    p1, src, dist = p1_info
    affected = sorted(v for v, d in dist.items() if d == 0)
    near = sum(1 for d in dist.values() if d <= 1)
    old = state.solution
    in_conf = len(p1.conflicts({v: old.get(v) for v in p1.adj}))
    m1, m2, m3 = st.columns(3)
    m1.metric("Directly affected variables", len(affected))
    m2.metric("Within 1 hop of change", near)
    m3.metric("Constraints violated by old solution", in_conf)
    if st.session_state.last:
        nm, r = st.session_state.last
        st.markdown(f"**{nm}** — {'✅ solved' if r['success'] else '❌ failed'}")
        k1, k2, k3, k4 = st.columns(4)
        k1.metric("Search nodes / steps", f"{r['nodes']:,}")
        k2.metric("Time", f"{r['time'] * 1000:.1f} ms")
        k3.metric("Variables changed", r.get("changed") if r.get("changed") is not None else "–")
        k4.metric("Fallback stage", r.get("stage", 1))
        assign = r["solution"] or r.get("final_assignment") or {}
        fig = draw(p1, assign, old, dist, r.get("actions"), color_by)
    else:
        fig = draw(p1, {v: old.get(v) for v in p1.adj}, old, dist, None, color_by, False)
    st.plotly_chart(fig, width='stretch')
    st.caption("Thick outline = variable whose value changed; red edges = violated constraints. "
               "'Reuse action' colouring: grey = retain, amber = verify, red = discard.")
    if st.session_state.compare is not None:
        df = st.session_state.compare
        st.dataframe(df, width='stretch', hide_index=True)
        cc1, cc2 = st.columns(2)
        cc1.plotly_chart(go.Figure(go.Bar(x=df["solver"], y=df["search nodes / steps"]))
                         .update_layout(title="Repair effort (nodes / steps)", height=360),
                         width='stretch')
        cc2.plotly_chart(go.Figure(go.Bar(x=df["solver"], y=df["vars changed"]))
                         .update_layout(title="Solution stability (vars changed)", height=360),
                         width='stretch')
    if st.session_state.last and st.session_state.last[1]["success"]:
        if st.button("Commit P₁ as the new P₀"):
            r = st.session_state.last[1]
            env.csp = p1
            env.hidden = p1.hidden
            state.update(p1, r["solution"])
            st.session_state.log.append({"step": st.session_state.step, "solver": st.session_state.last[0],
                                         "changes": len(st.session_state.pending), "nodes": r["nodes"],
                                         "changed": r.get("changed")})
            st.session_state.step += 1
            st.session_state.update(pending=[], p1=None, last=None, compare=None)
            st.rerun()
else:
    st.plotly_chart(draw(csp, state.solution, state.solution, {}, None, "Colour", False),
                    width='stretch')

if st.session_state.log:
    st.subheader("History")
    st.dataframe(pd.DataFrame(st.session_state.log), width='stretch', hide_index=True)
