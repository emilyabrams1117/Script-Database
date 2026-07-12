const { GoogleAuth } = require("google-auth-library");
const path = require("path");
const fs = require("fs");

async function main() {
  const auth = new GoogleAuth({
    keyFile: path.join(__dirname, "..", "..", "app", "credentials", "drive-service-account.json"),
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  const client = await auth.getClient();

  let pageToken;
  const files = [];
  let pages = 0;
  do {
    const res = await client.request({
      url: `https://www.googleapis.com/drive/v3/files?pageSize=1000&fields=nextPageToken,files(id,name,mimeType,parents,size)${pageToken ? `&pageToken=${pageToken}` : ""}`,
    });
    files.push(...res.data.files);
    pageToken = res.data.nextPageToken;
    pages++;
    console.error(`page ${pages}: ${files.length} files so far`);
  } while (pageToken);

  const outPath = path.join(__dirname, "drive_files.json");
  fs.writeFileSync(outPath, JSON.stringify(files, null, 2));
  console.error(`Done. ${files.length} total files written to ${outPath}`);

  const pdfs = files.filter((f) => f.mimeType === "application/pdf");
  console.error(`Of which ${pdfs.length} are PDFs`);
}

main().catch((err) => {
  console.error("ERROR:", err.response?.data || err.message);
  process.exit(1);
});
