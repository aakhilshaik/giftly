/**
 * Cloudflare Worker: receives waitlist form submissions and appends them
 * as rows to a JSON file in a GitHub repo (spreadsheet-style storage).
 *
 * Required environment variables / secrets (set these in Cloudflare):
 *   GITHUB_TOKEN  - a fine-grained GitHub Personal Access Token, scoped to
 *                   ONLY the target repo, with "Contents: Read and write" permission.
 *   GITHUB_OWNER  - your GitHub username or org (e.g. "yourname")
 *   GITHUB_REPO   - the repo name (e.g. "giftly-landing")
 *   GITHUB_PATH   - path to the JSON file in that repo (e.g. "data/signups.json")
 */

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    let email, signup_type;
    try {
      const formData = await request.formData();
      email = (formData.get("email") || "").toString().trim();
      signup_type = (formData.get("signup_type") || "").toString().trim();
    } catch (err) {
      return json({ error: "Could not parse form data" }, 400);
    }

    if (!email || !signup_type) {
      return json({ error: "Missing email or signup_type" }, 400);
    }
    // Very basic email sanity check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Invalid email" }, 400);
    }

    const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_PATH } = env;
    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`;
    const ghHeaders = {
      "Authorization": `Bearer ${GITHUB_TOKEN}`,
      "User-Agent": "giftly-signup-worker",
      "Accept": "application/vnd.github+json",
    };

    try {
      // 1. Read the current file (need its sha to update it)
      const getRes = await fetch(apiUrl, { headers: ghHeaders });
      if (!getRes.ok) {
        const detail = await getRes.text();
        return json({ error: "Could not read signups file", detail }, 500);
      }
      const fileData = await getRes.json();
      const sha = fileData.sha;
      const currentJson = JSON.parse(decodeBase64Utf8(fileData.content));

      // 2. Append the new signup
      currentJson.push({
        email,
        signup_type,
        timestamp: new Date().toISOString(),
      });

      // 3. Write the updated file back
      const newContent = encodeBase64Utf8(JSON.stringify(currentJson, null, 2));
      const putRes = await fetch(apiUrl, {
        method: "PUT",
        headers: { ...ghHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `New ${signup_type} signup: ${email}`,
          content: newContent,
          sha,
        }),
      });

      if (!putRes.ok) {
        const detail = await putRes.text();
        return json({ error: "Could not save signup", detail }, 500);
      }

      return json({ success: true });
    } catch (err) {
      return json({ error: "Unexpected error", detail: err.message }, 500);
    }
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: corsHeaders({ "Content-Type": "application/json" }),
  });
}

function corsHeaders(extra = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    ...extra,
  };
}

function decodeBase64Utf8(base64) {
  const binary = atob(base64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

function encodeBase64Utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}
