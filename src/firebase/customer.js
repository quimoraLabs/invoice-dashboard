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
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { logActivity } from "./activity";
import { generateUniqueCode } from "../utils/excelHelper";

// Firestore collection reference
const customersCollection = collection(db, "customers");

function resolveScope(scopeOrUserId, fallbackObj = {}) {
  if (scopeOrUserId && typeof scopeOrUserId === "object") {
    return {
      workspaceId: scopeOrUserId.workspaceId || fallbackObj.workspaceId || null,
      userId: scopeOrUserId.userId || fallbackObj.userId || null,
      actor: scopeOrUserId.actor || fallbackObj.actor || null,
    };
  }
  const idStr = scopeOrUserId || fallbackObj.userId || fallbackObj.workspaceId;
  return {
    workspaceId: fallbackObj.workspaceId || (idStr && idStr.startsWith("ws_") ? idStr : null),
    userId: fallbackObj.userId || (idStr && !idStr.startsWith("ws_") ? idStr : null),
    actor: fallbackObj.actor || null,
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
      customerCode: customer.customerCode || generateUniqueCode("CUST"),
      name: (customer.name || customer.full_name || "").trim(),
      companyName: (customer.companyName || customer.company || "").trim(),
      displayTradingName: (customer.displayTradingName || "").trim(),
      industryType: (customer.industryType || "Other").trim(),
      email: (customer.email || "").trim(),
      phone: String(customer.phone || customer.phone_number || "").trim(),
      address: (customer.address || "").trim(),
      shippingAddress: (customer.shippingAddress || "").trim(),
      gstin: (customer.gstin || "").trim().toUpperCase(),
      pan: (customer.pan || "").trim().toUpperCase(),
      paymentTerms: customer.paymentTerms || "Net 30",
      currency: customer.currency || "INR",
      openingBalance: Number(customer.openingBalance) || 0,
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

    if (scope.workspaceId) {
      logActivity({
        workspaceId: scope.workspaceId,
        actor: scope.actor || customer.actor || { uid: targetUid },
        action: "customer_create",
        entityType: "customer",
        entityId: docRef.id,
        entityTitle: customerPayload.name,
        details: `Added customer "${customerPayload.name}"`,
      });
    }

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
    const scope = resolveScope(scopeOrUserId, updatedData);
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

    if (scope.workspaceId) {
      logActivity({
        workspaceId: scope.workspaceId,
        actor: scope.actor || updatedData.actor,
        action: "customer_update",
        entityType: "customer",
        entityId: id,
        entityTitle: cleanData.name || "Customer",
        details: `Updated customer details${cleanData.name ? ` (${cleanData.name})` : ""}`,
      });
    }
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
    let customerName = "";
    if (scope.userId || scope.workspaceId) {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        customerName = data.name || "";
        if (scope.workspaceId && data.workspaceId && data.workspaceId !== scope.workspaceId) {
          throw new Error("Unauthorized: You do not have permission to delete this customer.");
        }
        if (!data.workspaceId && scope.userId && data.userId && data.userId !== scope.userId) {
          throw new Error("Unauthorized: You do not have permission to delete this customer.");
        }
      }
    }
    await deleteDoc(docRef);

    if (scope.workspaceId) {
      logActivity({
        workspaceId: scope.workspaceId,
        actor: scope.actor,
        action: "customer_delete",
        entityType: "customer",
        entityId: id,
        entityTitle: customerName || id,
        details: `Deleted customer "${customerName || id}"`,
      });
    }
  } catch (error) {
    console.error("Error deleting customer: ", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

// Bulk create customers via Firestore writeBatch in chunks of 400
async function createBulkCustomers(customersList, onProgress, scopeOrUserId) {
  const scope = resolveScope(scopeOrUserId);
  const targetUid = scope.userId;
  if (!targetUid && !scope.workspaceId) {
    throw new Error("User authentication or workspace required to import customers.");
  }

  const BATCH_SIZE = 400; // Safe threshold under Firestore 500-limit
  let totalSaved = 0;

  for (let i = 0; i < customersList.length; i += BATCH_SIZE) {
    const chunk = customersList.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    chunk.forEach((cust) => {
      const docRef = doc(customersCollection);
      const payload = {
        customerCode: cust.customerCode || generateUniqueCode("CUST"),
        name: (cust.name || "").trim(),
        companyName: (cust.companyName || cust.company || "").trim(),
        displayTradingName: (cust.displayTradingName || "").trim(),
        industryType: (cust.industryType || "Other").trim(),
        email: (cust.email || "").trim(),
        phone: String(cust.phone || "").trim(),
        address: (cust.address || "").trim(),
        shippingAddress: (cust.shippingAddress || "").trim(),
        gstin: (cust.gstin || "").trim().toUpperCase(),
        pan: (cust.pan || "").trim().toUpperCase(),
        paymentTerms: cust.paymentTerms || "Net 30",
        currency: cust.currency || "INR",
        openingBalance: Number(cust.openingBalance) || 0,
        profile: cust.profile || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (scope.workspaceId) payload.workspaceId = scope.workspaceId;
      if (targetUid) payload.userId = targetUid;

      batch.set(docRef, payload);
    });

    await batch.commit();
    totalSaved += chunk.length;
    if (onProgress) {
      onProgress(totalSaved, customersList.length);
    }
  }

  if (scope.workspaceId) {
    logActivity({
      workspaceId: scope.workspaceId,
      actor: scope.actor || { uid: targetUid },
      action: "customer_bulk_create",
      entityType: "customer",
      entityId: "bulk",
      entityTitle: `${totalSaved} Customers`,
      details: `Bulk imported ${totalSaved} customers via spreadsheet`,
    });
  }

  return totalSaved;
}

export { createCustomer, createBulkCustomers, listenToCustomers, updateCustomer, deleteCustomer };

