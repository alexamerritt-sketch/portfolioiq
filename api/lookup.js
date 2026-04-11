// Hardcoded database for most common tickers — always works instantly
// Finnhub API used as fallback for unlisted tickers
const TICKER_DB = {
  // ── BROAD MARKET ETFs ───────────────────────────────────────
  "SPY":  { name: "SPDR S&P 500 ETF", sector: "ETF - Broad Market", assetType: "ETF", dividendYield: 1.25, expenseRatio: 0.09 },
  "VOO":  { name: "Vanguard S&P 500 ETF", sector: "ETF - Broad Market", assetType: "ETF", dividendYield: 1.30, expenseRatio: 0.03 },
  "VTI":  { name: "Vanguard Total Stock Market ETF", sector: "ETF - Broad Market", assetType: "ETF", dividendYield: 1.35, expenseRatio: 0.03 },
  "IVV":  { name: "iShares Core S&P 500 ETF", sector: "ETF - Broad Market", assetType: "ETF", dividendYield: 1.25, expenseRatio: 0.03 },
  "DIA":  { name: "SPDR Dow Jones Industrial ETF", sector: "ETF - Broad Market", assetType: "ETF", dividendYield: 1.80, expenseRatio: 0.16 },
  "IWM":  { name: "iShares Russell 2000 ETF", sector: "ETF - Broad Market", assetType: "ETF", dividendYield: 1.20, expenseRatio: 0.19 },
  "ITOT": { name: "iShares Core S&P Total US Market ETF", sector: "ETF - Broad Market", assetType: "ETF", dividendYield: 1.30, expenseRatio: 0.03 },
  "SCHB": { name: "Schwab US Broad Market ETF", sector: "ETF - Broad Market", assetType: "ETF", dividendYield: 1.35, expenseRatio: 0.03 },
  "VV":   { name: "Vanguard Large-Cap ETF", sector: "ETF - Broad Market", assetType: "ETF", dividendYield: 1.40, expenseRatio: 0.04 },

  // ── DIVIDEND ETFs ────────────────────────────────────────────
  "SCHD": { name: "Schwab US Dividend Equity ETF", sector: "ETF - Broad Market", assetType: "ETF", dividendYield: 3.50, expenseRatio: 0.06 },
  "VYM":  { name: "Vanguard High Dividend Yield ETF", sector: "ETF - Broad Market", assetType: "ETF", dividendYield: 2.90, expenseRatio: 0.06 },
  "DVY":  { name: "iShares Select Dividend ETF", sector: "ETF - Broad Market", assetType: "ETF", dividendYield: 4.50, expenseRatio: 0.38 },
  "HDV":  { name: "iShares Core High Dividend ETF", sector: "ETF - Broad Market", assetType: "ETF", dividendYield: 3.80, expenseRatio: 0.08 },
  "DGRO": { name: "iShares Core Dividend Growth ETF", sector: "ETF - Broad Market", assetType: "ETF", dividendYield: 2.20, expenseRatio: 0.08 },
  "JEPI": { name: "JPMorgan Equity Premium Income ETF", sector: "ETF - Broad Market", assetType: "ETF", dividendYield: 7.50, expenseRatio: 0.35 },
  "JEPQ": { name: "JPMorgan Nasdaq Equity Premium ETF", sector: "ETF - Technology", assetType: "ETF", dividendYield: 9.00, expenseRatio: 0.35 },
  "DIVO": { name: "Amplify CWP Enhanced Dividend Income ETF", sector: "ETF - Broad Market", assetType: "ETF", dividendYield: 4.80, expenseRatio: 0.55 },

  // ── TECHNOLOGY ETFs ──────────────────────────────────────────
  "QQQ":  { name: "Invesco Nasdaq-100 ETF", sector: "ETF - Technology", assetType: "ETF", dividendYield: 0.60, expenseRatio: 0.20 },
  "QQQM": { name: "Invesco Nasdaq-100 ETF (Mini)", sector: "ETF - Technology", assetType: "ETF", dividendYield: 0.60, expenseRatio: 0.15 },
  "VGT":  { name: "Vanguard Information Technology ETF", sector: "ETF - Technology", assetType: "ETF", dividendYield: 0.70, expenseRatio: 0.10 },
  "XLK":  { name: "Technology Select Sector SPDR ETF", sector: "ETF - Technology", assetType: "ETF", dividendYield: 0.65, expenseRatio: 0.10 },
  "SOXX": { name: "iShares Semiconductor ETF", sector: "ETF - Technology", assetType: "ETF", dividendYield: 0.80, expenseRatio: 0.35 },
  "SMH":  { name: "VanEck Semiconductor ETF", sector: "ETF - Technology", assetType: "ETF", dividendYield: 0.70, expenseRatio: 0.35 },
  "ARKK": { name: "ARK Innovation ETF", sector: "ETF - Technology", assetType: "ETF", dividendYield: 0.00, expenseRatio: 0.75 },
  "CIBR": { name: "First Trust Cybersecurity ETF", sector: "ETF - Technology", assetType: "ETF", dividendYield: 0.30, expenseRatio: 0.60 },

  // ── SECTOR ETFs ──────────────────────────────────────────────
  "XLF":  { name: "Financial Select Sector SPDR ETF", sector: "ETF - Financials", assetType: "ETF", dividendYield: 1.80, expenseRatio: 0.10 },
  "XLV":  { name: "Health Care Select Sector SPDR ETF", sector: "ETF - Healthcare", assetType: "ETF", dividendYield: 1.60, expenseRatio: 0.10 },
  "XLE":  { name: "Energy Select Sector SPDR ETF", sector: "ETF - Energy", assetType: "ETF", dividendYield: 3.20, expenseRatio: 0.10 },
  "XLU":  { name: "Utilities Select Sector SPDR ETF", sector: "ETF - Utilities", assetType: "ETF", dividendYield: 3.10, expenseRatio: 0.10 },
  "XLI":  { name: "Industrial Select Sector SPDR ETF", sector: "ETF - Industrials", assetType: "ETF", dividendYield: 1.50, expenseRatio: 0.10 },
  "XLB":  { name: "Materials Select Sector SPDR ETF", sector: "ETF - Materials", assetType: "ETF", dividendYield: 1.90, expenseRatio: 0.10 },
  "XLRE": { name: "Real Estate Select Sector SPDR ETF", sector: "ETF - Real Estate", assetType: "ETF", dividendYield: 3.50, expenseRatio: 0.10 },
  "XLC":  { name: "Communication Services SPDR ETF", sector: "ETF - Communication", assetType: "ETF", dividendYield: 0.90, expenseRatio: 0.10 },
  "XLP":  { name: "Consumer Staples SPDR ETF", sector: "ETF - Consumer", assetType: "ETF", dividendYield: 2.60, expenseRatio: 0.10 },
  "XLY":  { name: "Consumer Discretionary SPDR ETF", sector: "ETF - Consumer", assetType: "ETF", dividendYield: 0.80, expenseRatio: 0.10 },
  "VNQ":  { name: "Vanguard Real Estate ETF", sector: "ETF - Real Estate", assetType: "ETF", dividendYield: 4.00, expenseRatio: 0.12 },

  // ── INTERNATIONAL ETFs ───────────────────────────────────────
  "VEA":  { name: "Vanguard FTSE Developed Markets ETF", sector: "ETF - International", assetType: "ETF", dividendYield: 3.00, expenseRatio: 0.05 },
  "VWO":  { name: "Vanguard FTSE Emerging Markets ETF", sector: "ETF - International", assetType: "ETF", dividendYield: 2.80, expenseRatio: 0.08 },
  "EFA":  { name: "iShares MSCI EAFE ETF", sector: "ETF - International", assetType: "ETF", dividendYield: 3.20, expenseRatio: 0.32 },
  "EEM":  { name: "iShares MSCI Emerging Markets ETF", sector: "ETF - International", assetType: "ETF", dividendYield: 2.50, expenseRatio: 0.68 },
  "VXUS": { name: "Vanguard Total International Stock ETF", sector: "ETF - International", assetType: "ETF", dividendYield: 3.10, expenseRatio: 0.07 },

  // ── BOND ETFs ────────────────────────────────────────────────
  "BND":  { name: "Vanguard Total Bond Market ETF", sector: "ETF - Bonds", assetType: "ETF", dividendYield: 3.50, expenseRatio: 0.03 },
  "AGG":  { name: "iShares Core US Aggregate Bond ETF", sector: "ETF - Bonds", assetType: "ETF", dividendYield: 3.40, expenseRatio: 0.03 },
  "TLT":  { name: "iShares 20+ Year Treasury Bond ETF", sector: "ETF - Bonds", assetType: "ETF", dividendYield: 4.20, expenseRatio: 0.15 },
  "IEF":  { name: "iShares 7-10 Year Treasury Bond ETF", sector: "ETF - Bonds", assetType: "ETF", dividendYield: 3.20, expenseRatio: 0.15 },
  "SHY":  { name: "iShares 1-3 Year Treasury Bond ETF", sector: "ETF - Bonds", assetType: "ETF", dividendYield: 4.80, expenseRatio: 0.15 },
  "LQD":  { name: "iShares iBoxx $ Investment Grade ETF", sector: "ETF - Bonds", assetType: "ETF", dividendYield: 4.10, expenseRatio: 0.14 },
  "HYG":  { name: "iShares iBoxx $ High Yield Corp Bond ETF", sector: "ETF - Bonds", assetType: "ETF", dividendYield: 5.80, expenseRatio: 0.48 },
  "SGOV": { name: "iShares 0-3 Month Treasury Bond ETF", sector: "ETF - Bonds", assetType: "ETF", dividendYield: 5.10, expenseRatio: 0.09 },

  // ── COMMODITY ETFs ───────────────────────────────────────────
  "GLD":  { name: "SPDR Gold Shares ETF", sector: "ETF - Commodities", assetType: "ETF", dividendYield: 0.00, expenseRatio: 0.40 },
  "IAU":  { name: "iShares Gold Trust ETF", sector: "ETF - Commodities", assetType: "ETF", dividendYield: 0.00, expenseRatio: 0.25 },
  "SLV":  { name: "iShares Silver Trust ETF", sector: "ETF - Commodities", assetType: "ETF", dividendYield: 0.00, expenseRatio: 0.50 },
  "USO":  { name: "United States Oil Fund ETF", sector: "ETF - Commodities", assetType: "ETF", dividendYield: 0.00, expenseRatio: 0.60 },

  // ── TOP US STOCKS ────────────────────────────────────────────
  "AAPL": { name: "Apple Inc.", sector: "Technology", assetType: "Stock", dividendYield: 0.50, expenseRatio: 0 },
  "MSFT": { name: "Microsoft Corp.", sector: "Technology", assetType: "Stock", dividendYield: 0.70, expenseRatio: 0 },
  "NVDA": { name: "NVIDIA Corp.", sector: "Technology", assetType: "Stock", dividendYield: 0.03, expenseRatio: 0 },
  "GOOGL":{ name: "Alphabet Inc.", sector: "Technology", assetType: "Stock", dividendYield: 0.00, expenseRatio: 0 },
  "GOOG": { name: "Alphabet Inc. (Class C)", sector: "Technology", assetType: "Stock", dividendYield: 0.00, expenseRatio: 0 },
  "AMZN": { name: "Amazon.com Inc.", sector: "Consumer", assetType: "Stock", dividendYield: 0.00, expenseRatio: 0 },
  "META": { name: "Meta Platforms Inc.", sector: "Communication", assetType: "Stock", dividendYield: 0.40, expenseRatio: 0 },
  "TSLA": { name: "Tesla Inc.", sector: "Consumer", assetType: "Stock", dividendYield: 0.00, expenseRatio: 0 },
  "BRK.B":{ name: "Berkshire Hathaway Inc.", sector: "Financials", assetType: "Stock", dividendYield: 0.00, expenseRatio: 0 },
  "AVGO": { name: "Broadcom Inc.", sector: "Technology", assetType: "Stock", dividendYield: 1.20, expenseRatio: 0 },
  "JPM":  { name: "JPMorgan Chase & Co.", sector: "Financials", assetType: "Stock", dividendYield: 2.10, expenseRatio: 0 },
  "LLY":  { name: "Eli Lilly and Co.", sector: "Healthcare", assetType: "Stock", dividendYield: 0.70, expenseRatio: 0 },
  "V":    { name: "Visa Inc.", sector: "Financials", assetType: "Stock", dividendYield: 0.80, expenseRatio: 0 },
  "UNH":  { name: "UnitedHealth Group Inc.", sector: "Healthcare", assetType: "Stock", dividendYield: 1.50, expenseRatio: 0 },
  "XOM":  { name: "Exxon Mobil Corp.", sector: "Energy", assetType: "Stock", dividendYield: 3.40, expenseRatio: 0 },
  "MA":   { name: "Mastercard Inc.", sector: "Financials", assetType: "Stock", dividendYield: 0.60, expenseRatio: 0 },
  "JNJ":  { name: "Johnson & Johnson", sector: "Healthcare", assetType: "Stock", dividendYield: 3.10, expenseRatio: 0 },
  "PG":   { name: "Procter & Gamble Co.", sector: "Consumer", assetType: "Stock", dividendYield: 2.40, expenseRatio: 0 },
  "HD":   { name: "Home Depot Inc.", sector: "Consumer", assetType: "Stock", dividendYield: 2.40, expenseRatio: 0 },
  "COST": { name: "Costco Wholesale Corp.", sector: "Consumer", assetType: "Stock", dividendYield: 0.60, expenseRatio: 0 },
  "MRK":  { name: "Merck & Co.", sector: "Healthcare", assetType: "Stock", dividendYield: 2.90, expenseRatio: 0 },
  "ABBV": { name: "AbbVie Inc.", sector: "Healthcare", assetType: "Stock", dividendYield: 3.60, expenseRatio: 0 },
  "CVX":  { name: "Chevron Corp.", sector: "Energy", assetType: "Stock", dividendYield: 4.20, expenseRatio: 0 },
  "KO":   { name: "Coca-Cola Co.", sector: "Consumer", assetType: "Stock", dividendYield: 3.00, expenseRatio: 0 },
  "PEP":  { name: "PepsiCo Inc.", sector: "Consumer", assetType: "Stock", dividendYield: 3.20, expenseRatio: 0 },
  "WMT":  { name: "Walmart Inc.", sector: "Consumer", assetType: "Stock", dividendYield: 1.10, expenseRatio: 0 },
  "MCD":  { name: "McDonald's Corp.", sector: "Consumer", assetType: "Stock", dividendYield: 2.30, expenseRatio: 0 },
  "BAC":  { name: "Bank of America Corp.", sector: "Financials", assetType: "Stock", dividendYield: 2.50, expenseRatio: 0 },
  "DIS":  { name: "Walt Disney Co.", sector: "Communication", assetType: "Stock", dividendYield: 0.00, expenseRatio: 0 },
  "NFLX": { name: "Netflix Inc.", sector: "Communication", assetType: "Stock", dividendYield: 0.00, expenseRatio: 0 },
  "ADBE": { name: "Adobe Inc.", sector: "Technology", assetType: "Stock", dividendYield: 0.00, expenseRatio: 0 },
  "AMD":  { name: "Advanced Micro Devices", sector: "Technology", assetType: "Stock", dividendYield: 0.00, expenseRatio: 0 },
  "INTC": { name: "Intel Corp.", sector: "Technology", assetType: "Stock", dividendYield: 2.00, expenseRatio: 0 },
  "CSCO": { name: "Cisco Systems Inc.", sector: "Technology", assetType: "Stock", dividendYield: 3.20, expenseRatio: 0 },
  "ORCL": { name: "Oracle Corp.", sector: "Technology", assetType: "Stock", dividendYield: 1.40, expenseRatio: 0 },
  "CRM":  { name: "Salesforce Inc.", sector: "Technology", assetType: "Stock", dividendYield: 0.60, expenseRatio: 0 },
  "QCOM": { name: "Qualcomm Inc.", sector: "Technology", assetType: "Stock", dividendYield: 2.10, expenseRatio: 0 },
  "TXN":  { name: "Texas Instruments Inc.", sector: "Technology", assetType: "Stock", dividendYield: 2.80, expenseRatio: 0 },
  "PYPL": { name: "PayPal Holdings Inc.", sector: "Financials", assetType: "Stock", dividendYield: 0.00, expenseRatio: 0 },
  "SQ":   { name: "Block Inc.", sector: "Financials", assetType: "Stock", dividendYield: 0.00, expenseRatio: 0 },
  "COIN": { name: "Coinbase Global Inc.", sector: "Financials", assetType: "Stock", dividendYield: 0.00, expenseRatio: 0 },
  "MSTR": { name: "MicroStrategy Inc.", sector: "Technology", assetType: "Stock", dividendYield: 0.00, expenseRatio: 0 },
  "WFC":  { name: "Wells Fargo & Co.", sector: "Financials", assetType: "Stock", dividendYield: 2.70, expenseRatio: 0 },
  "GS":   { name: "Goldman Sachs Group Inc.", sector: "Financials", assetType: "Stock", dividendYield: 2.20, expenseRatio: 0 },
  "MS":   { name: "Morgan Stanley", sector: "Financials", assetType: "Stock", dividendYield: 3.10, expenseRatio: 0 },
  "RTX":  { name: "RTX Corp.", sector: "Industrials", assetType: "Stock", dividendYield: 2.20, expenseRatio: 0 },
  "CAT":  { name: "Caterpillar Inc.", sector: "Industrials", assetType: "Stock", dividendYield: 1.60, expenseRatio: 0 },
  "BA":   { name: "Boeing Co.", sector: "Industrials", assetType: "Stock", dividendYield: 0.00, expenseRatio: 0 },
  "GE":   { name: "GE Aerospace", sector: "Industrials", assetType: "Stock", dividendYield: 0.70, expenseRatio: 0 },
  "UPS":  { name: "United Parcel Service Inc.", sector: "Industrials", assetType: "Stock", dividendYield: 5.00, expenseRatio: 0 },
  "FDX":  { name: "FedEx Corp.", sector: "Industrials", assetType: "Stock", dividendYield: 2.10, expenseRatio: 0 },
  "PFE":  { name: "Pfizer Inc.", sector: "Healthcare", assetType: "Stock", dividendYield: 6.50, expenseRatio: 0 },
  "TMO":  { name: "Thermo Fisher Scientific", sector: "Healthcare", assetType: "Stock", dividendYield: 0.30, expenseRatio: 0 },
  "ABT":  { name: "Abbott Laboratories", sector: "Healthcare", assetType: "Stock", dividendYield: 1.80, expenseRatio: 0 },
  "BMY":  { name: "Bristol-Myers Squibb Co.", sector: "Healthcare", assetType: "Stock", dividendYield: 4.80, expenseRatio: 0 },
  "AMGN": { name: "Amgen Inc.", sector: "Healthcare", assetType: "Stock", dividendYield: 3.20, expenseRatio: 0 },
  "NEE":  { name: "NextEra Energy Inc.", sector: "Utilities", assetType: "Stock", dividendYield: 3.10, expenseRatio: 0 },
  "SO":   { name: "Southern Company", sector: "Utilities", assetType: "Stock", dividendYield: 3.50, expenseRatio: 0 },
  "DUK":  { name: "Duke Energy Corp.", sector: "Utilities", assetType: "Stock", dividendYield: 3.80, expenseRatio: 0 },
  "AMT":  { name: "American Tower Corp.", sector: "Real Estate", assetType: "Stock", dividendYield: 3.00, expenseRatio: 0 },
  "PLD":  { name: "Prologis Inc.", sector: "Real Estate", assetType: "Stock", dividendYield: 3.20, expenseRatio: 0 },
  "O":    { name: "Realty Income Corp.", sector: "Real Estate", assetType: "Stock", dividendYield: 5.60, expenseRatio: 0 },
  "T":    { name: "AT&T Inc.", sector: "Communication", assetType: "Stock", dividendYield: 5.20, expenseRatio: 0 },
  "VZ":   { name: "Verizon Communications", sector: "Communication", assetType: "Stock", dividendYield: 6.40, expenseRatio: 0 },
  "TMUS": { name: "T-Mobile US Inc.", sector: "Communication", assetType: "Stock", dividendYield: 1.60, expenseRatio: 0 },
  "UBER": { name: "Uber Technologies Inc.", sector: "Technology", assetType: "Stock", dividendYield: 0.00, expenseRatio: 0 },
  "LYFT": { name: "Lyft Inc.", sector: "Technology", assetType: "Stock", dividendYield: 0.00, expenseRatio: 0 },
  "ABNB": { name: "Airbnb Inc.", sector: "Consumer", assetType: "Stock", dividendYield: 0.00, expenseRatio: 0 },
  "SPOT": { name: "Spotify Technology SA", sector: "Communication", assetType: "Stock", dividendYield: 0.00, expenseRatio: 0 },
  "SNOW": { name: "Snowflake Inc.", sector: "Technology", assetType: "Stock", dividendYield: 0.00, expenseRatio: 0 },
  "PLTR": { name: "Palantir Technologies", sector: "Technology", assetType: "Stock", dividendYield: 0.00, expenseRatio: 0 },
  "RBLX": { name: "Roblox Corp.", sector: "Communication", assetType: "Stock", dividendYield: 0.00, expenseRatio: 0 },
  "HOOD": { name: "Robinhood Markets Inc.", sector: "Financials", assetType: "Stock", dividendYield: 0.00, expenseRatio: 0 },
  "RIVN": { name: "Rivian Automotive Inc.", sector: "Consumer", assetType: "Stock", dividendYield: 0.00, expenseRatio: 0 },
  "LCID": { name: "Lucid Group Inc.", sector: "Consumer", assetType: "Stock", dividendYield: 0.00, expenseRatio: 0 },
  "NIO":  { name: "NIO Inc.", sector: "Consumer", assetType: "Stock", dividendYield: 0.00, expenseRatio: 0 },
  "BABA": { name: "Alibaba Group Holding", sector: "Consumer", assetType: "Stock", dividendYield: 1.20, expenseRatio: 0 },
  "TSM":  { name: "Taiwan Semiconductor Mfg.", sector: "Technology", assetType: "Stock", dividendYield: 1.40, expenseRatio: 0 },
  "ASML": { name: "ASML Holding NV", sector: "Technology", assetType: "Stock", dividendYield: 0.90, expenseRatio: 0 },
  "SAP":  { name: "SAP SE", sector: "Technology", assetType: "Stock", dividendYield: 1.10, expenseRatio: 0 },

  // ── CRYPTO ───────────────────────────────────────────────────
  "BTC":  { name: "Bitcoin", sector: "Crypto", assetType: "Crypto", dividendYield: 0, expenseRatio: 0 },
  "ETH":  { name: "Ethereum", sector: "Crypto", assetType: "Crypto", dividendYield: 0, expenseRatio: 0 },
  "SOL":  { name: "Solana", sector: "Crypto", assetType: "Crypto", dividendYield: 0, expenseRatio: 0 },
  "XRP":  { name: "XRP", sector: "Crypto", assetType: "Crypto", dividendYield: 0, expenseRatio: 0 },
  "ADA":  { name: "Cardano", sector: "Crypto", assetType: "Crypto", dividendYield: 0, expenseRatio: 0 },
  "DOGE": { name: "Dogecoin", sector: "Crypto", assetType: "Crypto", dividendYield: 0, expenseRatio: 0 },
  "DOT":  { name: "Polkadot", sector: "Crypto", assetType: "Crypto", dividendYield: 0, expenseRatio: 0 },
  "AVAX": { name: "Avalanche", sector: "Crypto", assetType: "Crypto", dividendYield: 0, expenseRatio: 0 },
  "MATIC":{ name: "Polygon", sector: "Crypto", assetType: "Crypto", dividendYield: 0, expenseRatio: 0 },
  "LINK": { name: "Chainlink", sector: "Crypto", assetType: "Crypto", dividendYield: 0, expenseRatio: 0 },
  "LTC":  { name: "Litecoin", sector: "Crypto", assetType: "Crypto", dividendYield: 0, expenseRatio: 0 },
  "BCH":  { name: "Bitcoin Cash", sector: "Crypto", assetType: "Crypto", dividendYield: 0, expenseRatio: 0 },
  "SHIB": { name: "Shiba Inu", sector: "Crypto", assetType: "Crypto", dividendYield: 0, expenseRatio: 0 },
  "PEPE": { name: "Pepe", sector: "Crypto", assetType: "Crypto", dividendYield: 0, expenseRatio: 0 },
  "UNI":  { name: "Uniswap", sector: "Crypto", assetType: "Crypto", dividendYield: 0, expenseRatio: 0 },
  "BNB":  { name: "BNB", sector: "Crypto", assetType: "Crypto", dividendYield: 0, expenseRatio: 0 },
  "SUI":  { name: "Sui", sector: "Crypto", assetType: "Crypto", dividendYield: 0, expenseRatio: 0 },
  "TON":  { name: "Toncoin", sector: "Crypto", assetType: "Crypto", dividendYield: 0, expenseRatio: 0 },
  "TRX":  { name: "TRON", sector: "Crypto", assetType: "Crypto", dividendYield: 0, expenseRatio: 0 },
  "ATOM": { name: "Cosmos", sector: "Crypto", assetType: "Crypto", dividendYield: 0, expenseRatio: 0 },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: "No ticker provided" });

  const symbol = ticker.trim().toUpperCase();

  // Check hardcoded database first — instant, always works
  if (TICKER_DB[symbol]) {
    return res.status(200).json({ ...TICKER_DB[symbol], found: true, source: "database" });
  }

  // Fall back to Finnhub for unlisted tickers
  const key = process.env.FINNHUB_KEY;
  if (!key) return res.status(200).json({ found: false });

  try {
    const [profileRes, metricsRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${key}`),
      fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${key}`)
    ]);

    const profile = await profileRes.json();
    const metrics = await metricsRes.json();

    if (!profile || !profile.name) {
      return res.status(200).json({ found: false });
    }

    const sector = mapSector(profile.finnhubIndustry || "", profile.name, symbol);
    const assetType = profile.name?.toLowerCase().includes("etf") || profile.name?.toLowerCase().includes("fund") ? "ETF" : "Stock";
    const dividendYield = parseFloat((metrics?.metric?.dividendYieldIndicatedAnnual || 0).toFixed(2));

    return res.status(200).json({
      name: profile.name,
      sector,
      assetType,
      dividendYield,
      expenseRatio: 0,
      found: true,
      source: "finnhub"
    });
  } catch (err) {
    return res.status(200).json({ found: false });
  }
}

function mapSector(ind, name, symbol) {
  const i = ind.toLowerCase();
  const n = (name || "").toLowerCase();
  if (n.includes("etf") || n.includes("fund") || n.includes("trust")) return "ETF - Broad Market";
  if (i.includes("tech") || i.includes("software") || i.includes("semiconductor")) return "Technology";
  if (i.includes("health") || i.includes("pharma") || i.includes("biotech")) return "Healthcare";
  if (i.includes("bank") || i.includes("financ") || i.includes("insurance")) return "Financials";
  if (i.includes("retail") || i.includes("consumer") || i.includes("food")) return "Consumer";
  if (i.includes("energy") || i.includes("oil") || i.includes("gas")) return "Energy";
  if (i.includes("util")) return "Utilities";
  if (i.includes("material") || i.includes("mining")) return "Materials";
  if (i.includes("industrial") || i.includes("aerospace")) return "Industrials";
  if (i.includes("real estate") || i.includes("reit")) return "Real Estate";
  if (i.includes("media") || i.includes("telecom") || i.includes("communication")) return "Communication";
  return "Technology";
}

