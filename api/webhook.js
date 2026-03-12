export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
 
  try {
    const event = req.body;
    const eventType = event?.type;
 
    // Zajímá nás pouze nová registrace
    if (eventType !== "user.created") {
      return res.status(200).json({ received: true });
    }
 
    const user = event?.data;
    const email = user?.email_addresses?.[0]?.email_address || "neznámý email";
    const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Neznámý uživatel";
    const userId = user?.id || "";
    const createdAt = new Date(user?.created_at).toLocaleString("cs-CZ");
 
    // Pošli email přes Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: "vasik.kraus@gmail.com",
        subject: `📈 Nový uživatel čeká na schválení – ${email}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #060d1a; color: #e2e8f0; border-radius: 16px;">
            <h2 style="color: #3b82f6; margin: 0 0 24px;">📈 Stock Analyzer Pro</h2>
            <h3 style="margin: 0 0 16px; font-size: 18px;">Nový uživatel čeká na schválení</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #4e6080; width: 120px;">Jméno:</td>
                <td style="padding: 8px 0; font-weight: 700;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #4e6080;">Email:</td>
                <td style="padding: 8px 0; font-weight: 700; color: #3b82f6;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #4e6080;">Registrace:</td>
                <td style="padding: 8px 0;">${createdAt}</td>
              </tr>
            </table>
            <div style="margin-top: 24px; padding: 16px; background: #0b1628; border-radius: 10px; border: 1px solid #1a2d4a;">
              <p style="margin: 0 0 12px; color: #4e6080; font-size: 13px;">Jak schválit uživatele:</p>
              <ol style="margin: 0; padding-left: 20px; color: #94a3b8; font-size: 13px; line-height: 1.8;">
                <li>Jdi na <a href="https://dashboard.clerk.com" style="color: #3b82f6;">dashboard.clerk.com</a></li>
                <li>Klikni na <strong>Users</strong> → najdi <strong>${email}</strong></li>
                <li>Otevři <strong>Public metadata</strong></li>
                <li>Vlož: <code style="background: #0f1e35; padding: 2px 6px; border-radius: 4px;">{"approved": true}</code></li>
              </ol>
            </div>
          </div>
        `,
      }),
    });
 
    if (!response.ok) {
      const error = await response.text();
      console.error("Resend error:", error);
      return res.status(500).json({ error: "Failed to send email" });
    }
 
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({ error: err.message });
  }
}
