export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: "No ticker provided" });

  const key = process.env.FINNHUB_KEY;
  if (!key) return res.status(500).json({ error: "API key not configured" });

  const symbol = ticker.trim().toUpperCase();

  // Detect crypto (common crypto symbols)
  const cryptoSymbols = ["BTC", "ETH", "SOL", "ADA", "XRP", "DOGE", "DOT", "AVAX", "MATIC", "LINK", "LTC", "BCH", "ATOM", "UNI", "SHIB", "PEPE", "BNB"];
  if (cryptoSymbols.includes(symbol)) {
    return res.status(200).json({
      name: getCryptoName(symbol),
      sector: "Crypto",
      assetType: "Crypto",
      dividendYield: 0,
      expenseRatio: 0,
      found: true
    });
  }

  try {
    // Fetch company profile from Finnhub
    const profileRes = await fetch(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${key}`
    );
    const profile = await profileRes.json();

    // Fetch basic financials for dividend yield
    const metricsRes = await fetch(
      `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${key}`
    );
    const metrics = await metricsRes.json();

    if (!profile || !profile.name) {
      return res.status(200).json({ found: false });
    }

    const finnhubSector = profile.finnhubIndustry || "";
    const sector = mapSector(finnhubSector, profile.name, symbol);
    const assetType = detectAssetType(profile, symbol);
    const dividendYield = metrics?.metric?.dividendYieldIndicatedAnnual || 0;
    const expenseRatio = assetType === "ETF" ? getETFExpenseRatio(symbol) : 0;

    return res.status(200).json({
      name: profile.name,
      sector,
      assetType,
      dividendYield: parseFloat((dividendYield).toFixed(2)),
      expenseRatio: parseFloat((expenseRatio).toFixed(2)),
      found: true
    });
  } catch (err) {
    console.error("Finnhub error:", err);
    return res.status(200).json({ found: false });
  }
}

function mapSector(finnhubIndustry, name, symbol) {
  const ind = (finnhubIndustry || "").toLowerCase();
  const n = (name || "").toLowerCase();

  // ETF detection
  if (n.includes("etf") || n.includes("fund") || n.includes("trust") || n.includes("ishares") || n.includes("vanguard") || n.includes("spdr") || ["SPY","QQQ","VTI","VOO","IVV","VEA","VWO","BND","AGG","GLD","SLV","DIA","IWM","XLF","XLK","XLE","XLV","XLU","XLI","XLB","XLRE","XLC","XLP","XLY"].includes(symbol)) {
    return mapETFSector(symbol, name);
  }
  if (ind.includes("tech") || ind.includes("software") || ind.includes("semiconductor") || ind.includes("internet")) return "Technology";
  if (ind.includes("health") || ind.includes("pharma") || ind.includes("biotech") || ind.includes("medical")) return "Healthcare";
  if (ind.includes("bank") || ind.includes("financ") || ind.includes("insurance") || ind.includes("invest")) return "Financials";
  if (ind.includes("retail") || ind.includes("consumer") || ind.includes("food") || ind.includes("beverage") || ind.includes("restaurant")) return "Consumer";
  if (ind.includes("energy") || ind.includes("oil") || ind.includes("gas") || ind.includes("petroleum")) return "Energy";
  if (ind.includes("util")) return "Utilities";
  if (ind.includes("material") || ind.includes("chemical") || ind.includes("mining") || ind.includes("metal")) return "Materials";
  if (ind.includes("industrial") || ind.includes("aerospace") || ind.includes("defense") || ind.includes("transport") || ind.includes("logistics")) return "Industrials";
  if (ind.includes("real estate") || ind.includes("reit")) return "Real Estate";
  if (ind.includes("media") || ind.includes("telecom") || ind.includes("communication") || ind.includes("entertainment")) return "Communication";
  return "Technology"; // default
}

function mapETFSector(symbol, name) {
  const etfMap = {
    "SPY": "ETF - Broad Market", "VOO": "ETF - Broad Market", "VTI": "ETF - Broad Market",
    "IVV": "ETF - Broad Market", "QQQ": "ETF - Technology", "XLK": "ETF - Technology",
    "XLF": "ETF - Financials", "XLV": "ETF - Healthcare", "XLE": "ETF - Energy",
    "XLU": "ETF - Utilities", "XLI": "ETF - Industrials", "XLB": "ETF - Materials",
    "XLRE": "ETF - Real Estate", "XLC": "ETF - Communication", "XLP": "ETF - Consumer",
    "XLY": "ETF - Consumer", "GLD": "ETF - Commodities", "SLV": "ETF - Commodities",
    "BND": "ETF - Bonds", "AGG": "ETF - Bonds", "DIA": "ETF - Broad Market",
    "IWM": "ETF - Broad Market", "VEA": "ETF - International", "VWO": "ETF - International",
  };
  return etfMap[symbol] || "ETF - Broad Market";
}

function getETFExpenseRatio(symbol) {
  const ratios = {
    "SPY": 0.09, "VOO": 0.03, "VTI": 0.03, "IVV": 0.03, "QQQ": 0.20,
    "XLK": 0.10, "XLF": 0.10, "XLV": 0.10, "XLE": 0.10, "XLU": 0.10,
    "XLI": 0.10, "XLB": 0.10, "XLRE": 0.10, "XLC": 0.10, "XLP": 0.10,
    "XLY": 0.10, "GLD": 0.40, "SLV": 0.50, "BND": 0.03, "AGG": 0.03,
    "DIA": 0.16, "IWM": 0.19, "VEA": 0.05, "VWO": 0.08,
  };
  return ratios[symbol] || 0.20;
}

function detectAssetType(profile, symbol) {
  const name = (profile.name || "").toLowerCase();
  if (name.includes("etf") || name.includes("fund") || name.includes("trust") || name.includes("ishares") || name.includes("vanguard") || name.includes("spdr")) return "ETF";
  return "Stock";
}

function getCryptoName(symbol) {
  const names = {
    "BTC": "Bitcoin", "ETH": "Ethereum", "SOL": "Solana", "ADA": "Cardano",
    "XRP": "XRP", "DOGE": "Dogecoin", "DOT": "Polkadot", "AVAX": "Avalanche",
    "MATIC": "Polygon", "LINK": "Chainlink", "LTC": "Litecoin", "BCH": "Bitcoin Cash",
    "ATOM": "Cosmos", "UNI": "Uniswap", "SHIB": "Shiba Inu", "PEPE": "Pepe", "BNB": "BNB"
  };
  return names[symbol] || symbol;
}

