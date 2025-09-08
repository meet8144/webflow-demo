export async function handler(event, context) {
  const cors = {
    "Access-Control-Allow-Origin": "*",                // or "http://localhost"
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // --- handle preflight ---
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: cors, body: "" };
  }

  try {
    const params = event.queryStringParameters || {};
    const tableName = params.table || "All Events";
    const viewName  = params.view  || "All Events";

    const encodedTable = encodeURIComponent(tableName);
    const encodedView  = encodeURIComponent(viewName);

    const baseId = "app3cnkgCHioDIU3j";
    const apiKey = "patm9uj52ZjZicUUT.1c872666f73d4a893c2d682dd297217be8bbe4c7cd5088222309470c6075964a";

    const url = `https://api.airtable.com/v0/${baseId}/${encodedTable}?view=${encodedView}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    });

    const data = await response.json();

    return {
      statusCode: 200,
      headers: { ...cors, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
