// netlify/functions/airtable-proxy.js
export async function handler(event, context) {
  try {
    const params = event.queryStringParameters || {};

    // Required pieces
    const tableName = params.table || "All Events";
    const encodedTable = encodeURIComponent(tableName);

    const baseId = "app3cnkgCHioDIU3j"; // process.env.AIRTABLE_BASE_ID
    const apiKey =
      "patm9uj52ZjZicUUT.1c872666f73d4a893c2d682dd297217be8bbe4c7cd5088222309470c6075964a"; // process.env.AIRTABLE_API_KEY

    if (!baseId || !apiKey) {
      throw new Error("Airtable Base ID or API Key is missing");
    }

    // Start URL
    let url = `https://api.airtable.com/v0/${baseId}/${encodedTable}`;

    // Build query string using & for every non-empty param (skip "table")
    let first = true;
    for (const [key, value] of Object.entries(params)) {
      if (key === "table" || !value) continue;
      url += first ? `?${encodeURIComponent(key)}=${encodeURIComponent(value)}` 
                   : `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      first = false;
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
