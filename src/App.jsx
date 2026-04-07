import { useState, useEffect } from "react";

const SECTORS = ["Technology", "Healthcare", "Financials", "Consumer", "Energy", "Utilities", "Materials", "Industrials", "Real Estate", "Communication"];

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
  const numSectors = sectorPcts.length;
  const sectorScore = Math.min(numSectors / 7, 1) * 40;
  const concentrationScore = Math.max(0, (1 - (topSectorPct - 20) / 60)) * 40;
  const holdingsScore = Math.min(holdings.length / 10, 1) * 20;
  const divScore = Math.round(sectorScore + concentrationScore + holdingsScore);
  const wDividend = holdings.reduce((s, h) => s + (h.dividendYield * h.value), 0) / total;
  const wExpense = holdings.reduce((s, h) => s + (h.expenseRatio * h.value), 0) / total;
  const flags = [];
  if (topSectorPct > 50) flags.push({ type: "warning", msg: `Heavy concentration in ${sectorPcts[0].sector} (${topSectorPct.toFixed(0)}%)` });
  if (holdings.length < 5) flags.push({ type: "warning", msg: "Fewer than 5 holdings — consider diversifying" });
  if (wExpense > 0.5) flags.push({ type: "warning", msg: `High avg expense ratio (${wExpense.toFixed(2)}%) — eating into returns` });
  if (numSectors < 3) flags.push({ type: "warning", msg: "Only " + numSectors + " sector(s) represented" });
  if (wDividend > 0.5) flags.push({ type: "success", msg: `Solid dividend yield of ${wDividend.toFixed(2)}%` });
  if (divScore >= 70) flags.push({ type: "success", msg: "Well-diversified portfolio" });
  return { total, sectorPcts, divScore, wDividend, wExpense, numSectors, flags };
}

function ScoreRing({ score, locked }) {
  const r = 54, circ = 2 * Math.PI * r, dash = (score / 100) * circ;
  const color = locked ? "#334155" : score >= 70 ? "#4ade80" : score >= 45 ? "#fbbf24" : "#f87171";
  const label = locked ? "Locked" : score >= 70 ? "Strong" : score >= 45 ? "Fair" : "At Risk";
  return (
    <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
      <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={locked ? `${circ * 0.4} ${circ}` : `${dash} ${circ}`}
          strokeLinecap="round" style={{ transition: "stroke-dasharray 1s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {locked ? <span style={{ fontSize: 28 }}>🔒</span> : <>
          <span style={{ fontSize: 24, fontWeight: 800, color, fontFamily: "'DM Mono', monospace" }}>{score}</span>
          <span style={{ fontSize: 10, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
        </>}
      </div>
    </div>
  );
}

function SectorBar({ sector, pct, locked }) {
  const color = locked ? "#1e293b" : pct > 50 ? "#f87171" : pct > 30 ? "#fbbf24" : "#38bdf8";
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: locked ? "#1e293b" : "#cbd5e1", fontFamily: "'DM Sans', sans-serif", filter: locked ? "blur(4px)" : "none" }}>{sector}</span>
        <span style={{ fontSize: 12, color, fontFamily: "'DM Mono', monospace", fontWeight: 600, filter: locked ? "blur(4px)" : "none" }}>{pct.toFixed(1)}%</span>
      </div>
      <div style={{ height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: locked ? "40%" : `${pct}%`, background: color, borderRadius: 3, transition: "width 0.8s ease", filter: locked ? "blur(3px)" : "none" }} />
      </div>
    </div>
  );
}

export default function App() {
  const [holdings, setHoldings] = useState(initialHoldings);
  const [form, setForm] = useState({ ticker: "", name: "", value: "", sector: "Technology", dividendYield: "", expenseRatio: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [animIn, setAnimIn] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (analyzed) { setAnimIn(false); setTimeout(() => setAnimIn(true), 50); }
  }, [analyzed]);

  function handleAdd() {
    if (!form.ticker || !form.value) return;
    setHoldings(prev => [...prev, { id: generateId(), ticker: form.ticker.toUpperCase(), name: form.name || form.ticker.toUpperCase(), value: parseFloat(form.value) || 0, sector: form.sector, dividendYield: parseFloat(form.dividendYield) || 0, expenseRatio: parseFloat(form.expenseRatio) || 0 }]);
    setForm({ ticker: "", name: "", value: "", sector: "Technology", dividendYield: "", expenseRatio: "" });
    setShowAdd(false); setAnalyzed(false);
  }

  function handleRemove(id) { setHoldings(prev => prev.filter(h => h.id !== id)); setAnalyzed(false); }
  function handleAnalyze() { setMetrics(calcMetrics(holdings)); setAnalyzed(true); }

  const total = holdings.reduce((s, h) => s + h.value, 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow-x: hidden; }
        .holding-row:hover { background: #0f172a !important; }
        .btn-primary { background: #38bdf8; color: #020817; border: none; padding: 11px 22px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s; letter-spacing: 0.02em; }
        .btn-primary:hover { background: #7dd3fc; transform: translateY(-1px); }
        .btn-ghost { background: transparent; color: #64748b; border: 1px solid #1e293b; padding: 9px 18px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: 13px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .btn-ghost:hover { border-color: #334155; color: #94a3b8; }
        .btn-danger { background: transparent; color: #f87171; border: none; cursor: pointer; font-size: 18px; padding: 2px 8px; border-radius: 4px; transition: background 0.15s; line-height: 1; min-width: 32px; }
        .btn-danger:hover { background: #1e1020; }
        input, select { background: #0f172a; border: 1px solid #1e293b; color: #e2e8f0; border-radius: 7px; padding: 9px 12px; font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; width: 100%; transition: border 0.2s; }
        input:focus, select:focus { border-color: #38bdf8; }
        input::placeholder { color: #334155; }
        .metric-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 16px 18px; }
        .flag-warn { background: #1c1008; border: 1px solid #78350f; color: #fbbf24; border-radius: 8px; padding: 10px 14px; font-size: 13px; display: flex; align-items: flex-start; gap: 8px; }
        .flag-ok { background: #0a1f14; border: 1px solid #14532d; color: #4ade80; border-radius: 8px; padding: 10px 14px; font-size: 13px; display: flex; align-items: flex-start; gap: 8px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }

        /* Holdings table scroll on mobile */
        .holdings-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 12px; }
        .holdings-table { min-width: 520px; }

        /* Add form grid responsive */
        .add-form-row1 { display: grid; grid-template-columns: 1fr 2fr 1.5fr; gap: 10px; margin-bottom: 10px; }
        .add-form-row2 { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 10px; align-items: end; }

        /* Results grid responsive */
        .metrics-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        .score-row { display: grid; grid-template-columns: auto 1fr; gap: 24px; margin-bottom: 24px; }

        @media (max-width: 600px) {
          .add-form-row1 { grid-template-columns: 1fr 1fr; }
          .add-form-row2 { grid-template-columns: 1fr 1fr; }
          .add-form-row2 .add-btn { grid-column: 1 / -1; }
          .metrics-grid { grid-template-columns: 1fr; }
          .score-row { grid-template-columns: 1fr; }
          .score-row-inner { display: flex; align-items: center; gap: 16px; }
          .btn-primary { font-size: 13px; padding: 10px 18px; }
          .btn-ghost { font-size: 12px; padding: 8px 14px; }
        }
      `}</style>

      {/* Top Banner */}
      <div style={{ background: "linear-gradient(135deg, #b8933a, #d4a84b)", padding: "11px 16px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#0c0e0f" }}>📊 You're using the free preview of PortfolioIQ</span>
        <a href="https://merritt84.gumroad.com/l/portfolio-health-checker" target="_blank" rel="noopener noreferrer"
          style={{ background: "#0c0e0f", color: "#d4a84b", padding: "7px 16px", borderRadius: "6px", fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
          Unlock Full Access — $7 →
        </a>
      </div>

      <div style={{ minHeight: "100vh", background: "#020817", fontFamily: "'DM Sans', sans-serif", color: "#e2e8f0", paddingBottom: 60 }}>

        {/* Header */}
        <div style={{ borderBottom: "1px solid #0f172a", padding: "20px 0 16px", background: "#020817" }}>
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
              <h2 style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.04em", textTransform: "uppercase" }}>Holdings</h2>
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
                  <select value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}>
                    {SECTORS.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <input placeholder="Div. Yield %" type="number" value={form.dividendYield} onChange={e => setForm(f => ({ ...f, dividendYield: e.target.value }))} />
                  <input placeholder="Exp. Ratio %" type="number" value={form.expenseRatio} onChange={e => setForm(f => ({ ...f, expenseRatio: e.target.value }))} />
                  <button className="btn-primary add-btn" onClick={handleAdd}>Add</button>
                </div>
              </div>
            )}

            <div className="holdings-scroll">
              <div className="holdings-table" style={{ background: "#0b1120", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 100px 100px 80px 80px 36px", padding: "10px 14px", borderBottom: "1px solid #1e293b", fontSize: 11, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  <span>Ticker</span><span>Name</span><span>Value</span><span>Sector</span><span>Div %</span><span>Exp %</span><span></span>
                </div>
                {holdings.length === 0 && <div style={{ padding: "28px", textAlign: "center", color: "#334155", fontSize: 14 }}>No holdings yet. Add one above.</div>}
                {holdings.map((h, i) => (
                  <div key={h.id} className="holding-row" style={{ display: "grid", gridTemplateColumns: "70px 1fr 100px 100px 80px 80px 36px", padding: "12px 14px", borderBottom: i < holdings.length - 1 ? "1px solid #0f172a" : "none", alignItems: "center", transition: "background 0.15s" }}>
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

          {/* Analyze Button */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <button className="btn-primary" style={{ padding: "14px 40px", fontSize: 15, borderRadius: 10, width: "100%", maxWidth: 320 }} onClick={handleAnalyze} disabled={holdings.length === 0}>
              Analyze Portfolio →
            </button>
          </div>

          {/* Results */}
          {analyzed && metrics && (
            <div style={{ opacity: animIn ? 1 : 0, transition: "opacity 0.4s ease", position: "relative" }}>

              {/* PAYWALL OVERLAY */}
              {!unlocked && (
                <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(2,8,23,0.7)", backdropFilter: "blur(6px)", borderRadius: 16, padding: 24 }}>
                  <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, padding: "36px 28px", textAlign: "center", maxWidth: 340, width: "100%" }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#f1f5f9", marginBottom: 12 }}>Your Results Are Ready</h3>
                    <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 24 }}>Unlock your full portfolio analysis — diversification score, risk flags, sector breakdown, dividend yield and more.</p>
                    <a href="https://merritt84.gumroad.com/l/portfolio-health-checker" target="_blank" rel="noopener noreferrer"
                      style={{ display: "block", background: "linear-gradient(135deg, #b8933a, #d4a84b)", color: "#0c0e0f", padding: "14px 24px", borderRadius: 8, fontSize: 15, fontWeight: 800, textDecoration: "none", marginBottom: 12, letterSpacing: "0.02em" }}>
                      Unlock Full Access — $7 →
                    </a>
                    <p style={{ fontSize: 11, color: "#334155" }}>One-time payment · Instant access · No subscription</p>
                  </div>
                </div>
              )}

              {/* Blurred results behind paywall */}
              <div style={{ filter: unlocked ? "none" : "blur(4px)", pointerEvents: unlocked ? "auto" : "none", userSelect: unlocked ? "auto" : "none" }}>

                <div className="score-row">
                  <div className="metric-card" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="score-row-inner" style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <ScoreRing score={metrics.divScore} locked={!unlocked} />
                      <div>
                        <div style={{ fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>Diversification Score</div>
                        <div style={{ fontSize: 13, color: "#64748b" }}>Based on sector spread,<br/>concentration & holdings</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, justifyContent: "center" }}>
                    {metrics.flags.map((f, i) => (
                      <div key={i} className={f.type === "warning" ? "flag-warn" : "flag-ok"}>
                        <span style={{ flexShrink: 0 }}>{f.type === "warning" ? "⚠" : "✓"}</span> {f.msg}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="metrics-grid">
                  <div className="metric-card">
                    <div style={{ fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Avg Dividend Yield</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, fontWeight: 500, color: metrics.wDividend > 0.3 ? "#4ade80" : "#94a3b8" }}>{metrics.wDividend.toFixed(2)}<span style={{ fontSize: 14 }}>%</span></div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>Weighted across holdings</div>
                  </div>
                  <div className="metric-card">
                    <div style={{ fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Avg Expense Ratio</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, fontWeight: 500, color: metrics.wExpense > 0.5 ? "#f87171" : "#4ade80" }}>{metrics.wExpense.toFixed(2)}<span style={{ fontSize: 14 }}>%</span></div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{metrics.wExpense > 0.5 ? "High — review ETF fees" : "Low — cost efficient"}</div>
                  </div>
                  <div className="metric-card">
                    <div style={{ fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Sectors Covered</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, fontWeight: 500, color: metrics.numSectors >= 5 ? "#4ade80" : metrics.numSectors >= 3 ? "#fbbf24" : "#f87171" }}>{metrics.numSectors}<span style={{ fontSize: 14 }}> / 10</span></div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{metrics.numSectors >= 6 ? "Good spread" : "Room to diversify"}</div>
                  </div>
                </div>

                <div className="metric-card">
                  <div style={{ fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Sector Concentration</div>
                  {metrics.sectorPcts.map(sp => <SectorBar key={sp.sector} sector={sp.sector} pct={sp.pct} locked={!unlocked} />)}
                </div>

                <div style={{ marginTop: 16, textAlign: "center", fontSize: 11, color: "#334155" }}>
                  Results are for informational purposes only. Not financial advice.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}