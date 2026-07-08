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
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { formatCurrentDate } from "../components/helper";

// Firestore collection reference
const invoiceCollection = collection(db, "invoices");

// Get the next invoice number
async function getNextInvoiceNumber() {
  const q = query(invoiceCollection, orderBy("invoice_no", "desc"), limit(1));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const lastInvoice = snapshot.docs[0].data();
    const lastNumber = parseInt(lastInvoice.invoice_no.replace("INV-", ""), 10);
    return `INV-${String(lastNumber + 1).padStart(3, "0")}`;
  } else {
    return "INV-001"; // First invoice
  }
}

async function createInvoice(invoice) {
  try {
    const docRef = await addDoc(invoiceCollection, invoice);
    console.log("Invoice add with ID : ", docRef.id);
    return docRef;
  } catch (error) {
    console.error("Error adding invoice : ", error);
    throw error;
  }
}

function listenToInvoices(callback) {
  return onSnapshot(invoiceCollection, (snapshot) => {
    const invoices = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(invoices);
  });
}

async function updateInvoiceStatusAndDueDate(id) {
  try {
    const docRef = doc(db, "invoices", id);
    const status = "Paid";
    const paid_date = formatCurrentDate();

    await updateDoc(docRef, {
      status,
      paid_date,
    });

    // console.log("Invoice updated:", id, { status, due_date });
  } catch (error) {
    console.error("Error updating invoice:", error);
    throw error;
    
  }
}

async function deleteInvoice(id) {
  try {
    const docRef = doc(db, "invoices", id);
    await deleteDoc(docRef);
    console.log("Invoice deleted : ", id);
  } catch (error) {
    console.error("Error deleting invoice : ", error);
    throw error;
  }
}

export {
  createInvoice,
  listenToInvoices,
  updateInvoiceStatusAndDueDate,
  deleteInvoice,
  getNextInvoiceNumber,
};
