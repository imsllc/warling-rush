const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(
  path.join(root, "warling_rush_privacy.html"),
  "utf8",
);
const article = html.match(/<article>([\s\S]*?)<\/article>/)[1];
const text = (value) =>
  value
    .replace(/<br\s*\/?\s*>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .trim();
const blocks = [...article.matchAll(/<(h2|p|li)\b[^>]*>([\s\S]*?)<\/\1>/g)].map(
  ([, type, content]) => ({ type, text: text(content) }),
);
const output =
  JSON.stringify(
    { updated: text(html.match(/<p class="date">([\s\S]*?)<\/p>/)[1]), blocks },
    null,
    2,
  ) + "\n";
const file = path.join(root, "src/privacyPolicy.json");
if (process.argv.includes("--check")) {
  if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== output)
    throw new Error(
      "Run npm run privacy:generate to synchronize the in-app privacy policy.",
    );
} else fs.writeFileSync(file, output);
