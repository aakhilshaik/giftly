# Wiring up GitHub-based signup capture

This replaces Formspree with your own setup: the form posts to a small
Cloudflare Worker (free), which writes each signup as a row into a JSON
file inside your GitHub repo.

## 1. Create the data file in your GitHub repo

In the same repo where you'll host `landing.html`, create a file at:

    data/signups.json

with this exact starting content:

    []

Commit it. This is the "spreadsheet" the Worker will append rows to.

## 2. Create a GitHub Personal Access Token (fine-grained, scoped down)

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens.
2. Click "Generate new token."
3. Under "Repository access," choose "Only select repositories" and pick just this one repo. Don't give it access to anything else.
4. Under "Permissions" → "Repository permissions," set **Contents: Read and write**. Leave everything else as "No access."
5. Generate the token and copy it somewhere safe — you won't be able to see it again. You'll paste it into Cloudflare in step 4, never into your HTML/JS.

## 3. Deploy the Worker on Cloudflare (free tier)

1. Sign up at https://dash.cloudflare.com (free).
2. Go to Workers & Pages → Create → Create Worker.
3. Give it a name (e.g. `giftly-signup`), deploy the default template first, then click "Edit code."
4. Delete the placeholder code and paste in the contents of `worker.js` (provided alongside this file).
5. Save and deploy.

## 4. Add your secrets to the Worker

In the Worker's dashboard: Settings → Variables and Secrets → Add.

Add these (mark `GITHUB_TOKEN` as "Encrypt" so it's a secret, not plaintext):

| Name          | Value                                      |
|---------------|---------------------------------------------|
| GITHUB_TOKEN  | the token you generated in step 2            |
| GITHUB_OWNER  | your GitHub username or org                  |
| GITHUB_REPO   | the repo name                                |
| GITHUB_PATH   | `data/signups.json`                          |

Save — this triggers a redeploy with the secrets available.

## 5. Get your Worker's URL

After deploying, Cloudflare gives you a URL like:

    https://giftly-signup.yourname.workers.dev

## 6. Point the landing page at it

In `landing.html`, find this line:

    const FORMSPREE_ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID";

Replace it with:

    const FORMSPREE_ENDPOINT = "https://giftly-signup.yourname.workers.dev";

(Keeping the variable name is fine — it's just pointing somewhere new.)

## 7. Test it

Open the page, submit a test email through both forms, then check
`data/signups.json` in your GitHub repo — you should see new commits
with rows appended, each with an email, signup_type, and timestamp.

## Notes

- This is fully free at this scale: GitHub is free for public/private repos,
  Cloudflare Workers' free tier covers 100,000 requests/day.
- Every signup creates a small commit to your repo — that's expected, it's
  how the "spreadsheet" gets updated. If you'd rather not see a growing
  commit history, GitHub Issues (one issue per signup, no repeated commits
  to a single file) is the alternative we discussed earlier.
- If two people submit at the exact same second, there's a small chance
  of a write conflict (GitHub rejects the second write because the file
  changed underneath it). At waitlist-signup volumes this is very unlikely,
  but if you ever see failed submissions in a burst, that's why — the fix
  would be adding a retry-on-conflict loop to the Worker.
