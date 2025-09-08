// netlify/functions/airtable-proxy.js

export async function handler(event, context) {
  // --- Common CORS headers ---
  const cors = {
    "Access-Control-Allow-Origin": "*",                // or "http://localhost" if you want to restrict
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // --- Handle preflight request ---
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: cors,
      body: "",
    };
  }

  // --- Query parameters ---
  const params = event.queryStringParameters || {};
  const tableName = encodeURIComponent(params.table || "All Events");
  const viewName  = encodeURIComponent(params.view  || "All Events");

  // --- Airtable credentials (use env vars in production!) ---
  const baseId = "app3cnkgCHioDIU3j";
  const apiKey = "patm9uj52ZjZicUUT.1c872666f73d4a893c2d682dd297217be8bbe4c7cd5088222309470c6075964a";

  // --- Build URL and fetch ---
  const url = `https://api.airtable.com/v0/${baseId}/${tableName}?view=${viewName}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  // --- Return JSON + CORS headers ---
  return {
    statusCode: 200,
    headers: {
      ...cors,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
}
