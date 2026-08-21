const apiBase = (process.env.BRIEFS_API_URL ?? "http://localhost:8001").replace(/\/$/, "");
const userId = process.env.BRIEFS_USER_ID ?? "demo";

async function request(path, options = {}) {
  const response = await fetch(apiBase + path, {
    ...options,
    headers: {
      "X-Briefs-User-Id": userId,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(response.status + ": " + JSON.stringify(body));
  }
  return body;
}

const created = await request("/api/v1/items", {
  method: "POST",
  body: JSON.stringify({
    name: "Developer example " + new Date().toISOString(),
    kind: "task",
    description: "Created by the Briefs REST example.",
  }),
});

const item = created.item;
const history = await request("/api/v1/items/" + item.id + "/activities");

console.log(JSON.stringify({ item, activities: history.activities }, null, 2));
