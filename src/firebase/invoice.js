import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { formatCurrentDate } from "../components/helper";

// Firestore collection reference
const invoiceCollection = collection(db, "invoices");

// Get the next serial invoice number based on the latest entry
async function getNextInvoiceNumber() {
  const q = query(invoiceCollection, orderBy("invoice_no", "desc"), limit(1));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const lastInvoice = snapshot.docs[0].data();
    const lastNumber = parseInt(lastInvoice.invoice_no.replace("INV-", ""), 10);
    return `INV-${String(lastNumber + 1).padStart(3, "0")}`;
  } else {
    return "INV-001"; // Default start identifier for empty database
  }
}

// Create a completely new invoice document records entry
async function createInvoice(invoice, setLoading) {
  setLoading?.(true);
  try {
    if (invoice.status === "Paid" && invoice.payment_type !== "") {
      invoice.paid_date = invoice.invoice_date;
    }

    const docRef = await addDoc(invoiceCollection, invoice);
    return docRef;
  } catch (error) {
    console.error("Error adding invoice : ", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

// Stream live snapshot data synchronization from database compilation arrays
function listenToInvoices(callback) {
  return onSnapshot(invoiceCollection, (snapshot) => {
    const invoices = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(invoices);
  });
}

// Fetch a specific unique single invoice configuration parameters payload by matching document ID
async function getInvoiceById(id) {
  try {
    const docRef = doc(db, "invoices", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting invoice by ID: ", error);
    throw error;
  }
}

// CORE ADDITION: Update entire modified values configuration dataset matching targeting entity properties
async function updateInvoice(id, updatedData, setLoading) {
  setLoading?.(true);
  try {
    const docRef = doc(db, "invoices", id);

    // Prevent document snapshot self-duplication by extracting redundant structural field tags
    const cleanData = { ...updatedData };
    delete cleanData.id;

    await updateDoc(docRef, cleanData);
  } catch (error) {
    console.error("Error performing updateInvoice routine execute:", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

/**
 * Updates the payment status and settlement details for a given invoice.
 * @param {string} id - The invoice document ID.
 * @param {string} status - New status ("Paid", "Unpaid", or "Pending"). Defaults to "Paid".
 * @param {string} type - Payment method used (e.g., "UPI", "Card", "Cash").
 * @param {Function} setLoading - Optional React state setter for loading states.
 */
async function updateInvoiceStatusAndDueDate(
  id,
  status = "Paid",
  type = "",
  setLoading,
) {
  setLoading?.(true);
  try {
    const docRef = doc(db, "invoices", id);

    // Build the dynamic payload based on payment status
    let payload = {};

    if (status === "Paid") {
      payload = {
        status: "Paid",
        payment_type: type, // Fixed typo: payment_type instead of payemnt_type
        paid_date: formatCurrentDate(),
      };
    } else {
      // Clear payment metadata if invoice is marked as Unpaid or Pending
      payload = {
        status: status,
        payment_type: null,
        paid_date: null,
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

// Permanently destroy targeting structural documents from targeted collection database matrices
async function deleteInvoice(id, setLoading) {
  setLoading?.(true);
  try {
    const docRef = doc(db, "invoices", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting invoice : ", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

export {
  createInvoice,
  getInvoiceById,
  listenToInvoices,
  updateInvoice, // Newly added export integration to kill target import execution breaks
  updateInvoiceStatusAndDueDate,
  deleteInvoice,
  getNextInvoiceNumber,
};
