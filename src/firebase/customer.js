import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./firebaseConfig";

// Firestore collection reference
const customersCollection = collection(db, "customers");

// Create a new customer
async function createCustomer(customer) {
  try {
    // Append the server timestamp automatically before inserting into Firestore
    const customerWithTimestamp = {
      ...customer,
      created_at: serverTimestamp(),
    };

    const docRef = await addDoc(customersCollection, customerWithTimestamp);
    console.log("Customer added with ID: ", docRef.id);
    return docRef;
  } catch (error) {
    console.error("Error adding customer: ", error);
    throw error;
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

async function updateCustomer(id, updatedData) {
  if (!id) throw new Error("No customer ID provided");

  try {
    const docRef = doc(db, "customers", id);
    await updateDoc(docRef, updatedData);
    console.log("Customer updated:", id, updatedData);
  } catch (error) {
    console.log(updatedData);
    
    console.error("Error updating customer:", error);
    throw error;
  }
}


// Delete a customer by ID
async function deleteCustomer(id) {
  try {
    const docRef = doc(db, "customers", id);
    await deleteDoc(docRef);
    console.log("Customer deleted : ", id);
  } catch (error) {
    console.error("Error deleteing customer : ", error);
    throw error;
  }
}

export { createCustomer, listenToCustomers ,updateCustomer,deleteCustomer};
