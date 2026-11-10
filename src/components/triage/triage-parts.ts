// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Everything the triage tool loads after load + idle, behind ONE dynamic import: the four tab
 * panels, the verdict box, the tabs and the full symptom data. (Separate import() calls each got
 * their own chunk group, and the bundler copied the shared symptom data into every one of them.)
 */
export { DashCluster } from "./dash-cluster";
export { LeakPanel, loadGooey } from "./leak-panel";
export { NoisePanel } from "./noise-panel";
export { OtherPanel, PaperTabs } from "./other-panel";
export { Verdict } from "./verdict";
export { SYMPTOM_BY_ID, TABS } from "@/data/symptoms";
