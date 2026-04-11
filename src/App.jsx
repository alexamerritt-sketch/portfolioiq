import { useState, useEffect, useRef } from "react";

const SECTORS = ["Technology", "Healthcare", "Financials", "Consumer", "Energy", "Utilities", "Materials", "Industrials", "Real Estate", "Communication", "ETF - Broad Market", "ETF - Technology", "ETF - Financials", "ETF - Healthcare", "ETF - Energy", "ETF - Bonds", "ETF - International", "ETF - Commodities", "ETF - Real Estate", "ETF - Consumer", "ETF - Communication", "ETF - Utilities", "ETF - Materials", "ETF - Industrials", "Crypto"];
const ASSET_TYPES = ["Stock", "ETF", "Crypto"];
const WHOP_URL = "https://whop.com/portfolioiq/portfolioiq-b9/";
const WHOP_CLIENT_ID = "app_cITuJl8hI8mi0c";
const APP_URL = "https://portfolioiq-six.vercel.app";
const PRICE = "$19.99";

const BACKUP_KEYS = [
  "C8C838B5-3E8A46A5-9DB3B785-A93940AB",
  "9A77C2F6-54A748D4-AACEF75D-6716BF1E",
  "D82AA148-E6F24034-A7E53844-25F67124",
];

const SP500 = {
  "Technology": 29, "Healthcare": 13, "Financials": 13, "Consumer": 10,
  "Industrials": 9, "Communication": 8, "Energy": 4, "Real Estate": 3,
  "Materials": 3, "Utilities": 2
};

const initialHoldings = [
  { id: 1, ticker: "AAPL", name: "Apple Inc.", value: 12400, sector: "Technology", assetType: "Stock", dividendYield: 0.5, expenseRatio: 0 },
  { id: 2, ticker: "MSFT", name: "Microsoft Corp.", value: 9800, sector: "Technology", assetType: "Stock", dividendYield: 0.7, expenseRatio: 0 },
  { id: 3, ticker: "JNJ", name: "Johnson & Johnson", value: 5200, sector: "Healthcare", assetType: "Stock", dividendYield: 3.1, expenseRatio: 0 },
  { id: 4, ticker: "SPY", name: "SPDR S&P 500 ETF", value: 8000, sector: "ETF - Broad Market", assetType: "ETF", dividendYield: 1.3, expenseRatio: 0.09 },
  { id: 5, ticker: "BTC", name: "Bitcoin", value: 6500, sector: "Crypto", assetType: "Crypto", dividendYield: 0, expenseRatio: 0 },
];

function generateId() { return Date.now() + Math.random(); }

// Build the Whop OAuth URL
function getWhopAuthURL() {
  const params = new URLSearchParams({
    client_id: WHOP_CLIENT_ID,
    redirect_uri: `${APP_URL}/api/whop-auth`,
    response_type: "code",
    scope: "user:read memberships:read",
  });
  return `https://whop.com/oauth?${params.toString()}`;
}

async function verifyKey(licenseKey) {
  const clean = licenseKey.trim().toUpperCase();
  if (BACKUP_KEYS.includes(clean)) return { valid: true };
  try {
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey: licenseKey.trim() })
    });
    const data = await res.json();
    return { valid: data.valid === true };
  } catch { return { valid: false }; }
}

async function verifyAccessToken(token) {
  try {
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: token })
    });
    const data = await res.json();
    return data.valid === true;
  } catch { return false; }
}

async function lookupTicker(ticker) {
  try {
    const res = await fetch(`/api/lookup?ticker=${ticker.trim().toUpperCase()}`);
    return await res.json();
  } catch { return { found: false }; }
}

function calcMetrics(holdings) {
  if (!holdings.length) return null;
  const total = holdings.reduce((s, h) => s + h.value, 0);
  if (total === 0) return null;
  const detailedMap = {};
  holdings.forEach(h => { detailedMap[h.sector] = (detailedMap[h.sector] || 0) + h.value; });
  const sectorPcts = Object.entries(detailedMap).map(([s, v]) => ({ sector: s, pct: (v / total) * 100 })).sort((a, b) => b.pct - a.pct);
  const topSectorPct = sectorPcts[0]?.pct || 0;
  const topSector = sectorPcts[0]?.sector || "";
  const numSectors = sectorPcts.length;
  const cryptoValue = holdings.filter(h => h.assetType === "Crypto").reduce((s, h) => s + h.value, 0);
  const etfValue = holdings.filter(h => h.assetType === "ETF").reduce((s, h) => s + h.value, 0);
  const stockValue = holdings.filter(h => h.assetType === "Stock").reduce((s, h) => s + h.value, 0);
  const cryptoPct = (cryptoValue / total) * 100;
  const etfPct = (etfValue / total) * 100;
  const stockPct = (stockValue / total) * 100;
  const divScore = Math.round(Math.min(numSectors / 7, 1) * 35 + Math.max(0, (1 - (topSectorPct - 20) / 60)) * 35 + Math.min(holdings.length / 10, 1) * 20 + (cryptoPct < 30 ? 10 : cryptoPct < 50 ? 5 : 0));
  const wDividend = holdings.reduce((s, h) => s + (h.dividendYield * h.value), 0) / total;
  const wExpense = holdings.reduce((s, h) => s + (h.expenseRatio * h.value), 0) / total;
  const annualDividend = (wDividend / 100) * total;
  const monthlyDividend = annualDividend / 12;
  const annualFee = (wExpense / 100) * total;
  const riskW = { "Technology": 9, "Crypto": 10, "Energy": 8, "Communication": 7, "Consumer": 6, "Materials": 6, "Financials": 5, "Industrials": 5, "Healthcare": 4, "Real Estate": 4, "Utilities": 2, "ETF": 4 };
  const riskScore = sectorPcts.reduce((s, sp) => { const b = sp.sector.startsWith("ETF") ? "ETF" : sp.sector; return s + ((riskW[b] || 5) * (sp.pct / 100)); }, 0);
  const riskLabel = riskScore >= 7.5 ? "Very Aggressive" : riskScore >= 6 ? "Aggressive" : riskScore >= 4.5 ? "Moderate" : "Conservative";
  const riskColor = riskScore >= 7.5 ? "#dc2626" : riskScore >= 6 ? "#d97706" : riskScore >= 4.5 ? "#1d4ed8" : "#15803d";
  let gs = Math.min(divScore / 100, 1) * 40 + Math.max(0, 1 - wExpense) * 20 + Math.min(wDividend / 3, 1) * 15 + Math.min(holdings.length / 12, 1) * 15 + Math.min(numSectors / 8, 1) * 10;
  const gradePct = gs * 100;
  const grade = gradePct >= 85 ? "A" : gradePct >= 75 ? "B+" : gradePct >= 65 ? "B" : gradePct >= 55 ? "C+" : gradePct >= 45 ? "C" : gradePct >= 35 ? "D" : "F";
  const gradeColor = gradePct >= 75 ? "#15803d" : gradePct >= 55 ? "#d97706" : "#dc2626";
  const flags = [];
  if (topSectorPct > 50) flags.push({ type: "warning", msg: `Heavy concentration in ${topSector} (${topSectorPct.toFixed(0)}%)` });
  if (holdings.length < 5) flags.push({ type: "warning", msg: "Fewer than 5 holdings — consider diversifying" });
  if (wExpense > 0.5) flags.push({ type: "warning", msg: `High fees costing $${annualFee.toFixed(0)}/year` });
  if (numSectors < 3) flags.push({ type: "warning", msg: `Only ${numSectors} sector(s) represented` });
  if (cryptoPct > 40) flags.push({ type: "warning", msg: `Crypto is ${cryptoPct.toFixed(0)}% of portfolio — high volatility` });
  if (wDividend > 0.5) flags.push({ type: "success", msg: `Earning $${annualDividend.toFixed(0)}/year in dividends ($${monthlyDividend.toFixed(0)}/mo)` });
  if (divScore >= 70) flags.push({ type: "success", msg: "Well-diversified portfolio" });
  if (etfPct > 0) flags.push({ type: "success", msg: `${etfPct.toFixed(0)}% in ETFs — good passive diversification` });
  const rebalance = [];
  const missing = ["Technology","Healthcare","Financials","Consumer","Energy"].filter(s => !detailedMap[s] && !Object.keys(detailedMap).some(k => k.startsWith("ETF")));
  if (topSectorPct > 40 && !sectorPcts[0].sector.startsWith("ETF")) rebalance.push({ type: "reduce", msg: `Trim ${topSector} by ~${Math.round(topSectorPct - 30)}% toward a healthier 30% ceiling` });
  if (missing.length > 2 && etfPct < 20) rebalance.push({ type: "add", msg: `Consider adding ${missing.slice(0, 2).join(" and ")} exposure` });
  if (holdings.length < 8) rebalance.push({ type: "add", msg: `Add ${8 - holdings.length} more positions to strengthen diversification` });
  if (annualFee > 100) rebalance.push({ type: "reduce", msg: `Switch to lower-cost ETFs — save ~$${annualFee.toFixed(0)}/year` });
  if (wDividend < 0.5 && cryptoPct < 50) rebalance.push({ type: "add", msg: `Add dividend stocks or REITs to build passive income` });
  if (cryptoPct > 30) rebalance.push({ type: "reduce", msg: `Consider reducing crypto to under 20% of portfolio` });
  const scoreLabel = divScore >= 80 ? "Elite Portfolio" : divScore >= 65 ? "Well Optimized" : divScore >= 45 ? "Building Strength" : "Needs Work";
  const scoreColor = divScore >= 80 ? "#15803d" : divScore >= 65 ? "#166534" : divScore >= 45 ? "#d97706" : "#dc2626";
  return { total, sectorPcts, divScore, scoreLabel, scoreColor, wDividend, wExpense, annualDividend, monthlyDividend, annualFee, riskScore, riskLabel, riskColor, riskPct: Math.min((riskScore / 10) * 100, 95), grade, gradeColor, numSectors, flags, rebalance, topSector, topSectorPct, cryptoPct, etfPct, stockPct };
}

function ScoreRing({ score, color, size = 110 }) {
  const r = (size / 2) - 11; const circ = 2 * Math.PI * r; const dash = (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#d4c9a8" strokeWidth="10" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="10" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 700, color, fontFamily: "'Cormorant Garamond', serif", lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 10, color: "#8a7d5a", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>/100</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color, accent }) {
  return (
    <div style={{ background: accent || "#faf7f0", border: "1px solid #d4c9a8", borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ fontSize: 10, color: "#8a7d5a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: color || "#1a2e1a", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#8a7d5a", marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

function SectorBar({ sector, pct }) {
  const color = sector === "Crypto" ? "#d97706" : sector.startsWith("ETF") ? "#1d4ed8" : pct > 50 ? "#dc2626" : pct > 30 ? "#d97706" : "#166534";
  const sp500pct = SP500[sector];
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: "#3d3520" }}>{sector}</span>
          {sector === "Crypto" && <span style={{ fontSize: 9, background: "#fef3c7", color: "#92400e", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>CRYPTO</span>}
          {sector.startsWith("ETF") && <span style={{ fontSize: 9, background: "#dbeafe", color: "#1e40af", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>ETF</span>}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {sp500pct && <span style={{ fontSize: 10, color: "#8a7d5a", fontFamily: "'DM Mono', monospace" }}>S&P: {sp500pct}%</span>}
          <span style={{ fontSize: 12, color, fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>{pct.toFixed(1)}%</span>
        </div>
      </div>
      <div style={{ height: 7, background: "#e8e0cc", borderRadius: 4, overflow: "hidden", position: "relative" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 1s ease", opacity: 0.85 }} />
        {sp500pct && <div style={{ position: "absolute", top: 0, bottom: 0, left: `${sp500pct}%`, width: 2, background: "#8a7d5a" }} />}
      </div>
    </div>
  );
}

function LoadingScreen({ onDone }) {
  const [step, setStep] = useState(0);
  const steps = ["Scanning holdings...", "Analyzing sectors...", "Calculating risk & grade...", "Building your report..."];
  useEffect(() => {
    const timers = steps.map((_, i) => setTimeout(() => setStep(i + 1), i * 650));
    const done = setTimeout(onDone, steps.length * 650 + 300);
    return () => { timers.forEach(clearTimeout); clearTimeout(done); };
  }, []);
  return (
    <div style={{ background: "#faf7f0", borderRadius: 16, border: "1px solid #d4c9a8", padding: "40px 28px", textAlign: "center", marginBottom: 24 }}>
      <div style={{ marginBottom: 28 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14, opacity: step > i ? 1 : 0.3, transition: "opacity 0.4s", justifyContent: "center" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: step > i ? "#166634" : "#d4c9a8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#f5f0e4", fontWeight: 700, transition: "background 0.4s", flexShrink: 0 }}>{step > i ? "✓" : i + 1}</div>
            <span style={{ fontSize: 14, color: step > i ? "#1a2e1a" : "#8a7d5a" }}>{s}</span>
          </div>
        ))}
      </div>
      <div style={{ width: "100%", height: 4, background: "#d4c9a8", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(step / steps.length) * 100}%`, background: "linear-gradient(90deg, #166534, #15803d)", borderRadius: 2, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

function LicenseModal({ onUnlock, onClose }) {
  const [key, setKey] = useState(""); const [error, setError] = useState(""); const [checking, setChecking] = useState(false);
  async function handleCheck() {
    if (!key.trim()) return;
    setChecking(true); setError("");
    const result = await verifyKey(key.trim());
    if (result.valid) { localStorage.setItem("portfolioiq_verified", "true"); onUnlock(); }
    else setError("Invalid license key. Please check your Whop purchase email.");
    setChecking(false);
  }
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(26,46,26,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#faf7f0", border: "1px solid #d4c9a8", borderRadius: 16, padding: "36px 28px", maxWidth: 420, width: "100%", boxShadow: "0 24px 48px rgba(0,0,0,0.2)" }}>
        <button onClick={onClose} style={{ float: "right", background: "none", border: "none", color: "#8a7d5a", fontSize: 24, cursor: "pointer", lineHeight: 1 }}>×</button>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔑</div>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: "#1a2e1a", marginBottom: 8 }}>Enter Your License Key</h3>
        <p style={{ fontSize: 13, color: "#6b5f3e", lineHeight: 1.7, marginBottom: 20 }}>Check your Whop purchase email for your unique license key.</p>
        <input placeholder="Paste your license key here" value={key} onChange={e => setKey(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCheck()}
          style={{ marginBottom: 10, fontFamily: "'DM Mono', monospace", fontSize: 13, background: "#f0ebe0", border: "1px solid #c4b896", color: "#1a2e1a", borderRadius: 8, padding: "11px 14px", width: "100%", outline: "none" }} />
        {error && <div style={{ color: "#dc2626", fontSize: 12, marginBottom: 10 }}>{error}</div>}
        <button onClick={handleCheck} disabled={!key || checking}
          style={{ width: "100%", background: checking ? "#d4c9a8" : "#166534", color: checking ? "#8a7d5a" : "#f5f0e4", border: "none", padding: "14px", borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 15, cursor: key && !checking ? "pointer" : "not-allowed", transition: "all 0.2s", marginBottom: 14 }}>
          {checking ? "Verifying..." : "Unlock Full Access →"}
        </button>
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: 12, color: "#8a7d5a" }}>Don't have a key? </span>
          <a href={WHOP_URL} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#166534", textDecoration: "none", fontWeight: 700 }}>Purchase for {PRICE} →</a>
        </div>
      </div>
    </div>
  );
}

function AddHoldingForm({ onAdd, onCancel }) {
  const [ticker, setTicker] = useState(""); const [name, setName] = useState(""); const [value, setValue] = useState("");
  const [sector, setSector] = useState("Technology"); const [assetType, setAssetType] = useState("Stock");
  const [dividendYield, setDividendYield] = useState(""); const [expenseRatio, setExpenseRatio] = useState("");
  const [looking, setLooking] = useState(false); const [lookupStatus, setLookupStatus] = useState("");

  async function handleTickerBlur() {
    if (!ticker.trim()) return;
    setLooking(true); setLookupStatus("Looking up ticker...");
    const data = await lookupTicker(ticker.trim());
    if (data.found) {
      setName(data.name || ""); setSector(data.sector || "Technology"); setAssetType(data.assetType || "Stock");
      setDividendYield(data.dividendYield > 0 ? data.dividendYield.toString() : "");
      setExpenseRatio(data.expenseRatio > 0 ? data.expenseRatio.toString() : "");
      setLookupStatus("✓ Auto-filled from market data");
    } else { setLookupStatus("Not found — please fill in manually"); }
    setLooking(false);
  }

  function handleAdd() {
    if (!ticker || !value) return;
    onAdd({ id: generateId(), ticker: ticker.trim().toUpperCase(), name: name || ticker.trim().toUpperCase(), value: parseFloat(value) || 0, sector, assetType, dividendYield: parseFloat(dividendYield) || 0, expenseRatio: parseFloat(expenseRatio) || 0 });
  }

  return (
    <div style={{ background: "#f0ebe0", border: "1px solid #c4b896", borderRadius: 14, padding: 20, marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6b5f3e", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Add Holding</div>
      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 140px", gap: 10, marginBottom: 10 }} className="add-g1">
        <div>
          <div style={{ fontSize: 11, color: "#8a7d5a", marginBottom: 4 }}>Ticker *</div>
          <input placeholder="AAPL" value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} onBlur={handleTickerBlur} style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600 }} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#8a7d5a", marginBottom: 4 }}>Name <span style={{ color: "#b4a882" }}>(auto-filled)</span></div>
          <input placeholder="Auto-fills on tab" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#8a7d5a", marginBottom: 4 }}>Value ($) *</div>
          <input placeholder="10000" type="number" value={value} onChange={e => setValue(e.target.value)} />
        </div>
      </div>
      {lookupStatus && (
        <div style={{ fontSize: 12, color: lookupStatus.startsWith("✓") ? "#15803d" : "#d97706", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          {looking && <span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid #d4c9a8", borderTopColor: "#166534", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />}
          {lookupStatus}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px 120px", gap: 10, marginBottom: 14 }} className="add-g2">
        <div>
          <div style={{ fontSize: 11, color: "#8a7d5a", marginBottom: 4 }}>Sector <span style={{ color: "#b4a882" }}>(auto-filled)</span></div>
          <select value={sector} onChange={e => setSector(e.target.value)}>{SECTORS.map(s => <option key={s}>{s}</option>)}</select>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#8a7d5a", marginBottom: 4 }}>Type</div>
          <select value={assetType} onChange={e => setAssetType(e.target.value)}>{ASSET_TYPES.map(t => <option key={t}>{t}</option>)}</select>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#8a7d5a", marginBottom: 4 }}>Div. Yield % <span style={{ color: "#b4a882" }}>(auto)</span></div>
          <input placeholder="0.00" type="number" value={dividendYield} onChange={e => setDividendYield(e.target.value)} disabled={assetType === "Crypto"} style={{ opacity: assetType === "Crypto" ? 0.4 : 1 }} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#8a7d5a", marginBottom: 4 }}>Exp. Ratio % <span style={{ color: "#b4a882" }}>(auto)</span></div>
          <input placeholder="0.00" type="number" value={expenseRatio} onChange={e => setExpenseRatio(e.target.value)} disabled={assetType !== "ETF"} style={{ opacity: assetType !== "ETF" ? 0.4 : 1 }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={handleAdd} disabled={!ticker || !value}
          style={{ background: ticker && value ? "#166534" : "#d4c9a8", color: ticker && value ? "#f5f0e4" : "#8a7d5a", border: "none", padding: "10px 24px", borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13, cursor: ticker && value ? "pointer" : "not-allowed" }}>
          Add to Portfolio
        </button>
        <button onClick={onCancel} style={{ background: "transparent", color: "#8a7d5a", border: "1px solid #c4b896", padding: "10px 16px", borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: "pointer" }}>Cancel</button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  const [holdings, setHoldings] = useState(initialHoldings);
  const [showAdd, setShowAdd] = useState(false);
  const [stage, setStage] = useState("input");
  const [metrics, setMetrics] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [unlockMethod, setUnlockMethod] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [animIn, setAnimIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const resultsRef = useRef(null);

  // ── AUTO UNLOCK LOGIC ──────────────────────────────────────────
  useEffect(() => {
    async function checkAccess() {
      // 1. Check if already unlocked in localStorage
      if (localStorage.getItem("portfolioiq_verified") === "true") {
        setUnlocked(true); setUnlockMethod("returning"); setChecking(false); return;
      }

      // 2. Check URL params from Whop OAuth callback
      const params = new URLSearchParams(window.location.search);
      const whopVerified = params.get("whop_verified");
      const accessToken = params.get("access_token");
      const error = params.get("error");

      if (whopVerified === "true" && accessToken) {
        // Verify the token server-side
        const valid = await verifyAccessToken(accessToken);
        if (valid) {
          localStorage.setItem("portfolioiq_verified", "true");
          localStorage.setItem("portfolioiq_access_token", accessToken);
          setUnlocked(true);
          setUnlockMethod("whop");
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
          setChecking(false); return;
        }
      }

      if (error) {
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      setChecking(false);
    }
    checkAccess();
  }, []);

  useEffect(() => {
    if (stage === "results") {
      setAnimIn(false);
      setTimeout(() => { setAnimIn(true); resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 100);
    }
  }, [stage]);

  function handleAdd(h) { setHoldings(prev => [...prev, h]); setShowAdd(false); setStage("input"); }
  function handleRemove(id) { setHoldings(prev => prev.filter(h => h.id !== id)); setStage("input"); }
  function handleAnalyze() { setMetrics(calcMetrics(holdings)); setStage("loading"); }
  function handleUnlock() { setUnlocked(true); setShowModal(false); localStorage.setItem("portfolioiq_verified", "true"); }
  const total = holdings.reduce((s, h) => s + h.value, 0);

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f0e4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #d4c9a8", borderTopColor: "#166534", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <div style={{ fontSize: 14, color: "#8a7d5a" }}>Loading PortfolioIQ...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow-x: hidden; background: #f5f0e4; }
        .hr { transition: background 0.15s; } .hr:hover { background: #ede8d8 !important; }
        .btn-p { background: #166534; color: #f5f0e4; border: none; padding: 11px 22px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s; }
        .btn-p:hover { background: #15803d; transform: translateY(-1px); }
        .btn-g { background: transparent; color: #6b5f3e; border: 1px solid #c4b896; padding: 9px 16px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: 13px; cursor: pointer; transition: all 0.2s; }
        .btn-g:hover { border-color: #8a7d5a; background: #ede8d8; }
        .btn-d { background: transparent; color: #dc2626; border: none; cursor: pointer; font-size: 16px; padding: 2px 8px; border-radius: 4px; opacity: 0.5; transition: opacity 0.15s; }
        .btn-d:hover { opacity: 1; background: #fee2e2; }
        input, select { background: #f0ebe0; border: 1px solid #c4b896; color: #1a2e1a; border-radius: 7px; padding: 9px 12px; font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; width: 100%; transition: border 0.2s; }
        input:focus, select:focus { border-color: #166534; box-shadow: 0 0 0 3px rgba(22,101,52,0.1); }
        input::placeholder { color: #b4a882; }
        .card { background: #faf7f0; border: 1px solid #d4c9a8; border-radius: 12px; padding: 18px 20px; }
        .fw { background: #fffbeb; border: 1px solid #fcd34d; color: #92400e; border-radius: 8px; padding: 10px 14px; font-size: 13px; display: flex; align-items: flex-start; gap: 8px; line-height: 1.5; }
        .fo { background: #f0fdf4; border: 1px solid #86efac; color: #14532d; border-radius: 8px; padding: 10px 14px; font-size: 13px; display: flex; align-items: flex-start; gap: 8px; line-height: 1.5; }
        .rr { background: #fff1f2; border: 1px solid #fecaca; color: #991b1b; border-radius: 8px; padding: 10px 14px; font-size: 13px; display: flex; gap: 10px; line-height: 1.5; }
        .ra { background: #f0fdf4; border: 1px solid #bbf7d0; color: #14532d; border-radius: 8px; padding: 10px 14px; font-size: 13px; display: flex; gap: 10px; line-height: 1.5; }
        .hs { overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 12px; }
        .ht { min-width: 560px; }
        .g4 { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 12px; margin-bottom: 18px; }
        .g3 { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 12px; margin-bottom: 18px; }
        .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 18px; }
        .sl { font-size: 10px; color: #8a7d5a; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 12px; font-weight: 700; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .g4 { grid-template-columns: 1fr 1fr; } .g3 { grid-template-columns: 1fr 1fr; }
          .g2 { grid-template-columns: 1fr; } .sf { flex-direction: column !important; }
          .add-g1 { grid-template-columns: 1fr 1fr !important; }
          .add-g2 { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 400px) { .g4, .g3 { grid-template-columns: 1fr; } }
      `}</style>

      {showModal && <LicenseModal onUnlock={handleUnlock} onClose={() => setShowModal(false)} />}

      {/* Banner */}
      {!unlocked ? (
        <div style={{ background: "#1a2e1a", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "#d4c9a8" }}>📊 Free preview — unlock full analysis</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            <a href={getWhopAuthURL()} style={{ background: "#15803d", color: "#f5f0e4", padding: "6px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>Buy & Unlock Instantly — {PRICE}</a>
            <button onClick={() => setShowModal(true)} style={{ background: "transparent", color: "#d4c9a8", border: "1px solid #3d5a3d", padding: "6px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>I already purchased</button>
          </div>
        </div>
      ) : (
        <div style={{ background: "#14532d", padding: "10px 16px", textAlign: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#86efac" }}>
            {unlockMethod === "whop" ? "✓ Verified via Whop — Welcome to PortfolioIQ Pro!" : "✓ Full Access Unlocked — Welcome to PortfolioIQ Pro"}
          </span>
        </div>
      )}

      <div style={{ minHeight: "100vh", background: "#f5f0e4", fontFamily: "'DM Sans', sans-serif", color: "#1a2e1a", paddingBottom: 80 }}>

        {/* Header */}
        <div style={{ borderBottom: "1px solid #d4c9a8", padding: "20px 0 16px", background: "#faf7f0" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#166534", textTransform: "uppercase", fontWeight: 700, marginBottom: 3 }}>PortfolioIQ</div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 700, color: "#1a2e1a", lineHeight: 1 }}>Portfolio Health Checker</h1>
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "#8a7d5a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>Total Value</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(18px, 3vw, 26px)", fontWeight: 700 }}>${total.toLocaleString("en-US")}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "#8a7d5a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>Holdings</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(18px, 3vw, 26px)", fontWeight: 700 }}>{holdings.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px 0" }}>

          {/* Holdings table */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ fontSize: 11, fontWeight: 700, color: "#8a7d5a", letterSpacing: "0.12em", textTransform: "uppercase" }}>Holdings</h2>
              <button className="btn-g" onClick={() => setShowAdd(!showAdd)} style={{ fontSize: 12 }}>{showAdd ? "Cancel" : "+ Add Holding"}</button>
            </div>
            {showAdd && <AddHoldingForm onAdd={handleAdd} onCancel={() => setShowAdd(false)} />}
            <div className="hs">
              <div className="ht" style={{ background: "#faf7f0", border: "1px solid #d4c9a8", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 80px 110px 80px 70px 70px 36px", padding: "9px 16px", borderBottom: "1px solid #e8e0cc", fontSize: 10, color: "#8a7d5a", letterSpacing: "0.1em", textTransform: "uppercase", background: "#f5f0e4" }}>
                  <span>Ticker</span><span>Name</span><span>Type</span><span>Value</span><span>Sector</span><span>Div %</span><span>Exp %</span><span></span>
                </div>
                {holdings.length === 0 && <div style={{ padding: "28px", textAlign: "center", color: "#b4a882", fontSize: 14 }}>No holdings yet. Add one above.</div>}
                {holdings.map((h, i) => (
                  <div key={h.id} className="hr" style={{ display: "grid", gridTemplateColumns: "70px 1fr 80px 110px 80px 70px 70px 36px", padding: "12px 16px", borderBottom: i < holdings.length - 1 ? "1px solid #ede8d8" : "none", alignItems: "center" }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#166534", fontWeight: 600 }}>{h.ticker}</span>
                    <span style={{ fontSize: 13, color: "#3d3520" }}>{h.name}</span>
                    <span><span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, fontWeight: 600, background: h.assetType === "Crypto" ? "#fef3c7" : h.assetType === "ETF" ? "#dbeafe" : "#f0fdf4", color: h.assetType === "Crypto" ? "#92400e" : h.assetType === "ETF" ? "#1e40af" : "#14532d" }}>{h.assetType}</span></span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>${h.value.toLocaleString()}</span>
                    <span style={{ fontSize: 11, color: "#8a7d5a" }}>{h.sector.replace("ETF - ", "")}</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: h.dividendYield > 0 ? "#15803d" : "#c4b896" }}>{h.dividendYield > 0 ? h.dividendYield.toFixed(1) + "%" : "—"}</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: h.expenseRatio > 0.5 ? "#dc2626" : "#8a7d5a" }}>{h.expenseRatio > 0 ? h.expenseRatio.toFixed(2) + "%" : "—"}</span>
                    <button className="btn-d" onClick={() => handleRemove(h.id)}>×</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {holdings.length > 0 && (
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              {[{ label: "Stocks", count: holdings.filter(h => h.assetType === "Stock").length, bg: "#f0fdf4", col: "#14532d" },
                { label: "ETFs", count: holdings.filter(h => h.assetType === "ETF").length, bg: "#dbeafe", col: "#1e40af" },
                { label: "Crypto", count: holdings.filter(h => h.assetType === "Crypto").length, bg: "#fef3c7", col: "#92400e" }]
                .filter(p => p.count > 0).map(p => (
                <div key={p.label} style={{ background: p.bg, color: p.col, padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{p.count} {p.label}</div>
              ))}
            </div>
          )}

          {stage === "input" && (
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <button className="btn-p" style={{ padding: "15px 48px", fontSize: 15, borderRadius: 10, width: "100%", maxWidth: 360 }} onClick={handleAnalyze} disabled={holdings.length === 0}>
                Analyze My Portfolio →
              </button>
            </div>
          )}

          {stage === "loading" && <LoadingScreen onDone={() => setStage("results")} />}

          {stage === "results" && metrics && (
            <div ref={resultsRef} style={{ opacity: animIn ? 1 : 0, transition: "opacity 0.5s ease" }}>

              {/* TOP 4 STAT CARDS */}
              <div className="g4">
                <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <ScoreRing score={metrics.divScore} color={metrics.scoreColor} size={100} />
                  <div style={{ fontSize: 11, color: "#8a7d5a", textTransform: "uppercase", letterSpacing: "0.1em" }}>Health Score</div>
                </div>
                <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 56, fontWeight: 700, color: metrics.gradeColor, lineHeight: 1 }}>{metrics.grade}</div>
                  <div style={{ fontSize: 11, color: "#8a7d5a", textTransform: "uppercase", letterSpacing: "0.1em" }}>Portfolio Grade</div>
                  <div style={{ fontSize: 12, color: metrics.scoreColor, fontWeight: 600 }}>{metrics.scoreLabel}</div>
                </div>
                <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
                  <div style={{ fontSize: 10, color: "#8a7d5a", textTransform: "uppercase", letterSpacing: "0.1em" }}>Annual Income</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: "#15803d" }}>${metrics.annualDividend.toFixed(0)}</div>
                  <div style={{ fontSize: 11, color: "#8a7d5a" }}>${metrics.monthlyDividend.toFixed(0)}/month passive</div>
                </div>
                <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
                  <div style={{ fontSize: 10, color: "#8a7d5a", textTransform: "uppercase", letterSpacing: "0.1em" }}>Risk Level</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: metrics.riskColor }}>{metrics.riskLabel}</div>
                  <div style={{ height: 6, background: "linear-gradient(90deg, #15803d, #d97706, #dc2626)", borderRadius: 3, position: "relative", marginTop: 4 }}>
                    <div style={{ position: "absolute", top: -4, width: 14, height: 14, borderRadius: "50%", background: metrics.riskColor, border: "2px solid #faf7f0", left: `calc(${metrics.riskPct}% - 7px)`, transition: "left 1.2s ease" }} />
                  </div>
                </div>
              </div>

              {/* METRICS */}
              <div className="g3">
                <StatCard label="Avg Dividend Yield" value={`${metrics.wDividend.toFixed(2)}%`} sub="Weighted across holdings" color={metrics.wDividend > 0.3 ? "#15803d" : "#8a7d5a"} />
                <StatCard label="Annual Fee Cost" value={`$${metrics.annualFee.toFixed(0)}`} sub={metrics.annualFee > 200 ? "Consider lower-cost ETFs" : "Fees look reasonable"} color={metrics.annualFee > 200 ? "#dc2626" : "#3d3520"} accent={metrics.annualFee > 200 ? "#fff1f2" : "#faf7f0"} />
                <StatCard label="Sectors Covered" value={`${metrics.numSectors}`} sub={`Out of ${SECTORS.length} categories`} color={metrics.numSectors >= 5 ? "#15803d" : metrics.numSectors >= 3 ? "#d97706" : "#dc2626"} />
              </div>

              <div className="g3">
                <StatCard label="Stocks" value={`${metrics.stockPct.toFixed(0)}%`} sub={`${holdings.filter(h => h.assetType === "Stock").length} positions`} color="#15803d" />
                <StatCard label="ETFs" value={`${metrics.etfPct.toFixed(0)}%`} sub={`${holdings.filter(h => h.assetType === "ETF").length} funds`} color="#1d4ed8" />
                <StatCard label="Crypto" value={`${metrics.cryptoPct.toFixed(0)}%`} sub={`${holdings.filter(h => h.assetType === "Crypto").length} assets`} color={metrics.cryptoPct > 30 ? "#dc2626" : "#d97706"} />
              </div>

              {/* LOCKED SECTION */}
              <div style={{ position: "relative" }}>
                {!unlocked && (
                  <div style={{ position: "absolute", inset: 0, zIndex: 10, background: "rgba(245,240,228,0.8)", backdropFilter: "blur(8px)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, minHeight: 400 }}>
                    <div style={{ background: "#faf7f0", border: "1px solid #d4c9a8", borderRadius: 16, padding: "36px 28px", textAlign: "center", maxWidth: 400, width: "100%", boxShadow: "0 16px 40px rgba(26,46,26,0.12)" }}>
                      <div style={{ fontSize: 40, marginBottom: 14 }}>📊</div>
                      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: "#1a2e1a", marginBottom: 10 }}>Your Full Report Is Ready</h3>
                      <div style={{ textAlign: "left", marginBottom: 24, display: "flex", flexDirection: "column", gap: 7 }}>
                        {["Risk flags & specific warnings", "Full sector breakdown vs S&P 500", "Detailed rebalancing action plan", "Crypto & ETF specific analysis", "Annual dividend income & fee costs"].map((f, i) => (
                          <div key={i} style={{ fontSize: 13, color: "#3d3520", display: "flex", gap: 10 }}>
                            <span style={{ color: "#15803d", fontWeight: 700 }}>✓</span> {f}
                          </div>
                        ))}
                      </div>
                      <a href={getWhopAuthURL()} style={{ display: "block", background: "#166534", color: "#f5f0e4", padding: "15px", borderRadius: 9, fontSize: 15, fontWeight: 700, textDecoration: "none", marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>
                        Buy & Unlock Instantly — {PRICE} →
                      </a>
                      <button onClick={() => setShowModal(true)} style={{ background: "transparent", color: "#8a7d5a", border: "1px solid #c4b896", padding: "11px", borderRadius: 9, fontSize: 13, cursor: "pointer", width: "100%", fontFamily: "'DM Sans', sans-serif" }}>
                        I already purchased — enter key
                      </button>
                      <p style={{ fontSize: 11, color: "#b4a882", marginTop: 12 }}>One-time payment · Instant access · No subscription</p>
                    </div>
                  </div>
                )}

                <div style={{ filter: unlocked ? "none" : "blur(6px)", pointerEvents: unlocked ? "auto" : "none", userSelect: unlocked ? "auto" : "none" }}>
                  <div style={{ marginBottom: 18 }}>
                    <div className="sl">Risk Flags & Insights</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {metrics.flags.map((f, i) => (
                        <div key={i} className={f.type === "warning" ? "fw" : "fo"}>
                          <span style={{ flexShrink: 0 }}>{f.type === "warning" ? "⚠" : "✓"}</span>{f.msg}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="g2">
                    <div className="card" style={{ background: "#f0fdf4", border: "1px solid #86efac" }}>
                      <div style={{ fontSize: 10, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>💰 Annual Dividend Income</div>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: "#15803d", lineHeight: 1 }}>${metrics.annualDividend.toFixed(0)}<span style={{ fontSize: 14, color: "#6b5f3e" }}>/yr</span></div>
                      <div style={{ fontSize: 12, color: "#15803d", marginTop: 5, opacity: 0.8 }}>${metrics.monthlyDividend.toFixed(0)}/month passive income</div>
                    </div>
                    <div className="card" style={{ background: metrics.annualFee > 200 ? "#fff1f2" : "#faf7f0", border: metrics.annualFee > 200 ? "1px solid #fecaca" : "1px solid #d4c9a8" }}>
                      <div style={{ fontSize: 10, color: metrics.annualFee > 200 ? "#dc2626" : "#8a7d5a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>📉 Annual Fee Cost</div>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: metrics.annualFee > 200 ? "#dc2626" : "#3d3520", lineHeight: 1 }}>${metrics.annualFee.toFixed(0)}<span style={{ fontSize: 14, color: "#8a7d5a" }}>/yr</span></div>
                      <div style={{ fontSize: 12, color: "#8a7d5a", marginTop: 5 }}>{metrics.annualFee > 200 ? "Consider lower-cost alternatives" : "Fees look reasonable"}</div>
                    </div>
                  </div>
                  <div className="card" style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: "#8a7d5a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Portfolio Risk Level</div>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: metrics.riskColor, marginBottom: 5 }}>{metrics.riskLabel}</div>
                      <div style={{ fontSize: 12, color: "#8a7d5a" }}>Based on sector volatility weightings</div>
                    </div>
                    <div style={{ width: 130 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 10, color: "#15803d", fontWeight: 600 }}>Low</span>
                        <span style={{ fontSize: 10, color: "#dc2626", fontWeight: 600 }}>High</span>
                      </div>
                      <div style={{ height: 8, background: "linear-gradient(90deg, #15803d, #d97706, #dc2626)", borderRadius: 4, position: "relative" }}>
                        <div style={{ position: "absolute", top: -4, width: 16, height: 16, borderRadius: "50%", background: metrics.riskColor, border: "3px solid #faf7f0", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", left: `calc(${metrics.riskPct}% - 8px)`, transition: "left 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
                      </div>
                    </div>
                  </div>
                  <div className="card" style={{ marginBottom: 18 }}>
                    <div className="sl">Sector Breakdown vs S&P 500 <span style={{ color: "#c4b896", fontWeight: 400 }}>(line = S&P avg)</span></div>
                    {metrics.sectorPcts.map(sp => <SectorBar key={sp.sector} sector={sp.sector} pct={sp.pct} />)}
                  </div>
                  {metrics.rebalance.length > 0 && (
                    <div className="card" style={{ marginBottom: 18, border: "1px solid #86efac", background: "#f0fdf4" }}>
                      <div style={{ fontSize: 11, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, fontWeight: 700 }}>📋 Your Rebalancing Plan</div>
                      <div style={{ fontSize: 12, color: "#6b5f3e", marginBottom: 14 }}>Personalized steps based on your current holdings</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {metrics.rebalance.map((r, i) => (
                          <div key={i} className={r.type === "reduce" ? "rr" : "ra"}>
                            <span style={{ flexShrink: 0, fontWeight: 700, fontSize: 15 }}>{r.type === "reduce" ? "↓" : "↑"}</span>
                            <span>{r.msg}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ textAlign: "center", fontSize: 11, color: "#b4a882", marginBottom: 20 }}>For informational purposes only. Not financial advice.</div>
                  <div style={{ textAlign: "center" }}>
                    <button className="btn-g" onClick={() => setStage("input")} style={{ fontSize: 12 }}>← Analyze Another Portfolio</button>
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
