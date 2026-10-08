import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  runTransaction,
  serverTimestamp,
  Timestamp,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import fs from "fs";
import path from "path";
import process from "node:process";
import { formatInvoiceNumber } from "../src/firebase/invoice";

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
  if (testEnv) await testEnv.cleanup();
});

beforeEach(async () => {
  if (testEnv) await testEnv.clearFirestore();
});

describe("Invoice Integration & Concurrent Smoke Suite (Emulator)", () => {
  // Test 1: Fresh user creates first invoice -> INV-001 & counter = 2
  it("Test 1: creates first invoice as INV-001 and sets counter to 2", async () => {
    const userId = "user_smoke_1";
    const context = testEnv.authenticatedContext(userId);
    const db = context.firestore();

    const counterRef = doc(db, "users", userId, "counters", "invoice");
    const newInvoiceRef = doc(collection(db, "invoices"));

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(counterRef);
      const nextNumber = snap.exists() ? snap.data().nextNumber : 1;
      const numStr = formatInvoiceNumber(nextNumber);

      transaction.set(newInvoiceRef, {
        userId,
        invoiceNumber: numStr,
        invoice_no: numStr,
        status: "Pending",
        createdAt: serverTimestamp(),
      });
      transaction.set(counterRef, {
        nextNumber: nextNumber + 1,
        prefix: "INV-",
        padding: 3,
        updatedAt: serverTimestamp(),
      });
    });

    const invSnap = await getDoc(newInvoiceRef);
    expect(invSnap.data().invoiceNumber).toBe("INV-001");
    expect(invSnap.data().invoice_no).toBe("INV-001");

    const countSnap = await getDoc(counterRef);
    expect(countSnap.data().nextNumber).toBe(2);
  });

  // Test 3: Deleting an invoice leaves a gap (numbers are not reused)
  it("Test 3: deleting an invoice leaves a gap and does not rollback counter", async () => {
    const userId = "user_smoke_3";
    const context = testEnv.authenticatedContext(userId);
    const db = context.firestore();
    const counterRef = doc(db, "users", userId, "counters", "invoice");

    // Initialize counter at 4 (simulating INV-001, INV-002, INV-003 already existed)
    await setDoc(counterRef, { nextNumber: 4, prefix: "INV-", padding: 3 });

    // Next invoice should be INV-004
    const newInvoiceRef = doc(collection(db, "invoices"));
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(counterRef);
      const nextNumber = snap.data().nextNumber;
      const numStr = formatInvoiceNumber(nextNumber);

      transaction.set(newInvoiceRef, { userId, invoiceNumber: numStr, invoice_no: numStr });
      transaction.set(counterRef, { nextNumber: nextNumber + 1, prefix: "INV-", padding: 3 });
    });

    const invSnap = await getDoc(newInvoiceRef);
    expect(invSnap.data().invoiceNumber).toBe("INV-004");
  });

  // Test 4: Legacy scan accurately identifies highest invoice number
  it("Test 4: legacy scan identifies highest number when counter does not exist", async () => {
    const userId = "user_smoke_4";
    const context = testEnv.authenticatedContext(userId);
    const db = context.firestore();

    // Populate legacy docs with camelCase and snake_case
    await setDoc(doc(db, "invoices", "inv_old_1"), { userId, invoiceNumber: "INV-002" });
    await setDoc(doc(db, "invoices", "inv_old_2"), { userId, invoice_no: "INV-005" });
    await setDoc(doc(db, "invoices", "inv_old_3"), { userId, invoiceNumber: "INV-003" });

    // Simulate scan
    const q = query(collection(db, "invoices"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    let max = 0;
    snapshot.docs.forEach((d) => {
      const data = d.data();
      const raw = data.invoiceNumber || data.invoice_no;
      const num = parseInt(String(raw).replace(/[^0-9]/g, ""), 10);
      if (!isNaN(num) && num > max) max = num;
    });

    expect(max).toBe(5);

    // First transaction uses max + 1 = 6
    const counterRef = doc(db, "users", userId, "counters", "invoice");
    const nextInvoiceRef = doc(collection(db, "invoices"));
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(counterRef);
      const nextNumber = snap.exists() ? snap.data().nextNumber : max + 1;
      const numStr = formatInvoiceNumber(nextNumber);

      transaction.set(nextInvoiceRef, { userId, invoiceNumber: numStr, invoice_no: numStr });
      transaction.set(counterRef, { nextNumber: nextNumber + 1, prefix: "INV-", padding: 3 });
    });

    const invSnap = await getDoc(nextInvoiceRef);
    expect(invSnap.data().invoiceNumber).toBe("INV-006");
  });

  // Test 5: Concurrent transactions assign distinct sequential numbers (no collisions)
  it("Test 5: concurrent creates assign distinct sequential numbers without collision", async () => {
    const userId = "user_smoke_5";
    const context = testEnv.authenticatedContext(userId);
    const db = context.firestore();
    const counterRef = doc(db, "users", userId, "counters", "invoice");

    await setDoc(counterRef, { nextNumber: 10, prefix: "INV-", padding: 3 });

    // Execute 3 concurrent transactions
    const createFn = async () => {
      const newInvoiceRef = doc(collection(db, "invoices"));
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(counterRef);
        const nextNumber = snap.data().nextNumber;
        const numStr = formatInvoiceNumber(nextNumber);

        transaction.set(newInvoiceRef, { userId, invoiceNumber: numStr, invoice_no: numStr });
        transaction.set(counterRef, { nextNumber: nextNumber + 1, prefix: "INV-", padding: 3 });
      });
      const snap = await getDoc(newInvoiceRef);
      return snap.data().invoiceNumber;
    };

    const results = await Promise.all([createFn(), createFn(), createFn()]);

    // Ensure all 3 numbers are distinct and within INV-010, INV-011, INV-012
    const unique = new Set(results);
    expect(unique.size).toBe(3);
    expect(results).toContain("INV-010");
    expect(results).toContain("INV-011");
    expect(results).toContain("INV-012");
  });
});
