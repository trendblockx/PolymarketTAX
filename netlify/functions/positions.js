exports.handler = async (event) => {
  const address = event.queryStringParameters?.address;

  if (!address) {
    return { statusCode: 400, body: JSON.stringify({ error: "Address required" }) };
  }

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  // Try Data API first
  try {
    const res = await fetch(
      `https://data-api.polymarket.com/positions?user=${address}&limit=500`
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return { statusCode: 200, headers, body: JSON.stringify(data) };
      }
    }
  } catch (_) {}

  // Fallback to Gamma API
  try {
    const res2 = await fetch(
      `https://gamma-api.polymarket.com/positions?user_address=${address}&limit=500`
    );
    if (res2.ok) {
      const data2 = await res2.json();
      return { statusCode: 200, headers, body: JSON.stringify(data2) };
    }
  } catch (_) {}

  return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to fetch positions from Polymarket" }) };
};
