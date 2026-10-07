import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { formatCurrentDate } from "../components/helper";

// Firestore collection reference
const invoiceCollection = collection(db, "invoices");

// Get the next serial invoice number based on the current user's latest entry
async function getNextInvoiceNumber(userId) {
  const targetUid = userId;
  try {
    const q = targetUid
      ? query(invoiceCollection, where("userId", "==", targetUid), orderBy("invoiceNumber", "desc"), limit(1))
      : query(invoiceCollection, orderBy("invoiceNumber", "desc"), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const lastInvoice = snapshot.docs[0].data();
      const lastNumber = parseInt((lastInvoice.invoiceNumber || lastInvoice.invoice_no)?.replace("INV-", "") || "0", 10);
      return `INV-${String(lastNumber + 1).padStart(3, "0")}`;
    }
  } catch (error) {
    console.warn("Fallback to sequential invoice number generation:", error);
  }
  return "INV-001";
}

// Create a new invoice document attached to current user ID
async function createInvoice(invoice, setLoading, userId) {
  setLoading?.(true);
  try {
    const targetUid = userId || invoice.userId;
    if (!targetUid) {
      throw new Error("User authentication required to create invoice.");
    }

    const invoicePayload = {
      ...invoice,
      userId: targetUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    delete invoicePayload.created_at;
    delete invoicePayload.updated_at;

    // Normalize date fields to Firestore Timestamp objects
    const rawInvoiceDate = invoicePayload.invoiceDate || invoicePayload.invoice_date || formatCurrentDate();
    invoicePayload.invoiceDate = rawInvoiceDate?.toDate ? rawInvoiceDate : Timestamp.fromDate(new Date(rawInvoiceDate));
    delete invoicePayload.invoice_date;

    if (invoicePayload.dueDate || invoicePayload.due_date) {
      const rawDueDate = invoicePayload.dueDate || invoicePayload.due_date;
      invoicePayload.dueDate = rawDueDate?.toDate ? rawDueDate : Timestamp.fromDate(new Date(rawDueDate));
      delete invoicePayload.due_date;
    }

    if (invoicePayload.status === "Paid" && (invoicePayload.paymentType || invoicePayload.payment_type)) {
      const rawPaidDate = invoicePayload.paidDate || invoicePayload.paid_date;
      if (rawPaidDate) {
        invoicePayload.paidDate = rawPaidDate?.toDate ? rawPaidDate : Timestamp.fromDate(new Date(rawPaidDate));
      } else {
        invoicePayload.paidDate = invoicePayload.invoiceDate;
      }
    } else {
      invoicePayload.paidDate = null;
    }
    delete invoicePayload.paid_date;

    const docRef = await addDoc(invoiceCollection, invoicePayload);
    return docRef;
  } catch (error) {
    console.error("Error adding invoice : ", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

// Stream live snapshot data isolated per user ID
function listenToInvoices(callback, userId) {
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
async function getInvoiceById(id, userId) {
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

// Update invoice fields
async function updateInvoice(id, updatedData, setLoading, userId) {
  setLoading?.(true);
  try {
    const docRef = doc(db, "invoices", id);
    if (userId) {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().userId && docSnap.data().userId !== userId) {
        throw new Error("Unauthorized: You do not have permission to update this invoice.");
      }
    }
    const cleanData = { ...updatedData };
    delete cleanData.id;
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
async function updateInvoiceStatusAndDueDate(
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

// Delete invoice document
async function deleteInvoice(id, setLoading, userId) {
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

export {
  createInvoice,
  getInvoiceById,
  listenToInvoices,
  updateInvoice,
  updateInvoiceStatusAndDueDate,
  deleteInvoice,
  getNextInvoiceNumber,
};
