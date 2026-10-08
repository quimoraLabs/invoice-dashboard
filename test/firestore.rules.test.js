import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
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
});
