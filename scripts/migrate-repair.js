import { db, rateLimitedClerkUpdate, withRetry } from "./migrate-helpers.js";

/**
 * Standalone Clerk Recovery Mode (--repair-clerk)
 * Reads Firestore for existing user workspaces and re-applies private_metadata updates.
 * Zero Firestore writes.
 */
export async function runClerkRepair({ userArg, isDryRun }) {
  console.log(`\n🔧 Running Standalone Clerk Metadata Repair Mode [Dry-Run: ${isDryRun}]`);

  // Support workspaces (primary) with fallback to legacy organizations
  let wsSnapshot = await db.collection("workspaces").get();
  if (wsSnapshot.empty) {
    wsSnapshot = await db.collection("organizations").get();
  }
  console.log(`📦 Found ${wsSnapshot.size} total workspaces in Firestore`);

  let repairedCount = 0;
  const errors = [];

  for (const wsDoc of wsSnapshot.docs) {
    const wsData = wsDoc.data();
    const workspaceId = wsDoc.id;
    const ownerId = wsData.ownerId;

    if (!ownerId) continue;
    if (userArg && ownerId !== userArg) continue;

    try {
      console.log(`  🔄 Repairing metadata for User ${ownerId} -> Workspace: ${workspaceId}`);
      if (!isDryRun) {
        await withRetry(() =>
          rateLimitedClerkUpdate(ownerId, {
            activeWorkspaceId: workspaceId,
            activeRole: "owner",
            activeOrgId: workspaceId, // Backward compat alias
          })
        );
      }
      repairedCount++;
    } catch (err) {
      console.error(`  ❌ Failed repairing Clerk user ${ownerId}:`, err.message);
      errors.push({ userId: ownerId, workspaceId, error: err.message });
    }
  }

  console.log(`\n🎉 Clerk Metadata Repair Complete. Successfully repaired ${repairedCount} users.`);
  if (errors.length > 0) {
    console.warn(`⚠️ Encountered ${errors.length} errors during repair.`);
  }

  return { repairedCount, errors };
}
