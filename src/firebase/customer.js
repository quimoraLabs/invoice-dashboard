import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "./firebaseConfig";

// Firestore collection reference
const customersCollection = collection(db, "customers");

// Create a new customer attached to current user ID
async function createCustomer(customer, setLoading, userId) {
  setLoading?.(true);
  try {
    const targetUid = userId || customer.userId;
    if (!targetUid) {
      throw new Error("User authentication required to create customer.");
    }
    const customerPayload = {
      full_name: (customer.full_name || customer.name || "").trim(),
      email: (customer.email || "").trim(),
      phone_number: String(customer.phone_number || customer.phone || "").trim(),
      address: (customer.address || "").trim(),
      company: (customer.company || "").trim(),
      gstin: (customer.gstin || "").trim(),
      profile: customer.profile || "",
      userId: targetUid,
      created_at: serverTimestamp(),
    };

    const docRef = await addDoc(customersCollection, customerPayload);
    return docRef;
  } catch (error) {
    console.error("Error adding customer: ", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

// Stream live customer snapshot data isolated per user ID
function listenToCustomers(callback, userId) {
  const targetUid = userId;

  if (!targetUid) {
    callback([]);
    return () => {};
  }


  const q = query(customersCollection, where("userId", "==", targetUid));

  return onSnapshot(
    q,
    (snapshot) => {
      const customers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(customers);
    },
    (error) => {
      console.error("Error listening to customers:", error);
      callback([]);
    }
  );
}

// Update existing customer details
async function updateCustomer(id, updatedData, setLoading) {
  if (!id) throw new Error("No customer ID provided");
  setLoading?.(true);

  try {
    const docRef = doc(db, "customers", id);
    const cleanData = { ...updatedData };
    if (cleanData.full_name || cleanData.name) {
      cleanData.full_name = (cleanData.full_name || cleanData.name).trim();
    }
    if (cleanData.phone_number || cleanData.phone) {
      cleanData.phone_number = String(cleanData.phone_number || cleanData.phone).trim();
    }
    delete cleanData.name;
    delete cleanData.phone;

    await updateDoc(docRef, cleanData);
  } catch (error) {
    console.error("Error updating customer:", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

// Delete customer by ID
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
