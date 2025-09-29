// netlify/functions/airtable-proxy.js
export async function handler(event, context) {
  try {
    const params = event.queryStringParameters || {};

    // Required pieces
    const tableName = params.table || "All Events";
    const encodedTable = encodeURIComponent(tableName);

    const baseId = process.env.AIRTABLE_BASE_ID;
    const apiKey = process.env.AIRTABLE_API_KEY;

    if (!baseId || !apiKey) {
      throw new Error("Airtable Base ID or API Key is missing");
    }

    // Start URL
    let url = `https://api.airtable.com/v0/${baseId}/${encodedTable}`;

    // --- Build filterByFormula dynamically ---
    let formula = null;
    if (params.date || params.city || params.bypass) {
      const date = params.date ? `"${params.date}"` : null;
      const city = params.city ? `"${params.city}"` : null;
      const bypass = params.bypass === "1";

      const conditions = [
        date ? `IS_SAME({Event Date}, ${date}, 'day')` : null,
        `{Total Charged Amount} >= 15`,
        `{Total Charged Amount} <= 999999999`,
      ].filter(Boolean);

      // city OR bypass logic
      if (city || bypass) {
        const orParts = [];
        if (city) orParts.push(`{Event City} = ${city}`);
        if (bypass) orParts.push(`{Universal Event Bypass} = 1`);
        conditions.push(`OR(${orParts.join(", ")})`);
      }

      formula = `AND(${conditions.join(", ")})`;
    }

    // Build query string
    let first = true;
    for (const [key, value] of Object.entries(params)) {
      if (["table", "date", "city", "bypass"].includes(key) || !value) continue;
      url += first
        ? `?${encodeURIComponent(key)}=${encodeURIComponent(value)}`
        : `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      first = false;
    }

    // Append formula if created
    if (formula) {
      url += first
        ? `?filterByFormula=${encodeURIComponent(formula)}`
        : `&filterByFormula=${encodeURIComponent(formula)}`;
    }

    console.log("Fetching Airtable URL:", url);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Airtable API error: ${response.status} - ${text}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    };
  } catch (err) {
    console.error("Error in Airtable Proxy:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    };
  }
}
