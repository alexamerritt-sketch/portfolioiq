export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { licenseKey } = req.body;
  if (!licenseKey) return res.status(400).json({ error: "No license key provided" });

  try {
    const response = await fetch("https://api.gumroad.com/v2/licenses/verify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        product_permalink: "portfolio-health-checker",
        license_key: licenseKey,
        increment_uses_count: "false"
      })
    });
    const data = await response.json();
    if (data.success) {
      return res.status(200).json({ valid: true });
    } else {
      return res.status(200).json({ valid: false });
    }
  } catch (err) {
    return res.status(500).json({ error: "Verification failed" });
  }
}