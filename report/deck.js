const pptxgen = require("pptxgenjs");
const { applyTheme } = require("C:/Users/Advika/.claude/skills/synced/6fbb12e2-c718-4ee4-a187-c1477b938c7a_7ad4b1c4-b865-42c0-8e5b-88b3ae625ce3/pptx/scripts/apply_theme.js");

const OUT = process.argv[2];
const THEME = {
  name: "Dynamic CSP", headFontFace: "Cambria", bodyFontFace: "Calibri",
  colors: { dk1: "1B1F2E", lt1: "FFFFFF", dk2: "1F2A6B", lt2: "EEF1F8",
    accent1: "2E5BDA", accent2: "E8A33D", accent3: "D64545", accent4: "8C95A8", accent5: "1E9E6E", accent6: "6A4FCF",
    hlink: "2E5BDA", folHlink: "6A4FCF" },
};
const H = THEME.colors;
const MUTED = "5A6175", ICE = "CADCFC";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "Dynamic CSP with Incremental Repair";
pres.author = "Advika Sinha, Kavya Rajput";
const C = pres.SchemeColor;

// ---------------------------------------------------------------- layouts
pres.defineSlideMaster({
  title: "CONTENT", background: { color: "FFFFFF" },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 12.1, h: 0.9, fontFace: "Cambria",
      fontSize: 34, bold: true, color: C.text2, valign: "middle", margin: 0 }, text: "" } },
    { text: { text: "Dynamic CSP with Incremental Repair  ·  DAC-203", options: { x: 0.6, y: 6.98, w: 8, h: 0.3,
      fontSize: 10, color: MUTED, margin: 0, fontFace: "Calibri" } } },
  ],
  slideNumber: { x: 12.2, y: 6.98, w: 0.5, h: 0.3, fontSize: 10, color: MUTED, align: "right", fontFace: "Calibri" },
});
pres.defineSlideMaster({
  title: "DARK", background: { color: H.dk2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.7, y: 1.6, w: 7.2, h: 1.9, fontFace: "Cambria",
      fontSize: 44, bold: true, color: C.background1, valign: "bottom", margin: 0 }, text: "" } },
  ],
});

// ---------------------------------------------------------------- helpers
let sid = 0;
const newSlide = (master = "CONTENT") => pres.addSlide({ masterName: master });
const T = (slide, text, o) => slide.addText(text, { isTextBox: true, fontFace: "Calibri", color: C.text1, margin: 0,
  valign: "top", fontSize: 15, objectName: `t${++sid}`, ...o });
const card = (slide, x, y, w, h, fill = C.background2) => slide.addShape(pres.shapes.ROUNDED_RECTANGLE,
  { x, y, w, h, fill: { color: fill }, line: { type: "none" }, rectRadius: 0.08, objectName: `c${++sid}` });
const node = (slide, x, y, d, color, label, lc = "FFFFFF") => {
  slide.addShape(pres.shapes.OVAL, { x: x - d / 2, y: y - d / 2, w: d, h: d, fill: { color },
    line: { color: "FFFFFF", width: 1.5 }, objectName: `n${++sid}` });
  if (label !== undefined) T(slide, String(label), { x: x - d / 2, y: y - d / 2, w: d, h: d, align: "center",
    valign: "middle", fontSize: 12, bold: true, color: lc });
};
const line = (slide, x1, y1, x2, y2, color, width = 1.5) => slide.addShape(pres.shapes.LINE, {
  x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.max(Math.abs(x2 - x1), 0.001), h: Math.max(Math.abs(y2 - y1), 0.001),
  flipV: (x2 - x1) * (y2 - y1) < 0, line: { color, width }, objectName: `l${++sid}` });
const graph = (slide, nodes, edges, d, edgeColor) => {
  edges.forEach(([a, b]) => line(slide, nodes[a][0], nodes[a][1], nodes[b][0], nodes[b][1], edgeColor, 1.5));
  nodes.forEach(([x, y, c, lab]) => node(slide, x, y, d, c, lab));
};
const chartBase = { catAxisLabelColor: MUTED, valAxisLabelColor: MUTED, catAxisLabelFontSize: 12, valAxisLabelFontSize: 11,
  catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", dataLabelFontFace: "+mn-lt", dataLabelFontSize: 11,
  dataLabelColor: "1B1F2E", valGridLine: { color: "E3E5EC", size: 0.75 }, catGridLine: { style: "none" },
  titleFontFace: "+mn-lt", titleFontSize: 14, titleColor: "1B1F2E", catAxisLineShow: false, valAxisLineShow: false };

// ================================================================ 1. title
{
  const s = newSlide("DARK");
  s.addText("Dynamic CSP with Incremental Repair", { placeholder: "title" });
  T(s, "Learned selective state reuse for dynamic graph-colouring problems", { x: 0.7, y: 3.65, w: 7.0, h: 0.9,
    fontSize: 20, color: ICE });
  T(s, [{ text: "Advika Sinha  (23117010)", options: { breakLine: true } }, { text: "Kavya Rajput  (23117064)" }],
    { x: 0.7, y: 4.85, w: 6, h: 0.8, fontSize: 16, color: C.background1, paraSpaceAfter: 4 });
  T(s, "DAC-203  ·  IIT Roorkee", { x: 0.7, y: 5.9, w: 6, h: 0.4, fontSize: 14, color: ICE });
  const A = H.accent2, B = ICE, G = H.accent5, D = H.accent3;
  graph(s, [[8.9, 1.7, A], [10.5, 1.3, B], [12.1, 2.0, G], [8.5, 3.3, B], [10.1, 2.9, G], [11.6, 3.6, A],
    [9.2, 4.9, D], [10.9, 4.7, B], [12.3, 5.3, D], [9.9, 6.1, A]],
  [[0, 1], [1, 2], [0, 3], [0, 4], [1, 4], [2, 5], [4, 5], [3, 6], [4, 7], [5, 7], [5, 8], [6, 7], [7, 8], [6, 9], [7, 9], [3, 4]],
  0.42, "6F7BB5");
  s.addNotes(`WHAT TO SAY (about 1 minute)
"Good morning. I'm Advika Sinha, and this is Kavya Rajput. Our DAC-203 project is 'Dynamic CSP with Incremental Repair: learned selective state reuse.'

The one-line idea: when a constraint problem you have already solved changes a little, you should not throw the old solution away and start again, but you also cannot blindly keep all of it. We trained machine-learning models that decide, for every single variable, whether to keep its old value, re-check it, or throw it away. Then we measured whether that beats simple rules and complete re-solving.

The talk goes: what a CSP is and why changing problems matter, our hypotheses, what changed since mid-evaluation, how the system works, how the ML is trained, results, a live demo, and conclusions."

THE PICTURE ON THE RIGHT
It is a small graph-colouring problem, the kind of CSP we use throughout. Each circle is a variable, each line is a constraint, and the colours are a valid solution: no two connected circles share a colour.

KEY TERMS (have these ready)
- CSP (Constraint Satisfaction Problem): find values for variables so that every constraint is satisfied.
- Dynamic CSP: a CSP that keeps changing after it has been solved (constraints, domains or variables are added or removed).
- Incremental repair: fixing the old solution so it fits the new problem, instead of solving from scratch.
- State reuse: carrying information from the previous solve (here, the old variable values) into the new solve.
- "Learned selective": an ML model chooses which parts to reuse, variable by variable.

WHO DID WHAT (in case you are asked)
Roughly 50/50. Advika led the ML pipeline: features, counterfactual labelling, training the three models, threshold tuning, the learned policy and deployment. Kavya led the CSP environment, the solvers, the repair and fallback logic, the baselines, the benchmark, the dashboard, and part of the ML evaluation.`);
}

// ================================================================ 2. CSP basics
{
  const s = newSlide();
  s.addText("A CSP: variables, domains, constraints", { placeholder: "title" });
  const rows = [
    [H.accent1, "Variables", "What we must decide. Here: one per node of a graph."],
    [H.accent2, "Domains", "The values each variable may take. Here: k colours {0, …, k−1}."],
    [H.accent5, "Constraints", "Rules on combinations of values. Here: the two ends of an edge must differ."],
  ];
  rows.forEach(([c, head, body], i) => {
    const y = 1.65 + i * 1.45;
    node(s, 0.95, y + 0.32, 0.5, c);
    T(s, head, { x: 1.45, y, w: 5.3, h: 0.45, fontSize: 20, bold: true, color: C.text2, fontFace: "Cambria" });
    T(s, body, { x: 1.45, y: y + 0.48, w: 5.3, h: 0.75, fontSize: 15 });
  });
  T(s, "Solution = every variable has a value from its domain and no constraint is violated.",
    { x: 0.6, y: 5.95, w: 6.3, h: 0.7, fontSize: 15, italic: true, color: MUTED });
  card(s, 7.3, 1.5, 5.4, 5.2, C.background2);
  const b = H.accent1, a = H.accent2, g = H.accent5, r = H.accent3;
  graph(s, [[8.3, 2.4, b, 0], [10.1, 2.05, a, 1], [11.8, 2.75, g, 2], [8.7, 4.2, g, 3], [10.4, 3.85, r, 4], [11.5, 5.15, b, 5]],
    [[0, 1], [1, 2], [0, 3], [1, 3], [1, 4], [2, 4], [3, 4], [4, 5], [3, 5], [2, 5]], 0.55, "9AA1B5");
  T(s, "Graph colouring with k = 4: each edge joins two different colours", { x: 7.6, y: 5.85, w: 4.9, h: 0.7,
    fontSize: 13, color: MUTED, align: "center" });
  s.addNotes(`WHAT TO SAY (about 1.5 minutes)
"A Constraint Satisfaction Problem has three parts. Variables are the things we must decide. Each variable has a domain, the set of values it is allowed to take. Constraints are the rules about which combinations of values are allowed. A solution gives every variable a value from its domain without breaking any constraint.

We use graph colouring as our CSP because it is the classic, clean example. Every node is a variable. The domain is k colours, here 4. Every edge is a constraint saying its two ends must get different colours. The graph on the right is a valid solution: follow any edge and the two colours differ."

DEFINITIONS
- Variable: an unknown to be decided (here, the colour of one node).
- Domain: the set of allowed values for one variable. Normally {0,1,2,3} for k = 4. A domain can shrink: if a colour is banned for a node, that node's domain loses it.
- Constraint: a rule restricting value combinations. Ours are binary "not-equal" constraints, one per edge (they involve two variables).
- Assignment: a value given to some or all variables. Complete = every variable has one. Consistent = no constraint is broken.
- Solution: a complete, consistent assignment.
- k: the number of colours available.
- Degree of a node: how many edges (constraints) it has. A high-degree node is more constrained.

WHY GRAPH COLOURING
- Graph colouring with k ≥ 3 is NP-complete: no known algorithm solves every instance quickly, so search effort really matters.
- It models real problems: exam timetabling (exams = nodes, students in both = edge, colours = time slots), radio-frequency assignment, register allocation in compilers, and map colouring.
- Every change type we need (add or remove a constraint, shrink a domain, add or remove a variable, change k) has a natural meaning.

IF ASKED "Why not a standard CSP benchmark?"
We needed unlimited, guaranteed-solvable sequences of changes with controlled change types. Planted graph colouring gives exactly that (next slides). Testing on standard benchmarks is listed as future work.`);
}

// ================================================================ 3. dynamic CSP
{
  const s = newSlide();
  s.addText("Real problems change after they are solved", { placeholder: "title" });
  const steps = [["Solved problem", "P₀ and its solution"], ["Change Δ", "add / remove constraints, shrink domains, add / remove variables"],
    ["New problem", "P₁: the old solution may now break rules"], ["Repair", "find a solution of P₁, reusing what we can"]];
  steps.forEach(([h, b], i) => {
    const x = 0.6 + i * 3.1;
    card(s, x, 1.6, 2.75, 1.75, i === 3 ? C.accent1 : C.background2);
    T(s, h, { x: x + 0.2, y: 1.75, w: 2.35, h: 0.45, fontSize: 18, bold: true, fontFace: "Cambria", color: i === 3 ? C.background1 : C.text2 });
    T(s, b, { x: x + 0.2, y: 2.25, w: 2.35, h: 1.0, fontSize: 14, color: i === 3 ? C.background1 : C.text1 });
    if (i < 3) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + 2.79, y: 2.3, w: 0.28, h: 0.36, fill: { color: H.accent4 }, line: { type: "none" }, objectName: `a${++sid}` });
  });
  T(s, "Re-solving from scratch has two costs", { x: 0.6, y: 3.75, w: 7, h: 0.45, fontSize: 20, bold: true, fontFace: "Cambria", color: C.text2 });
  [["7,169", "search nodes per change, on average, for a cold restart"], ["45 of ~103", "variables change colour per change, though each change makes only 1–4 edits"]]
    .forEach(([big, small], i) => {
      const x = 0.6 + i * 4.0;
      T(s, big, { x, y: 4.3, w: 3.7, h: 0.9, fontSize: 44, bold: true, color: C.accent3, fontFace: "Cambria" });
      T(s, small, { x, y: 5.25, w: 3.6, h: 0.8, fontSize: 14, color: MUTED });
    });
  card(s, 8.85, 3.85, 3.85, 2.55, C.background2);
  T(s, "Central question", { x: 9.1, y: 4.05, w: 3.4, h: 0.4, fontSize: 14, bold: true, color: C.accent1 });
  T(s, "Which parts of the old solution are safe and useful to keep?", { x: 9.1, y: 4.5, w: 3.4, h: 1.7, fontSize: 20,
    fontFace: "Cambria", bold: true, color: C.text2 });
  s.addNotes(`WHAT TO SAY (about 1.5 minutes)
"In practice, problems keep changing after we solve them. A timetable gets a new clash, a room closes, a new exam is added. We call the solved problem P-zero, the batch of edits delta, and the new problem P-one. The old solution may now break some rules of P-one, so we have to repair it.

The simple approach is a cold restart: solve P-one from scratch. That has two costs. The first is computation: on our test set a cold restart needs about 7,000 search nodes per change on average. The second is stability: it changes about 45 of the roughly 100 variables, even though each change only makes one to four edits. If those variables were people's exam slots, you would have rescheduled 45 people for a tiny change.

But we cannot keep everything either. Some old values become illegal, and some are legal but harmful to keep. So the central question is: which parts of the old solution are safe and useful to keep?"

DEFINITIONS
- P₀ (P-zero): the problem before the change. Its solution is the "old solution".
- Δ (delta): the batch of changes applied at one step (1 to 4 atomic changes in our experiments).
- P₁ (P-one): the problem after the change.
- Repair: finding a solution of P₁, ideally starting from the old solution.
- Cold restart: solving P₁ from scratch, ignoring the old solution.
- Search node: one attempt to assign a value to a variable during backtracking search. Our main measure of computational effort, because it does not depend on the machine.
- Solution stability / "variables changed": the number of variables that exist in both P₀ and P₁ and have a different value in the new solution than in the old one (the Hamming distance between old and new solutions).
- Safe to keep: keeping it still allows a solution. Useful to keep: keeping it actually saves effort or changes.

WHERE THE NUMBERS COME FROM
Averaged over 270 test changes on graphs of 60, 100 and 150 nodes (mean size about 103 nodes): cold restart mean 7,169 search nodes and 45.3 variables changed per change. The mean batch is 2.6 changes.`);
}

// ================================================================ 4. RQ + hypotheses
{
  const s = newSlide();
  s.addText("Research question and hypotheses", { placeholder: "title" });
  card(s, 0.6, 1.5, 12.1, 1.15, C.background2);
  T(s, "Can a learned, change-aware policy preserve solver state after a change more effectively than fixed reuse rules or complete re-solving?",
    { x: 0.9, y: 1.62, w: 11.5, h: 0.95, fontSize: 18, italic: true, fontFace: "Cambria", color: C.text2, valign: "middle" });
  const hs = [["H1", "Solver state has heterogeneous stability", "Assignments, nogoods and heuristic statistics react differently to a change."],
    ["H2", "Graph distance alone is insufficient", "Far from the change does not automatically mean safe to keep."],
    ["H3", "Learning beats fixed policies", "A model predicts beneficial reuse better than a hand-made rule."],
    ["H4", "Cheaper, still complete", "Selective reuse cuts repair cost and still always finds a solution."]];
  hs.forEach(([k, h, b], i) => {
    const x = 0.6 + i * 3.08;
    card(s, x, 3.0, 2.85, 3.6, "FFFFFF");
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 3.0, w: 2.85, h: 3.6, fill: { type: "none" }, line: { color: "D5D9E4", width: 1 }, rectRadius: 0.08, objectName: `b${++sid}` });
    node(s, x + 0.55, 3.55, 0.65, [H.accent4, H.accent2, H.accent1, H.accent5][i], k);
    T(s, h, { x: x + 0.25, y: 4.05, w: 2.4, h: 0.95, fontSize: 17, bold: true, fontFace: "Cambria", color: C.text2 });
    T(s, b, { x: x + 0.25, y: 5.05, w: 2.4, h: 1.4, fontSize: 14, color: C.text1 });
  });
  s.addNotes(`WHAT TO SAY (about 1.5 minutes)
"Our research question: can a learned, change-aware policy decide what to keep after a change better than fixed rules or re-solving from scratch? We split it into four hypotheses.

H1: different kinds of solver state have different stability. For example, a variable's value, a learned nogood and a heuristic score do not all go stale in the same way.
H2: graph distance alone is not enough. A rule like 'keep everything far from the change' will sometimes keep something harmful.
H3: learning can predict which reuse is beneficial better than a fixed rule. This is the ML part.
H4: selective reuse reduces repair cost without hurting completeness, meaning we still always find a solution.

I'll give an honest verdict on each one at the end. Spoiler: H4 is supported, H2 and H3 are partially supported, and H1 was outside our final scope."

DEFINITIONS
- Policy: a rule that maps a situation to an action. Our policy maps each variable to retain, verify or discard.
- Change-aware: the decision uses information about the specific change (its type, where it happened, how disruptive it is).
- Solver state: anything the solver knows from the last solve. The old variable values (assignments), nogoods, heuristic statistics, propagation caches.
- Nogood: a combination of values that is known to lead to failure, recorded so the search never tries it again.
- Heuristic statistics: counters the solver keeps to guide future choices (for example, how often a variable was involved in a failure).
- Fixed policy / fixed rule: a hand-written reuse rule, for example "keep everything more than 1 hop from the change".
- Completeness: the method is guaranteed to find a solution whenever one exists.
- Repair cost: in our experiments, search nodes (computation) and variables changed (stability).

WHY H1 IS NOT TESTED
In the final system we reuse only one kind of state, the variable assignments (the history of conflicts and changes is used as input features, but is not itself reused). That kept the counterfactual labelling feasible. Testing H1 is future work.`);
}

// ================================================================ 5. related work
{
  const s = newSlide();
  s.addText("Related work and the gap we address", { placeholder: "title" });
  const rw = [["Wallace, Grimes & Freuder (2009)", "Find stable structural features of a dynamic CSP and exploit them in later search.", "Does not learn which state to keep."],
    ["Koriche et al. (2022)", "Multi-armed bandits pick the best variable-ordering heuristic.", "Chooses heuristics, not state to reuse after a change."],
    ["Tolpin & Shimony (2011)", "Deploy an expensive heuristic only when its benefit outweighs its cost.", "About heuristics, not selective reuse."]];
  rw.forEach(([h, idea, gap], i) => {
    const x = 0.6 + i * 4.1;
    card(s, x, 1.55, 3.85, 3.35, C.background2);
    T(s, h, { x: x + 0.25, y: 1.72, w: 3.4, h: 0.75, fontSize: 17, bold: true, fontFace: "Cambria", color: C.text2 });
    T(s, idea, { x: x + 0.25, y: 2.5, w: 3.4, h: 1.25, fontSize: 15 });
    T(s, [{ text: "Gap: ", options: { bold: true, color: C.accent3 } }, { text: gap }], { x: x + 0.25, y: 3.85, w: 3.4, h: 0.95, fontSize: 14, color: C.text1 });
  });
  card(s, 0.6, 5.25, 12.1, 1.35, C.text2);
  T(s, "Our contribution", { x: 0.95, y: 5.4, w: 4, h: 0.4, fontSize: 14, bold: true, color: ICE });
  T(s, "A change-aware, per-variable, learned reuse decision inside a repair procedure that is still complete, tested against rules and re-solving on identical change sequences.",
    { x: 0.95, y: 5.8, w: 11.4, h: 0.75, fontSize: 16, color: C.background1 });
  s.addNotes(`WHAT TO SAY (about 1.5 minutes)
"Three pieces of prior work shaped our project.

Wallace, Grimes and Freuder in 2009 looked at dynamic CSPs and found that some structural features stay stable across changes, and that search can exploit them. But they do not learn a general policy for what to keep.

Koriche and colleagues in 2022 used multi-armed bandits, a learning method, to pick the best variable-ordering heuristic. That is learning inside a CSP solver, but it chooses heuristics. It does not decide what to reuse after the problem changes.

Tolpin and Shimony in 2011 asked when an expensive heuristic is worth running, by comparing benefit against cost. Again this is about heuristics, not reuse.

So the gap is a reuse decision that is change-aware, made per variable, and learned from data, inside a repair procedure that still guarantees a solution. We compare it fairly: every method sees exactly the same sequence of changes."

DEFINITIONS
- Variable-ordering heuristic: the rule that decides which variable the search assigns next (for example MRV, minimum remaining values).
- Multi-armed bandit: a learning setting where you repeatedly choose between options ("arms") with unknown payoffs and learn which is best while still exploring. "Best-arm identification" means finding the best option with as few trials as possible.
- Structural stability (Wallace et al.): parts of the problem's structure that persist across changes, so search knowledge about them stays valid.

ALSO RELEVANT (cited in the report)
- Verfaillie & Schiex (1994): solution reuse in dynamic CSPs by locally repairing the previous solution, rule-based rather than learned.
- Minton et al. (1992): the Min-Conflicts heuristic repair method, which is one of our baselines.
- Haralick & Elliott (1980): forward checking.
- Dechter & Dechter (1988): belief maintenance in dynamic constraint networks.`);
}

// ================================================================ 6. changes since mid-eval
{
  const s = newSlide();
  s.addText("What changed since mid-evaluation", { placeholder: "title" });
  const hdr = (t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: H.dk2 }, fontSize: 15 } });
  const rows = [
    [hdr("Mid-evaluation plan"), hdr("Final system"), hdr("Why")],
    ["Repair with Min-Conflicts local search", "Backtracking + MRV + forward checking, with kept values fixed and old values tried first", "Min-Conflicts failed on 32% of test changes; it cannot guarantee a solution"],
    ["Reuse nogoods, heuristic stats, caches and assignments", "Reuse decisions for assignments; history used as features", "Made counterfactual labelling feasible; H1 left for future work"],
    ["Wallace et al. structural baseline", "Fixed rule: keep beyond 1 hop, re-check within", "A simplified, distance-only version of the idea"],
    ["Labels decided \"experimentally\"", "Counterfactual labels: change one variable's action, rerun", "Measures the effect of one decision"],
    ["(not planned)", "Fallback ladder, retain threshold, live dashboard", "Needed for completeness and for the demo"],
  ];
  s.addTable(rows, { x: 0.6, y: 1.5, w: 12.1, colW: [3.4, 4.6, 4.1], fontSize: 14, fontFace: "Calibri", color: "1B1F2E",
    border: { type: "solid", pt: 0.75, color: "D5D9E4" }, valign: "middle", margin: [0.06, 0.12, 0.06, 0.12],
    fill: { color: "FFFFFF" }, rowH: [0.45, 0.9, 0.75, 0.65, 0.65, 0.65], objectName: `tbl${++sid}` });
  s.addNotes(`WHAT TO SAY (about 2 minutes)
"Building and measuring the system changed some plans from mid-evaluation, and I want to be upfront about them.

First, the repair engine. We planned Min-Conflicts local search. When we tested it, it failed on 32% of test changes within its step budget. Local search is incomplete: it can get stuck and never prove anything. So the main engine became complete backtracking search with MRV and forward checking, extended so that kept values are fixed and old values are tried first. Min-Conflicts stays as a baseline.

Second, the kind of state reused. We planned four kinds: assignments, nogoods, heuristic statistics and caches. We kept one, the variable assignments, because labelling each decision by experiment is expensive, and doing it properly for one kind beat doing four badly. Conflict and change history is still carried forward, but as input features to the model.

Third, the structural baseline is a simple distance rule: keep everything more than one hop from the change, and re-check the rest.

Fourth, labels are now counterfactual: we change one variable's action, rerun the repair, and see which action is cheapest.

And we added things we had not planned: a fallback ladder that guarantees a solution, a tunable retain threshold, and the live dashboard."

DEFINITIONS
- Local search: starts from a complete (possibly wrong) assignment and keeps changing values to reduce violations. Fast, but not guaranteed to finish.
- Min-Conflicts: a local search that picks a variable in conflict and gives it the value with the fewest conflicts. Our budget is 50 × n steps (n = number of nodes).
- Complete search: explores systematically and is guaranteed to find a solution if one exists (given enough budget; our last fallback stage has 500,000 nodes).
- Backtracking: assign variables one at a time; when a variable has no legal value left, undo the last choice and try another.
- MRV (Minimum Remaining Values): assign next the variable with the fewest legal values left (the "most constrained" variable). Ties are broken by degree.
- Forward checking: after assigning a value, immediately remove that value from the neighbours' domains. If any neighbour's domain becomes empty, backtrack straight away.
- Counterfactual: "what would have happened if this one thing were different, with everything else held the same."
- Ablations and backtrack/propagation counts from the mid-eval metric list are not reported separately. Search nodes are the main cost measure, and the fallback rate measures harmful reuse.`);
}

// ================================================================ 7. testbed
{
  const s = newSlide();
  s.addText("Testbed: planted graph colouring under change", { placeholder: "title" });
  const items = [["Always solvable", "Each node gets a hidden colour; edges only join different hidden colours. Changes respect it."],
    ["Disruptive changes", "Biased towards changes that break the current solution, where repair matters."],
    ["Sequences", "P₀ → P₁ → … → P₁₅, with 1–4 changes per step; k = 4, average degree 8."],
    ["Solver history", "Each variable carries its conflict count, change count and time since last change."]];
  items.forEach(([h, b], i) => {
    const y = 1.55 + i * 1.3;
    node(s, 0.85, y + 0.22, 0.32, [H.accent5, H.accent3, H.accent1, H.accent4][i]);
    T(s, h, { x: 1.2, y, w: 5.3, h: 0.42, fontSize: 18, bold: true, color: C.text2, fontFace: "Cambria" });
    T(s, b, { x: 1.2, y: y + 0.43, w: 5.3, h: 0.8, fontSize: 14 });
  });
  s.addChart(pres.charts.BAR, [{ name: "Share of sampled changes (%)", labels: ["add_edge", "restrict_domain", "remove_edge", "add_node", "remove_node", "add_color", "remove_color"],
    values: [35, 23, 12, 12, 8, 5, 5] }], { ...chartBase, x: 6.9, y: 1.45, w: 5.8, h: 5.3, barDir: "bar", chartColors: [H.accent1],
    catAxisOrientation: "maxMin", showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0\"%\"", valAxisHidden: true,
    valGridLine: { style: "none" }, showTitle: true, title: "Seven change types and how often each is sampled", showLegend: false, barGapWidthPct: 55,
    objectName: `ch${++sid}` });
  s.addNotes(`WHAT TO SAY (about 1.5 minutes)
"To test reuse properly we built our own dynamic testbed.

Instances are 'planted'. Before drawing edges, each node secretly gets a hidden colour, and we only draw edges between nodes with different hidden colours. So a valid colouring always exists, and every change we apply respects that hidden colouring too. This means any failure is the solver's fault, never an impossible problem.

Changes are biased to be disruptive. For example, when we add an edge, 70% of the time we pick two nodes that currently share a colour, so the new edge breaks the current solution. That is where repair strategy actually matters.

A sequence starts from P-zero and applies 15 steps, each with one to four changes. We use 4 colours and average degree 8.

There are seven change types, shown on the right with their sampling weights. Adding a constraint and banning a colour are the most common."

THE SEVEN CHANGE TYPES
- add_edge (35%): new not-equal constraint between two nodes.
- restrict_domain (23%): ban one colour for one node (70% of the time its current colour, so it must change).
- remove_edge (12%): delete a constraint (never breaks the solution, but frees up options).
- add_node (12%): new variable connected to about "average degree" random neighbours.
- remove_node (8%): delete a variable and all its constraints.
- add_color (5%): k → k + 1 (at most 2 extra colours).
- remove_color (5%): k → k − 1; every node using the highest colour must change. Only when k is above the planted k.

DEFINITIONS
- Planted instance: a random problem built around a hidden solution, so it is guaranteed solvable.
- k-partite graph: nodes are split into k groups and edges only go between groups. Planted colouring makes our graph k-partite.
- Average degree: average number of edges per node (8 in experiments, 7 by default in the demo). Higher means harder.
- Conflict bias = 0.7: the probability that a sampled change targets the current solution.
- SolverState: what we carry from step to step. The old solution, plus per variable: how many times it was in conflict after a change, how many times repair changed its value, and the step when it last changed.

DATA SIZES
Training: 30 sequences (10 seeds × sizes 60, 100, 150). Test: 18 different sequences (6 seeds × 3 sizes). Training and test seeds never overlap.`);
}

// ================================================================ 8. retain / verify / discard
{
  const s = newSlide();
  s.addText("Every method gives each variable one action", { placeholder: "title" });
  const acts = [[H.accent4, "Retain", "Keep the old value fixed. The variable leaves the search entirely.", "cheapest, riskiest"],
    [H.accent2, "Verify", "Search over it, but try the old value first.", "middle ground"],
    [H.accent3, "Discard", "Search over it from scratch, with no hint.", "safest, most expensive"]];
  acts.forEach(([c, h, b, tag], i) => {
    const x = 0.6 + i * 4.1;
    card(s, x, 1.55, 3.85, 2.9, C.background2);
    node(s, x + 0.6, 2.15, 0.7, c);
    T(s, h, { x: x + 1.1, y: 1.9, w: 2.5, h: 0.55, fontSize: 24, bold: true, fontFace: "Cambria", color: C.text2 });
    T(s, b, { x: x + 0.3, y: 2.75, w: 3.3, h: 1.0, fontSize: 15 });
    T(s, tag, { x: x + 0.3, y: 3.8, w: 3.3, h: 0.4, fontSize: 14, italic: true, color: MUTED });
  });
  T(s, "Search engine", { x: 0.6, y: 4.8, w: 5.8, h: 0.4, fontSize: 18, bold: true, fontFace: "Cambria", color: C.text2 });
  T(s, "Backtracking + MRV + forward checking. Retained values are placed and propagated first; verified values are tried first.",
    { x: 0.6, y: 5.25, w: 5.8, h: 1.2, fontSize: 15 });
  T(s, "Safety rules before search", { x: 6.9, y: 4.8, w: 5.8, h: 0.4, fontSize: 18, bold: true, fontFace: "Cambria", color: C.text2 });
  T(s, [{ text: "An old value that is now illegal is always discarded.", options: { bullet: true, breakLine: true } },
    { text: "Two neighbouring retained variables with the same colour both drop to verify.", options: { bullet: true } }],
  { x: 6.9, y: 5.25, w: 5.8, h: 1.3, fontSize: 15, paraSpaceAfter: 6 });
  s.addNotes(`WHAT TO SAY (about 2 minutes)
"This is the core interface of the project. After a change, every method, whether it is a rule or a trained model, gives every variable one of three actions.

Retain: keep the old value and fix it. The variable is taken out of the search completely. That is the cheapest option, but the riskiest: if the kept value is wrong for the new problem, the search cannot fix it.

Verify: the variable is searched over, but its old value is tried first. If the old value still works, it is kept almost for free; if not, the search moves on.

Discard: the variable is searched from scratch with no hint. Safest, but most expensive.

The engine underneath is backtracking with MRV and forward checking. Retained values are placed first and their effects propagated; verified values are tried first.

Two safety rules run before the search. If an old value is now illegal, for example its colour was banned, that variable is always discarded. And if two neighbouring retained variables have the same colour, they would certainly clash, so both are moved to verify."

THE BASELINES IN THIS LANGUAGE (useful to say)
- Cold restart = discard everything.
- Warm start = verify everything.
- Fixed structural reuse (r = 1) = retain everything more than 1 hop from the change, verify the rest.
- Learned policy = a classifier chooses retain, verify or discard for each variable.
- Naive Min-Conflicts is the exception: local search from the old assignment, with no fallback.

DEFINITIONS
- Fixed (retained) assignment: a value placed before search starts and never changed by the search.
- Hint (verified value): the first value tried for a variable; the others are tried afterwards in normal order.
- Propagation: forward checking from the fixed values removes their colours from neighbours' domains before search begins. If a neighbour's domain becomes empty, the retained set is infeasible (status "infeasible_fixed"), which triggers the fallback on the next slide.
- Search node budget: each repair stage may use at most 5,000 search nodes.

ON THE DASHBOARD these are coloured grey = retain, amber = verify, red = discard, the same colours as on this slide.`);
}

// ================================================================ 9. fallback ladder
{
  const s = newSlide();
  s.addText("A fallback ladder keeps every method complete", { placeholder: "title" });
  const st = [["1", "Policy's plan", "Use the actions as given"], ["2", "Release ring 1", "Retained within 1 hop → verify"],
    ["3", "Release ring 2", "Retained within 2 hops → verify"], ["4", "Release ring 3", "Retained within 3 hops → verify"],
    ["5", "Release ring 4", "Retained within 4 hops → verify"], ["6", "Cold restart", "Full search from scratch"]];
  st.forEach(([n, h, b], i) => {
    const x = 0.6 + i * 2.04, last = i === 5, first = i === 0;
    card(s, x, 1.7, 1.86, 2.5, first ? C.accent1 : last ? C.accent3 : C.background2);
    const fg = first || last ? C.background1 : C.text2;
    T(s, `Stage ${n}`, { x: x + 0.15, y: 1.85, w: 1.6, h: 0.4, fontSize: 14, bold: true, color: first || last ? C.background1 : MUTED });
    T(s, h, { x: x + 0.15, y: 2.25, w: 1.6, h: 0.8, fontSize: 17, bold: true, fontFace: "Cambria", color: fg });
    T(s, b, { x: x + 0.15, y: 3.1, w: 1.6, h: 1.0, fontSize: 14, color: first || last ? C.background1 : C.text1 });
  });
  T(s, "Each stage runs only if the previous one fails: kept values make P₁ unsolvable, or 5,000 search nodes run out.",
    { x: 0.6, y: 4.45, w: 12.1, h: 0.45, fontSize: 15, color: MUTED, italic: true });
  [["100%", "of changes solved by every method that uses the ladder"], ["Fallback rate", "share of changes needing stage 2 or later: our measure of harmful reuse"]]
    .forEach(([big, small], i) => {
      const x = 0.6 + i * 6.2;
      card(s, x, 5.1, 5.9, 1.5, C.background2);
      T(s, big, { x: x + 0.3, y: 5.22, w: 5.3, h: 0.6, fontSize: 28, bold: true, fontFace: "Cambria", color: i ? C.accent2 : C.accent5 });
      T(s, small, { x: x + 0.3, y: 5.85, w: 5.3, h: 0.65, fontSize: 15 });
    });
  s.addNotes(`WHAT TO SAY (about 1.5 minutes)
"A wrong retain decision can make the new problem unsolvable with those values fixed. We never want reuse to cost us a solution, so every method runs inside a fallback ladder.

Stage 1 runs the policy's actions as given. If that fails, stage 2 releases every retained variable within 1 hop of the change, turning them into verify, and searches again. Stages 3, 4 and 5 widen that ring to 2, 3 and 4 hops. If everything still fails, stage 6 is a full cold restart.

A stage fails if the kept values are provably inconsistent or if it uses up its budget of 5,000 search nodes.

Because the last stage is complete search, every method that uses the ladder is complete, and in our tests all of them solved 100% of changes. The share of changes that needed stage 2 or later is how we measure harmful reuse."

DEFINITIONS
- Ring / radius r: the set of variables within r hops of the change, measured by breadth-first search (BFS) in the new graph.
- Hop: one edge. A neighbour is 1 hop away, a neighbour's neighbour 2 hops.
- Touched nodes (where distance is measured from): endpoints of added or removed edges, new nodes, neighbours of removed nodes, and every node whose old value became illegal.
- Fallback stage: the stage at which the repair finally succeeded (1 = first try). Shown on the dashboard.
- Harmful reuse: a retain decision that causes the first plan to fail.
- First-try success: the share of changes solved at stage 1.
- Stage costs add up: if stages 1, 2 and 3 run, the reported search nodes are the sum of all three.

WHY THIS MATTERS FOR THE RESULTS
Each failed stage can burn up to 5,000 nodes before escalating. This is why fallbacks dominate the learned policies' cost (slide "The catch").
Note: a stage is skipped if releasing that ring changes nothing (no retained variables in it). Warm start retains nothing, so it jumps straight from stage 1 to stage 6.`);
}

// ================================================================ 10. features
{
  const s = newSlide();
  s.addText("29 features describe each variable after a change", { placeholder: "title" });
  const g = [[H.accent1, "Locality and structure", "6", "distance to the change, degree, change in degree, new node?, neighbours' mean degree, neighbours sharing its colour"],
    [H.accent2, "Validity and tightness", "6", "old value still legal?, in conflict?, domain size, saturation, slack, conflicted neighbours"],
    [H.accent5, "Solver history", "4", "times in conflict, times changed, steps since last change, neighbours' conflict history"],
    [H.accent6, "Global change context", "13", "k, density, graph size, batch size, number of touched nodes, fraction conflicted, count of each change type"]];
  g.forEach(([c, h, n, b], i) => {
    const x = 0.6 + (i % 2) * 6.15, y = 1.55 + Math.floor(i / 2) * 2.6;
    card(s, x, y, 5.95, 2.35, C.background2);
    node(s, x + 0.55, y + 0.55, 0.62, c, n);
    T(s, h, { x: x + 1.05, y: y + 0.3, w: 4.6, h: 0.5, fontSize: 19, bold: true, fontFace: "Cambria", color: C.text2 });
    T(s, b, { x: x + 0.3, y: y + 1.0, w: 5.4, h: 1.25, fontSize: 17 });
  });
  s.addNotes(`WHAT TO SAY (about 1.5 minutes)
"For every variable of the new problem we compute 29 numbers that the model uses to decide its action. They fall into four groups.

Locality and structure: how far the variable is from the change, how many constraints it has, and whether that just changed.
Validity and tightness: is its old value still legal, is it in conflict, and how much room does it have.
Solver history: how often it has been in trouble before.
Global context: how big and how disruptive this change is overall.

These cover everything we listed at mid-evaluation: change type and magnitude, graph distance, degree and tightness, conflict frequency and assignment persistence."

EVERY FEATURE, DEFINED (feature name in brackets)
Locality and structure (6)
- [dist] hops from the nearest touched node, capped at 10.
- [degree] number of constraints (edges) on the variable now.
- [delta_degree] degree now minus degree before the change.
- [is_new] 1 if the variable was just added.
- [nbr_mean_degree] average degree of its neighbours.
- [n_conf_nbrs] number of neighbours whose old colour equals its old colour (direct clashes).
Validity and tightness (6)
- [old_valid] 1 if its old colour is still in its domain and below k.
- [in_conflict] 1 if its old value is illegal or clashes with a neighbour.
- [domain_size] how many colours it may take now.
- [saturation] how many different colours its neighbours use (the DSATUR idea). High saturation = few options.
- [slack] how many of its legal colours are not used by any neighbour, i.e. free colours. Slack 0 = very tight.
- [conf_nbrs_within1] how many neighbours are themselves in conflict.
Solver history (4)
- [conflict_hist] times this variable was in conflict after earlier changes.
- [change_hist] times repair changed its value before.
- [steps_since_change] steps since it last changed (capped at 20). Measures assignment persistence.
- [nbr_conflict_hist] neighbours' average conflict history.
Global change context (13)
- [k] number of colours; [density] 2 × edges / nodes, i.e. average degree; [n_nodes] graph size.
- [batch_size] number of changes in this step; [n_sources] number of touched nodes.
- [frac_conflicted] fraction of all variables whose old value is now in conflict. How disruptive the change was overall.
- Seven counts, one per change type, for how many changes of that type were in the batch.

WHY GLOBAL FEATURES: the same local situation should be treated differently when the whole graph is disrupted versus barely touched. The models confirm this: frac_conflicted and k are among the most important features.`);
}

// ================================================================ 11. counterfactual labelling
{
  const s = newSlide();
  s.addText("Labels come from counterfactual experiments", { placeholder: "title" });
  const steps = ["Give every variable a reference action from the fixed rule",
    "Sample up to 12 variables within 2 hops and 8 farther away",
    "For each one, rerun the repair three times, switching only its action",
    "Label = the cheapest action (search nodes + variables changed)"];
  steps.forEach((t, i) => {
    const y = 1.6 + i * 1.08;
    node(s, 0.95, y + 0.3, 0.55, C.text2 === undefined ? H.dk2 : H.dk2, i + 1);
    T(s, t, { x: 1.45, y: y + 0.05, w: 4.9, h: 0.85, fontSize: 16, valign: "middle" });
  });
  card(s, 0.6, 6.0, 5.8, 0.75, C.background2);
  T(s, [{ text: "7,205", options: { bold: true, color: C.accent1 } }, { text: " labelled variables from 438 change events" }],
    { x: 0.85, y: 6.0, w: 5.4, h: 0.75, fontSize: 16, valign: "middle" });
  s.addChart(pres.charts.BAR, [
    { name: "retain", labels: ["0 hops", "1 hop", "2 hops", "3 hops", "4+ hops"], values: [78.6, 77.7, 96.9, 97.4, 98.5] },
    { name: "verify", labels: ["0 hops", "1 hop", "2 hops", "3 hops", "4+ hops"], values: [20.7, 21.1, 2.7, 2.5, 1.5] },
    { name: "discard", labels: ["0 hops", "1 hop", "2 hops", "3 hops", "4+ hops"], values: [0.7, 1.3, 0.5, 0.1, 0] },
  ], { ...chartBase, x: 6.8, y: 1.45, w: 5.9, h: 5.3, barDir: "bar", barGrouping: "percentStacked", catAxisOrientation: "maxMin",
    chartColors: [H.accent4, H.accent2, H.accent3], showValue: false, showLegend: true, legendPos: "b", legendFontSize: 12,
    legendFontFace: "+mn-lt", legendColor: MUTED, showTitle: true, title: "Best action by distance from the change (%)",
    valAxisLabelFormatCode: "0%", barGapWidthPct: 45, objectName: `ch${++sid}` });
  s.addNotes(`WHAT TO SAY (about 2 minutes)
"To train a model we need labels: for a given variable after a given change, which action is actually best? Nobody knows that in advance, so we measured it with counterfactual experiments.

For every change event in the training sequences, we first give every variable a reference action from the fixed rule. Then we sample up to 12 variables close to the change and 8 farther away. For each sampled variable, we rerun the entire repair three times, with everything identical except that one variable's action: retain, verify or discard. Whichever run is cheapest gives the label. Cost is search nodes plus the number of variables changed.

That gave us 7,205 labelled variables from 438 change events.

The chart shows what the labels look like. Far from the change, retain is right about 97% of the time. Within one hop, verify is right about 21% of the time. Distance clearly matters, but even 2 to 3 hops away a few percent of variables are better re-checked, which is part of why distance alone is not enough."

DEFINITIONS
- Label: the correct answer the model learns to predict (retain, verify or discard).
- Counterfactual labelling: compare outcomes while changing only one factor, so the difference is caused by that factor.
- Reference policy: the fixed r = 1 rule, used for every variable except the one being tested.
- Cost = search nodes + 1.0 × variables changed. A failed repair costs 2 × nodes + 100,000, a big penalty.
- Ties: the cheaper action wins in the order retain, then verify, then discard (keeping is preferred if it costs the same).
- Regret: the extra cost of the action we picked over the best action. We store all three costs, so we can compute regret exactly.
- Only variables whose old value is still legal are sampled (illegal ones are always discarded anyway).
- Events where even the reference policy needed a cold restart are skipped: no single variable can be blamed or credited there.

DATASET NUMBERS
- 30 training sequences × 15 steps = 450 events; 438 produced labelled rows.
- 7,205 rows: 5,765 for training, 1,440 for validation.
- Label share: retain 91.6%, verify 7.8%, discard 0.6%. Very imbalanced, which affects the classifiers (next slide).
- Counts per distance: 0 hops 285, 1 hop 1,756, 2 hops 3,131, 3 hops 1,967, 4+ hops 66.`);
}

// ================================================================ 12. models
{
  const s = newSlide();
  s.addText("Three classifiers, validated on unseen sequences", { placeholder: "title" });
  const hd = (t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: H.dk2 } } });
  const it = (t) => ({ text: t, options: { italic: true, color: MUTED } });
  s.addTable([
    [hd("Model"), hd("Accuracy"), hd("Macro F1"), hd("Retain AUC"), hd("Regret")],
    ["Logistic Regression", "0.753", "0.439", "0.904", "18.8"],
    [{ text: "Random Forest", options: { bold: true } }, { text: "0.942", options: { bold: true } }, { text: "0.511", options: { bold: true } }, { text: "0.915", options: { bold: true } }, "14.2"],
    ["XGBoost", "0.888", "0.485", "0.864", "14.3"],
    [it("Always retain"), it("0.922"), it("–"), it("–"), it("15.2")],
    [it("Fixed rule (r = 1)"), it("–"), it("–"), it("–"), it("14.0")],
  ], { x: 0.6, y: 1.55, w: 7.4, colW: [2.6, 1.2, 1.2, 1.3, 1.1], fontSize: 15, fontFace: "Calibri", color: "1B1F2E", align: "center",
    border: { type: "solid", pt: 0.75, color: "D5D9E4" }, valign: "middle", rowH: 0.55, margin: [0.05, 0.1, 0.05, 0.1], objectName: `tbl${++sid}` });
  T(s, "Validation: 1,440 rows from 6 held-out training sequences. Regret = extra cost of the predicted action over the best one.",
    { x: 0.6, y: 5.0, w: 7.4, h: 0.7, fontSize: 13, color: MUTED });
  card(s, 8.4, 1.55, 4.3, 2.35, C.background2);
  T(s, "Imbalance handled", { x: 8.7, y: 1.72, w: 3.8, h: 0.4, fontSize: 17, bold: true, fontFace: "Cambria", color: C.text2 });
  T(s, "Balanced class weights in all three models; RF 300 trees, XGBoost 300 trees of depth 4.", { x: 8.7, y: 2.15, w: 3.8, h: 1.6, fontSize: 15 });
  card(s, 8.4, 4.1, 4.3, 2.55, C.text2);
  T(s, "Takeaway", { x: 8.7, y: 4.27, w: 3.8, h: 0.4, fontSize: 17, bold: true, fontFace: "Cambria", color: ICE });
  T(s, "Random Forest classifies best, but offline regret only matches the fixed rule. The end-to-end test decides.", { x: 8.7, y: 4.7, w: 3.8, h: 1.8, fontSize: 15, color: C.background1 });
  s.addNotes(`WHAT TO SAY (about 2 minutes)
"We trained three classifiers of increasing power: logistic regression, a random forest and XGBoost. To avoid leakage, validation uses whole sequences the models never saw: 20% of training sequences, stratified by size.

Random Forest is the best classifier: 94% accuracy, and it ranks variables best for 'should this be retained'. All models struggle with the rare discard class, which has only 7 validation examples.

The honest point is regret. The tree models make cheaper choices than always retaining, but on this offline measure they only match the fixed distance rule, 14.2 against 14.0. So classification scores alone do not prove the model is better. The real test is end to end, where every variable's action is chosen at once and errors compound. That's the results section."

MODELS, DEFINED
- Logistic Regression: a linear model. It weighs the features and passes the sum through a softmax to get class probabilities. Features are standardised first (mean 0, std 1). Simple and fast, but it can only draw linear boundaries, so it cannot capture interactions like "close AND tight AND conflicted".
- Random Forest: 300 decision trees, each trained on a bootstrap sample with random feature subsets; prediction = average of the trees. min_samples_leaf = 3. Captures non-linear interactions.
- XGBoost: gradient-boosted trees. Trees are added one at a time, each correcting the previous ones' errors. 300 trees, depth 4, learning rate 0.05, row and column subsampling 0.9.
- Class imbalance: retain is 92% of labels. "Balanced" weighting counts rare classes more, so the model does not just always predict retain.

METRICS, DEFINED
- Accuracy: share of predictions that are correct. Misleading under imbalance: always predicting retain already scores 0.922.
- Precision (per class): of the times we predicted this class, how often we were right. Recall: of the true cases of this class, how many we found.
- F1: harmonic mean of precision and recall. Macro F1: average F1 over the three classes, each weighted equally, so rare classes count.
- AUC (area under the ROC curve) for retain: the probability that a random truly-retain variable gets a higher P(retain) than a random non-retain one. 0.5 = random, 1.0 = perfect.
- Regret: mean extra cost (search nodes + variables changed) of the predicted action versus the best action.

DETAIL (if asked)
- RF: retain recall 98%, precision 96%; verify recall 49%; discard 0.
- Logistic Regression over-predicts verify and discard (balanced weights push it hard): verify recall 72% but precision 29%.
- Retain threshold τ: optionally retain only if P(retain) ≥ τ. Tuned end to end on the held-out training sequences over {argmax, 0.6, 0.8, 0.9}. Chosen: 0.6 for LR and XGBoost, argmax for RF. High τ (0.9) retains almost nothing and degrades towards warm start.
- Training time: LR 0.6 s, RF 3.1 s, XGBoost 1.6 s.
- Prediction overhead per change: about 2–3 ms for LR and XGBoost, about 25 ms for RF.`);
}

// ================================================================ 13. setup
{
  const s = newSlide();
  s.addText("Experimental setup", { placeholder: "title" });
  [["18", "unseen test sequences"], ["270", "change events"], ["3", "graph sizes: 60, 100, 150"], ["7", "repair methods compared"]]
    .forEach(([big, small], i) => {
      const x = 0.6 + i * 3.08;
      card(s, x, 1.55, 2.85, 2.1, C.background2);
      T(s, big, { x: x + 0.3, y: 1.7, w: 2.3, h: 1.0, fontSize: 54, bold: true, fontFace: "Cambria", color: C.accent1 });
      T(s, small, { x: x + 0.3, y: 2.75, w: 2.3, h: 0.75, fontSize: 15, color: C.text1 });
    });
  const pts = [["Same changes for everyone", "Every method replays exactly the same change batches from the same P₀."],
    ["Own history", "Each method repairs from its own previous solution, as it would in real use."],
    ["Budgets", "5,000 search nodes per stage; 500,000 for a cold restart; Min-Conflicts 50 × n steps."],
    ["Metrics", "Success, first-try success, search nodes (mean, median, 95th pct), time, variables changed."]];
  pts.forEach(([h, b], i) => {
    const x = 0.6 + (i % 2) * 6.15, y = 4.0 + Math.floor(i / 2) * 1.35;
    node(s, x + 0.2, y + 0.2, 0.28, [H.accent1, H.accent5, H.accent2, H.accent6][i]);
    T(s, h, { x: x + 0.5, y, w: 5.4, h: 0.4, fontSize: 17, bold: true, fontFace: "Cambria", color: C.text2 });
    T(s, b, { x: x + 0.5, y: y + 0.42, w: 5.4, h: 0.8, fontSize: 15 });
  });
  s.addNotes(`WHAT TO SAY (about 1 minute)
"For evaluation we used 18 sequences the models never saw, 6 per graph size, 15 steps each, which gives 270 change events. We compare 7 methods: cold restart, naive Min-Conflicts, the fixed rule, warm start, and our three learned policies.

Fairness: every method replays exactly the same changes from the same starting problem. Each method then repairs from its own previous solution, as it would in real use. So a method that makes unnecessary changes lives with them.

Budgets are 5,000 search nodes per stage and 500,000 for a cold restart."

DEFINITIONS
- Test sequence: a fresh P₀ plus 15 batches of changes, from seeds never used in training (training seeds 100–109, test seeds 500–505).
- Replay: applying the same stored change batches in the same order for every method.
- "Repairs from its own previous solution": if a method changed many variables at step t, the next step starts from that changed solution.
- If a method fails (only Min-Conflicts can), the failure is recorded and the chain continues from a reference solution whose cost is not charged.
- Success rate: share of changes solved with a valid colouring.
- First-try success: solved at stage 1, without falling back.
- Mean vs median: the mean is pulled up by a few very expensive changes; the median is the typical change. 95th percentile (P95): 95% of changes cost less than this, a measure of the bad tail.
- Wall time: real time in milliseconds. Repair times do not include ML prediction; that was measured separately (2–25 ms).
- Runtime: the whole pipeline takes about 16.5 minutes on 4 worker processes (Python 3.14, scikit-learn 1.9.1, XGBoost 3.4.1).`);
}

// ================================================================ 14. results
{
  const s = newSlide();
  s.addText("Learned reuse: cheaper and steadier than re-solving", { placeholder: "title" });
  [["−51%", "search nodes vs cold restart (XGBoost)"], ["2 vs 43", "median search nodes: learned vs fixed rule"], ["−65%", "variables changed vs cold restart"], ["100%", "changes solved by every complete method"]]
    .forEach(([big, small], i) => {
      const x = 0.6 + i * 3.08;
      T(s, big, { x, y: 1.45, w: 2.9, h: 0.8, fontSize: 38, bold: true, fontFace: "Cambria", color: i === 3 ? C.accent5 : C.accent1 });
      T(s, small, { x, y: 2.25, w: 2.8, h: 0.65, fontSize: 14, color: MUTED });
    });
  const meth = ["Cold restart", "Warm start", "ML: Logistic Reg.", "Fixed rule (r=1)", "ML: Random Forest", "ML: XGBoost", "Min-Conflicts*"];
  const isML = [0, 0, 1, 0, 1, 1, 0];
  const two = (vals) => [{ name: "Learned", labels: meth, values: vals.map((v, i) => isML[i] ? v : 0) },
    { name: "Baseline", labels: meth, values: vals.map((v, i) => isML[i] ? 0 : v) }];
  const opts = (x, title, fmt) => ({ ...chartBase, x, y: 3.05, w: 6.0, h: 3.55, barDir: "bar", barOverlapPct: 100, barGapWidthPct: 45,
    chartColors: [H.accent1, "A9AFBE"], catAxisOrientation: "maxMin", showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: fmt,
    valAxisHidden: true, valGridLine: { style: "none" }, showLegend: false, showTitle: true, title, objectName: `ch${++sid}` });
  s.addChart(pres.charts.BAR, two([155, 121, 51, 43, 2, 2, 2]), opts(0.5, "Median search nodes per change", "#,##0;;;"));
  s.addChart(pres.charts.BAR, two([45.3, 22.5, 21.2, 14.6, 14.4, 15.8, 0.8]), opts(6.75, "Mean variables changed per change", "0.0;;;"));
  T(s, "Blue = learned policies. *Min-Conflicts solves only 68% of changes.", { x: 0.6, y: 6.62, w: 8, h: 0.3, fontSize: 11, color: MUTED });
  s.addNotes(`WHAT TO SAY (about 2 minutes)
"Here are the headline results on the 270 unseen changes.

Every method that uses our repair interface solved 100% of changes. Naive Min-Conflicts, which has no fallback, solved only 68%.

Compared with a cold restart, XGBoost needs 51% fewer search nodes and changes 65% fewer variables. Compared with the fixed distance rule, it needs 12% fewer search nodes at about the same stability.

The left chart is the typical change, the median. The tree models solve it in 2 search nodes, essentially free, against 43 for the fixed rule and 155 for a cold restart. The right chart is stability: Random Forest changes 14 variables per change, the fixed rule 15, warm start 22, and a cold restart 45.

Logistic regression is the weakest learned policy. It is a linear model and cannot capture the interactions the trees use, so it retains less and pays for it."

FULL TABLE (mean over 270 changes) — method: success / first-try / mean nodes / median / P95 / mean ms / vars changed
- Cold restart: 100% / 100% / 7,169 / 155 / 38,595 / 1,316 / 45.3
- Naive Min-Conflicts: 67.8% / 67.8% / 1,730 / 2 / 7,451 / 9 / 0.8 (only on solved changes)
- Fixed reuse (r = 1): 100% / 72.2% / 3,973 / 43 / 9,126 / 713 / 14.6
- Warm start (verify all): 100% / 92.6% / 1,871 / 121 / 8,627 / 275 / 22.5
- ML Logistic Regression: 100% / 86.3% / 5,487 / 51 / 13,088 / 1,037 / 21.2
- ML Random Forest: 100% / 70.4% / 3,881 / 2 / 8,754 / 783 / 14.4
- ML XGBoost: 100% / 72.2% / 3,499 / 2 / 8,453 / 775 / 15.8

HOW THE HEADLINE NUMBERS ARE COMPUTED
- −51%: XGBoost mean 3,499 vs cold restart 7,169 (Random Forest: −46%).
- −12%: XGBoost 3,499 vs fixed rule 3,973 (Random Forest: −2%).
- −65%: XGBoost 15.8 vs cold restart 45.3 variables changed (Random Forest: −68%).
- Head to head per change: Random Forest needs fewer nodes than the fixed rule on 71% of changes, the same on 16%, more on 13%. XGBoost: 72% / 4% / 25%.

IF ASKED "Why is Min-Conflicts' median 2 and stability so good?"
When it succeeds it makes tiny local fixes, so it is very cheap and stable. But it fails on a third of changes, and a method that sometimes returns no answer is not acceptable here. That is exactly why it is a baseline and not our engine.

IF ASKED "Are the times fair?"
Repair times exclude ML prediction. Measured separately: 2–3 ms per change for LR and XGBoost, about 25 ms for Random Forest. Small next to mean repair times of hundreds of milliseconds.`);
}

// ================================================================ 15. the catch
{
  const s = newSlide();
  s.addText("The catch: some retain plans fail and must be unwound", { placeholder: "title" });
  const lbl = ["Cold restart (0% fell back)", "Warm start (7%)", "Fixed rule (28%)", "ML: Logistic Reg. (14%)", "ML: Random Forest (30%)", "ML: XGBoost (28%)"];
  s.addChart(pres.charts.BAR, [
    { name: "Policy's first plan (stage 1)", labels: lbl, values: [1936, 85, 7, 61, 1, 14] },
    { name: "Fallback stages 2–6", labels: lbl, values: [0, 420, 1066, 1421, 1047, 931] },
  ], { ...chartBase, x: 0.5, y: 1.45, w: 7.3, h: 5.25, barDir: "bar", barGrouping: "stacked", catAxisOrientation: "maxMin",
    chartColors: [H.accent1, H.accent2], showValue: false, showLegend: true, legendPos: "b", legendFontSize: 12, legendFontFace: "+mn-lt",
    legendColor: MUTED, showTitle: true, title: "Total search nodes over 270 changes (thousands)", valAxisLabelFormatCode: "#,##0",
    barGapWidthPct: 45, objectName: `ch${++sid}` });
  [["5 nodes", "average cost when Random Forest's first plan works (70% of changes)"],
    ["~13,000 nodes", "average cost when it has to fall back (30% of changes)"],
    ["1,871 vs 3,499", "mean nodes: warm start vs XGBoost. Warm start rarely falls back, but changes 42% more variables"]]
    .forEach(([big, small], i) => {
      const y = 1.55 + i * 1.75;
      card(s, 8.15, y, 4.55, 1.55, C.background2);
      T(s, big, { x: 8.4, y: y + 0.12, w: 4.1, h: 0.55, fontSize: 26, bold: true, fontFace: "Cambria", color: [C.accent5, C.accent2, C.accent3][i] });
      T(s, small, { x: 8.4, y: y + 0.7, w: 4.1, h: 0.8, fontSize: 14 });
    });
  s.addNotes(`WHAT TO SAY (about 2 minutes) — this is the most important insight, take your time
"Now the catch, and the most interesting finding.

The chart splits each method's total search effort into its first plan, in blue, and its fallbacks, in amber. For the learned policies, the blue part is almost invisible. When Random Forest's first plan works, which is about 70% of changes, it costs 5 search nodes on average. Almost free.

But in the other 30%, the retained values turn out to be inconsistent with the new problem. The ladder has to release rings one by one, each failed stage burning up to 5,000 nodes, and those fallbacks cost around 13,000 nodes each. They account for nearly all of the learned policies' effort.

Warm start, which verifies everything and retains nothing, only falls back 7% of the time. That is why it has the lowest mean cost of the complete methods, 1,871 nodes against 3,499 for XGBoost. It pays for that in stability: it changes 42% more variables.

So the learned policies are excellent on typical changes and expensive on the hard ones. Cutting the cost of failed retain plans is the clear next step."

NUMBERS BEHIND THE CHART (stage counts out of 270 changes: stage 1 / stages 2–5 / stage 6 cold)
- Fixed rule: 195 / 56 / 19. Mean nodes at stage 1: 34; when fell back: 14,213.
- Warm start: 250 / 0 / 20. Stage 1: 339; fell back: 21,022.
- Logistic Regression: 233 / 20 / 17. Stage 1: 261; fell back: 38,395.
- Random Forest: 190 / 65 / 15. Stage 1: 5; fell back: 13,086.
- XGBoost: 195 / 59 / 16. Stage 1: 74; fell back: 12,406.
- The learned policies reach a full cold restart less often (15–16 changes) than the fixed rule (19) and warm start (20).

EFFECT OF GRAPH SIZE (mean search nodes; n = 60 / 100 / 150)
- Cold restart: 207 / 6,633 / 14,667
- Fixed rule: 103 / 3,219 / 8,597
- Warm start: 151 / 2,444 / 3,019
- Logistic Regression: 105 / 1,678 / 14,677
- Random Forest: 79 / 2,991 / 8,572
- XGBoost: 98 / 2,239 / 8,161
So Random Forest is cheapest on small graphs, the learned policies beat every baseline except warm start at n = 100, and at n = 150 warm start is far ahead because a failed retain plan costs more on bigger graphs. At n = 150 Random Forest still changes only 20.6 variables vs 30.1 for warm start and 71.4 for cold restart.

IF ASKED "So is the ML worth it?"
Yes if you care about stability and typical-case cost: it beats cold restart and the fixed rule, and it is as stable as the best rule. Not yet if you care only about average search effort: warm start wins that. Fixing the fallback cost (for example, releasing only the conflicting retained variables instead of whole rings) is the obvious improvement.`);
}

// ================================================================ 16. features learned
{
  const s = newSlide();
  s.addText("What the models learned", { placeholder: "title" });
  const f = ["k (colours)", "frac_conflicted", "degree", "slack", "domain_size", "conf_nbrs_within1", "dist (distance)", "delta_degree"];
  const v = [0.111, 0.100, 0.090, 0.087, 0.053, 0.052, 0.051, 0.035];
  s.addChart(pres.charts.BAR, [{ name: "Other features", labels: f, values: v.map((x, i) => i === 6 ? 0 : x) },
    { name: "Distance", labels: f, values: v.map((x, i) => i === 6 ? x : 0) }],
  { ...chartBase, x: 0.5, y: 1.45, w: 6.9, h: 5.25, barDir: "bar", barOverlapPct: 100, barGapWidthPct: 45, catAxisOrientation: "maxMin",
    chartColors: [H.accent1, H.accent2], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.000;;;", valAxisHidden: true,
    valGridLine: { style: "none" }, showLegend: false, showTitle: true, title: "XGBoost: eight most important features", objectName: `ch${++sid}` });
  [["Distance ranks only 7th", "in XGBoost and 8th in Random Forest."],
    ["Disruption matters most", "How much of the graph is in conflict, and how many colours there are."],
    ["Tightness matters next", "Degree, slack and domain size: how cornered the variable is."]]
    .forEach(([h, b], i) => {
      const y = 1.6 + i * 1.7;
      node(s, 7.95, y + 0.25, 0.4, [H.accent2, H.accent1, H.accent1][i]);
      T(s, h, { x: 8.35, y, w: 4.35, h: 0.5, fontSize: 19, bold: true, fontFace: "Cambria", color: C.text2 });
      T(s, b, { x: 8.35, y: y + 0.52, w: 4.35, h: 0.95, fontSize: 15 });
    });
  s.addNotes(`WHAT TO SAY (about 1.5 minutes)
"What did the models actually learn? This chart shows XGBoost's eight most important features.

Distance to the change, in amber, is only seventh. In the random forest it is eighth. The models lean more on how disrupted the whole problem is, the fraction of variables in conflict and the number of colours, and then on how cornered the variable is: its degree, its free colours, its domain size, and how many of its neighbours are in conflict.

This is evidence for H2: a distance-only rule ignores the signals the models find most useful. Combined with the labels from before, where a few percent of far-away variables were still better re-checked, distance is useful but not sufficient."

DEFINITIONS
- Feature importance (XGBoost, "gain"): how much, on average, splits on this feature improved the model. Values sum to 1 across the 29 features.
- Feature importance (Random Forest, impurity-based): how much splits on this feature reduced class impurity (Gini), averaged over trees.
- These are measures of how the model uses features, not proof of cause and effect.

RANDOM FOREST TOP 10 (if asked)
frac_conflicted 0.162, degree 0.162, k 0.069, density 0.067, nbr_mean_degree 0.060, n_nodes 0.053, domain_size 0.052, dist 0.052, n_sources 0.043, nbr_conflict_hist 0.041.

LOGISTIC REGRESSION (largest mean absolute coefficients)
k, domain_size, slack, degree, frac_conflicted, ch_add_color, saturation, dist.

INTUITION
- frac_conflicted: when much of the graph is broken, keeping old values is riskier, so the model retains less.
- slack = 0 means every legal colour is already used by a neighbour. Keeping such a variable fixed is likely to block its neighbours.
- k: with more colours there is more room, so retaining is safer.`);
}

// ================================================================ 17. verdicts
{
  const s = newSlide();
  s.addText("Hypotheses: what the evidence says", { placeholder: "title" });
  const v = [["H1", "Heterogeneous stability", "Not tested", H.accent4, "Only assignments are reused in the final scope."],
    ["H2", "Distance alone is insufficient", "Partly supported", H.accent2, "Distance matters, but models rank conflict and tightness above it."],
    ["H3", "Learning beats fixed policies", "Partly supported", H.accent2, "Beats the fixed rule (−12% nodes, median 2 vs 43); not warm start on mean."],
    ["H4", "Cheaper and still complete", "Supported", H.accent5, "100% solved; −51% nodes and −65% changes vs cold restart."]];
  v.forEach(([k, h, verdict, col, ev], i) => {
    const y = 1.5 + i * 1.32;
    card(s, 0.6, y, 12.1, 1.15, C.background2);
    node(s, 1.15, y + 0.575, 0.66, H.dk2, k);
    T(s, h, { x: 1.7, y: y + 0.1, w: 4.0, h: 0.95, fontSize: 18, bold: true, fontFace: "Cambria", color: C.text2, valign: "middle" });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.8, y: y + 0.32, w: 2.0, h: 0.5, fill: { color: col }, line: { type: "none" }, rectRadius: 0.25, objectName: `p${++sid}` });
    T(s, verdict, { x: 5.8, y: y + 0.32, w: 2.0, h: 0.5, fontSize: 14, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
    T(s, ev, { x: 8.05, y: y + 0.1, w: 4.45, h: 0.95, fontSize: 15, valign: "middle" });
  });
  s.addNotes(`WHAT TO SAY (about 1.5 minutes)
"Back to our four hypotheses.

H1, that different kinds of solver state have different stability, was not tested: in the final scope we only reuse variable assignments.

H2, that distance alone is insufficient: partly supported. Distance clearly matters, since far variables are retained 97% of the time against 78% near the change. But the models rank conflict and tightness features above distance, and some far variables are still better re-checked. On the other hand, the distance rule's offline regret is about as good as the models', so we cannot claim a clear win on that measure.

H3, that learning beats fixed policies: partly supported. The tree models beat the fixed rule end to end, with 12% fewer search nodes, fewer nodes on 71% of changes, and a median of 2 against 43, at the same stability. But they do not beat warm start on average search cost, and logistic regression does not beat the fixed rule.

H4, cheaper and still complete: supported. Every method solved 100% of changes, with half the search effort and about a third of the changed variables compared with a cold restart."

KEY EVIDENCE, BY HYPOTHESIS
- H2: retain is the right action for 78–79% of variables within 1 hop but 97–98% at 2+ hops; verify is still best for 2–3% of far variables; dist ranks 7th (XGBoost) and 8th (RF). Offline regret: fixed rule 14.0 vs RF 14.2.
- H3: XGBoost 3,499 vs fixed rule 3,973 mean nodes; RF fewer nodes than the rule on 71% of changes; but warm start 1,871.
- H4: 100% success for all complete methods; XGBoost −51% nodes and −65% variables changed vs cold restart; prediction overhead 2–25 ms per change.

IF ASKED "Isn't 'partly supported' a weak result?"
It is the honest one. The positive result (beats the rule, typical change nearly free, very stable) is real, and the negative result (fallback cost) tells us exactly what to fix next.`);
}

// ================================================================ 18. DEMO
{
  const s = newSlide("DARK");
  s.addText("Live demo", { placeholder: "title" });
  T(s, "dynamic-csp-solver-dac203.streamlit.app", { x: 0.7, y: 3.65, w: 7, h: 0.5, fontSize: 20, color: ICE });
  T(s, "Switching to the browser…", { x: 0.7, y: 4.3, w: 7, h: 0.5, fontSize: 16, italic: true, color: C.background1 });
  card(s, 8.1, 1.0, 4.6, 5.5, "2B3880");
  T(s, "What you will see", { x: 8.45, y: 1.2, w: 4.0, h: 0.45, fontSize: 18, bold: true, fontFace: "Cambria", color: C.background1 });
  const st = ["Solve a problem P₀", "Apply 3 random changes", "Cold restart: many recolourings", "Random Forest: retain / verify / discard", "Compare all seven methods", "Commit and change again"];
  st.forEach((t, i) => {
    const y = 1.85 + i * 0.75;
    node(s, 8.65, y + 0.2, 0.38, [H.accent1, H.accent2, H.accent3, H.accent4, H.accent5, H.accent6][i], i + 1);
    T(s, t, { x: 9.05, y, w: 3.5, h: 0.45, fontSize: 15, color: C.background1, valign: "middle" });
  });
  s.addNotes(`DEMO SCRIPT (about 5–6 minutes). Open the app before the talk and keep it in a browser tab.
URL: https://dynamic-csp-solver-dac203.streamlit.app (local backup: run "streamlit run app.py" and open http://localhost:8501)
The changes are deterministic: if you follow these exact clicks you will see exactly these numbers (times in ms will vary).

SETUP
Sidebar: keep Variables 80, Colours 4, Average degree 7.0. Set Seed = 2024. Click "Generate & solve P₀". The header should read 80 variables, 280 constraints, 4 colours, Step 0.

1. THE PROBLEM
Say: "Each dot is a variable, each line a not-equal constraint, colours are the current solution P₀."

2. A CHANGE
In "2 · Modify constraints" click "Add random batch" (batch size 3). Pending: restrict_domain(53, 2), restrict_domain(38, 2), add_node(80, 1, 7 neighbours).
Say: "Two nodes lose a colour, and a new node arrives with 7 constraints. Only 3 variables are directly affected."
After the first repair, point at the metrics: 3 directly affected, 21 within 1 hop, 0 constraints violated by the old solution.

3. COLD RESTART
Repair method = "Cold restart (BT+MRV+FC)", click "Apply changes & repair". You get 87 search nodes and 64 of 80 variables changed.
Say: "Valid, but it recoloured 64 variables for 3 small edits. Every thick outline is a changed variable."

4. LEARNED POLICY (main point)
Repair method = "ML: Random Forest", click "Apply changes & repair". You get 21 search nodes, 4 variables changed, fallback stage 1.
Switch "Colour nodes by" to "Reuse action": grey = retain (60), amber = verify (19), red = discard (2).
Say: "The model kept 60 variables untouched and re-checked 19 around the change. Stage 1 means its plan worked first time."
Optionally switch to "Distance to change" to show the amber region sits around the change.

5. COMPARE ALL
Click "Compare all solvers". You should see (nodes / variables changed): Cold restart 87 / 64; Naive Min-Conflicts fails; Fixed structural reuse 21 / 4; Warm start 81 / 24; Logistic Regression 81 / 58; Random Forest 21 / 4; XGBoost 30 / 4.
Say: "Warm start keeps more than a restart but saves no search. Logistic regression behaves almost like a restart, because it never retains. The tree models get it right. Here the fixed rule ties with Random Forest, which is fair to admit: on one small example a good rule can match the model. The benchmark over 270 changes is where they separate."

6. THRESHOLD (optional)
With "ML: XGBoost", set "ML retain threshold" to 0.6 → 38 nodes / 7 changed; 0.9 → 157 nodes / 42 changed (retains nothing, behaves like warm start). Set it back to 0.
Say: "This dial trades risk against reuse."

7. KEEP GOING
Click "Commit P₁ as the new P₀" (header: 81 variables, 287 constraints, Step 1).
Change type = add_edge, From node = 5, To node = 0 (both colour 0, so the new edge is violated immediately). Click "Add change", then "Compare all solvers".
Result: 1 violated constraint. Random Forest and XGBoost change 1 variable (15–17 nodes); cold restart changes 64.
Commit again: the History table shows both steps (30 nodes / 4 changed, then 17 / 1).

CLOSING LINE
"Over a stream of changes, the learned policy keeps the solution stable and the work proportional to the size of the change, not the size of the problem."

IF SOMETHING GOES WRONG
- The app is asleep (Streamlit Cloud sleeps idle apps): click "Yes, get this app back up" and wait about 30 seconds. Open it before the talk to avoid this.
- Numbers differ: you clicked in a different order. Click "Generate & solve P₀" to reset and start again.
- No internet: use the local version (streamlit run app.py).

DASHBOARD TERMS
- "Directly affected variables": variables at distance 0 (touched nodes).
- "Within 1 hop of change": variables at distance 0 or 1.
- "Constraints violated by old solution": edges whose two ends share a colour in the old solution, under P₁.
- "Search nodes / steps": search nodes for backtracking methods, local-search steps for Min-Conflicts.
- "Fallback stage": 1 = first plan worked; 2–5 = rings released; 6 = cold restart.
- Red edges = violated constraints; thick outline = variable whose value changed.`);
}

// ================================================================ 19. limitations
{
  const s = newSlide();
  s.addText("Limitations and next steps", { placeholder: "title" });
  const cols = [["Limitations", H.accent3, ["About 30% of learned repairs need a fallback, and fallbacks dominate cost",
    "Only variable assignments are reused, so H1 is untested", "Synthetic planted instances with k = 4",
    "Labels change one variable at a time; deployment changes all at once", "Very few discard examples (0.6%)"]],
  ["Next steps", H.accent5, ["After a failed stage 1, release only the conflicting retained variables, not whole rings",
    "Train on the end-to-end repair cost directly", "Reuse nogoods and heuristic statistics to test H1",
    "Larger graphs, more colours, standard benchmarks, feature ablations", "Combine: retain only when very confident, verify the rest"]]];
  cols.forEach(([h, c, items], i) => {
    const x = 0.6 + i * 6.15;
    card(s, x, 1.5, 5.95, 4.6, C.background2);
    node(s, x + 0.5, 1.98, 0.42, c);
    T(s, h, { x: x + 0.85, y: 1.72, w: 4.8, h: 0.5, fontSize: 21, bold: true, fontFace: "Cambria", color: C.text2 });
    T(s, items.map((t, j) => ({ text: t, options: { bullet: true, breakLine: j < items.length - 1 } })),
      { x: x + 0.3, y: 2.5, w: 5.4, h: 3.45, fontSize: 16, paraSpaceAfter: 12 });
  });
  s.addNotes(`WHAT TO SAY (about 1.5 minutes)
"Our main limitation is the one you just saw: about 30% of learned repairs need a fallback, and those fallbacks dominate the cost. We also only reuse variable assignments, so H1 is untested. Our instances are synthetic planted graph colouring with 4 colours. Our labels change one variable at a time while the deployed policy changes all variables at once, so errors can compound in ways the labels do not see. And discard is so rare that the models almost never predict it correctly.

The most promising next step: when stage 1 fails, release only the retained variables actually involved in the conflict, instead of whole rings around the change. That attacks the fallback cost directly. Beyond that: train directly on the end-to-end repair cost, extend reuse to nogoods and heuristic statistics to test H1, scale up to larger and standard benchmarks with feature ablations, and try a hybrid that only retains when the model is very confident and verifies everything else."

DEFINITIONS
- Cost-sensitive / end-to-end training: train the model on the total repair cost of its whole set of decisions, not on single-variable labels. Imitation learning or reinforcement learning are ways to do this.
- Conflict set / explanation: the specific variables whose fixed values cause the failure. Releasing only those is like conflict-directed backjumping.
- Feature ablation: retrain with groups of features removed, to see which groups matter. (Planned at mid-evaluation, not done.)
- Compounding errors: one wrong retain can force neighbours to change, which the single-variable labels never observe.

IF ASKED "Why did you not fix the fallback problem?"
We found it in the final evaluation; understanding and measuring it precisely is the result. The fix is the first next step.`);
}

// ================================================================ 20. conclusion
{
  const s = newSlide("DARK");
  s.addText("Conclusion", { placeholder: "title" });
  const pts = [["Built", "A complete testbed for dynamic CSP repair, with a learned per-variable reuse policy that never loses completeness."],
    ["Found", "Tree models halve the search of a cold restart, change a third as many variables, and beat a fixed reuse rule."],
    ["Next", "Make failed retain plans cheap to unwind; warm start still wins on average search effort."]];
  pts.forEach(([h, b], i) => {
    const y = 3.75 + i * 0.95;
    T(s, h, { x: 0.7, y, w: 1.2, h: 0.8, fontSize: 18, bold: true, color: C.accent2, fontFace: "Cambria" });
    T(s, b, { x: 1.95, y, w: 6.0, h: 0.85, fontSize: 15, color: C.background1 });
  });
  card(s, 8.6, 2.0, 4.1, 3.6, "2B3880");
  T(s, "Thank you", { x: 8.9, y: 2.4, w: 3.5, h: 0.8, fontSize: 34, bold: true, fontFace: "Cambria", color: C.background1, align: "center" });
  T(s, "Questions?", { x: 8.9, y: 3.25, w: 3.5, h: 0.6, fontSize: 22, color: ICE, align: "center" });
  T(s, "github.com/advikasinha/dynamic-csp-solver", { x: 8.75, y: 4.4, w: 3.8, h: 0.8, fontSize: 13, color: ICE, align: "center" });
  s.addNotes(`WHAT TO SAY (about 1 minute)
"To conclude. We built a complete testbed for repairing dynamic CSPs, and a learned policy that decides, per variable, what to keep, re-check or discard, without ever losing completeness.

The tree-based policies halve the search effort of a cold restart, change about a third as many variables, beat a fixed distance-based reuse rule, and solve the typical change almost for free.

What we learned: about 30% of learned retain plans fail and are expensive to unwind, which is why a simple verify-everything warm start still has the lowest average search cost. Making those failures cheap is the next step.

Thank you. We're happy to take questions."

LIKELY QUESTIONS AND ANSWERS
Q: Why is warm start so strong?
A: It never commits to a wrong value: everything is searchable, old values are just tried first. It almost never needs a fallback (7%). The price is stability (22.5 variables changed vs 14–16 for the learned policies).

Q: Why not just use Min-Conflicts like you planned?
A: It failed on 32% of test changes. A repair method that sometimes returns nothing is not acceptable, so it became a baseline.

Q: Isn't the model just learning distance?
A: No. Distance ranks only 7th or 8th; global disruption (fraction conflicted, k) and the variable's tightness (degree, slack) matter more.

Q: How do you know the labels are right?
A: They are measured, not guessed: for each sampled variable we rerun the repair with each of the three actions, holding everything else fixed, and pick the cheapest.

Q: Does the ML overhead eat the gains?
A: No. Prediction takes 2–3 ms per change for XGBoost and LR, about 25 ms for RF, against mean repair times of hundreds of milliseconds.

Q: Why is logistic regression worse than the fixed rule?
A: It is linear, so it cannot represent interactions (close AND tight AND conflicted). With balanced class weights it over-predicts verify and discard, so it retains much less (52 variables vs 92 for RF) and pays in search.

Q: Would this work on real problems?
A: The interface (retain, verify, discard plus fallback) applies to any CSP solved by backtracking. The features are graph-colouring specific but have general versions (domain size, constraint degree, conflict history). Testing on real benchmarks is future work.

Q: Who did what?
A: About 50/50. Advika led the ML pipeline: features, labelling, training, thresholds, the policy and deployment. Kavya led the environment, solvers, repair and fallback logic, baselines, benchmark and dashboard, plus part of the ML evaluation. The report's first page has the full split.

Q: How long does the whole experiment take?
A: About 16.5 minutes end to end on 4 processes. Everything is reproducible with "python experiments/run_all.py".`);
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();
