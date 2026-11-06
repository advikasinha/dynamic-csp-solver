"""Run every phase end to end.

    python experiments/run_all.py            # all stages (cached where possible)
    python experiments/run_all.py phase4     # one stage

Outputs go to results/ and models/.
"""
from __future__ import annotations

import json
import os
import pickle
import sys
import time
import multiprocessing as mp


def Pool(n):
    # spawn, not fork: forking after XGBoost/OpenMP has run can deadlock the workers
    return mp.get_context("spawn").Pool(n)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

import joblib  # noqa: E402
import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from dcsp.benchmark import baseline_methods, ml_method, run_sequence  # noqa: E402
from dcsp.dataset import label_sequence  # noqa: E402
from dcsp.env import build_sequence  # noqa: E402
from dcsp.features import FEATURES  # noqa: E402
from dcsp.policies import MLReusePolicy  # noqa: E402

RES = os.path.join(ROOT, "results")
MOD = os.path.join(ROOT, "models")
os.makedirs(RES, exist_ok=True)
os.makedirs(MOD, exist_ok=True)

SIZES = [60, 100, 150]
K, AVG_DEG, STEPS = 4, 8.0, 15
TRAIN_SEEDS = range(100, 110)      # 10 per size -> 30 training sequences
TEST_SEEDS = range(500, 506)       # 6 per size  -> 18 unseen test sequences
LABEL_MAP = {"retain": 0, "verify": 1, "discard": 2}
WORKERS = max(1, min(4, os.cpu_count() or 1))


# ------------------------------------------------------------------ sequences
def _build(args):
    split, n, seed = args
    return split, n, seed, build_sequence(n, K, AVG_DEG, STEPS, seed)


def stage_sequences():
    path = os.path.join(RES, "sequences.pkl")
    if os.path.exists(path):
        return pickle.load(open(path, "rb"))
    jobs = [("train", n, s) for n in SIZES for s in TRAIN_SEEDS] + \
           [("test", n, s) for n in SIZES for s in TEST_SEEDS]
    with Pool(WORKERS) as p:
        out = p.map(_build, jobs)
    seqs = {"train": [], "test": []}
    for split, n, seed, seq in out:
        seqs[split].append(seq)
    pickle.dump(seqs, open(path, "wb"))
    return seqs


# -------------------------------------------------------------------- phase 2
def _bench(args):
    seq, sid, name = args
    fn = baseline_methods()[name]
    return run_sequence(seq, sid, name, fn)


def stage_phase2(seqs):
    names = list(baseline_methods().keys())
    jobs = [(seq, i, nm) for i, seq in enumerate(seqs["test"]) for nm in names]
    with Pool(WORKERS) as p:
        out = p.map(_bench, jobs)
    df = pd.DataFrame([r for rows in out for r in rows])
    df.to_csv(os.path.join(RES, "phase2_events.csv"), index=False)
    return df


# -------------------------------------------------------------------- phase 3
def _label(args):
    seq, sid = args
    return label_sequence(seq, sid, seed=sid)


def stage_phase3(seqs):
    jobs = [(seq, i) for i, seq in enumerate(seqs["train"])]
    with Pool(WORKERS) as p:
        out = p.map(_label, jobs)
    df = pd.DataFrame([r for rows in out for r in rows])
    df.to_csv(os.path.join(RES, "dataset.csv"), index=False)
    return df


# -------------------------------------------------------------------- phase 4
def make_models():
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.pipeline import make_pipeline
    from sklearn.preprocessing import StandardScaler
    from xgboost import XGBClassifier
    return {
        "Logistic Regression": make_pipeline(
            StandardScaler(), LogisticRegression(max_iter=3000, class_weight="balanced")),
        "Random Forest": RandomForestClassifier(
            n_estimators=300, min_samples_leaf=3, class_weight="balanced_subsample",
            n_jobs=WORKERS, random_state=0),
        "XGBoost": XGBClassifier(
            n_estimators=300, max_depth=4, learning_rate=0.05, subsample=0.9,
            colsample_bytree=0.9, objective="multi:softprob", num_class=3,
            eval_metric="mlogloss", random_state=0, n_jobs=WORKERS),
    }


def _e2e(args):
    seq, sid, name, model_path, thr = args
    model = joblib.load(model_path)
    est = model[-1] if hasattr(model, "steps") else model
    if hasattr(est, "n_jobs"):
        est.n_jobs = 1  # already parallel across sequences
    pol = MLReusePolicy(model, name, threshold=thr)
    return run_sequence(seq, sid, name, ml_method(pol))


def stage_phase4(seqs, data):
    from sklearn.metrics import (accuracy_score, classification_report, confusion_matrix,
                                 f1_score, roc_auc_score)
    from sklearn.utils.class_weight import compute_sample_weight

    data = data.copy()
    data["y"] = data["label"].map(LABEL_MAP)
    seq_ids = sorted(data["seq"].unique())
    rng = np.random.RandomState(0)
    # hold out 20% of training sequences (stratified by size) for validation
    val_ids = []
    for n in SIZES:
        ids = sorted(data.loc[data["n"] == n, "seq"].unique())
        val_ids += list(rng.choice(ids, size=max(1, len(ids) // 5), replace=False))
    tr = data[~data["seq"].isin(val_ids)]
    va = data[data["seq"].isin(val_ids)]
    Xtr, ytr = tr[FEATURES].values.astype(float), tr["y"].values
    Xva, yva = va[FEATURES].values.astype(float), va["y"].values

    metrics, importances = {}, {}
    for name, model in make_models().items():
        t0 = time.time()
        if name == "XGBoost":
            model.fit(Xtr, ytr, sample_weight=compute_sample_weight("balanced", ytr))
        else:
            model.fit(Xtr, ytr)
        fit_time = time.time() - t0
        pred = model.predict(Xva)
        proba = model.predict_proba(Xva)
        p_ret = proba[:, list(model.classes_).index(0)]
        costs = va[["cost_retain", "cost_verify", "cost_discard"]].values
        best = costs.min(1)
        regret = float(np.mean(costs[np.arange(len(pred)), pred.astype(int)] - best))
        metrics[name] = {
            "accuracy": accuracy_score(yva, pred),
            "macro_f1": f1_score(yva, pred, average="macro"),
            "retain_auc": roc_auc_score((yva == 0).astype(int), p_ret),
            "mean_regret_nodes": regret,
            "fit_time_s": fit_time,
            "confusion": confusion_matrix(yva, pred, labels=[0, 1, 2]).tolist(),
            "report": classification_report(yva, pred, labels=[0, 1, 2],
                                            target_names=list(LABEL_MAP), output_dict=True,
                                            zero_division=0),
        }
        joblib.dump(model, os.path.join(MOD, f"{name.replace(' ', '_').lower()}.joblib"))
        est = model[-1] if hasattr(model, "steps") else model
        if hasattr(est, "feature_importances_"):
            importances[name] = dict(zip(FEATURES, map(float, est.feature_importances_)))
        elif hasattr(est, "coef_"):
            importances[name] = dict(zip(FEATURES, map(float, np.abs(est.coef_).mean(0))))

    # reference policies scored on the same validation rows
    costs = va[["cost_retain", "cost_verify", "cost_discard"]].values
    best = costs.min(1)
    ref_pred = np.where(va["dist"].values > 1, 0, 1)
    metrics["_reference"] = {
        "always_retain_regret": float(np.mean(costs[:, 0] - best)),
        "fixed_policy_regret": float(np.mean(costs[np.arange(len(va)), ref_pred] - best)),
        "oracle_label_share": va["label"].value_counts(normalize=True).to_dict(),
        "n_train_rows": int(len(tr)), "n_val_rows": int(len(va)),
        "val_seq_ids": [int(x) for x in val_ids],
    }
    json.dump(metrics, open(os.path.join(RES, "phase4_classification.json"), "w"), indent=2)
    json.dump(importances, open(os.path.join(RES, "feature_importance.json"), "w"), indent=2)

    # --- threshold tuning, end to end, on the held-out *training* sequences
    val_seqs = [(seqs["train"][i], int(i)) for i in val_ids]
    tune_jobs = []
    for name in make_models():
        mp = os.path.join(MOD, f"{name.replace(' ', '_').lower()}.joblib")
        for thr in (None, 0.6, 0.8, 0.9):
            tune_jobs.append((name, mp, thr))
    jobs = [(s, sid, f"{nm}|{thr}", mp, thr) for nm, mp, thr in tune_jobs for s, sid in val_seqs]
    with Pool(WORKERS) as p:
        out = p.map(_e2e, jobs)
    tune = pd.DataFrame([r for rows in out for r in rows])
    tune.to_csv(os.path.join(RES, "phase4_threshold_tuning.csv"), index=False)
    agg = tune.groupby("method").agg(nodes=("nodes", "sum"), changed=("changed", "sum"),
                                     success=("success", "mean"))
    agg["score"] = agg["nodes"] + agg["changed"]
    chosen = {}
    for name in make_models():
        sub = agg[agg.index.str.startswith(name + "|")]
        best_key = sub["score"].idxmin()
        thr = best_key.split("|")[1]
        chosen[name] = None if thr == "None" else float(thr)
    json.dump({"chosen": chosen, "table": agg.reset_index().to_dict("records")},
              open(os.path.join(RES, "phase4_threshold_choice.json"), "w"), indent=2)

    # --- final end-to-end evaluation on the unseen test sequences
    jobs = []
    for name, thr in chosen.items():
        mp = os.path.join(MOD, f"{name.replace(' ', '_').lower()}.joblib")
        label = f"ML: {name}"
        jobs += [(s, i, label, mp, thr) for i, s in enumerate(seqs["test"])]
    with Pool(WORKERS) as p:
        out = p.map(_e2e, jobs)
    df = pd.DataFrame([r for rows in out for r in rows])
    df.to_csv(os.path.join(RES, "phase4_events.csv"), index=False)
    return metrics, chosen, df


def summarize():
    ev = pd.concat([pd.read_csv(os.path.join(RES, "phase2_events.csv")),
                    pd.read_csv(os.path.join(RES, "phase4_events.csv"))])
    g = ev.groupby("method")
    summ = pd.DataFrame({
        "success_rate": g["success"].mean(),
        "first_try_success": g["first_try_success"].mean(),
        "mean_nodes": g["nodes"].mean(),
        "median_nodes": g["nodes"].median(),
        "p95_nodes": g["nodes"].quantile(0.95),
        "mean_time_ms": g["time"].mean() * 1000,
        "mean_changed": g["changed"].mean(),
        "events": g.size(),
    }).sort_values("mean_nodes")
    summ.to_csv(os.path.join(RES, "summary.csv"))
    by_n = ev.groupby(["method", "n"]).agg(mean_nodes=("nodes", "mean"),
                                           mean_time_ms=("time", lambda x: x.mean() * 1000),
                                           mean_changed=("changed", "mean"),
                                           success=("success", "mean")).reset_index()
    by_n.to_csv(os.path.join(RES, "summary_by_size.csv"), index=False)
    print(summ.round(3).to_string())
    print(by_n.round(2).to_string())
    return summ


if __name__ == "__main__":
    which = sys.argv[1:] or ["sequences", "phase2", "phase3", "phase4", "summary"]
    t0 = time.time()
    seqs = stage_sequences()
    print(f"sequences ready ({time.time() - t0:.0f}s)", flush=True)
    if "phase2" in which:
        stage_phase2(seqs)
        print(f"phase2 done ({time.time() - t0:.0f}s)", flush=True)
    if "phase3" in which:
        d = stage_phase3(seqs)
        print(f"phase3 done: {len(d)} rows ({time.time() - t0:.0f}s)", flush=True)
    if "phase4" in which:
        data = pd.read_csv(os.path.join(RES, "dataset.csv"))
        m, chosen, _ = stage_phase4(seqs, data)
        print("chosen thresholds", chosen)
        print({k: {kk: vv for kk, vv in v.items() if kk in ("accuracy", "macro_f1", "retain_auc",
                                                            "mean_regret_nodes")}
               for k, v in m.items() if not k.startswith("_")})
        print(m["_reference"])
        print(f"phase4 done ({time.time() - t0:.0f}s)", flush=True)
    if "summary" in which:
        summarize()
