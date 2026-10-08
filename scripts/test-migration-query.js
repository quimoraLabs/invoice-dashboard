import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import admin from "firebase-admin";

const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

const db = admin.firestore();
const userId = process.argv[2] || process.env.TEST_USER_ID;

if (!userId) {
  console.error("❌ Please provide a user ID: node scripts/test-migration-query.js <userId>");
  process.exit(1);
}

async function testQueries() {
  const collections = ["invoices", "customers", "products"];
  
  for (const collName of collections) {
    try {
      const snap = await db.collection(collName).where("userId", "==", userId).get();
      console.log(`✅ ${collName}: ${snap.size} docs`);
    } catch (e) {
      console.error(`❌ ${collName}:`, e.code, e.message);
    }
  }
  
  try {
    const orgSnap = await db.collection("organizations").where("ownerId", "==", userId).limit(1).get();
    console.log(`✅ organizations: ${orgSnap.size} docs`);
  } catch (e) {
    console.error(`❌ organizations:`, e.code, e.message);
  }
  
  try {
    const profile = await db.collection("business_profiles").doc(userId).get();
    console.log(`✅ business_profiles: ${profile.exists ? "exists" : "not found"}`);
  } catch (e) {
    console.error(`❌ business_profiles:`, e.code, e.message);
  }
}

testQueries().then(() => process.exit(0));