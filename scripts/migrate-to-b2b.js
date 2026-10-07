import { db, admin, clerk, rateLimitedClerkUpdate, withRetry } from "./migrate-helpers.js";
import { runClerkRepair } from "./migrate-repair.js";
import fs from "fs";

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
    organizationsCreated: 0,
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
      if (!batch || batch.data ? batch.data.length === 0 : batch.length === 0) break;
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

      // Step A: Idempotent Organization Provisioning
      const orgQuery = await db.collection("organizations").where("ownerId", "==", userId).limit(1).get();
      let orgId;

      if (!orgQuery.empty) {
        orgId = orgQuery.docs[0].id;
        console.log(`  ℹ️ Organization already exists: ${orgId}`);
      } else {
        const orgName = `${user.firstName ? user.firstName + "'s" : "My"} Business`;
        const now = admin.firestore.FieldValue.serverTimestamp();
        const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14-day trial

        if (!isDryRun) {
          const orgRef = await db.collection("organizations").add({
            name: orgName,
            ownerId: userId,
            plan: "free",
            status: "active",
            trialEndsAt: admin.firestore.Timestamp.fromDate(trialEnd),
            createdAt: now,
            updatedAt: now
          });
          orgId = orgRef.id;

          // Create organizationMembers doc
          const memberDocId = `${orgId}_${userId}`;
          await db.collection("organizationMembers").doc(memberDocId).set({
            orgId,
            userId,
            email: user.emailAddresses?.[0]?.emailAddress?.toLowerCase() || "",
            displayName: userLabel,
            role: "owner",
            status: "active",
            joinedAt: now,
            updatedAt: now
          });
        } else {
          orgId = `dry_run_org_${userId.slice(-6)}`;
        }
        report.organizationsCreated++;
        report.membersCreated++;
        console.log(`  ✅ Created Organization & Owner Member: ${orgId}`);
      }

      // Step B: Batch Stamp Domain Collections (invoices, customers, products)
      for (const collName of ["invoices", "customers", "products"]) {
        const snap = await db.collection(collName).where("userId", "==", userId).get();
        // Client-side filtering ensures documents without an orgId field are caught accurately
        const unmigratedDocs = snap.docs.filter((d) => !d.data().orgId);

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
                  orgId: orgId,
                  createdBy: userId,
                  createdAt: data.createdAt || data.created_at || admin.firestore.FieldValue.serverTimestamp()
                };

                // Step B.5: Convert legacy snake_case fields & string dates to camelCase Timestamps
                if (collName === "customers") {
                  if (data.full_name) updatePayload.name = data.full_name;
                  if (data.phone_number) updatePayload.phone = data.phone_number;
                } else if (collName === "invoices") {
                  if (data.invoice_no) updatePayload.invoiceNumber = data.invoice_no;
                  if (data.tax_percentage !== undefined) updatePayload.taxRate = data.tax_percentage;
                  if (data.total_price !== undefined) updatePayload.totalAmount = data.total_price;
                  if (data.payment_type !== undefined) updatePayload.paymentType = data.payment_type;
                  if (typeof data.invoice_date === "string" || typeof data.invoiceDate === "string") {
                    const dStr = data.invoice_date || data.invoiceDate;
                    updatePayload.invoiceDate = admin.firestore.Timestamp.fromDate(new Date(dStr + "T00:00:00.000Z"));
                  }
                  if (typeof data.due_date === "string" || typeof data.dueDate === "string") {
                    const dStr = data.due_date || data.dueDate;
                    updatePayload.dueDate = admin.firestore.Timestamp.fromDate(new Date(dStr + "T00:00:00.000Z"));
                  }
                  if (typeof data.paid_date === "string" || typeof data.paidDate === "string") {
                    const dStr = data.paid_date || data.paidDate;
                    updatePayload.paidDate = admin.firestore.Timestamp.fromDate(new Date(dStr + "T00:00:00.000Z"));
                  }
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

      // Step C: Reseat Business Profile
      const legacyProfileRef = db.collection("business_profiles").doc(userId);
      const legacyProfileSnap = await legacyProfileRef.get();

      if (legacyProfileSnap.exists) {
        console.log(`  🏢 Reseating business profile: ${userId} -> ${orgId}`);
        if (!isDryRun) {
          const profileData = legacyProfileSnap.data();
          const reseatedProfile = {
            ...profileData,
            orgId: orgId,
            userId: userId,
            createdBy: userId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          if (profileData.account_number) reseatedProfile.accountNumber = profileData.account_number;
          if (profileData.ifsc_code) reseatedProfile.ifscCode = profileData.ifsc_code;
          if (profileData.bank_name) reseatedProfile.bankName = profileData.bank_name;
          if (profileData.tax_id) reseatedProfile.taxId = profileData.tax_id;

          await db.collection("business_profiles").doc(orgId).set(reseatedProfile);
          // Verify copy exists before deletion
          const verifySnap = await db.collection("business_profiles").doc(orgId).get();
          if (verifySnap.exists) {
            await legacyProfileRef.delete();
          }
        }
        report.profilesReseated++;
      }

      // Step D: Update Clerk Private Metadata
      if (!isDryRun) {
        await withRetry(() =>
          rateLimitedClerkUpdate(userId, {
            activeOrgId: orgId,
            activeRole: "owner"
          })
        );
        console.log(`  🔐 Updated Clerk private_metadata: activeOrgId=${orgId}, activeRole=owner`);
      }

    } catch (err) {
      console.error(`  ❌ Failed migrating user ${userId}:`, err.message);
      report.errors.push({ userId, error: err.message });
    }
  }

  // 3. Post-Migration Assertion Checks (Zero-Missing Field Validation)
  if (!isDryRun) {
    console.log(`\n🔍 Running Post-Migration Assertion Checks...`);
    for (const collName of ["invoices", "customers", "products"]) {
      const fullSnapshot = await db.collection(collName).get();
      const unscopedDocs = fullSnapshot.docs.filter((docSnap) => {
        const data = docSnap.data();
        return !data.orgId || data.orgId === "";
      });
      console.log(`  - ${collName} total docs: ${fullSnapshot.size} | Unscoped remaining: ${unscopedDocs.length}`);
      console.assert(unscopedDocs.length === 0, `❌ CRITICAL: ${unscopedDocs.length} ${collName} are still missing orgId!`);
    }

    // Verify all business_profiles docIds are organization IDs
    const profilesSnapshot = await db.collection("business_profiles").get();
    const legacyDocIds = profilesSnapshot.docs.filter((d) => d.id.startsWith("user_"));
    console.log(`  - business_profiles total docs: ${profilesSnapshot.size} | Legacy user_* docIds: ${legacyDocIds.length}`);
    console.assert(legacyDocIds.length === 0, `❌ CRITICAL: ${legacyDocIds.length} legacy user-keyed business profiles remain!`);
  }

  // 4. Save Migration Report
  report.endTime = new Date().toISOString();
  if (!fs.existsSync("scripts")) {
    fs.mkdirSync("scripts");
  }
  fs.writeFileSync("scripts/migration-report.json", JSON.stringify(report, null, 2));
  console.log(`\n📊 Migration Report saved to scripts/migration-report.json`);
}

runMigration().catch(console.error);
