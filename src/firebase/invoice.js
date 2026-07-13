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
  getDoc
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
async function createInvoice(invoice) {
  try {
    const docRef = await addDoc(invoiceCollection, invoice);
    console.log("Invoice added with ID : ", docRef.id);
    return docRef;
  } catch (error) {
    console.error("Error adding invoice : ", error);
    throw error;
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
      console.log("No such invoice found!");
      return null;
    }
  } catch (error) {
    console.error("Error getting invoice by ID: ", error);
    throw error;
  }
}

// CORE ADDITION: Update entire modified values configuration dataset matching targeting entity properties
async function updateInvoice(id, updatedData) {
  try {
    const docRef = doc(db, "invoices", id);
    
    // Prevent document snapshot self-duplication by extracting redundant structural field tags
    const cleanData = { ...updatedData };
    delete cleanData.id; 

    await updateDoc(docRef, cleanData);
    console.log("Invoice fields updated seamlessly for ID:", id);
  } catch (error) {
    console.error("Error performing updateInvoice routine execute:", error);
    throw error;
  }
}

// Update basic quick indicators like settlement configurations parameter states
async function updateInvoiceStatusAndDueDate(id) {
  try {
    const docRef = doc(db, "invoices", id);
    const status = "Paid";
    const paid_date = formatCurrentDate();

    await updateDoc(docRef, {
      status,
      paid_date,
    });
  } catch (error) {
    console.error("Error updating invoice status metrics details:", error);
    throw error;
  }
}

// Permanently destroy targeting structural documents from targeted collection database matrices
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
  getInvoiceById,
  listenToInvoices,
  updateInvoice, // Newly added export integration to kill target import execution breaks
  updateInvoiceStatusAndDueDate,
  deleteInvoice,
  getNextInvoiceNumber,
};