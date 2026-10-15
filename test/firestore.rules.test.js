import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, writeBatch, query, where, documentId, getDocs, collection } from "firebase/firestore";
import fs from "fs";
import path from "path";
import process from "node:process";


const PROJECT_ID = "invoice-dashboard-daedb";

let testEnv;

beforeAll(async () => {
  const rules = fs.readFileSync(
    path.resolve(process.cwd(), "firestore.rules"),
    "utf8"
  );

  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

describe("Firestore Security Rules", () => {
  // Test 1: allows owner to self-join after creating workspace
  it("allows owner to self-join after creating workspace", async () => {
    const ownerId = "user_owner_1";
    const workspaceId = "ws_test_1";

    const ownerContext = testEnv.authenticatedContext(ownerId);
    const db = ownerContext.firestore();

    // 1. Owner creates workspace doc
    await assertSucceeds(
      setDoc(doc(db, "workspaces", workspaceId), {
        name: "Test Workspace",
        ownerId: ownerId,
      })
    );

    // 2. Owner self-joins as owner in workspace_members
    await assertSucceeds(
      setDoc(doc(db, "workspace_members", `${workspaceId}_${ownerId}`), {
        workspaceId: workspaceId,
        userId: ownerId,
        role: "owner",
      })
    );
  });

  // Test 2: denies attacker self-join to another user's workspace
  it("denies attacker self-join to another user's workspace", async () => {
    const ownerId = "user_owner_2";
    const attackerId = "user_attacker_2";
    const workspaceId = "ws_test_2";

    // Setup workspace by owner using admin context or owner context
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "workspaces", workspaceId), {
        name: "Owner Workspace",
        ownerId: ownerId,
      });
      await setDoc(doc(adminDb, "workspace_members", `${workspaceId}_${ownerId}`), {
        workspaceId: workspaceId,
        userId: ownerId,
        role: "owner",
      });
    });

    const attackerContext = testEnv.authenticatedContext(attackerId);
    const attackerDb = attackerContext.firestore();

    // Attacker tries to self-join
    await assertFails(
      setDoc(doc(attackerDb, "workspace_members", `${workspaceId}_${attackerId}`), {
        workspaceId: workspaceId,
        userId: attackerId,
        role: "member",
      })
    );
  });

  // Test 3: allows owner to invite member
  it("allows owner to invite member", async () => {
    const ownerId = "user_owner_3";
    const workspaceId = "ws_test_3";
    const inviteId = "inv_test_3";

    // Setup workspace with owner member
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "workspaces", workspaceId), {
        name: "Workspace 3",
        ownerId: ownerId,
      });
      await setDoc(doc(adminDb, "workspace_members", `${workspaceId}_${ownerId}`), {
        workspaceId: workspaceId,
        userId: ownerId,
        role: "owner",
      });
    });

    const ownerContext = testEnv.authenticatedContext(ownerId);
    const ownerDb = ownerContext.firestore();

    // Owner creates invite
    await assertSucceeds(
      setDoc(doc(ownerDb, "workspace_invites", inviteId), {
        workspaceId: workspaceId,
        email: "invitee@example.com",
        role: "member",
      })
    );
  });

  // Test 4: denies invitee self-accept (Phase 2 fix)
  it("denies invitee self-accept (Phase 2 fix)", async () => {
    const ownerId = "user_owner_4";
    const inviteeId = "user_invitee_4";
    const workspaceId = "ws_test_4";

    // Setup workspace and owner
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "workspaces", workspaceId), {
        name: "Workspace 4",
        ownerId: ownerId,
      });
      await setDoc(doc(adminDb, "workspace_members", `${workspaceId}_${ownerId}`), {
        workspaceId: workspaceId,
        userId: ownerId,
        role: "owner",
      });
      await setDoc(doc(adminDb, "workspace_invites", "inv_4"), {
        workspaceId: workspaceId,
        email: "invitee@example.com",
        role: "member",
      });
    });

    const inviteeContext = testEnv.authenticatedContext(inviteeId);
    const inviteeDb = inviteeContext.firestore();

    // Invitee tries to add themselves to workspace_members directly
    await assertFails(
      setDoc(doc(inviteeDb, "workspace_members", `${workspaceId}_${inviteeId}`), {
        workspaceId: workspaceId,
        userId: inviteeId,
        role: "member",
      })
    );
  });

  // Test 5: allows owner to read own invoice
  it("allows owner to read own invoice", async () => {
    const ownerId = "user_invoice_5";
    const invoiceId = "inv_doc_5";

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "invoices", invoiceId), {
        userId: ownerId,
        invoiceNumber: "INV-001",
        total: 1000,
      });
    });

    const ownerContext = testEnv.authenticatedContext(ownerId);
    const ownerDb = ownerContext.firestore();

    await assertSucceeds(getDoc(doc(ownerDb, "invoices", invoiceId)));
  });

  // Test 6: denies cross-user invoice read
  it("denies cross-user invoice read", async () => {
    const ownerId = "user_invoice_6";
    const attackerId = "user_attacker_6";
    const invoiceId = "inv_doc_6";

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "invoices", invoiceId), {
        userId: ownerId,
        invoiceNumber: "INV-002",
        total: 2000,
      });
    });

    const attackerContext = testEnv.authenticatedContext(attackerId);
    const attackerDb = attackerContext.firestore();

    await assertFails(getDoc(doc(attackerDb, "invoices", invoiceId)));
  });

  // Test 7: allows owner to read own counter
  it("allows owner to read own counter", async () => {
    const ownerId = "user_counter_7";
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "users", ownerId, "counters", "invoice"), {
        nextNumber: 1,
        prefix: "INV-",
      });
    });

    const ownerContext = testEnv.authenticatedContext(ownerId);
    const ownerDb = ownerContext.firestore();

    await assertSucceeds(getDoc(doc(ownerDb, "users", ownerId, "counters", "invoice")));
  });

  // Test 8: allows owner to write own counter
  it("allows owner to write own counter", async () => {
    const ownerId = "user_counter_8";
    const ownerContext = testEnv.authenticatedContext(ownerId);
    const ownerDb = ownerContext.firestore();

    await assertSucceeds(
      setDoc(doc(ownerDb, "users", ownerId, "counters", "invoice"), {
        nextNumber: 1,
        prefix: "INV-",
        padding: 3,
      })
    );
  });

  // Test 9: denies attacker to read other user's counter
  it("denies attacker to read other user's counter", async () => {
    const ownerId = "user_counter_9_owner";
    const attackerId = "user_counter_9_attacker";

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "users", ownerId, "counters", "invoice"), {
        nextNumber: 5,
        prefix: "INV-",
      });
    });

    const attackerContext = testEnv.authenticatedContext(attackerId);
    const attackerDb = attackerContext.firestore();

    await assertFails(getDoc(doc(attackerDb, "users", ownerId, "counters", "invoice")));
  });

  // Test 10: denies attacker to write other user's counter
  it("denies attacker to write other user's counter", async () => {
    const ownerId = "user_counter_10_owner";
    const attackerId = "user_counter_10_attacker";

    const attackerContext = testEnv.authenticatedContext(attackerId);
    const attackerDb = attackerContext.firestore();

    await assertFails(
      setDoc(doc(attackerDb, "users", ownerId, "counters", "invoice"), {
        nextNumber: 999,
        prefix: "HACK-",
      })
    );
  });

  // Test 11: allows owner to create workspace + member in ONE batch
  it("allows owner to create workspace + member in ONE batch", async () => {
    const ownerId = "user_batch_owner_1";
    const workspaceId = "ws_batch_1";

    const ownerContext = testEnv.authenticatedContext(ownerId);
    const db = ownerContext.firestore();

    const batch = writeBatch(db);
    batch.set(doc(db, "workspaces", workspaceId), {
      name: "Batch Workspace",
      ownerId: ownerId,
    });
    batch.set(doc(db, "workspace_members", `${workspaceId}_${ownerId}`), {
      workspaceId: workspaceId,
      userId: ownerId,
      role: "owner",
    });

    await assertSucceeds(batch.commit());
  });

  // Test 12: denies attacker batch-joining someone else's workspace
  it("denies attacker batch-joining someone else's workspace", async () => {
    const ownerId = "user_victim_2";
    const attackerId = "user_attacker_2";
    const workspaceId = "ws_victim_2";

    // Seed workspace owned by victim
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "workspaces", workspaceId), {
        name: "Victim Workspace",
        ownerId: ownerId,
      });
    });

    const attackerContext = testEnv.authenticatedContext(attackerId);
    const db = attackerContext.firestore();

    const batch = writeBatch(db);
    batch.set(doc(db, "workspace_members", `${workspaceId}_${attackerId}`), {
      workspaceId: workspaceId,
      userId: attackerId,
      role: "owner",
    });

    await assertFails(batch.commit());
  });

  // Test 13: allows member to query workspaces using documentId() in [...]
  it("allows member to query workspaces using documentId() in [...]", async () => {
    const userId = "user_query_1";
    const ws1 = "ws_q_1";
    const ws2 = "ws_q_2";

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "workspaces", ws1), { name: "WS 1", ownerId: userId });
      await setDoc(doc(adminDb, "workspace_members", `${ws1}_${userId}`), {
        workspaceId: ws1,
        userId: userId,
        role: "owner",
      });
      await setDoc(doc(adminDb, "workspaces", ws2), { name: "WS 2", ownerId: userId });
      await setDoc(doc(adminDb, "workspace_members", `${ws2}_${userId}`), {
        workspaceId: ws2,
        userId: userId,
        role: "owner",
      });
    });

    const userContext = testEnv.authenticatedContext(userId);
    const db = userContext.firestore();

    const q = query(collection(db, "workspaces"), where(documentId(), "in", [ws1, ws2]));
    await assertSucceeds(getDocs(q));
  });

  // Test 14: denies updating invoice to change userId
  it("denies updating invoice to change userId", async () => {
    const userId = "user_inv_owner";
    const invoiceId = "inv_test_immutability";

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "invoices", invoiceId), {
        userId: userId,
        invoiceNumber: "INV-001",
        total: 100,
      });
    });

    const userContext = testEnv.authenticatedContext(userId);
    const db = userContext.firestore();

    // Updating own invoice without changing userId should succeed
    await assertSucceeds(
      setDoc(
        doc(db, "invoices", invoiceId),
        { userId: userId, invoiceNumber: "INV-001", total: 200 },
        { merge: true }
      )
    );

    // Updating own invoice but tampering userId to another user should fail
    await assertFails(
      setDoc(
        doc(db, "invoices", invoiceId),
        { userId: "attacker_user_id", invoiceNumber: "INV-001", total: 200 },
        { merge: true }
      )
    );
  });

  // Test 15: denies attacker batch attempt to hijack existing workspace ownerId and self-join
  it("denies attacker batch attempt to hijack existing workspace ownerId and self-join", async () => {
    const victimOwnerId = "user_victim_3";
    const attackerId = "user_attacker_3";
    const workspaceId = "ws_victim_3";

    // Setup victim workspace
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "workspaces", workspaceId), {
        name: "Victim Workspace",
        ownerId: victimOwnerId,
      });
      await setDoc(doc(adminDb, "workspace_members", `${workspaceId}_${victimOwnerId}`), {
        workspaceId: workspaceId,
        userId: victimOwnerId,
        role: "owner",
      });
    });

    const attackerContext = testEnv.authenticatedContext(attackerId);
    const db = attackerContext.firestore();

    const batch = writeBatch(db);
    // Attacker tries to overwrite workspace ownerId to self and create owner-member doc
    batch.set(
      doc(db, "workspaces", workspaceId),
      { ownerId: attackerId },
      { merge: true }
    );
    batch.set(doc(db, "workspace_members", `${workspaceId}_${attackerId}`), {
      workspaceId: workspaceId,
      userId: attackerId,
      role: "owner",
    });

    await assertFails(batch.commit());
  });

  // --- Phase 2: B2B Multi-Tenancy Custom Claims & Workspace Isolation Tests ---

  // Test 16: allows reading invoice with matching workspaceId custom claim
  it("allows reading invoice with matching workspaceId custom claim", async () => {
    const wsId = "ws_b2b_alpha";
    const invoiceId = "inv_b2b_1";

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "invoices", invoiceId), {
        workspaceId: wsId,
        userId: "user_creator_alpha",
        invoiceNumber: "INV-101",
        total: 5000,
      });
    });

    const userContext = testEnv.authenticatedContext("user_member_alpha", {
      workspaceId: wsId,
      role: "accountant",
    });
    const db = userContext.firestore();

    await assertSucceeds(getDoc(doc(db, "invoices", invoiceId)));
  });

  // Test 17: denies cross-tenant invoice read when workspaceId claim does not match
  it("denies cross-tenant invoice read when workspaceId claim does not match", async () => {
    const wsAlpha = "ws_b2b_alpha";
    const wsBeta = "ws_b2b_beta";
    const invoiceId = "inv_b2b_alpha_private";

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "invoices", invoiceId), {
        workspaceId: wsAlpha,
        userId: "user_alpha",
        invoiceNumber: "INV-102",
        total: 7500,
      });
    });

    const attackerContext = testEnv.authenticatedContext("user_attacker_beta", {
      workspaceId: wsBeta,
      role: "owner",
    });
    const db = attackerContext.firestore();

    await assertFails(getDoc(doc(db, "invoices", invoiceId)));
  });

  // Test 18: allows creating invoice with active workspaceId claim
  it("allows creating invoice with active workspaceId claim", async () => {
    const wsId = "ws_b2b_create";
    const userId = "user_creator_b2b";
    const invoiceId = "inv_b2b_create_1";

    const userContext = testEnv.authenticatedContext(userId, {
      workspaceId: wsId,
      role: "accountant",
    });
    const db = userContext.firestore();

    await assertSucceeds(
      setDoc(doc(db, "invoices", invoiceId), {
        workspaceId: wsId,
        userId: userId,
        invoiceNumber: "INV-103",
        total: 1200,
      })
    );
  });

  // Test 19: denies creating invoice with different workspaceId than active token claim
  it("denies creating invoice with different workspaceId than active token claim", async () => {
    const userContext = testEnv.authenticatedContext("user_spoof", {
      workspaceId: "ws_user_org",
      role: "accountant",
    });
    const db = userContext.firestore();

    await assertFails(
      setDoc(doc(db, "invoices", "inv_spoof_target"), {
        workspaceId: "ws_victim_org",
        userId: "user_spoof",
        invoiceNumber: "INV-999",
        total: 500,
      })
    );
  });

  // Test 20: allows updating invoice while keeping workspaceId immutable
  it("allows updating invoice while keeping workspaceId immutable", async () => {
    const wsId = "ws_b2b_update";
    const userId = "user_updater";
    const invoiceId = "inv_b2b_update_1";

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "invoices", invoiceId), {
        workspaceId: wsId,
        userId: userId,
        invoiceNumber: "INV-104",
        total: 300,
      });
    });

    const userContext = testEnv.authenticatedContext(userId, {
      workspaceId: wsId,
      role: "accountant",
    });
    const db = userContext.firestore();

    // Succeeded when workspaceId is preserved
    await assertSucceeds(
      setDoc(
        doc(db, "invoices", invoiceId),
        { workspaceId: wsId, total: 450 },
        { merge: true }
      )
    );

    // Fails when attempting to mutate workspaceId
    await assertFails(
      setDoc(
        doc(db, "invoices", invoiceId),
        { workspaceId: "ws_hijacked_org", total: 450 },
        { merge: true }
      )
    );
  });

  // Test 21: allows workspace manager to delete invoice and denies non-owner/creator
  it("enforces role-based delete on workspace invoice", async () => {
    const wsId = "ws_b2b_delete";
    const creatorId = "user_inv_creator";
    const ownerId = "user_ws_owner";
    const otherMemberId = "user_ws_other_member";
    const invoiceId = "inv_delete_test";

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "invoices", invoiceId), {
        workspaceId: wsId,
        userId: creatorId,
        invoiceNumber: "INV-105",
        total: 800,
      });
    });

    const { deleteDoc } = await import("firebase/firestore");

    // Other accountant member who didn't create doc should fail to delete
    const otherContext = testEnv.authenticatedContext(otherMemberId, {
      workspaceId: wsId,
      role: "accountant",
    });
    await assertFails(deleteDoc(doc(otherContext.firestore(), "invoices", invoiceId)));

    // Owner should succeed to delete
    const ownerContext = testEnv.authenticatedContext(ownerId, {
      workspaceId: wsId,
      role: "owner",
    });
    await assertSucceeds(deleteDoc(doc(ownerContext.firestore(), "invoices", invoiceId)));
  });

  // Test 22: allows read/write to workspace-scoped counters
  it("allows read and write to workspace-scoped counters", async () => {
    const wsId = "ws_counter_test";
    const memberContext = testEnv.authenticatedContext("user_member_c", {
      workspaceId: wsId,
      role: "accountant",
    });
    const db = memberContext.firestore();

    await assertSucceeds(
      setDoc(doc(db, "workspaces", wsId, "counters", "invoice"), {
        nextNumber: 1,
        prefix: "INV-",
      })
    );

    await assertSucceeds(getDoc(doc(db, "workspaces", wsId, "counters", "invoice")));

    // Attacker from different workspace cannot read or write
    const attackerContext = testEnv.authenticatedContext("user_attacker_c", {
      workspaceId: "ws_other_counter",
      role: "accountant",
    });
    const attackerDb = attackerContext.firestore();

    await assertFails(getDoc(doc(attackerDb, "workspaces", wsId, "counters", "invoice")));
    await assertFails(
      setDoc(doc(attackerDb, "workspaces", wsId, "counters", "invoice"), {
        nextNumber: 9999,
      })
    );
  });

  // Test 23: verifies customers and products enforce workspace tenant isolation
  it("verifies customers and products enforce workspace tenant isolation", async () => {
    const wsAlpha = "ws_cust_prod_alpha";
    const wsBeta = "ws_cust_prod_beta";

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "customers", "cust_1"), {
        workspaceId: wsAlpha,
        name: "Alpha Customer",
      });
      await setDoc(doc(adminDb, "products", "prod_1"), {
        workspaceId: wsAlpha,
        name: "Alpha Product",
      });
    });

    const betaContext = testEnv.authenticatedContext("user_beta", {
      workspaceId: wsBeta,
      role: "owner",
    });
    const betaDb = betaContext.firestore();

    await assertFails(getDoc(doc(betaDb, "customers", "cust_1")));
    await assertFails(getDoc(doc(betaDb, "products", "prod_1")));

    const alphaContext = testEnv.authenticatedContext("user_alpha", {
      workspaceId: wsAlpha,
      role: "accountant",
    });
    const alphaDb = alphaContext.firestore();

    await assertSucceeds(getDoc(doc(alphaDb, "customers", "cust_1")));
    await assertSucceeds(getDoc(doc(alphaDb, "products", "prod_1")));
  });
});


