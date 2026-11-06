import json, sys
import pandas as pd, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
R = "C:/Users/Advika/Documents/GitHub/dynamic-csp-solver/retrain/results/"
OUT = sys.argv[1]
BLUE, ORANGE, AQUA, GREY = "#2a78d6", "#eb6834", "#1baf7a", "#a3a29c"
INK, INK2 = "#0b0b0b", "#52514e"
plt.rcParams.update({"font.family": "Arial", "font.size": 9, "axes.edgecolor": "#c9c8c2",
    "axes.labelcolor": INK2, "xtick.color": INK2, "ytick.color": INK2, "axes.titlesize": 10,
    "axes.titleweight": "bold", "axes.titlecolor": INK, "axes.spines.top": False, "axes.spines.right": False})
ev = pd.concat([pd.read_csv(R + "phase2_events.csv"), pd.read_csv(R + "phase4_events.csv")])
SHORT = {"Cold restart (BT+MRV+FC)": "Cold restart", "Naive Min-Conflicts": "Naive Min-Conflicts*",
         "Fixed reuse (r=1)": "Fixed reuse (r=1)", "Warm start (verify all)": "Warm start (verify all)",
         "ML: Logistic Regression": "ML: Logistic Reg.", "ML: Random Forest": "ML: Random Forest", "ML: XGBoost": "ML: XGBoost"}
ev["m"] = ev.method.map(SHORT)
def grid(ax): ax.xaxis.grid(True, color="#e6e5e0", lw=0.6); ax.set_axisbelow(True)

# Fig 1: median nodes and mean vars changed
g = ev.groupby("m")
med = g.nodes.median().sort_values(ascending=False); chg = g.changed.mean()
fig, axes = plt.subplots(1, 2, figsize=(7.2, 3.0), sharey=True)
for ax, ser, title, fmt in [(axes[0], med, "Median search nodes per change", "{:.0f}"),
                            (axes[1], chg.reindex(med.index), "Mean variables changed per change", "{:.1f}")]:
    cols = [BLUE if k.startswith("ML") else GREY for k in ser.index]
    ax.barh(ser.index, ser.values, color=cols, height=0.62, edgecolor="white", linewidth=1)
    for y, v in enumerate(ser.values): ax.text(v, y, " " + fmt.format(v), va="center", color=INK, fontsize=8)
    ax.set_title(title, loc="left"); grid(ax); ax.set_xlim(0, ser.max() * 1.2)
fig.text(0.01, 0.01, "Blue = learned policies, grey = baselines.  *Naive Min-Conflicts succeeds on only 68% of changes; failed changes are excluded from 'variables changed'.",
         fontsize=7, color=INK2)
fig.tight_layout(rect=(0, 0.05, 1, 1)); fig.savefig(OUT + "/fig1_median_stability.png", dpi=200); plt.close(fig)

# Fig 2: total nodes split by first-try vs fallback
order = ["Cold restart", "Warm start (verify all)", "Fixed reuse (r=1)", "ML: Logistic Reg.", "ML: Random Forest", "ML: XGBoost"]
e2 = ev[ev.m.isin(order)]
first = e2[e2.stage == 1].groupby("m").nodes.sum().reindex(order).fillna(0) / 1000
fb = e2[e2.stage > 1].groupby("m").nodes.sum().reindex(order).fillna(0) / 1000
rate = e2.groupby("m").stage.apply(lambda s: (s > 1).mean()).reindex(order)
fig, ax = plt.subplots(figsize=(7.2, 2.9))
ax.barh(order, first, color=BLUE, height=0.62, edgecolor="white", linewidth=1, label="Policy's first plan (stage 1)")
ax.barh(order, fb, left=first, color=ORANGE, height=0.62, edgecolor="white", linewidth=1, label="Fallback stages 2–6")
for y, k in enumerate(order):
    ax.text(first[k] + fb[k], y, f"  {first[k]+fb[k]:,.0f}k  ({rate[k]*100:.0f}% of changes fell back)", va="center", fontsize=8, color=INK)
ax.set_xlim(0, 2900); ax.set_xlabel("Total search nodes over 270 test changes (thousands)")
ax.set_title("Where the search effort goes", loc="left"); grid(ax); ax.invert_yaxis()
ax.legend(loc="lower right", frameon=False, fontsize=8)
fig.tight_layout(); fig.savefig(OUT + "/fig2_fallback.png", dpi=200); plt.close(fig)

# Fig 3: oracle label share by distance
d = pd.read_csv(R + "dataset.csv")
d["bucket"] = pd.cut(d.dist, [-1, 0, 1, 2, 3, 10], labels=["0", "1", "2", "3", "≥4"])
sh = d.groupby("bucket", observed=True).label.value_counts(normalize=True).unstack().fillna(0)[["retain", "verify", "discard"]] * 100
cnt = d.groupby("bucket", observed=True).size()
fig, ax = plt.subplots(figsize=(7.2, 2.6))
left = 0
for lab, col in [("retain", BLUE), ("verify", ORANGE), ("discard", AQUA)]:
    ax.barh(sh.index.astype(str), sh[lab], left=left, color=col, height=0.62, edgecolor="white", linewidth=1, label=lab)
    left = left + sh[lab]
for y, b in enumerate(sh.index):
    ax.text(sh.loc[b, "retain"] - 1, y, f"{sh.loc[b,'retain']:.0f}% retain", ha="right", va="center", color="white", fontsize=8)
    ax.text(101, y, f"{sh.loc[b,'verify']:.0f}% verify  (n={cnt[b]:,})", va="center", fontsize=8, color=INK)
ax.set_xlim(0, 135); ax.set_xticks([0, 25, 50, 75, 100]); ax.set_xlabel("Share of labelled variables (%)")
ax.set_ylabel("Hops from the change"); ax.invert_yaxis()
ax.set_title("Best action (counterfactual label) by distance from the change", loc="left")
ax.legend(loc="lower right", frameon=False, fontsize=8, ncol=3, bbox_to_anchor=(1, -0.42))
fig.tight_layout(); fig.savefig(OUT + "/fig3_labels_by_distance.png", dpi=200); plt.close(fig)

# Fig 4: feature importance
imp = json.load(open(R + "feature_importance.json"))
fig, axes = plt.subplots(1, 2, figsize=(7.2, 3.2))
for ax, name in zip(axes, ["Random Forest", "XGBoost"]):
    s = pd.Series(imp[name]).sort_values(ascending=False).head(10)[::-1]
    ax.barh(s.index, s.values, color=[ORANGE if i == "dist" else BLUE for i in s.index], height=0.62, edgecolor="white", linewidth=1)
    ax.set_title(f"{name}: top-10 features", loc="left"); grid(ax)
    for y, v in enumerate(s.values): ax.text(v, y, f" {v:.3f}", va="center", fontsize=7.5, color=INK)
    ax.set_xlim(0, s.max() * 1.25)
fig.text(0.01, 0.01, "Orange = graph distance to the change ('dist'). Importances are impurity-based (RF) and gain-based (XGBoost).", fontsize=7, color=INK2)
fig.tight_layout(rect=(0, 0.05, 1, 1)); fig.savefig(OUT + "/fig4_importance.png", dpi=200); plt.close(fig)
print("ok")
