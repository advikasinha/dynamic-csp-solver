const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun, Footer, Header,
  AlignmentType, HeadingLevel, WidthType, ShadingType, BorderStyle, LevelFormat, PageNumber,
  PageBreak, TableOfContents, VerticalAlign,
} = require("docx");

const DIR = __dirname;
const OUT = process.argv[2];
const FONT = "Calibri";
const NAVY = "1F2A6B";
const MUTED = "52514E";
const PAGE_W = 11906, MARGIN = 1300, CONTENT = PAGE_W - 2 * MARGIN; // A4

// ---------------------------------------------------------------- helpers
function runs(text, base = {}) {
  // **bold** and _italic_ inline markup
  const out = [];
  const re = /(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), ...base }));
    const t = m[0];
    if (t.startsWith("**")) out.push(new TextRun({ text: t.slice(2, -2), bold: true, ...base }));
    else if (t.startsWith("`")) out.push(new TextRun({ text: t.slice(1, -1), font: "Consolas", size: 19, ...base }));
    else out.push(new TextRun({ text: t.slice(1, -1), italics: true, ...base }));
    last = m.index + t.length;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), ...base }));
  return out;
}
const P = (text, opts = {}) => new Paragraph({ children: runs(text, opts.run || {}), spacing: { after: 120, line: 276 },
  alignment: opts.align || AlignmentType.JUSTIFIED, ...(opts.para || {}) });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] });
const B = (text, level = 0) => new Paragraph({ numbering: { reference: "bullets", level }, children: runs(text),
  spacing: { after: 60, line: 264 } });
const N = (text, ref = "numbers") => new Paragraph({ ...(ref === "hyp" ? { indent: { left: 360 } } : { numbering: { reference: ref, level: 0 } }), children: runs(text),
  spacing: { after: 60, line: 264 } });
const CODE = (lines) => lines.map((l, i) => new Paragraph({
  children: [new TextRun({ text: l || " ", font: "Consolas", size: 18 })],
  shading: { type: ShadingType.CLEAR, color: "auto", fill: "F3F3F1" },
  spacing: { after: i === lines.length - 1 ? 160 : 0 }, indent: { left: 200, right: 200 },
}));
const CAPTION = (t) => new Paragraph({ children: runs(t, { size: 18, color: MUTED, italics: false }),
  alignment: AlignmentType.CENTER, spacing: { before: 60, after: 220 } });

function img(file, widthIn) {
  const buf = fs.readFileSync(path.join(DIR, file));
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  const wpx = widthIn * 96;
  return new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 120 },
    children: [new ImageRun({ type: "png", data: buf, transformation: { width: wpx, height: wpx * h / w },
      altText: { title: file, description: file, name: file } })] });
}

const border = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
const borders = { top: border, bottom: border, left: border, right: border };
function table(header, rows, widths, opts = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  const mk = (cells, isHead, rowIdx) => new TableRow({ tableHeader: isHead, cantSplit: true, children: cells.map((c, i) => {
    const bold = isHead || (opts.boldRows || []).includes(rowIdx);
    return new TableCell({
      borders, width: { size: widths[i], type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
      shading: isHead ? { type: ShadingType.CLEAR, color: "auto", fill: "E4E7F2" }
        : ((opts.shadeRows || []).includes(rowIdx) ? { type: ShadingType.CLEAR, color: "auto", fill: "F4F6FB" } : undefined),
      margins: { top: 50, bottom: 50, left: 90, right: 90 },
      children: [new Paragraph({ alignment: (i === 0 || (opts.leftCols || []).includes(i)) ? AlignmentType.LEFT : AlignmentType.CENTER,
        children: runs(String(c), { size: opts.size || 18, bold }) })],
    });
  }) });
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths,
    rows: [mk(header, true, -1), ...rows.map((r, i) => mk(r, false, i))] });
}
const gap = () => new Paragraph({ children: [], spacing: { after: 60 } });

// ---------------------------------------------------------------- title page
const titlePage = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 60 },
    children: [new TextRun({ text: "INDIAN INSTITUTE OF TECHNOLOGY ROORKEE", bold: true, size: 26, color: NAVY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 360 },
    children: [new TextRun({ text: "DAC-203  ·  Project Report", size: 22, color: MUTED })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
    children: [new TextRun({ text: "Dynamic CSP with Incremental Repair", bold: true, size: 44, color: NAVY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 360 },
    children: [new TextRun({ text: "Learned Selective State Reuse for Dynamic Graph-Colouring CSPs", size: 28, color: NAVY })] }),
  table(["Group member", "Enrolment no.", "Role"], [
    ["Advika Sinha", "23117010", "ML lead: features, labelling, models, learned policy"],
    ["Kavya Rajput", "23117064", "Systems lead: CSP environment, solvers, baselines, dashboard"],
  ], [2600, 1700, CONTENT - 4300], { leftCols: [2] , size: 19 }),
  gap(),
  table(["Item", "Details"], [
    ["Course instructor", "[Instructor name]"],
    ["Submission date", "[Date]"],
    ["Code repository", "github.com/advikasinha/dynamic-csp-solver"],
    ["Live demo", "dynamic-csp-solver-dac203.streamlit.app"],
  ], [2600, CONTENT - 2600], { leftCols: [1], size: 19 }),
  new Paragraph({ spacing: { before: 300, after: 100 },
    children: [new TextRun({ text: "Contribution of each group member", bold: true, size: 24, color: NAVY })] }),
  P("The work was split equally (about 50% each). Advika led the machine-learning pipeline; Kavya led the CSP " +
    "environment, the search and repair engine, the benchmark and the dashboard, and also took part of the ML " +
    "evaluation. Both members worked on the literature review, the mid-evaluation presentation and this report.",
    { run: { size: 19 } }),
  table(["Advika Sinha (23117010)", "Kavya Rajput (23117064)"], [
    ["Per-variable feature design: 29 features (`dcsp/features.py`)",
     "Graph-colouring CSP model and planted instance generator (`dcsp/csp.py`)"],
    ["Counterfactual labelling and the 7,205-row reuse dataset (`dcsp/dataset.py`, phase 3)",
     "Dynamic environment: 7 change types, disruptive change sampler, solver state (`dcsp/env.py`)"],
    ["Training of Logistic Regression, Random Forest and XGBoost; class balancing; validation split",
     "Backtracking + MRV + Forward Checking and Min-Conflicts solvers (`dcsp/solvers.py`)"],
    ["Retain-threshold tuning on held-out training sequences",
     "Retain / verify / discard repair interface and fallback ladder; baselines (`dcsp/repair.py`)"],
    ["Learned reuse policy and its integration into the repair engine (`dcsp/policies.py`)",
     "Benchmark harness and replay of identical sequences (`dcsp/benchmark.py`, phase 2)"],
    ["Classifier analysis: confusion matrices, regret, feature importance",
     "End-to-end evaluation of the learned policies on test sequences; fallback analysis"],
    ["Experiment pipeline (`experiments/run_all.py`), retraining and deployment",
     "Interactive Streamlit + Plotly dashboard (`app.py`)"],
    ["Report: ML sections (5, 7.1, 7.5) and abstract", "Report: system and evaluation sections (4, 6, 7.2–7.4, 8) and related work"],
  ], [CONTENT / 2, CONTENT / 2], { leftCols: [1], size: 17 }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ---------------------------------------------------------------- body
const body = [
  new Paragraph({ children: [new TextRun({ text: "Contents", bold: true, size: 30, color: NAVY, font: FONT })], spacing: { after: 120 } }),
  new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-2" }),
  P("_Right-click the table above and choose Update Field if page numbers are missing._", { run: { size: 17, color: MUTED } }),
  new Paragraph({ children: [new PageBreak()] }),

  H1("Abstract"),
  P("Real constraint satisfaction problems change after they are solved: a timetable gains a clash, a resource " +
    "disappears, a new task arrives. Re-solving from scratch throws away the previous solution and usually changes " +
    "far more of it than the edit requires. We study **selective reuse**: after a change, decide for every variable " +
    "whether to **retain** its old value (fix it, no search), **verify** it (search, old value tried first) or " +
    "**discard** it (search from scratch). We build a dynamic graph-colouring testbed with seven change types, " +
    "label 7,205 variable decisions by counterfactual repair experiments, and train Logistic Regression, Random " +
    "Forest and XGBoost policies on 29 per-variable features. A fallback ladder that releases retained variables " +
    "ring by ring around the change keeps every method complete."),
  P("On 270 unseen changes across graphs of 60, 100 and 150 variables, every complete method solves 100% of " +
    "changes. The XGBoost policy needs **51% fewer search nodes than a cold restart** and **12% fewer than a fixed " +
    "distance-based reuse rule**, changes **65% fewer variables** than a cold restart, and solves the median change " +
    "in **2 search nodes** (fixed rule: 43; cold restart: 155). Its prediction overhead is 2–3 ms per change. " +
    "However, a simple warm start that verifies every variable has the lowest _mean_ search cost (1,871 nodes vs " +
    "3,499 for XGBoost), because the learned policies' first plan fails on about 30% of changes, and those " +
    "fallbacks account for almost all of their cost. Reducing harmful retention is therefore the main open problem."),

  H1("1. Introduction and Motivation"),
  P("A **Constraint Satisfaction Problem (CSP)** asks for an assignment of values to variables such that every " +
    "constraint is satisfied. It has three components: **variables** (what must be decided), **domains** (the " +
    "values each variable may take) and **constraints** (which combinations of values are allowed)."),
  P("In a **dynamic CSP** the problem itself changes over time: constraints are added or removed, domains shrink " +
    "or grow, and variables appear or disappear. We write the solved problem as P₀, the batch of edits as Δ and " +
    "the new problem as P₁. Re-solving P₁ from scratch after every small Δ is expensive, and it discards " +
    "information the previous search already paid for. Equally important in practice is **solution stability**: " +
    "if the variables are people's shifts or radio frequencies, every changed value has a real cost."),
  P("Reusing everything is not the answer either. Parts of the old state become invalid (a banned colour), and " +
    "parts remain valid but harmful: keeping them fixed can make P₁ unsatisfiable or force a long search. Our " +
    "central question, as framed at mid-evaluation, is:"),
  P("**Which parts of the previous solver state are safe and useful to preserve after a change?**", { align: AlignmentType.CENTER }),

  H1("2. Research Question and Hypotheses"),
  P("_Can a learned, change-aware policy selectively preserve solver state after CSP modifications more " +
    "effectively than fixed structural reuse rules or complete re-solving?_"),
  N("**H1: Solver state has heterogeneous stability.** Assignments, nogoods and heuristic statistics do not all respond to a change in the same way.", "hyp"),
  N("**H2: Graph distance alone is insufficient.** Being far from the change does not guarantee that a value is safe or useful to keep.", "hyp"),
  N("**H3: Learning predicts beneficial reuse better than fixed policies.**", "hyp"),
  N("**H4: Selective reuse reduces repair cost without harming completeness.**", "hyp"),
  P("Section 7.6 assesses each hypothesis against the results. H1 was not tested in the final scope (Section 3)."),

  H1("3. Related Work and Changes Since Mid-Evaluation"),
  H2("3.1 Related work"),
  table(["Work", "Idea", "Gap relative to this project"], [
    ["Wallace, Grimes & Freuder (2009)", "Identify stable structural features of a dynamic CSP and exploit them in later search.", "Does not learn a general policy for which state to retain."],
    ["Koriche, Lecoutre, Paparrizou & Wattez (2022)", "Best-arm identification (multi-armed bandits) to choose variable-ordering heuristics.", "Selects heuristics; does not address state reuse after a change."],
    ["Tolpin & Shimony (2011)", "Decide when an expensive CSP heuristic is worth deploying, by benefit vs. cost.", "Heuristic deployment rather than selective reuse of state."],
    ["Verfaillie & Schiex (1994)", "Solution reuse in dynamic CSPs by local repair of the previous solution.", "Reuse is rule-based, not learned per variable."],
    ["Minton et al. (1992)", "Min-Conflicts heuristic repair for CSPs and scheduling.", "Incomplete; no guarantee of finding a solution (see Section 7.2)."],
  ], [2500, 3700, CONTENT - 6200], { leftCols: [1, 2], size: 17 }),
  P("Our contribution is a **change-aware, per-variable, learned** reuse decision, combined with a complete " +
    "repair procedure, and evaluated against both rule-based reuse and complete re-solving on identical change " +
    "sequences.", { para: { spacing: { before: 160, after: 120 } } }),
  H2("3.2 What changed since mid-evaluation"),
  P("Building and measuring the system led to several deliberate changes to the plan presented at mid-evaluation:"),
  table(["Mid-evaluation plan", "Final implementation", "Reason"], [
    ["Repair engine: Min-Conflicts local search", "Repair engine: Backtracking + MRV + Forward Checking that takes retained values as fixed and old values as first-try hints. Min-Conflicts is kept as a baseline.", "Min-Conflicts failed on 32% of test changes within its step budget, so it cannot guarantee completeness (H4)."],
    ["Reuse heterogeneous state: assignments, nogoods, heuristic statistics, propagation caches", "Reuse decisions are made for **variable assignments**. Conflict and change history are carried forward and used as **features**, not as reusable state.", "Keeping one well-measured state type made counterfactual labelling tractable. H1 is left to future work."],
    ["Labels determined \"experimentally\"", "Counterfactual labelling: rerun the same repair three times, changing only one variable's action (Section 5.2).", "Gives a label that measures the effect of one decision, not correlation."],
    ["Structural stability baseline (Wallace et al.)", "Fixed structural reuse rule: retain beyond r hops of the change, verify within (r = 1).", "A simplified, distance-only version of the structural-stability idea."],
    ["Metrics: time, node expansions, backtracks, propagation ops, reuse %, harmful reuse, completeness", "Search nodes, wall time, variables changed, success rate, first-try success, fallback stage, retained count.", "Backtracks and propagation counts are not reported separately. Harmful reuse is measured as the fallback rate."],
    ["Benchmark CSPs", "Planted random graph colouring (guaranteed solvable).", "Lets us generate unlimited solvable sequences with controlled change types."],
    ["(not planned)", "Retain-probability threshold, fallback ladder, interactive dashboard.", "Needed for safety (completeness) and for demonstration."],
  ], [2700, 3800, CONTENT - 6500], { leftCols: [1, 2], size: 17 }),

  H1("4. System Design"),
  H2("4.1 Problem model"),
  P("We use **graph colouring** as the CSP: one variable per node, domain {0, …, k−1} minus any banned colours, " +
    "and a not-equal constraint on every edge. Instances are **planted**: each node gets a hidden colour and edges " +
    "are only drawn between nodes of different hidden colour, so a valid k-colouring always exists. All changes " +
    "respect the hidden colouring, so every P_t in a sequence stays solvable and failures are the solver's, not " +
    "the problem's."),
  H2("4.2 Dynamic environment"),
  P("A sequence P₀ → P₁ → … → P₁₅ applies a batch of 1–4 atomic changes at each step. The sampler is biased " +
    "towards **disruptive** changes (for example, adding an edge between two nodes that currently share a colour), " +
    "because those are where repair strategy matters."),
  table(["Change type", "Effect", "Sampling weight"], [
    ["add_edge", "New not-equal constraint between two nodes", "0.35"],
    ["restrict_domain", "Ban one colour for one node (often its current colour)", "0.23"],
    ["remove_edge", "Delete a constraint", "0.12"],
    ["add_node", "New variable connected to ~average-degree neighbours", "0.12"],
    ["remove_node", "Delete a variable and its constraints", "0.08"],
    ["add_color", "k → k + 1", "0.05"],
    ["remove_color", "k → k − 1 (highest colour removed)", "0.05"],
  ], [2400, 5000, CONTENT - 7400], { leftCols: [1] }),
  P("A **SolverState** carries the old solution plus per-variable history from step to step: how often each " +
    "variable was in conflict after a change, how often repair changed its value, and when it last changed.",
    { para: { spacing: { before: 160, after: 120 } } }),
  H2("4.3 Solvers"),
  B("**Backtracking + MRV + Forward Checking (BT+MRV+FC).** Chooses the variable with the fewest remaining values (degree tie-break), prunes neighbours' domains after each assignment, and accepts two extra inputs: _fixed_ (retained) assignments that are placed and propagated first, and _hints_ (verified) values that are tried first."),
  B("**Min-Conflicts.** Starts from the old assignment and repeatedly recolours a conflicted variable with its least-conflicting value, with a budget of 50 × n steps."),
  H2("4.4 The retain / verify / discard interface"),
  P("Every repair method in the project, learned or not, is expressed as one action per variable of P₁:"),
  table(["Action", "Meaning in the search"], [
    ["Retain", "Keep the old value fixed; the variable is removed from search (forward-checked once)."],
    ["Verify", "Search over the variable, but try the old value first."],
    ["Discard", "Search over the variable from scratch, with no hint."],
  ], [1800, CONTENT - 1800], { leftCols: [1] }),
  P("Two safety rules are applied before search: a variable whose old value is invalid in P₁ (new node, banned or " +
    "removed colour) is always discarded, and two adjacent retained variables with the same colour are both " +
    "downgraded to verify.", { para: { spacing: { before: 160, after: 120 } } }),
  H3("Fallback ladder (completeness guarantee)"),
  P("A wrong retain decision can make P₁ unsatisfiable under the fixed values, or exhaust the stage budget of " +
    "5,000 search nodes. The repair then escalates instead of failing:"),
  table(["Stage", "What happens"], [
    ["1", "Run the policy's actions as given."],
    ["2–5", "Release retained variables within 1, 2, 3, then 4 hops of the change to verify, and search again."],
    ["6", "Cold restart with BT+MRV+FC (budget 500,000 nodes)."],
  ], [1200, CONTENT - 1200], { leftCols: [1] }),
  P("Because the last stage is a complete search, every policy that uses this interface is complete. The " +
    "**fallback rate** (share of changes needing stage > 1) is our measure of harmful reuse.",
    { para: { spacing: { before: 160, after: 120 } } }),
  H2("4.5 Baselines"),
  table(["Baseline", "Policy"], [
    ["Cold restart (BT+MRV+FC)", "Ignore the old solution; solve P₁ from scratch."],
    ["Naive Min-Conflicts", "Unfiltered local repair from the old assignment (incomplete)."],
    ["Fixed structural reuse (r = 1)", "Retain every variable more than 1 hop from the change; verify the rest."],
    ["Warm start (verify all)", "Verify every variable: search everything, old values first."],
  ], [3000, CONTENT - 3000], { leftCols: [1] }),
  P("Distance from the change is the BFS hop distance in P₁ from the **touched nodes**: the endpoints of " +
    "added or removed edges, new nodes, neighbours of removed nodes, and every node whose old value became invalid.",
    { para: { spacing: { before: 160, after: 120 } } }),

  H1("5. Learning the Reuse Policy"),
  H2("5.1 Features"),
  P("For each variable of P₁ we compute 29 features in four groups. They cover the change type and magnitude, " +
    "graph distance, constraint degree and tightness, conflict frequency, and assignment persistence named in the " +
    "mid-evaluation plan."),
  table(["Group", "Features"], [
    ["Locality and structure (6)", "`dist` (hops to change, capped at 10), `degree`, `delta_degree`, `is_new`, `nbr_mean_degree`, `n_conf_nbrs`"],
    ["Validity and tightness (6)", "`old_valid`, `in_conflict`, `domain_size`, `saturation` (distinct neighbour colours), `slack` (free colours), `conf_nbrs_within1`"],
    ["Solver history (4)", "`conflict_hist`, `change_hist`, `steps_since_change`, `nbr_conflict_hist`"],
    ["Global change context (13)", "`k`, `density`, `n_nodes`, `batch_size`, `n_sources`, `frac_conflicted`, and a count of each of the 7 change types in the batch"],
  ], [2700, CONTENT - 2700], { leftCols: [1], size: 17 }),
  H2("5.2 Counterfactual labelling"),
  P("A label should say which action is _best for this variable_, holding everything else equal. For every change " +
    "event in the training sequences:", { para: { spacing: { before: 160, after: 120 } } }),
  N("Compute features for every variable, and a reference action for every variable from the fixed r = 1 rule.", "lab"),
  N("Sample up to 12 variables within 2 hops of the change and up to 8 farther away (only variables whose old value is still valid).", "lab"),
  N("For each sampled variable, run the full repair three times, switching only that variable between retain, verify and discard.", "lab"),
  N("Score each run by cost = search nodes + variables changed (a failed run costs 2 × nodes + 100,000). The label is the cheapest action; ties go to retain, then verify.", "lab"),
  P("Events where even the reference policy needed a cold restart are skipped, because no single variable's " +
    "action can be credited. All three per-action costs are stored, which lets us measure **regret**: the extra " +
    "cost of a predicted action over the best one.", { para: { spacing: { before: 120, after: 120 } } }),
  H2("5.3 Dataset"),
  table(["Property", "Value"], [
    ["Training sequences", "30 (10 seeds × 3 sizes: n = 60, 100, 150), k = 4, average degree 8, 15 steps"],
    ["Labelled change events", "438 of 450 produced labelled rows"],
    ["Labelled variables (rows)", "7,205: 5,765 for training, 1,440 for validation"],
    ["Validation split", "20% of training sequences held out, stratified by size (6 sequences)"],
    ["Label distribution", "retain 91.6%, verify 7.8%, discard 0.6%"],
  ], [2900, CONTENT - 2900], { leftCols: [1] }),
  P("The labels are heavily imbalanced: retaining is usually right. Figure 1 shows how the right action depends on " +
    "distance from the change.", { para: { spacing: { before: 160, after: 120 } } }),
  img("fig3_labels_by_distance.png", 6.2),
  CAPTION("Figure 1. Counterfactual labels by hop distance from the change (training data)."),
  H2("5.4 Models"),
  table(["Model", "Configuration", "Class imbalance handling"], [
    ["Logistic Regression", "Standardised features, max 3,000 iterations", "class_weight = balanced"],
    ["Random Forest", "300 trees, min_samples_leaf = 3", "class_weight = balanced_subsample"],
    ["XGBoost", "300 trees, depth 4, learning rate 0.05, subsample 0.9, colsample 0.9, softprob", "Balanced sample weights"],
  ], [2200, 4300, CONTENT - 6500], { leftCols: [1, 2], size: 17 }),
  H2("5.5 Decision rule and threshold tuning"),
  P("The policy predicts class probabilities for every variable. By default it takes the most likely action " +
    "(argmax). Because a wrong retain is the expensive mistake, we also tried a **retain threshold**: retain only " +
    "if P(retain) ≥ τ, otherwise take the more likely of verify and discard. τ ∈ {argmax, 0.6, 0.8, 0.9} was " +
    "chosen per model by replaying the 6 held-out training sequences end to end and minimising total search nodes " +
    "+ variables changed. The chosen values were τ = 0.6 for Logistic Regression and XGBoost, and argmax for " +
    "Random Forest (Appendix B).", { para: { spacing: { before: 160, after: 120 } } }),

  H1("6. Experimental Setup"),
  B("**Test data:** 18 unseen sequences (6 seeds × n = 60, 100, 150), 15 steps each, giving **270 change events** (2.6 changes per batch on average). Training and test seeds do not overlap."),
  B("**Protocol:** every method replays exactly the same change batches from the same P₀ and initial solution. Each method repairs from _its own_ previous solution. If a method fails, the chain continues from a reference solution whose cost is not charged to the method."),
  B("**Budgets:** 5,000 nodes per repair stage; 500,000 nodes for a cold restart; Min-Conflicts 50 × n steps."),
  B("**Metrics:** success rate; first-try success (stage 1); search nodes (mean, median, 95th percentile); wall time; variables changed (the number of persisting variables whose value differs from the old solution); fallback stage."),
  B("**Environment:** Python 3.14, scikit-learn 1.9.1, XGBoost 3.4.1, NumPy 2.5.4, pandas 3.1.1. The full pipeline runs in about 16.5 minutes on 4 worker processes."),

  H1("7. Results"),
  H2("7.1 Classifier quality (validation set)"),
  table(["Model", "Accuracy", "Macro F1", "Retain AUC", "Mean regret"], [
    ["Logistic Regression", "0.753", "0.439", "0.904", "18.84"],
    ["Random Forest", "0.942", "0.511", "0.915", "14.23"],
    ["XGBoost", "0.888", "0.485", "0.864", "14.31"],
    ["_Reference: always retain_", "0.922", "–", "–", "15.23"],
    ["_Reference: fixed r = 1 rule_", "–", "–", "–", "14.03"],
  ], [3100, 1400, 1400, 1400, CONTENT - 7300], { boldRows: [1] }),
  P("Mean regret is the extra cost (search nodes + variables changed) of the predicted action over the best " +
    "action, averaged over the 1,440 validation rows.", { run: { size: 18, color: MUTED }, para: { spacing: { before: 60, after: 160 } } }),
  P("Random Forest is the strongest classifier: it recovers 98% of retain labels with 96% precision, and ranks " +
    "variables well (retain AUC 0.915). All models struggle with **discard**, which has only 7 validation " +
    "examples. On regret alone, the tree models (14.2–14.3) beat always-retain (15.2) but do not beat the fixed " +
    "distance rule (14.0). Offline classification quality therefore does not by itself show a gain over the " +
    "rule. The end-to-end results below are the real test, because there every variable's action changes at " +
    "once and the policy repairs from its own earlier solutions."),

  H2("7.2 End-to-end repair on 270 unseen changes"),
  table(["Method", "Success", "1st-try", "Mean nodes", "Median", "P95 nodes", "Mean ms", "Vars changed"], [
    ["Cold restart (BT+MRV+FC)", "100%", "100%", "7,169", "155", "38,595", "1,316", "45.3"],
    ["Naive Min-Conflicts", "67.8%", "67.8%", "1,730", "2", "7,451", "9", "0.8*"],
    ["Fixed reuse (r = 1)", "100%", "72.2%", "3,973", "43", "9,126", "713", "14.6"],
    ["Warm start (verify all)", "100%", "92.6%", "1,871", "121", "8,627", "275", "22.5"],
    ["ML: Logistic Regression", "100%", "86.3%", "5,487", "51", "13,088", "1,037", "21.2"],
    ["ML: Random Forest", "100%", "70.4%", "3,881", "2", "8,754", "783", "14.4"],
    ["ML: XGBoost", "100%", "72.2%", "3,499", "2", "8,453", "775", "15.8"],
  ], [2700, 900, 900, 1100, 900, 1100, 900, CONTENT - 8500], { shadeRows: [4, 5, 6], size: 17 }),
  P("* Min-Conflicts' 'variables changed' covers only the 68% of changes it solved. Times are repair times and " +
    "exclude the ML policy's feature extraction and prediction; we measured that separately at 2–3 ms per change " +
    "for Logistic Regression and XGBoost and about 25 ms for Random Forest (300 trees).",
    { run: { size: 18, color: MUTED }, para: { spacing: { before: 60, after: 160 } } }),
  img("fig1_median_stability.png", 6.4),
  CAPTION("Figure 2. Typical repair effort (median search nodes) and solution stability (mean variables changed)."),
  P("Key observations:"),
  B("**Completeness holds.** Every method using the retain/verify/discard interface solved all 270 changes. Naive Min-Conflicts, which has no fallback, solved only 68%."),
  B("**Learned policies are cheap on the typical change.** XGBoost and Random Forest solve the median change in 2 search nodes, against 43 for the fixed rule and 155 for a cold restart."),
  B("**They beat cold restart and the fixed rule on mean cost.** XGBoost uses 51% fewer nodes than a cold restart and 12% fewer than the fixed rule (Random Forest: 46% and 2%). Per event, Random Forest needs fewer nodes than the fixed rule on 71% of changes, the same on 16% and more on 13%. For XGBoost the figures are 72%, 4% and 25%."),
  B("**They are as stable as the fixed rule.** Random Forest changes 14.4 variables per change (fixed rule 14.6, warm start 22.5, cold restart 45.3)."),
  B("**But warm start has the lowest mean cost.** Verify-all averages 1,871 nodes, about half of XGBoost's 3,499. It changes 42% more variables than XGBoost, though."),
  B("**Logistic Regression is the weakest learned policy.** It retains fewer variables (52 vs 92 for Random Forest) and is costlier than the fixed rule. A linear model cannot represent the interaction between distance, conflicts and slack that the trees exploit."),

  H2("7.3 Where the cost comes from: fallbacks"),
  img("fig2_fallback.png", 6.4),
  CAPTION("Figure 3. Total search nodes split into the policy's first plan and the fallback stages."),
  table(["Method", "Stage 1", "Stages 2–5", "Stage 6 (cold)", "Mean nodes, stage 1", "Mean nodes, fell back"], [
    ["Fixed reuse (r = 1)", "195", "56", "19", "34", "14,213"],
    ["Warm start (verify all)", "250", "0", "20", "339", "21,022"],
    ["ML: Logistic Regression", "233", "20", "17", "261", "38,395"],
    ["ML: Random Forest", "190", "65", "15", "5", "13,086"],
    ["ML: XGBoost", "195", "59", "16", "74", "12,406"],
  ], [2700, 1000, 1200, 1300, 1700, CONTENT - 7900], { size: 17 }),
  P("This is the most important finding. When the learned policy's first plan works (about 70% of changes), it " +
    "is almost free: 5 search nodes on average for Random Forest. In the remaining 30% the retained values are " +
    "inconsistent with P₁, the ladder releases them ring by ring, and each failed stage spends its 5,000-node " +
    "budget before escalating. Those fallbacks account for nearly all of the learned policies' search effort. Warm " +
    "start retains nothing, so it never pays for rings 1–4. It only falls back when its single stage runs out of " +
    "budget (7% of changes), and that is why its mean is lower.",
    { para: { spacing: { before: 160, after: 120 } } }),
  P("The learned policies already fall back to a cold restart less often than the baselines (15–16 changes vs " +
    "19–20). The main open problem is the stage 2–5 fallbacks. Section 8 suggests ways to reduce them."),

  H2("7.4 Effect of problem size"),
  table(["Method", "n = 60", "n = 100", "n = 150"], [
    ["Cold restart", "207", "6,633", "14,667"],
    ["Fixed reuse (r = 1)", "103", "3,219", "8,597"],
    ["Warm start (verify all)", "151", "2,444", "3,019"],
    ["ML: Logistic Regression", "105", "1,678", "14,677"],
    ["ML: Random Forest", "79", "2,991", "8,572"],
    ["ML: XGBoost", "98", "2,239", "8,161"],
  ], [3400, 1900, 1900, CONTENT - 7200], { shadeRows: [3, 4, 5] }),
  P("Mean search nodes per change by graph size (90 changes per size).", { run: { size: 18, color: MUTED }, para: { spacing: { before: 60, after: 160 } } }),
  P("Random Forest is cheapest on small graphs (n = 60). At n = 100 the learned policies beat every baseline " +
    "except warm start, and Logistic Regression happens to be the cheapest. At n = 150 warm start is far ahead, " +
    "because the cost of a failed retain plan grows with graph size. Stability follows the same pattern as " +
    "before: at n = 150, Random Forest changes 20.6 variables per change, against 30.1 for warm start and 71.4 " +
    "for a cold restart."),

  H2("7.5 What the models learned"),
  img("fig4_importance.png", 6.4),
  CAPTION("Figure 4. Ten most important features for the two tree models."),
  P("Distance to the change (`dist`) is only the 7th–8th most important feature in both tree models. The models " +
    "rely more on **how disrupted the problem is overall** (`frac_conflicted`, `k`), **how constrained the " +
    "variable is** (`degree`, `slack`, `domain_size`) and **local conflict pressure** (`conf_nbrs_within1`). " +
    "Figure 1 shows the same thing from the label side. Verify is the right call for about 21% of variables within " +
    "one hop, but also for 2–3% of variables two or more hops away. A pure distance rule would always retain " +
    "those."),

  H2("7.6 Hypotheses revisited"),
  table(["Hypothesis", "Verdict", "Evidence"], [
    ["H1: heterogeneous stability", "Not tested", "Only variable assignments are reused in the final scope; nogoods and heuristic statistics are future work."],
    ["H2: distance alone is insufficient", "Partially supported", "Distance matters (79% vs 97% retain near vs far), but trees rank conflict and constrainedness features above it, and 2–3% of far variables are best verified. The distance rule's offline regret is nevertheless competitive (14.0 vs 14.2)."],
    ["H3: learning beats fixed policies", "Partially supported", "Tree policies beat the fixed structural rule end to end (−12% mean nodes for XGBoost, fewer nodes on 71–72% of changes, median 2 vs 43) at equal stability. They do not beat warm start on mean cost, and Logistic Regression does not beat the fixed rule."],
    ["H4: lower cost, completeness kept", "Supported", "100% success for every complete method; 46–51% fewer nodes and 65–68% fewer changed variables than a cold restart; 2–25 ms prediction overhead."],
  ], [2500, 1500, CONTENT - 4000], { leftCols: [1, 2], size: 17 }),

  H1("8. Interactive Demonstration"),
  P("The Streamlit dashboard (`app.py`, live at dynamic-csp-solver-dac203.streamlit.app) makes the repair process " +
    "visible. A user generates and solves P₀, applies hand-made or random changes, picks a repair method, and " +
    "sees the coloured graph with changed variables outlined and violated constraints in red. The nodes can be " +
    "coloured by solution, by the policy's reuse action (grey = retain, amber = verify, red = discard) or by " +
    "distance to the change. **Compare all solvers** runs every method on the same P₁ and charts their effort " +
    "and stability; committed steps build up a history table."),
  P("A reproducible scenario: defaults (80 variables, k = 4, average degree 7), seed 2024, one random batch of 3 " +
    "changes. Cold restart takes 87 nodes and changes 64 variables. Random Forest takes 21 nodes and changes 4, " +
    "retaining 60 variables, verifying 19 and discarding 2, and succeeds at stage 1."),

  H1("9. Limitations and Future Work"),
  H2("Limitations"),
  B("**Harmful retention.** About 30% of learned-policy repairs need a fallback, and those fallbacks dominate the cost."),
  B("**Single state type.** Only assignments are reused, so H1 is untested."),
  B("**Synthetic instances.** Planted random graph colouring with k = 4. Results may differ on structured or real benchmarks."),
  B("**Narrow cost signal.** Labels come from single-variable interventions around a fixed reference policy, which differs from the joint decision made at test time."),
  B("**Few discard examples** (0.6% of labels), so discard is rarely predicted correctly."),
  B("**Metrics.** Backtracks and propagation counts are not reported separately, and the ML overhead was measured separately from the repair times."),
  H2("Future work"),
  B("Train the policy on the end-to-end cost directly (cost-sensitive or imitation learning) instead of single-variable labels."),
  B("Add a cheap infeasibility check after stage 1 that releases only the conflicting retained variables, instead of whole rings."),
  B("Extend reuse to nogoods, variable-ordering statistics and propagation caches to test H1."),
  B("Feature-set ablations, larger graphs, more colours, and standard dynamic-CSP benchmarks."),
  B("Combine the learned policy with warm start: retain only where the model is very confident and verify the rest."),

  H1("10. Conclusion"),
  P("We built a complete testbed for dynamic graph-colouring CSPs, and a learned per-variable reuse policy that " +
    "plugs into a complete repair procedure. Tree-based policies halve the search effort of a cold restart, change " +
    "about a third as many variables, beat a fixed distance-based reuse rule, and solve a typical change almost " +
    "for free, with no loss of completeness. A simple verify-all warm start still has the lowest average search " +
    "cost, because about 30% of learned retain plans turn out to be infeasible and have to be unwound. The models " +
    "make clear what drives good reuse: global disruption and local constrainedness more than distance alone. The " +
    "clearest next step is to cut the cost of those infeasible retain plans."),

  H1("11. Reproducibility"),
  table(["Path", "Contents"], [
    ["`dcsp/csp.py`", "CSP model, mutations, conflict checks, planted generator"],
    ["`dcsp/env.py`", "Change types, disruptive sampler, SolverState, replayable sequences"],
    ["`dcsp/solvers.py`", "BT+MRV+FC (with fixed values and hints), Min-Conflicts"],
    ["`dcsp/repair.py`", "Retain/verify/discard interface, fallback ladder, baselines"],
    ["`dcsp/features.py`, `dcsp/dataset.py`", "29 features; counterfactual labelling"],
    ["`dcsp/policies.py`", "Learned reuse policy (MLReusePolicy)"],
    ["`dcsp/benchmark.py`", "Replays identical sequences for every method"],
    ["`experiments/run_all.py`", "Whole pipeline: sequences, phase 2, phase 3, phase 4, summary"],
    ["`app.py`", "Streamlit + Plotly dashboard"],
    ["`retrain/models/`, `retrain/results/`", "Models and results reported here (pinned library versions)"],
  ], [3600, CONTENT - 3600], { leftCols: [1], size: 17 }),
  P("To reproduce:", { para: { spacing: { before: 160, after: 80 } } }),
  ...CODE([
    "pip install -r requirements.txt",
    "python experiments/run_all.py      # or one stage: phase2 | phase3 | phase4 | summary",
    "streamlit run app.py",
  ]),
  P("`run_all.py` writes to `models/` and `results/`. The numbers in this report are the copies in `retrain/`, " +
    "which the dashboard also loads."),

  H1("References"),
  ...[
    "Wallace, R. J., Grimes, D., & Freuder, E. C. (2009). Solving dynamic constraint satisfaction problems by identifying stable features. _Proceedings of IJCAI-09_.",
    "Koriche, F., Lecoutre, C., Paparrizou, A., & Wattez, H. (2022). Best heuristic identification for constraint satisfaction. _Proceedings of IJCAI-22_.",
    "Tolpin, D., & Shimony, S. E. (2011). Rational deployment of CSP heuristics. _Proceedings of IJCAI-11_.",
    "Verfaillie, G., & Schiex, T. (1994). Solution reuse in dynamic constraint satisfaction problems. _Proceedings of AAAI-94_.",
    "Minton, S., Johnston, M. D., Philips, A. B., & Laird, P. (1992). Minimizing conflicts: a heuristic repair method for constraint satisfaction and scheduling problems. _Artificial Intelligence_, 58, 161–205.",
    "Haralick, R. M., & Elliott, G. L. (1980). Increasing tree search efficiency for constraint satisfaction problems. _Artificial Intelligence_, 14, 263–313.",
    "Dechter, R., & Dechter, A. (1988). Belief maintenance in dynamic constraint networks. _Proceedings of AAAI-88_.",
    "Pedregosa, F., et al. (2011). Scikit-learn: Machine learning in Python. _Journal of Machine Learning Research_, 12, 2825–2830.",
    "Chen, T., & Guestrin, C. (2016). XGBoost: A scalable tree boosting system. _Proceedings of KDD-16_.",
  ].map((r) => N(r, "refs")),

  H1("Appendix A. Per-class validation results"),
  table(["Model", "Class", "Precision", "Recall", "F1", "Support"], [
    ["Logistic Regression", "retain", "0.987", "0.757", "0.857", "1,328"],
    ["", "verify", "0.288", "0.724", "0.412", "105"],
    ["", "discard", "0.025", "0.571", "0.048", "7"],
    ["Random Forest", "retain", "0.957", "0.983", "0.970", "1,328"],
    ["", "verify", "0.671", "0.486", "0.564", "105"],
    ["", "discard", "0.000", "0.000", "0.000", "7"],
    ["XGBoost", "retain", "0.953", "0.925", "0.939", "1,328"],
    ["", "verify", "0.340", "0.457", "0.390", "105"],
    ["", "discard", "0.111", "0.143", "0.125", "7"],
  ], [2600, 1300, 1300, 1300, 1300, CONTENT - 7800], { size: 17 }),
  P("Confusion matrices (rows = true retain / verify / discard; columns = predicted): Logistic Regression " +
    "[[1005, 186, 137], [12, 76, 17], [1, 2, 4]]; Random Forest [[1305, 23, 0], [54, 51, 0], [5, 2, 0]]; " +
    "XGBoost [[1229, 91, 8], [57, 48, 0], [4, 2, 1]].", { run: { size: 18 }, para: { spacing: { before: 160, after: 120 } } }),

  H1("Appendix B. Threshold tuning"),
  table(["Model", "argmax", "τ = 0.6", "τ = 0.8", "τ = 0.9", "Chosen"], [
    ["Logistic Regression", "252,661", "143,759", "235,096", "235,206", "0.6"],
    ["Random Forest", "68,047", "68,188", "109,443", "230,042", "argmax"],
    ["XGBoost", "96,434", "89,793", "108,116", "221,959", "0.6"],
  ], [2700, 1300, 1300, 1300, 1300, CONTENT - 7900]),
  P("Total search nodes + variables changed over the 6 held-out training sequences (90 changes); lower is better. " +
    "All settings solved 100% of changes. Very high thresholds retain almost nothing, so the policy degrades " +
    "towards warm start.", { run: { size: 18, color: MUTED }, para: { spacing: { before: 60, after: 160 } } }),
];

// ---------------------------------------------------------------- document
const numCfg = (ref, fmt, text) => ({ reference: ref, levels: [{ level: 0, format: fmt, text, alignment: AlignmentType.LEFT,
  style: { paragraph: { indent: { left: 540, hanging: 360 } } } }] });
const doc = new Document({
  creator: "Advika Sinha, Kavya Rajput",
  title: "Dynamic CSP with Incremental Repair: Learned Selective State Reuse",
  features: { updateFields: true },
  styles: {
    default: { document: { run: { font: FONT, size: 21 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 30, bold: true, color: NAVY }, paragraph: { spacing: { before: 360, after: 140 }, keepNext: true, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 25, bold: true, color: NAVY }, paragraph: { spacing: { before: 240, after: 100 }, keepNext: true, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 22, bold: true, color: "333333" }, paragraph: { spacing: { before: 180, after: 80 }, keepNext: true, outlineLevel: 2 } },
    ],
  },
  numbering: { config: [
    { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
    numCfg("lab", LevelFormat.DECIMAL, "%1."),
    numCfg("refs", LevelFormat.DECIMAL, "[%1]"),
    numCfg("numbers", LevelFormat.DECIMAL, "%1."),
  ] },
  sections: [
    { properties: { page: { size: { width: PAGE_W, height: 16838 }, margin: { top: 1100, bottom: 1100, left: MARGIN, right: MARGIN } } },
      children: titlePage },
    { properties: { page: { size: { width: PAGE_W, height: 16838 }, margin: { top: 1300, bottom: 1300, left: MARGIN, right: MARGIN },
        pageNumbers: { start: 1 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "Dynamic CSP with Incremental Repair · DAC-203", size: 16, color: MUTED })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: MUTED })] })] }) },
      children: body },
  ],
});
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(OUT, b); console.log("wrote", OUT, b.length); });
