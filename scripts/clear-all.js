import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(sa),
      });
    } catch {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
}

export const db = admin.firestore();

// Parse CLI Flags
export function parseArgs() {
  const flags = {
    confirm: false,
    keepProfiles: false,
  };

  for (const arg of process.argv.slice(2)) {
    if (arg === "--confirm") {
      flags.confirm = true;
    } else if (arg === "--keep-profiles") {
      flags.keepProfiles = true;
    }
  }

  return flags;
}

const ALL_COLLECTIONS = [
  "invoices",
  "customers",
  "products",
  "business_profiles",
  "workspaces",
  "workspace_members",
  "workspace_invites",
];

async function clearCollection(collName) {
  let totalDeleted = 0;
  let batchIndex = 0;

  while (true) {
    const snapshot = await db.collection(collName).limit(500).get();
    if (snapshot.empty) break;

    batchIndex++;
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    totalDeleted += snapshot.size;
    console.log(
      `   Batch ${batchIndex}: deleted ${snapshot.size} docs from '${collName}' (running total: ${totalDeleted})`
    );
  }

  return totalDeleted;
}

export async function main() {
  const flags = parseArgs();
  const collections = flags.keepProfiles
    ? ALL_COLLECTIONS.filter((c) => c !== "business_profiles")
    : ALL_COLLECTIONS;

  console.log("==================================================");
  console.log("🔥 FIRESTORE COMPLETE DATABASE RESET SCRIPT");
  console.log("==================================================");

  if (flags.keepProfiles) {
    console.log("ℹ️  Flag '--keep-profiles' active: skipping 'business_profiles'");
  }

  const projectId = db.projectId || process.env.VITE_FIREBASE_PROJECT_ID || "unknown";
  console.log(`🎯 Target Firebase Project: ${projectId}`);

  // Step 1: Pre-deletion document counting
  console.log("\n📊 Document counts per collection:");
  const counts = {};
  let totalDocsFound = 0;

  for (const collName of collections) {
    const snapshot = await db.collection(collName).get();
    counts[collName] = snapshot.size;
    totalDocsFound += snapshot.size;
    console.log(` - ${collName}: ${snapshot.size} docs`);
  }

  console.log(`\nTotal documents across target collections: ${totalDocsFound}`);

  // Step 2: Safety Check
  if (!flags.confirm) {
    console.log(`\n⚠️  WARNING: This will PERMANENTLY DELETE all data in project '${projectId}'.`);
    console.log("⚠️  Run with '--confirm' to proceed with deletion:");
    console.log("    npm run clear:all -- --confirm");
    if (flags.keepProfiles) {
      console.log("    npm run clear:all -- --confirm --keep-profiles");
    }
    console.log("\nDry-run complete. No documents were deleted.\n");
    return;
  }

  // Step 3: Deletion execution
  console.log("\n🚨 Confirmation received (--confirm). Starting deletion...\n");

  const summary = {};
  for (const collName of collections) {
    if (counts[collName] === 0) {
      console.log(`⏭️  Skipping '${collName}' (0 docs)`);
      summary[collName] = 0;
      continue;
    }

    console.log(`🗑️  Deleting collection: '${collName}'...`);
    const deletedCount = await clearCollection(collName);
    summary[collName] = deletedCount;
    console.log(`✅ Finished '${collName}': deleted ${deletedCount} docs\n`);
  }

  // Step 4: Summary Report
  console.log("==================================================");
  console.log("🏁 DELETION SUMMARY");
  console.log("==================================================");
  let totalDeletedAll = 0;
  for (const [coll, count] of Object.entries(summary)) {
    console.log(` - ${coll}: ${count} deleted`);
    totalDeletedAll += count;
  }
  console.log(`\n🎉 Done! Total deleted documents: ${totalDeletedAll}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error running clear script:", err);
    process.exit(1);
  });
