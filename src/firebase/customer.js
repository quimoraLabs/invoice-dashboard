import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

// Firestore collection reference
const customersCollection = collection(db, "customers");

// Create a new customer
async function createCustomer(customer, setLoading) {
  setLoading?.(true);
  try {
    // Append the server timestamp automatically before inserting into Firestore
    const customerWithTimestamp = {
      ...customer,
      created_at: serverTimestamp(),
    };

    const docRef = await addDoc(customersCollection, customerWithTimestamp);
    return docRef;
  } catch (error) {
    console.error("Error adding customer: ", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

// Read (real-time listener for customers)
function listenToCustomers(callback) {
  return onSnapshot(customersCollection, (snapshot) => {
    const customers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(customers);
  });
}

async function updateCustomer(id, updatedData, setLoading) {
  if (!id) throw new Error("No customer ID provided");
  setLoading?.(true);

  try {
    const docRef = doc(db, "customers", id);
    await updateDoc(docRef, updatedData);
  } catch (error) {
    console.error("Error updating customer:", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

// Delete a customer by ID
async function deleteCustomer(id, setLoading) {
  setLoading?.(true);
  try {
    const docRef = doc(db, "customers", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleteing customer : ", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

export { createCustomer, listenToCustomers, updateCustomer, deleteCustomer };
