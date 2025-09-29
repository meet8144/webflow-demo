// netlify/functions/airtable-proxy.js
export async function handler(event, context) {
  try {
    const params = event.queryStringParameters || {};

    // Table name
    const tableName = params.table || "All Events";
    const encodedTable = encodeURIComponent(tableName);

    // Airtable credentials
    const baseId = process.env.AIRTABLE_BASE_ID;
    const apiKey = process.env.AIRTABLE_API_KEY;

    if (!baseId || !apiKey) throw new Error("Airtable Base ID or API Key is missing");

    let url = `https://api.airtable.com/v0/${baseId}/${encodedTable}?`;

    // Build filterByFormula dynamically
    const conditions = [];

    // Total Charged Amount filter
    conditions.push(`{Total Charged Amount} >= 0`);
    conditions.push(`{Total Charged Amount} <= 99999999999999`);

    // OR conditions: city or bypass
    const orParts = [];
    if (params.city) orParts.push(`{Event City} = "${params.city}"`);
    if (params.bypass === "1") orParts.push(`{Universal Event Bypass} = TRUE()`);
    if (orParts.length) conditions.push(`OR(${orParts.join(",")})`);

    const formula = conditions.length ? `AND(${conditions.join(",")})` : null;

    // Include other query params (excluding table, city, bypass)
    const queryParams = Object.entries(params)
      .filter(([key, val]) => !["table", "city", "bypass"].includes(key) && val)
      .map(([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`);

    if (formula) queryParams.push(`filterByFormula=${encodeURIComponent(formula)}`);

    url += queryParams.join("&");

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
      headers: { "Access-Control-Allow-Origin": "*" },
    };
  } catch (err) {
    console.error("Error in Airtable Proxy:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
      headers: { "Access-Control-Allow-Origin": "*" },
    };
  }
}
