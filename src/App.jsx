import { useState, useEffect, useRef } from "react";

const SECTORS = ["Technology", "Healthcare", "Financials", "Consumer", "Energy", "Utilities", "Materials", "Industrials", "Real Estate", "Communication"];

// Add new license keys here each time someone purchases
// Format: "PORTFOLIOIQ-XXXX-XXXX-XXXX"
const VALID_KEYS = [
  "PORTFOLIOIQ-DEMO-1234-5678", // test key
];

const GUMROAD_URL = "https://merritt84.gumroad.com/l/portfolio-health-checker";

const initialHoldings = [
  { id: 1, ticker: "AAPL", name: "Apple Inc.", value: 12400, sector: "Technology", dividendYield: 0.5, expenseRatio: 0 },
  { id: 2, ticker: "MSFT", name: "Microsoft Corp.", value: 9800, sector: "Technology", dividendYield: 0.7, expenseRatio: 0 },
  { id: 3, ticker: "JNJ", name: "Johnson & Johnson", value: 5200, sector: "Healthcare", dividendYield: 3.1, expenseRatio: 0 },
  { id: 4, ticker: "SPY", name: "S&P 500 ETF", value: 8000, sector: "Technology", dividendYield: 1.3, expenseRatio: 0.09 },
];

function generateId() { return Date.now() + Math.random(); }

function calcMetrics(holdings) {
  if (!holdings.length) return null;
  const total = holdings.reduce((s, h) => s + h.value, 0);
  if (total === 0) return null;
  const sectorMap = {};
  holdings.forEach(h => { sectorMap[h.sector] = (sectorMap[h.sector] || 0) + h.value; });
  const sectorPcts = Object.entries(sectorMap).map(([s, v]) => ({ sector: s, pct: (v / total) * 100 })).sort((a, b) => b.pct - a.pct);
  const topSectorPct = sectorPcts[0]?.pct || 0;
  const topSector = sectorPcts[0]?.sector || "";
  const numSectors = sectorPcts.length;
  const sectorScore = Math.min(numSectors / 7, 1) * 40;
  const concentrationScore = Math.max(0, (1 - (topSectorPct - 20) / 60)) * 40;
  const holdingsScore = Math.min(holdings.length / 10, 1) * 20;
  const divScore = Math.round(sectorScore + concentrationScore + holdingsScore);
  const wDividend = holdings.reduce((s, h) => s + (h.dividendYield * h.value), 0) / total;
  const wExpense = holdings.reduce((s, h) => s + (h.expenseRatio * h.value), 0) / total;
  const flags = [];
  if (topSectorPct > 50) flags.push({ type: "warning", msg: `Heavy concentration in ${topSector} (${topSectorPct.toFixed(0)}%)` });
  if (holdings.length < 5) flags.push({ type: "warning", msg: "Fewer than 5 holdings — consider diversifying" });
  if (wExpense > 0.5) flags.push({ type: "warning", msg: `High avg expense ratio (${wExpense.toFixed(2)}%) — eating into returns` });
  if (numSectors < 3) flags.push({ type: "warning", msg: "Only " + numSectors + " sector(s) represented" });
  if (wDividend > 0.5) flags.push({ type: "success", msg: `Solid dividend yield of ${wDividend.toFixed(2)}%` });
  if (divScore >= 70) flags.push({ type: "success", msg: "Well-diversified portfolio" });
  const rebalance = [];
  const missingSectors = SECTORS.filter(s => !sectorMap[s]);
  if (topSectorPct > 40) rebalance.push({ type: "reduce", msg: `Reduce ${topSector} exposure by ~${Math.round(topSectorPct - 30)}% to bring it closer to a healthy 30%` });
  if (missingSectors.length > 5) rebalance.push({ type: "add", msg: `Consider adding exposure to ${missingSectors.slice(0, 3).join(", ")} for better balance` });
  if (holdings.length < 8) rebalance.push({ type: "add", msg: `Add ${8 - holdings.length} more positions to meaningfully improve diversification` });
  if (wExpense > 0.3) rebalance.push({ type: "reduce", msg: `Switching to lower-cost ETFs could save you ~$${(wExpense * total / 100).toFixed(0)}/year in fees` });
  if (wDividend < 0.5) rebalance.push({ type: "add", msg: `Consider adding dividend-paying stocks or REITs to boost income yield` });
  const scoreLabel = divScore >= 80 ? "Elite Portfolio" : divScore >= 65 ? "Well Optimized" : divScore >= 45 ? "Building Strength" : "Needs Work";
  const scoreColor = divScore >= 80 ? "#4ade80" : divScore >= 65 ? "#38bdf8" : divScore >= 45 ? "#fbbf24" : "#f87171";
  return { total, sectorPcts, divScore, scoreLabel, scoreColor, wDividend, wExpense, numSectors, flags, rebalance, topSector, topSectorPct };
}

function ScoreRing({ score, color, size = 120 }) {
  const r = (size / 2) - 10;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e293b" strokeWidth="9" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="9"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.2s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.2, fontWeight: 800, color, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: size * 0.09, color: "#64748b", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 2 }}>/100</span>
      </div>
    </div>
  );
}

function SectorBar({ sector, pct }) {
  const color = pct > 50 ? "#f87171" : pct > 30 ? "#fbbf24" : "#38bdf8";
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: "#cbd5e1" }}>{sector}</span>
        <span style={{ fontSize: 12, color, fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>{pct.toFixed(1)}%</span>
      </div>
      <div style={{ height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.9s ease" }} />
      </div>
    </div>
  );
}

function LoadingScreen({ onDone }) {
  const [step, setStep] = useState(0);
  const steps = ["Scanning your holdings...", "Analyzing sector exposure...", "Calculating risk flags...", "Generating your report..."];
  useEffect(() => {
    const timers = steps.map((_, i) => setTimeout(() => setStep(i + 1), i * 650));
    const done = setTimeout(onDone, steps.length * 650 + 300);
    return () => { timers.forEach(clearTimeout); clearTimeout(done); };
  }, []);
  return (
    <div style={{ background: "#0a0f1a", borderRadius: 16, border: "1px solid #1e293b", padding: "36px 24px", textAlign: "center", marginBottom: 24 }}>
      <div style={{ marginBottom: 24 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, opacity: step > i ? 1 : 0.2, transition: "opacity 0.4s ease", justifyContent: "center" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: step > i ? "#4ade80" : "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#020817", fontWeight: 700, transition: "background 0.3s", flexShrink: 0 }}>
              {step > i ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: 14, color: step > i ? "#e2e8f0" : "#334155", fontFamily: "'DM Sans', sans-serif" }}>{s}</span>
          </div>
        ))}
      </div>
      <div style={{ width: "100%", height: 4, background: "#1e293b", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(step / steps.length) * 100}%`, background: "linear-gradient(90deg, #38bdf8, #4ade80)", borderRadius: 2, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

function LicenseModal({ onUnlock, onClose }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  function handleCheck() {
    setChecking(true); setError("");
    setTimeout(() => {
      const clean = key.trim().toUpperCase();
      if (VALID_KEYS.includes(clean)) {
        localStorage.setItem("portfolioiq_key", clean);
        onUnlock();
      } else {
        setError("Invalid license key. Please check your Gumroad purchase email and try again.");
      }
      setChecking(false);
    }, 900);
  }
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(2,8,23,0.9)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, padding: "32px 24px", maxWidth: 400, width: "100%" }}>
        <button onClick={onClose} style={{ float: "right", background: "none", border: "none", color: "#475569", fontSize: 22, cursor: "pointer", marginTop: -8, lineHeight: 1 }}>×</button>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔑</div>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>Enter Your License Key</h3>
        <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: 20 }}>Check your Gumroad purchase email for your unique key. It looks like:<br/><span style={{ color: "#38bdf8", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>PORTFOLIOIQ-XXXX-XXXX-XXXX</span></p>
        <input placeholder="PORTFOLIOIQ-XXXX-XXXX-XXXX" value={key} onChange={e => setKey(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCheck()} style={{ marginBottom: 10, fontFamily: "'DM Mono', monospace", fontSize: 13, letterSpacing: "0.04em" }} />
        {error && <div style={{ color: "#f87171", fontSize: 12, marginBottom: 10, lineHeight: 1.5 }}>{error}</div>}
        <button onClick={handleCheck} disabled={!key || checking}
          style={{ width: "100%", background: checking ? "#1e293b" : "#38bdf8", color: checking ? "#475569" : "#020817", border: "none", padding: "13px", borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14, cursor: key && !checking ? "pointer" : "not-allowed", transition: "all 0.2s", marginBottom: 14 }}>
          {checking ? "Verifying key..." : "Unlock Full Access →"}
        </button>
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: 12, color: "#475569" }}>Don't have a key? </span>
          <a href={GUMROAD_URL} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#d4a84b", textDecoration: "none", fontWeight: 700 }}>Purchase for $7 →</a>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [holdings, setHoldings] = useState(initialHoldings);
  const [form, setForm] = useState({ ticker: "", name: "", value: "", sector: "Technology", dividendYield: "", expenseRatio: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [stage, setStage] = useState("input");
  const [metrics, setMetrics] = useState(null);
  const [unlocked, setUnlocked] = useState(() => {
    try { const k = localStorage.getItem("portfolioiq_key"); return k && VALID_KEYS.includes(k); } catch { return false; }
  });
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [animIn, setAnimIn] = useState(false);
  const resultsRef = useRef(null);

  useEffect(() => {
    if (stage === "results") {
      setAnimIn(false);
      setTimeout(() => { setAnimIn(true); resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 100);
    }
  }, [stage]);

  function handleAdd() {
    if (!form.ticker || !form.value) return;
    setHoldings(prev => [...prev, { id: generateId(), ticker: form.ticker.toUpperCase(), name: form.name || form.ticker.toUpperCase(), value: parseFloat(form.value) || 0, sector: form.sector, dividendYield: parseFloat(form.dividendYield) || 0, expenseRatio: parseFloat(form.expenseRatio) || 0 }]);
    setForm({ ticker: "", name: "", value: "", sector: "Technology", dividendYield: "", expenseRatio: "" });
    setShowAdd(false);
  }
  function handleRemove(id) { setHoldings(prev => prev.filter(h => h.id !== id)); setStage("input"); }
  function handleAnalyze() { setMetrics(calcMetrics(holdings)); setStage("loading"); }
  function handleUnlock() { setUnlocked(true); setShowLicenseModal(false); }

  const total = holdings.reduce((s, h) => s + h.value, 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,700;0,800;1,600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow-x: hidden; background: #020817; }
        .holding-row:hover { background: #0f172a !important; }
        .btn-primary { background: #38bdf8; color: #020817; border: none; padding: 11px 22px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s; }
        .btn-primary:hover { background: #7dd3fc; transform: translateY(-1px); }
        .btn-ghost { background: transparent; color: #64748b; border: 1px solid #1e293b; padding: 9px 18px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: 13px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .btn-ghost:hover { border-color: #334155; color: #94a3b8; }
        .btn-danger { background: transparent; color: #f87171; border: none; cursor: pointer; font-size: 18px; padding: 2px 8px; border-radius: 4px; line-height: 1; min-width: 32px; }
        .btn-danger:hover { background: #1e1020; }
        input, select { background: #0f172a; border: 1px solid #1e293b; color: #e2e8f0; border-radius: 7px; padding: 9px 12px; font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; width: 100%; transition: border 0.2s; }
        input:focus, select:focus { border-color: #38bdf8; }
        input::placeholder { color: #334155; }
        .metric-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 18px 20px; }
        .flag-warn { background: #1c1008; border: 1px solid #78350f; color: #fbbf24; border-radius: 8px; padding: 10px 14px; font-size: 13px; display: flex; align-items: flex-start; gap: 8px; line-height: 1.5; }
        .flag-ok { background: #0a1f14; border: 1px solid #14532d; color: #4ade80; border-radius: 8px; padding: 10px 14px; font-size: 13px; display: flex; align-items: flex-start; gap: 8px; line-height: 1.5; }
        .rebalance-reduce { background: #1a0a0a; border: 1px solid #7f1d1d; color: #fca5a5; border-radius: 8px; padding: 10px 14px; font-size: 13px; display: flex; align-items: flex-start; gap: 10px; line-height: 1.5; }
        .rebalance-add { background: #0a1628; border: 1px solid #1e3a5f; color: #7dd3fc; border-radius: 8px; padding: 10px 14px; font-size: 13px; display: flex; align-items: flex-start; gap: 10px; line-height: 1.5; }
        .holdings-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 12px; }
        .holdings-table { min-width: 500px; }
        .add-form-row1 { display: grid; grid-template-columns: 1fr 2fr 1.5fr; gap: 10px; margin-bottom: 10px; }
        .add-form-row2 { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 10px; align-items: end; }
        .metrics-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 20px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 600px) {
          .add-form-row1 { grid-template-columns: 1fr 1fr; }
          .add-form-row2 { grid-template-columns: 1fr 1fr; }
          .add-form-btn { grid-column: 1 / -1; }
          .metrics-grid { grid-template-columns: 1fr 1fr; }
          .score-flex { flex-direction: column; align-items: flex-start !important; }
        }
        @media (max-width: 400px) { .metrics-grid { grid-template-columns: 1fr; } }
      `}</style>

      {showLicenseModal && <LicenseModal onUnlock={handleUnlock} onClose={() => setShowLicenseModal(false)} />}

      {/* Banner */}
      {!unlocked ? (
        <div style={{ background: "linear-gradient(135deg, #92700a, #b8933a)", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#fef3c7" }}>📊 Free preview — full analysis locked</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            <a href={GUMROAD_URL} target="_blank" rel="noopener noreferrer" style={{ background: "#0c0e0f", color: "#d4a84b", padding: "6px 14px", borderRadius: "5px", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>Unlock for $7 →</a>
            <button onClick={() => setShowLicenseModal(true)} style={{ background: "transparent", color: "#fef3c7", border: "1px solid rgba(255,255,255,0.3)", padding: "6px 14px", borderRadius: "5px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>I already purchased</button>
          </div>
        </div>
      ) : (
        <div style={{ background: "linear-gradient(135deg, #14532d, #166534)", padding: "10px 16px", textAlign: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#86efac" }}>✓ Full Access Unlocked — Welcome to PortfolioIQ Pro</span>
        </div>
      )}

      <div style={{ minHeight: "100vh", background: "#020817", fontFamily: "'DM Sans', sans-serif", color: "#e2e8f0", paddingBottom: 80 }}>

        {/* Header */}
        <div style={{ borderBottom: "1px solid #0f172a", padding: "20px 0 16px" }}>
          <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.18em", color: "#38bdf8", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Portfolio Intelligence</div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(22px, 5vw, 32px)", fontWeight: 800, color: "#f1f5f9", lineHeight: 1 }}>Health Checker</h1>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>Portfolio Value</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "clamp(16px, 4vw, 22px)", fontWeight: 500, color: "#e2e8f0" }}>${total.toLocaleString("en-US")}</div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 820, margin: "0 auto", padding: "24px 16px 0" }}>

          {/* Holdings */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 8 }}>
              <h2 style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.04em", textTransform: "uppercase" }}>Your Holdings</h2>
              <button className="btn-ghost" onClick={() => setShowAdd(!showAdd)}>{showAdd ? "Cancel" : "+ Add Holding"}</button>
            </div>
            {showAdd && (
              <div style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 12, padding: 16, marginBottom: 14 }}>
                <div className="add-form-row1">
                  <input placeholder="Ticker (e.g. NVDA)" value={form.ticker} onChange={e => setForm(f => ({ ...f, ticker: e.target.value }))} />
                  <input placeholder="Name (optional)" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  <input placeholder="Value ($)" type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
                </div>
                <div className="add-form-row2">
                  <select value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}>{SECTORS.map(s => <option key={s}>{s}</option>)}</select>
                  <input placeholder="Div. Yield %" type="number" value={form.dividendYield} onChange={e => setForm(f => ({ ...f, dividendYield: e.target.value }))} />
                  <input placeholder="Exp. Ratio %" type="number" value={form.expenseRatio} onChange={e => setForm(f => ({ ...f, expenseRatio: e.target.value }))} />
                  <button className="btn-primary add-form-btn" onClick={handleAdd}>Add</button>
                </div>
              </div>
            )}
            <div className="holdings-scroll">
              <div className="holdings-table" style={{ background: "#0b1120", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 100px 110px 75px 75px 36px", padding: "10px 14px", borderBottom: "1px solid #1e293b", fontSize: 11, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  <span>Ticker</span><span>Name</span><span>Value</span><span>Sector</span><span>Div %</span><span>Exp %</span><span></span>
                </div>
                {holdings.length === 0 && <div style={{ padding: "28px", textAlign: "center", color: "#334155", fontSize: 14 }}>No holdings yet. Add one above.</div>}
                {holdings.map((h, i) => (
                  <div key={h.id} className="holding-row" style={{ display: "grid", gridTemplateColumns: "70px 1fr 100px 110px 75px 75px 36px", padding: "12px 14px", borderBottom: i < holdings.length - 1 ? "1px solid #0f172a" : "none", alignItems: "center", transition: "background 0.15s" }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#38bdf8", fontWeight: 500 }}>{h.ticker}</span>
                    <span style={{ fontSize: 13, color: "#cbd5e1" }}>{h.name}</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#e2e8f0" }}>${h.value.toLocaleString()}</span>
                    <span style={{ fontSize: 11, color: "#64748b" }}>{h.sector}</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: h.dividendYield > 0 ? "#4ade80" : "#334155" }}>{h.dividendYield > 0 ? h.dividendYield.toFixed(1) + "%" : "—"}</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: h.expenseRatio > 0.5 ? "#f87171" : "#64748b" }}>{h.expenseRatio > 0 ? h.expenseRatio.toFixed(2) + "%" : "—"}</span>
                    <button className="btn-danger" onClick={() => handleRemove(h.id)}>×</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {stage === "input" && (
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <button className="btn-primary" style={{ padding: "14px 40px", fontSize: 15, borderRadius: 10, width: "100%", maxWidth: 340 }} onClick={handleAnalyze} disabled={holdings.length === 0}>
                Analyze My Portfolio →
              </button>
            </div>
          )}

          {stage === "loading" && <LoadingScreen onDone={() => setStage("results")} />}

          {stage === "results" && metrics && (
            <div ref={resultsRef} style={{ opacity: animIn ? 1 : 0, transition: "opacity 0.5s ease" }}>

              {/* Score — always visible */}
              <div style={{ background: "#0a0f1a", border: `1px solid ${metrics.scoreColor}44`, borderRadius: 16, padding: "24px 20px", marginBottom: 20 }}>
                <div className="score-flex" style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                  <ScoreRing score={metrics.divScore} color={metrics.scoreColor} size={110} />
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>Your Diversification Score</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(20px, 4vw, 30px)", fontWeight: 800, color: metrics.scoreColor, marginBottom: 8 }}>{metrics.scoreLabel}</div>
                    <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
                      <strong style={{ color: "#94a3b8" }}>{metrics.numSectors} sectors</strong> · <strong style={{ color: "#94a3b8" }}>{holdings.length} holdings</strong> · Top: <strong style={{ color: metrics.scoreColor }}>{metrics.topSector} ({metrics.topSectorPct.toFixed(0)}%)</strong>
                    </div>
                  </div>
                </div>
                {!unlocked && (
                  <div style={{ marginTop: 16, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, color: "#94a3b8" }}>🔒 Risk flags, sector breakdown & rebalancing plan locked</span>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <a href={GUMROAD_URL} target="_blank" rel="noopener noreferrer" style={{ background: "linear-gradient(135deg, #b8933a, #d4a84b)", color: "#0c0e0f", padding: "9px 18px", borderRadius: 6, fontSize: 13, fontWeight: 800, textDecoration: "none", whiteSpace: "nowrap" }}>Unlock for $7 →</a>
                        <button onClick={() => setShowLicenseModal(true)} style={{ background: "transparent", color: "#64748b", border: "1px solid #1e293b", padding: "9px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>I purchased</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Full Results */}
              <div style={{ position: "relative" }}>
                {!unlocked && (
                  <div style={{ position: "absolute", inset: 0, zIndex: 10, background: "rgba(2,8,23,0.65)", backdropFilter: "blur(8px)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, minHeight: 300 }}>
                    <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, padding: "32px 24px", textAlign: "center", maxWidth: 360, width: "100%" }}>
                      <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
                      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#f1f5f9", marginBottom: 10 }}>Your Full Report Is Ready</h3>
                      <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: 20 }}>Unlock risk flags, sector concentration breakdown, dividend & fee analysis, and a personalized step-by-step rebalancing plan.</p>
                      <a href={GUMROAD_URL} target="_blank" rel="noopener noreferrer" style={{ display: "block", background: "linear-gradient(135deg, #b8933a, #d4a84b)", color: "#0c0e0f", padding: "14px", borderRadius: 8, fontSize: 15, fontWeight: 800, textDecoration: "none", marginBottom: 10 }}>Unlock Full Access — $7 →</a>
                      <button onClick={() => setShowLicenseModal(true)} style={{ background: "transparent", color: "#475569", border: "1px solid #1e293b", padding: "10px", borderRadius: 8, fontSize: 13, cursor: "pointer", width: "100%", fontFamily: "'DM Sans', sans-serif" }}>I already purchased — enter key</button>
                      <p style={{ fontSize: 11, color: "#334155", marginTop: 12 }}>One-time payment · No subscription · Instant access</p>
                    </div>
                  </div>
                )}

                <div style={{ filter: unlocked ? "none" : "blur(5px)", pointerEvents: unlocked ? "auto" : "none", userSelect: unlocked ? "auto" : "none" }}>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Risk Flags</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {metrics.flags.map((f, i) => (
                        <div key={i} className={f.type === "warning" ? "flag-warn" : "flag-ok"}>
                          <span style={{ flexShrink: 0 }}>{f.type === "warning" ? "⚠" : "✓"}</span>{f.msg}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="metrics-grid">
                    <div className="metric-card">
                      <div style={{ fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Avg Dividend Yield</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 26, fontWeight: 500, color: metrics.wDividend > 0.3 ? "#4ade80" : "#94a3b8" }}>{metrics.wDividend.toFixed(2)}<span style={{ fontSize: 13 }}>%</span></div>
                      <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>Weighted avg</div>
                    </div>
                    <div className="metric-card">
                      <div style={{ fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Avg Expense Ratio</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 26, fontWeight: 500, color: metrics.wExpense > 0.5 ? "#f87171" : "#4ade80" }}>{metrics.wExpense.toFixed(2)}<span style={{ fontSize: 13 }}>%</span></div>
                      <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>{metrics.wExpense > 0.5 ? "Review fees" : "Cost efficient"}</div>
                    </div>
                    <div className="metric-card">
                      <div style={{ fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Sectors Covered</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 26, fontWeight: 500, color: metrics.numSectors >= 5 ? "#4ade80" : metrics.numSectors >= 3 ? "#fbbf24" : "#f87171" }}>{metrics.numSectors}<span style={{ fontSize: 13 }}>/10</span></div>
                      <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>{metrics.numSectors >= 6 ? "Good spread" : "Room to grow"}</div>
                    </div>
                  </div>

                  <div className="metric-card" style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Sector Concentration</div>
                    {metrics.sectorPcts.map(sp => <SectorBar key={sp.sector} sector={sp.sector} pct={sp.pct} />)}
                  </div>

                  {metrics.rebalance.length > 0 && (
                    <div className="metric-card" style={{ marginBottom: 20, border: "1px solid #1e3a5f", background: "#080f1a" }}>
                      <div style={{ fontSize: 12, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>📋 Your Rebalancing Plan</div>
                      <div style={{ fontSize: 12, color: "#475569", marginBottom: 14 }}>Personalized action steps based on your portfolio</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {metrics.rebalance.map((r, i) => (
                          <div key={i} className={r.type === "reduce" ? "rebalance-reduce" : "rebalance-add"}>
                            <span style={{ flexShrink: 0, fontWeight: 700, fontSize: 15 }}>{r.type === "reduce" ? "↓" : "↑"}</span>
                            <span>{r.msg}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ textAlign: "center", fontSize: 11, color: "#1e293b", marginBottom: 20 }}>For informational purposes only. Not financial advice.</div>
                  <div style={{ textAlign: "center" }}>
                    <button className="btn-ghost" onClick={() => setStage("input")} style={{ fontSize: 12 }}>← Analyze Another Portfolio</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}