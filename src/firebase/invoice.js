import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
  getDocs,
  getDoc,
  serverTimestamp,
  Timestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { formatCurrentDate } from "../components/helper";

// Firestore collection reference
const invoiceCollection = collection(db, "invoices");

// Rounding helper for strict 2-decimal calculations (avoids floating point drift)
export function round2(num) {
  const n = Number(num) || 0;
  const sign = n < 0 ? -1 : 1;
  return (sign * Math.round(Math.abs(n) * 100)) / 100;
}

// Format invoice sequence number, e.g. 1 -> INV-001, 1000 -> INV-1000
export function formatInvoiceNumber(n, prefix = "INV-", padding = 3) {
  return `${prefix}${String(n).padStart(padding, "0")}`;
}

// Option B: Scan user's existing invoices to find highest numeric invoice number
// Runs once only when /users/{userId}/counters/invoice does not exist
// TODO Phase 2: pagination if invoice count > 5000
export async function scanForHighestNumber(userId) {
  if (!userId) return 0;
  try {
    const q = query(invoiceCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return 0;

    let maxNum = 0;
    snapshot.docs.forEach((d) => {
      const data = d.data();
      const raw = data.invoiceNumber || data.invoice_no;
      if (raw) {
        const parsed = parseInt(String(raw).replace(/[^0-9]/g, ""), 10);
        if (!isNaN(parsed) && parsed > maxNum) {
          maxNum = parsed;
        }
      }
    });
    return maxNum;
  } catch (error) {
    console.error("Error scanning existing invoices for highest number:", error);
    throw new Error(
      `Failed to determine highest invoice number: ${error.message || error}`,
      { cause: error }
    );
  }
}



// Helper to normalize date to YYYY-MM-DD string for comparison
export function toDateString(d) {
  if (!d) return "";
  const dateObj = d?.toDate ? d.toDate() : (d instanceof Date ? d : new Date(d));
  if (isNaN(dateObj.getTime())) return "";
  return dateObj.toISOString().split("T")[0];
}

// Validate business rules (90-day backdate, no future, duplicate products, tax rounding, payment status)
export function validateInvoiceData(invoicePayload, existingDate = null) {
  // 1. Date Validation (max 90 days in past, no future dates)
  const rawDate = invoicePayload.invoiceDate || invoicePayload.invoice_date || formatCurrentDate();
  const dateObj = rawDate?.toDate ? rawDate.toDate() : new Date(rawDate);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (dateObj > today) {
    throw new Error("Invoice date cannot be in the future (GST invalid).");
  }

  // 90-day backdate rule: Enforce on create OR when date is modified on update
  const isDateChanged = existingDate ? toDateString(rawDate) !== toDateString(existingDate) : true;
  if (isDateChanged) {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 90);
    minDate.setHours(0, 0, 0, 0);
    if (dateObj < minDate) {
      throw new Error("Invoice date cannot be more than 90 days in the past (GST invalid).");
    }
  }

  // 2. Mandatory Customer / Billed To Validation
  const clientName = invoicePayload.client?.name || invoicePayload.client?.full_name || invoicePayload.customer_name;
  if (!clientName || !clientName.trim()) {
    throw new Error("Customer name is required. Please select or enter a valid customer.");
  }

  // 3. Line Items Non-Empty & Validated Items
  if (!Array.isArray(invoicePayload.items) || invoicePayload.items.length === 0) {
    throw new Error("Invoice must contain at least one line item.");
  }

  const seenIds = new Set();
  const seenTitles = new Set();
  invoicePayload.items.forEach((item, index) => {
    const itemTitle = item.title?.trim().toLowerCase();
    const itemId = item.id?.trim();
    const qty = Number(item.quantity);
    const price = Number(item.price);

    if (!itemTitle) {
      throw new Error(`Line item at row ${index + 1} must have a product title.`);
    }
    if (isNaN(qty) || qty <= 0) {
      throw new Error(`Quantity for "${item.title}" at row ${index + 1} must be at least 1.`);
    }
    if (isNaN(price) || price < 0) {
      throw new Error(`Price for "${item.title}" at row ${index + 1} cannot be negative.`);
    }

    if (itemId && seenIds.has(itemId)) {
      throw new Error(`Duplicate product found (ID: ${itemId}) at row ${index + 1}. Increase quantity instead.`);
    }
    if (itemTitle && seenTitles.has(itemTitle)) {
      throw new Error(`Duplicate product found ("${item.title}") at row ${index + 1}. Increase quantity instead.`);
    }

    if (itemId) seenIds.add(itemId);
    if (itemTitle) seenTitles.add(itemTitle);
  });

  // 4. Payment Settlement Status Validation
  if (!invoicePayload.status || !invoicePayload.status.trim()) {
    throw new Error("Payment status (Pending, Paid, or Draft) is mandatory.");
  }

  // 5. Payment Method Validation for Paid Status
  if (invoicePayload.status === "Paid" && !invoicePayload.paymentType && !invoicePayload.payment_type) {
    throw new Error("Payment method (UPI, Card, Cash, etc.) is mandatory for Paid status.");
  }
}


// Normalize calculation values with strict 2-decimal rounding
function normalizeInvoiceCalculations(invoicePayload) {
  const items = invoicePayload.items.map((item) => {
    const qty = Number(item.quantity) || 1;
    const price = round2(item.price);
    const taxRate = Number(item.taxRate ?? invoicePayload.taxRate ?? 18);
    const subTotal = round2(qty * price);
    const taxAmount = round2((subTotal * taxRate) / 100);
    const total = round2(subTotal + taxAmount);

    return {
      ...item,
      quantity: qty,
      price,
      taxRate,
      subTotal,
      taxAmount,
      total,
    };
  });

  const subTotal = round2(items.reduce((acc, it) => acc + it.subTotal, 0));
  const totalTax = round2(items.reduce((acc, it) => acc + it.taxAmount, 0));
  const totalAmount = round2(subTotal + totalTax);

  return {
    ...invoicePayload,
    items,
    subTotal,
    totalTax,
    totalAmount,
  };
}

// Atomically create invoice with sequential number using Firestore transaction
export async function createInvoiceWithNumber(userId, invoice, setLoading) {
  setLoading?.(true);
  try {
    const targetUid = userId || invoice.userId;
    if (!targetUid) {
      throw new Error("User authentication required to create invoice.");
    }

    // 1. Business Validations (performed before transaction)
    validateInvoiceData(invoice);
    const normalizedData = normalizeInvoiceCalculations(invoice);

    // 2. Prepare Timestamps and Date Fields
    const rawInvoiceDate = normalizedData.invoiceDate || normalizedData.invoice_date || formatCurrentDate();
    const invoiceDate = rawInvoiceDate?.toDate ? rawInvoiceDate : Timestamp.fromDate(new Date(rawInvoiceDate));

    let dueDate = null;
    if (normalizedData.dueDate || normalizedData.due_date) {
      const rawDueDate = normalizedData.dueDate || normalizedData.due_date;
      dueDate = rawDueDate?.toDate ? rawDueDate : Timestamp.fromDate(new Date(rawDueDate));
    }

    let paidDate = null;
    if (normalizedData.status === "Paid") {
      const rawPaidDate = normalizedData.paidDate || normalizedData.paid_date;
      paidDate = rawPaidDate ? (rawPaidDate?.toDate ? rawPaidDate : Timestamp.fromDate(new Date(rawPaidDate))) : Timestamp.fromDate(new Date());
    }

    // 3. Step A: Outside transaction - check if counter exists or scan legacy invoices
    const counterRef = doc(db, "users", targetUid, "counters", "invoice");
    const counterSnap = await getDoc(counterRef);
    let initialNextNumber = 1;

    if (!counterSnap.exists()) {
      const maxExisting = await scanForHighestNumber(targetUid);
      initialNextNumber = maxExisting + 1;
    }

    // 4. Step B: Atomic transaction - read counter, assign number, dual-write invoice & increment counter
    const result = await runTransaction(db, async (transaction) => {
      const freshCounterSnap = await transaction.get(counterRef);
      const prefix = freshCounterSnap.exists() ? (freshCounterSnap.data().prefix || "INV-") : "INV-";
      const padding = freshCounterSnap.exists() ? (freshCounterSnap.data().padding || 3) : 3;
      const nextNumber = freshCounterSnap.exists()
        ? freshCounterSnap.data().nextNumber
        : initialNextNumber;

      const generatedInvoiceNumber = formatInvoiceNumber(nextNumber, prefix, padding);
      const newInvoiceRef = doc(invoiceCollection);

      const invoicePayload = {
        ...normalizedData,
        userId: targetUid,
        invoiceNumber: generatedInvoiceNumber,
        invoice_no: generatedInvoiceNumber, // Dual-write for backward compatibility
        invoiceDate,
        dueDate,
        paidDate,
        status: normalizedData.status || "Pending",
        paymentType: normalizedData.status === "Paid" ? (normalizedData.paymentType || normalizedData.payment_type || "UPI") : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      delete invoicePayload.created_at;
      delete invoicePayload.updated_at;
      delete invoicePayload.invoice_date;
      delete invoicePayload.due_date;
      delete invoicePayload.paid_date;
      delete invoicePayload.payment_type;

      // Commit writes in transaction
      transaction.set(newInvoiceRef, invoicePayload);
      transaction.set(counterRef, {
        nextNumber: nextNumber + 1,
        prefix,
        padding,
        updatedAt: serverTimestamp(),
      });

      return {
        id: newInvoiceRef.id,
        invoiceNumber: generatedInvoiceNumber,
      };
    });

    return result;
  } catch (error) {
    console.error("Error creating invoice with transaction:", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

// Backward compatible wrapper for existing callers
export async function createInvoice(invoice, setLoading, userId) {
  return createInvoiceWithNumber(userId || invoice.userId, invoice, setLoading);
}

// Get next invoice number preview (reads counter or scans, does not increment)
export async function getNextInvoiceNumber(userId) {
  if (!userId) return "—";
  try {
    const counterRef = doc(db, "users", userId, "counters", "invoice");
    const counterSnap = await getDoc(counterRef);
    if (counterSnap.exists()) {
      const data = counterSnap.data();
      return formatInvoiceNumber(data.nextNumber || 1, data.prefix || "INV-", data.padding || 3);
    }
    const maxExisting = await scanForHighestNumber(userId);
    return formatInvoiceNumber(maxExisting + 1, "INV-", 3);
  } catch (error) {
    console.warn("Unable to determine next invoice number preview:", error);
    return "—";
  }
}


// Stream live snapshot data isolated per user ID
export function listenToInvoices(callback, userId) {
  const targetUid = userId;

  if (!targetUid) {
    callback([]);
    return () => {};
  }

  const q = query(invoiceCollection, where("userId", "==", targetUid));

  return onSnapshot(
    q,
    (snapshot) => {
      const invoices = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(invoices);
    },
    (error) => {
      console.error("Error listening to invoices:", error);
      callback([]);
    }
  );
}

// Fetch single invoice payload matching document ID
export async function getInvoiceById(id, userId) {
  try {
    const docRef = doc(db, "invoices", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (userId && data.userId && data.userId !== userId) {
        throw new Error("Unauthorized: You do not have permission to view this invoice.");
      }
      return { id: docSnap.id, ...data };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting invoice by ID: ", error);
    throw error;
  }
}

// Update invoice fields (guard: invoiceNumber is immutable)
export async function updateInvoice(id, updatedData, setLoading, userId) {
  setLoading?.(true);
  try {
    const docRef = doc(db, "invoices", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("Target invoice document not found.");
    }

    const existingData = docSnap.data();
    if (userId && existingData.userId && existingData.userId !== userId) {
      throw new Error("Unauthorized: You do not have permission to update this invoice.");
    }

    // Business validations on update: pass stored invoiceDate so 90-day check only runs if date changed
    const existingDate = existingData.invoiceDate || existingData.invoice_date;
    validateInvoiceData(updatedData, existingDate);
    const normalizedData = normalizeInvoiceCalculations(updatedData);

    const cleanData = { ...normalizedData };
    delete cleanData.id;
    // Guard: invoiceNumber & invoice_no are strictly immutable!
    delete cleanData.invoiceNumber;
    delete cleanData.invoice_no;


    cleanData.updatedAt = serverTimestamp();

    await updateDoc(docRef, cleanData);
  } catch (error) {
    console.error("Error performing updateInvoice:", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

// Update payment status and settlement details
export async function updateInvoiceStatusAndDueDate(
  id,
  status = "Paid",
  type = "",
  setLoading,
  userId,
) {
  setLoading?.(true);
  try {
    const docRef = doc(db, "invoices", id);
    if (userId) {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().userId && docSnap.data().userId !== userId) {
        throw new Error("Unauthorized: You do not have permission to modify this invoice status.");
      }
    }
    let payload = {};

    if (status === "Paid") {
      payload = {
        status: "Paid",
        paymentType: type || "UPI",
        paidDate: Timestamp.fromDate(new Date()),
        updatedAt: serverTimestamp(),
      };
    } else {
      payload = {
        status: status,
        paymentType: null,
        paidDate: null,
        updatedAt: serverTimestamp(),
      };
    }

    await updateDoc(docRef, payload);
  } catch (error) {
    console.error("Error updating invoice status details:", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

// Delete invoice document (Numbers are never reused / no counter rollback per GST compliance)
export async function deleteInvoice(id, setLoading, userId) {
  setLoading?.(true);
  try {
    const docRef = doc(db, "invoices", id);
    if (userId) {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().userId && docSnap.data().userId !== userId) {
        throw new Error("Unauthorized: You do not have permission to delete this invoice.");
      }
    }
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting invoice : ", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}
