import crypto from "crypto";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) {
    return res.status(500).json({
      error: "Missing IMAGEKIT_PRIVATE_KEY on server. Please configure it in your environment.",
    });
  }

  try {
    const token = req.query?.token || crypto.randomUUID();
    const expire = Math.floor(Date.now() / 1000) + 1800; // 30 minutes validity
    const signature = crypto
      .createHmac("sha1", privateKey)
      .update(token + expire)
      .digest("hex");

    return res.status(200).json({
      token,
      expire,
      signature,
    });
  } catch (err) {
    console.error("Error generating ImageKit authentication parameters:", err);
    return res.status(500).json({
      error: "Failed to generate ImageKit authentication parameters",
      details: err.message,
    });
  }
}
