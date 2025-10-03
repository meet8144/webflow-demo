const fetch = require("node-fetch");

exports.handler = async function (event, context) {
  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const BASE_ID = process.env.AIRTABLE_BASE_ID;

    // Get table and view from query params
    const tableName = event.queryStringParameters?.table;
    const viewName = event.queryStringParameters?.view || "Grid view";

    if (!tableName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Table name is required" })
      };
    }

    const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tableName)}?view=${encodeURIComponent(viewName)}`;

    let allRecords = [];
    let offset;

    // Loop through pages
    do {
      const res = await fetch(offset ? `${url}&offset=${offset}` : url, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
      });
      const data = await res.json();
      allRecords = allRecords.concat(data.records);
      offset = data.offset;
    } while (offset);

    // Extract city field & remove duplicates
    const cities = allRecords
      .map(record => record.fields.city)
      .filter(Boolean);

    const uniqueCities = [...new Set(cities)];

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(uniqueCities)
    };
    
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
