import { db, rateLimitedClerkUpdate, withRetry } from "./migrate-helpers.js";

/**
 * Standalone Clerk Recovery Mode (--repair-clerk)
 * Reads Firestore for existing user organizations and only re-applies private_metadata updates.
 * Zero Firestore writes.
 */
export async function runClerkRepair({ userArg, isDryRun }) {
  console.log(`\n🔧 Running Standalone Clerk Metadata Repair Mode [Dry-Run: ${isDryRun}]`);

  const orgsSnapshot = await db.collection("organizations").get();
  console.log(`📦 Found ${orgsSnapshot.size} total organizations in Firestore`);

  let repairedCount = 0;
  const errors = [];

  for (const orgDoc of orgsSnapshot.docs) {
    const orgData = orgDoc.data();
    const orgId = orgDoc.id;
    const ownerId = orgData.ownerId;

    if (!ownerId) continue;
    if (userArg && ownerId !== userArg) continue;

    try {
      console.log(`  🔄 Repairing metadata for User ${ownerId} -> Org: ${orgId}`);
      if (!isDryRun) {
        await withRetry(() =>
          rateLimitedClerkUpdate(ownerId, {
            activeOrgId: orgId,
            activeRole: "owner"
          })
        );
      }
      repairedCount++;
    } catch (err) {
      console.error(`  ❌ Failed repairing Clerk user ${ownerId}:`, err.message);
      errors.push({ userId: ownerId, orgId, error: err.message });
    }
  }

  console.log(`\n🎉 Clerk Metadata Repair Complete. Successfully repaired ${repairedCount} users.`);
  if (errors.length > 0) {
    console.warn(`⚠️ Encountered ${errors.length} errors during repair.`);
  }

  return { repairedCount, errors };
}
