import { db, admin, clerk, rateLimitedClerkUpdate, withRetry } from "./migrate-helpers.js";
import { runClerkRepair } from "./migrate-repair.js";
import fs from "fs";

function parseDateToTimestamp(rawDate) {
  if (!rawDate) return null;
  if (rawDate instanceof admin.firestore.Timestamp) return rawDate;
  if (rawDate?.toDate) {
    const d = rawDate.toDate();
    return !isNaN(d.getTime()) ? admin.firestore.Timestamp.fromDate(d) : null;
  }
  const d = new Date(rawDate);
  if (!isNaN(d.getTime())) {
    return admin.firestore.Timestamp.fromDate(d);
  }
  return null;
}

async function runMigration() {
  const isRepairClerk = process.argv.includes("--repair-clerk");
  const isExecute = process.argv.includes("--execute");
  const isDryRun = !isExecute || process.argv.includes("--dry-run");
  const isVerbose = process.argv.includes("--verbose");
  const userArg = process.argv.find((a) => a.startsWith("--user="))?.split("=")[1];
  const limitArg = process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1];
  const userLimit = limitArg ? parseInt(limitArg, 10) : null;

  // Route to Clerk Repair Mode if requested
  if (isRepairClerk) {
    return await runClerkRepair({ userArg, isDryRun });
  }

  console.log(`🚀 Starting B2B Migration Script [Mode: ${isDryRun ? "DRY-RUN" : "LIVE EXECUTE"}]`);

  const report = {
    startTime: new Date().toISOString(),
    isDryRun,
    usersProcessed: 0,
    workspacesCreated: 0,
    membersCreated: 0,
    documentsStamped: { invoices: 0, customers: 0, products: 0 },
    profilesReseated: 0,
    errors: []
  };

  // 1. Fetch Target Users
  let users = [];
  if (userArg) {
    const singleUser = await clerk.users.getUser(userArg);
    users = [singleUser];
  } else {
    // Paginate all Clerk users in batches of 100
    let offset = 0;
    while (true) {
      const batch = await clerk.users.getUserList({ limit: 100, offset });
      if (!batch || (batch.data ? batch.data.length === 0 : batch.length === 0)) break;
      const userList = batch.data || batch;
      users.push(...userList);
      offset += 100;
      if (userLimit && users.length >= userLimit) {
        users = users.slice(0, userLimit);
        break;
      }
    }
  }

  console.log(`👥 Found ${users.length} target users to migrate.`);

  // 2. Process Each User
  for (const user of users) {
    const userId = user.id;
    const userLabel = user.firstName
      ? `${user.firstName} ${user.lastName || ""}`.trim()
      : user.emailAddresses?.[0]?.emailAddress || userId;

    try {
      console.log(`\n👤 Processing User: ${userLabel} (${userId})`);
      report.usersProcessed++;

      // Step A: Idempotent Workspace Provisioning
      const wsQuery = await db.collection("workspaces").where("ownerId", "==", userId).limit(1).get();
      let workspaceId;

      if (!wsQuery.empty) {
        workspaceId = wsQuery.docs[0].id;
        console.log(`  ℹ️ Workspace already exists: ${workspaceId}`);
      } else {
        const wsName = `${user.firstName ? user.firstName + "'s" : "My"} Business`;
        const now = admin.firestore.FieldValue.serverTimestamp();

        if (!isDryRun) {
          const wsRef = await db.collection("workspaces").add({
            name: wsName,
            ownerId: userId,
            createdAt: now,
            updatedAt: now
          });
          workspaceId = wsRef.id;

          // Create workspace_members doc
          const memberDocId = `${workspaceId}_${userId}`;
          await db.collection("workspace_members").doc(memberDocId).set({
            workspaceId,
            userId,
            email: user.emailAddresses?.[0]?.emailAddress?.toLowerCase() || "",
            displayName: userLabel,
            role: "owner",
            joinedAt: now,
            updatedAt: now
          });
        } else {
          workspaceId = `dry_run_ws_${userId.slice(-6)}`;
        }
        report.workspacesCreated++;
        report.membersCreated++;
        console.log(`  ✅ Created Workspace & Owner Member: ${workspaceId}`);
      }

      // Step B: Batch Stamp Domain Collections (invoices, customers, products)
      for (const collName of ["invoices", "customers", "products"]) {
        const snap = await db.collection(collName).where("userId", "==", userId).get();
        // Client-side filtering ensures documents without a workspaceId field are caught accurately
        const unmigratedDocs = snap.docs.filter((d) => !d.data().workspaceId);

        if (unmigratedDocs.length > 0) {
          console.log(`  📦 Stamping ${unmigratedDocs.length} ${collName}...`);

          if (!isDryRun) {
            // Commit in chunks of 400 to respect Firestore batch limit of 500
            for (let i = 0; i < unmigratedDocs.length; i += 400) {
              const chunk = unmigratedDocs.slice(i, i + 400);
              const batch = db.batch();

              chunk.forEach((docSnap) => {
                const data = docSnap.data();
                const updatePayload = {
                  workspaceId,
                  userId,
                  createdAt: data.createdAt || data.created_at || admin.firestore.FieldValue.serverTimestamp(),
                  updatedAt: data.updatedAt || data.updated_at || admin.firestore.FieldValue.serverTimestamp()
                };

                // Convert legacy snake_case fields & string dates to camelCase Timestamps
                if (collName === "customers") {
                  if (data.full_name) updatePayload.name = data.full_name;
                  if (data.phone_number) updatePayload.phone = data.phone_number;
                } else if (collName === "invoices") {
                  if (data.invoice_no) updatePayload.invoiceNumber = data.invoice_no;
                  if (data.tax_percentage !== undefined) updatePayload.taxRate = data.tax_percentage;
                  if (data.total_price !== undefined) updatePayload.totalAmount = data.total_price;
                  if (data.payment_type !== undefined) updatePayload.paymentType = data.payment_type;

                  const parsedInvDate = parseDateToTimestamp(data.invoiceDate || data.invoice_date);
                  if (parsedInvDate) updatePayload.invoiceDate = parsedInvDate;

                  const parsedDueDate = parseDateToTimestamp(data.dueDate || data.due_date);
                  if (parsedDueDate) updatePayload.dueDate = parsedDueDate;

                  const parsedPaidDate = parseDateToTimestamp(data.paidDate || data.paid_date);
                  if (parsedPaidDate) updatePayload.paidDate = parsedPaidDate;
                }

                if (isVerbose) {
                  console.log(`    -> Update ${collName}/${docSnap.id}:`, updatePayload);
                }

                batch.update(docSnap.ref, updatePayload);
              });

              await batch.commit();
            }
          }
          report.documentsStamped[collName] += unmigratedDocs.length;
        }
      }

      // Step C: Dual-Write / Reseat Business Profile
      const legacyProfileRef = db.collection("business_profiles").doc(userId);
      const legacyProfileSnap = await legacyProfileRef.get();

      if (legacyProfileSnap.exists) {
        console.log(`  🏢 Reseating business profile: ${userId} -> ${workspaceId}`);
        if (!isDryRun) {
          const profileData = legacyProfileSnap.data();
          const reseatedProfile = {
            ...profileData,
            workspaceId,
            userId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          if (profileData.account_number) reseatedProfile.accountNumber = profileData.account_number;
          if (profileData.ifsc_code) reseatedProfile.ifscCode = profileData.ifsc_code;
          if (profileData.bank_name) reseatedProfile.bankName = profileData.bank_name;
          if (profileData.tax_id) reseatedProfile.taxId = profileData.tax_id;

          // Write to workspaceId doc and preserve legacy doc for zero disruption
          await db.collection("business_profiles").doc(workspaceId).set(reseatedProfile);
        }
        report.profilesReseated++;
      }

      // Step D: Update Clerk Private Metadata
      if (!isDryRun) {
        await withRetry(() =>
          rateLimitedClerkUpdate(userId, {
            activeWorkspaceId: workspaceId,
            activeRole: "owner",
            activeOrgId: workspaceId // Backward compat alias
          })
        );
        console.log(`  🔐 Updated Clerk private_metadata: activeWorkspaceId=${workspaceId}, activeRole=owner`);
      }

    } catch (err) {
      console.error(`  ❌ Failed migrating user ${userId}:`, err.message);
      report.errors.push({ userId, error: err.message });
    }
  }

  // 3. Post-Migration Assertion Checks (Zero-Missing Field Validation)
  if (!isDryRun) {
    console.log(`\n🔍 Running Post-Migration Assertion Checks...`);
    let hasAssertionFailure = false;
    for (const collName of ["invoices", "customers", "products"]) {
      const fullSnapshot = await db.collection(collName).get();
      const unscopedDocs = fullSnapshot.docs.filter((docSnap) => {
        const data = docSnap.data();
        return !data.workspaceId || data.workspaceId === "";
      });
      console.log(`  - ${collName} total docs: ${fullSnapshot.size} | Unscoped remaining: ${unscopedDocs.length}`);
      if (unscopedDocs.length > 0) {
        console.error(`❌ CRITICAL: ${unscopedDocs.length} ${collName} are still missing workspaceId!`);
        hasAssertionFailure = true;
      }
    }

    if (hasAssertionFailure) {
      console.error("Migration finished with unmigrated documents remaining!");
      process.exit(1);
    }
  }

  // 4. Save Migration Report
  report.endTime = new Date().toISOString();
  if (!fs.existsSync("scripts")) {
    fs.mkdirSync("scripts");
  }
  fs.writeFileSync("scripts/migration-report.json", JSON.stringify(report, null, 2));
  console.log(`\n📊 Migration Report saved to scripts/migration-report.json`);
}

runMigration().catch((err) => {
  console.error("Migration execution fatal error:", err);
  process.exit(1);
});
