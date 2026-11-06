# Learning What to Reuse: ML-Guided Repair for Dynamic Graph-Coloring CSPs

A dynamic graph-colouring CSP testbed. A problem P0 is solved, a batch of edits turns it
into P1, and a repair method must colour P1 starting from the old solution. For each
variable a reuse policy decides to **retain** (keep the value fixed), **verify** (search,
old value first) or **discard** (search from scratch). We compare hand-designed baselines
with learned policies (Logistic Regression, Random Forest, XGBoost).

## Layout

| Path | Phase | What it holds |
| --- | --- | --- |
| `dcsp/csp.py` | 1 | CSP model, mutations, conflict checks, planted generator |
| `dcsp/env.py` | 1 | change types, disruptive change sampler, `SolverState`, replayable sequences |
| `dcsp/solvers.py` | 2 | Backtracking + MRV + forward checking; Min-Conflicts |
| `dcsp/repair.py` | 2/4 | retain/verify/discard interface, ring fallback, baselines |
| `dcsp/benchmark.py` | 2/4 | replays identical sequences per method |
| `dcsp/features.py` | 3 | 29 per-variable features |
| `dcsp/dataset.py` | 3 | counterfactual labelling |
| `dcsp/policies.py` | 4 | `MLReusePolicy` |
| `experiments/run_all.py` | 1-4 | whole pipeline |
| `app.py` | 5 | Streamlit + Plotly dashboard |
| `results/` | | CSV/JSON outputs used in the report |
| `models/` | | trained classifiers (joblib) |

## Run

```bash
pip install numpy pandas scikit-learn xgboost networkx streamlit plotly joblib
python experiments/run_all.py            # all stages; or: phase2 | phase3 | phase4 | summary
streamlit run app.py
```

The pretrained models in `models/` let the dashboard use the ML policies straight away.
