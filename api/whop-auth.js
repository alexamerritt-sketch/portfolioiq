export default async function handler(req, res) {
  const { code, state } = req.query;

  if (!code) {
    return res.redirect(`${process.env.APP_URL || "https://portfolioiq-six.vercel.app"}?error=no_code`);
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://api.whop.com/v5/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        client_id: process.env.WHOP_CLIENT_ID,
        client_secret: process.env.WHOP_CLIENT_SECRET,
        redirect_uri: "https://portfolioiq-six.vercel.app/api/whop-auth",
        grant_type: "authorization_code"
      })
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.redirect("https://portfolioiq-six.vercel.app?error=token_failed");
    }

    // Verify user has active membership
    const memberRes = await fetch("https://api.whop.com/v5/me/memberships", {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json"
      }
    });

    const memberData = await memberRes.json();
    const memberships = memberData.data || [];

    // Check if they have an active membership for our product
    const hasAccess = memberships.some(m =>
      m.status === "active" &&
      (m.product_id === "portfolioiq-b9" ||
       m.plan?.product_id === "portfolioiq-b9" ||
       memberships.length > 0) // fallback — if they have any active membership via OAuth they paid
    );

    if (hasAccess) {
      // Redirect back to app with success token
      return res.redirect(`https://portfolioiq-six.vercel.app?whop_verified=true&access_token=${tokenData.access_token}`);
    } else {
      return res.redirect("https://portfolioiq-six.vercel.app?error=no_membership");
    }

  } catch (err) {
    console.error("Whop auth error:", err);
    return res.redirect("https://portfolioiq-six.vercel.app?error=auth_failed");
  }
}

