exports.handler = async function (event) {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: ""
    };
  }

  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const BASE_ID = process.env.AIRTABLE_BASE_ID;

    const tableName = event.queryStringParameters?.table;
    const viewName = event.queryStringParameters?.view || "Grid view";
    const columnName = event.queryStringParameters?.column || "city"; // default to 'city'

    if (!tableName) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Table name is required" })
      };
    }

    let url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tableName)}?view=${encodeURIComponent(viewName)}`;
    let allRecords = [];
    let offset;

    do {
      const res = await fetch(offset ? `${url}&offset=${offset}` : url, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
      });
      const data = await res.json();
      if (data.records) allRecords = allRecords.concat(data.records);
      offset = data.offset;
    } while (offset);

    // Use dynamic column name
    const values = allRecords.map(r => r.fields[columnName]).filter(Boolean);
    const uniqueValues = [...new Set(values)];

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(uniqueValues)
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message })
    };
  }
};
