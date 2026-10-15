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

function resolveScope(scopeOrUserId, fallbackObj = {}) {
  if (scopeOrUserId && typeof scopeOrUserId === "object") {
    return {
      workspaceId: scopeOrUserId.workspaceId || fallbackObj.workspaceId || null,
      userId: scopeOrUserId.userId || fallbackObj.userId || null,
    };
  }
  const idStr = scopeOrUserId || fallbackObj.userId || fallbackObj.workspaceId;
  return {
    workspaceId: fallbackObj.workspaceId || (idStr && idStr.startsWith("ws_") ? idStr : null),
    userId: fallbackObj.userId || (idStr && !idStr.startsWith("ws_") ? idStr : null),
  };
}

// Create a new customer attached to current workspace or user ID
async function createCustomer(customer, setLoading, scopeOrUserId) {
  setLoading?.(true);
  try {
    const scope = resolveScope(scopeOrUserId, customer);
    const targetUid = scope.userId || customer.userId;
    if (!targetUid && !scope.workspaceId) {
      throw new Error("User authentication or workspace required to create customer.");
    }
    const customerPayload = {
      name: (customer.name || customer.full_name || "").trim(),
      email: (customer.email || "").trim(),
      phone: String(customer.phone || customer.phone_number || "").trim(),
      address: (customer.address || "").trim(),
      company: (customer.company || "").trim(),
      gstin: (customer.gstin || "").trim(),
      profile: customer.profile || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (scope.workspaceId) {
      customerPayload.workspaceId = scope.workspaceId;
    }
    if (targetUid) {
      customerPayload.userId = targetUid;
    }

    const docRef = await addDoc(customersCollection, customerPayload);
    return docRef;
  } catch (error) {
    console.error("Error adding customer: ", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

// Stream live customer snapshot data isolated per workspace or user ID
function listenToCustomers(callback, scopeOrUserId) {
  const scope = resolveScope(scopeOrUserId);

  if (!scope.workspaceId && !scope.userId) {
    callback([]);
    return () => {};
  }

  const q = scope.workspaceId
    ? query(customersCollection, where("workspaceId", "==", scope.workspaceId))
    : query(customersCollection, where("userId", "==", scope.userId));

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
async function updateCustomer(id, updatedData, setLoading, scopeOrUserId) {
  if (!id) throw new Error("No customer ID provided");
  setLoading?.(true);

  try {
    const docRef = doc(db, "customers", id);
    const scope = resolveScope(scopeOrUserId);
    if (scope.userId || scope.workspaceId) {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (scope.workspaceId && data.workspaceId && data.workspaceId !== scope.workspaceId) {
          throw new Error("Unauthorized: You do not have permission to update this customer.");
        }
        if (!data.workspaceId && scope.userId && data.userId && data.userId !== scope.userId) {
          throw new Error("Unauthorized: You do not have permission to update this customer.");
        }
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
async function deleteCustomer(id, setLoading, scopeOrUserId) {
  setLoading?.(true);
  try {
    const docRef = doc(db, "customers", id);
    const scope = resolveScope(scopeOrUserId);
    if (scope.userId || scope.workspaceId) {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (scope.workspaceId && data.workspaceId && data.workspaceId !== scope.workspaceId) {
          throw new Error("Unauthorized: You do not have permission to delete this customer.");
        }
        if (!data.workspaceId && scope.userId && data.userId && data.userId !== scope.userId) {
          throw new Error("Unauthorized: You do not have permission to delete this customer.");
        }
      }
    }
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting customer: ", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

export { createCustomer, listenToCustomers, updateCustomer, deleteCustomer };
