import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

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
      name: (customer.name || customer.full_name || "").trim(),
      email: (customer.email || "").trim(),
      phone: String(customer.phone || customer.phone_number || "").trim(),
      address: (customer.address || "").trim(),
      company: (customer.company || "").trim(),
      gstin: (customer.gstin || "").trim(),
      profile: customer.profile || "",
      userId: targetUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
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
async function updateCustomer(id, updatedData, setLoading, userId) {
  if (!id) throw new Error("No customer ID provided");
  setLoading?.(true);

  try {
    const docRef = doc(db, "customers", id);
    if (userId) {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().userId && docSnap.data().userId !== userId) {
        throw new Error("Unauthorized: You do not have permission to update this customer.");
      }
    }
    const cleanData = { ...updatedData };
    if (cleanData.name || cleanData.full_name) {
      cleanData.name = (cleanData.name || cleanData.full_name).trim();
    }
    if (cleanData.phone || cleanData.phone_number) {
      cleanData.phone = String(cleanData.phone || cleanData.phone_number).trim();
    }
    delete cleanData.full_name;
    delete cleanData.phone_number;
    cleanData.updatedAt = serverTimestamp();

    await updateDoc(docRef, cleanData);
  } catch (error) {
    console.error("Error updating customer:", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

// Delete customer by ID
async function deleteCustomer(id, setLoading, userId) {
  setLoading?.(true);
  try {
    const docRef = doc(db, "customers", id);
    if (userId) {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().userId && docSnap.data().userId !== userId) {
        throw new Error("Unauthorized: You do not have permission to delete this customer.");
      }
    }
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleteing customer : ", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

export { createCustomer, listenToCustomers, updateCustomer, deleteCustomer };
