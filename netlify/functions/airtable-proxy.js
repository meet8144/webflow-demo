// netlify/functions/airtable-proxy.js
export async function handler(event, context) {
  try {
    const params = event.queryStringParameters || {};

    // Airtable credentials
    const baseId = process.env.AIRTABLE_BASE_ID;
    const apiKey = process.env.AIRTABLE_API_KEY;
    if (!baseId || !apiKey) throw new Error("Airtable Base ID or API Key is missing");

    // Table name (default "All Events")
    const tableName = params.table || "All Events";
    const encodedTable = encodeURIComponent(tableName);

    let url = `https://api.airtable.com/v0/${baseId}/${encodedTable}?`;

    // Build filterByFormula
    let formula = null;
    if (params.filterByFormula) {
      // Use custom formula from URL if provided
      formula = params.filterByFormula;
    } else {
      // Build formula dynamically
      const conditions = [];

      // Total Charged Amount range
      conditions.push(`{Total Charged Amount} >= 0`);
      conditions.push(`{Total Charged Amount} <= 99999999999999`);

      // OR conditions: city or bypass
      const orParts = [];
      if (params.city) orParts.push(`{Event City} = "${params.city}"`);
      if (params.bypass === "1") orParts.push(`{Universal Event Bypass} = TRUE()`);
      if (orParts.length) conditions.push(`OR(${orParts.join(",")})`);

      // Optional date filter (expects YYYY-MM-DD)
      if (params.date) {
        const isoDate = `${params.date}T00:00:00.000Z`;
        conditions.push(`IS_SAME({Event Date}, "${isoDate}", 'day')`);
      }

      if (conditions.length) formula = `AND(${conditions.join(",")})`;
    }

    // Build query string
    const queryParams = [];

    // Include view if provided
    if (params.view) queryParams.push(`view=${encodeURIComponent(params.view)}`);

    // Include other params except table, city, bypass, filterByFormula, date, view
    const excluded = ["table", "city", "bypass", "filterByFormula", "date", "view"];
    Object.entries(params)
      .filter(([key, val]) => !excluded.includes(key) && val)
      .forEach(([key, val]) => {
        queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
      });

    // Add formula
    if (formula) queryParams.push(`filterByFormula=${encodeURIComponent(formula)}`);

    url += queryParams.join("&");

    console.log("Fetching Airtable URL:", url);

    // Fetch from Airtable
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