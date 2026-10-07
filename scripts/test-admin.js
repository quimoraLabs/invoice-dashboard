import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import admin from "firebase-admin";

const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

console.log("=== Service Account Info ===");
console.log("Project ID:", sa.project_id);
console.log("Client Email:", sa.client_email);
console.log("Type:", sa.type);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa),
  });
}

console.log("=== Admin App Info ===");
console.log("App Project ID:", admin.app().options.projectId);

const db = admin.firestore();

try {
  const snap = await db.collection("invoices").limit(1).get();
  console.log("✅ Admin SDK working. Docs found:", snap.size);
} catch (e) {
  console.error("❌ Admin SDK failed:", e.code, e.message);
}