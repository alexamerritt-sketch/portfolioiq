export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ valid: false });

  const { licenseKey, accessToken } = req.body;

  // Backup keys — always valid
  const BACKUP_KEYS = [
    "C8C838B5-3E8A46A5-9DB3B785-A93940AB",
    "9A77C2F6-54A748D4-AACEF75D-6716BF1E",
    "D82AA148-E6F24034-A7E53844-25F67124",
  ];

  // Check backup keys
  if (licenseKey && BACKUP_KEYS.includes(licenseKey.trim().toUpperCase())) {
    return res.status(200).json({ valid: true });
  }

  // Verify Whop access token (from OAuth flow)
  if (accessToken) {
    try {
      const memberRes = await fetch("https://api.whop.com/v5/me/memberships", {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      const memberData = await memberRes.json();
      const memberships = memberData.data || [];
      const hasAccess = memberships.some(m => m.status === "active");
      if (hasAccess) return res.status(200).json({ valid: true });
    } catch (err) {
      console.error("Token verify error:", err);
    }
  }

  // Verify Whop license key
  if (licenseKey) {
    try {
      const response = await fetch("https://api.whop.com/api/v2/memberships/validate_license", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.WHOP_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          license_key: licenseKey.trim(),
          product_id: "portfolioiq-b9"
        })
      });
      const data = await response.json();
      if (data.valid || data.status === "active") {
        return res.status(200).json({ valid: true });
      }
    } catch (err) {
      console.error("License verify error:", err);
    }
  }

  return res.status(200).json({ valid: false });
}

