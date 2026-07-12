const { GoogleAuth } = require("google-auth-library");
const path = require("path");

const ids = [
  "1kZYT3GU2sh-fSKLktfELulfqbvZD-VFL",
  "1SUSOcasGgrpBrZXsFaZGLMQryaZtM0oW",
  "1IiGIpvuzR8K3741BVs5X6U3dkRHIAqAz",
  "1v3nivwRJS9Ct03rdkSNK6rNq3qLiz5YR",
  "1AaIzUJZYmwF8oe9__U0PoFmBOH-Qhuz9",
  "1P7KOrQwlJ7sbKYXBWGXTjrnhvLvCr1Xk",
  "173criVkhZII7BKJk15hA5etr9H0E-fZ9",
  "1b8wEpdOrjjWQOpXrPvRXKhaEGIvk1Ob0",
];

async function main() {
  const auth = new GoogleAuth({
    keyFile: path.join(__dirname, "..", "..", "app", "credentials", "drive-service-account.json"),
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  const client = await auth.getClient();

  // Also try listing anything the service account can see at all
  try {
    const listRes = await client.request({
      url: `https://www.googleapis.com/drive/v3/files?pageSize=10&fields=files(id,name)`,
    });
    console.log("Files visible to service account:", JSON.stringify(listRes.data, null, 2));
  } catch (err) {
    console.log("List error:", err.response?.data || err.message);
  }

  for (const fileId of ids) {
    try {
      const res = await client.request({
        url: `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size`,
      });
      console.log("OK:", fileId, "->", res.data.name);
    } catch (err) {
      console.log("FAIL:", fileId, "->", err.response?.data?.error?.message || err.message);
    }
  }
}

main().catch((err) => {
  console.error("ERROR:", err.response?.data || err.message);
  process.exit(1);
});
