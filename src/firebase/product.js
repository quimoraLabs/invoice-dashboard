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
import { logActivity } from "./activity";

// Firestore collection reference
const productsCollection = collection(db, "products");

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

// Create a new product attached to current workspace or user ID
async function createProduct(product, setLoading, scopeOrUserId) {
  setLoading?.(true);
  try {
    const scope = resolveScope(scopeOrUserId, product);
    const targetUid = scope.userId || product.userId;
    if (!targetUid && !scope.workspaceId) {
      throw new Error("User authentication or workspace required to create product.");
    }
    const productPayload = {
      ...product,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (scope.workspaceId) {
      productPayload.workspaceId = scope.workspaceId;
    }
    if (targetUid) {
      productPayload.userId = targetUid;
    }

    const docRef = await addDoc(productsCollection, productPayload);

    if (scope.workspaceId) {
      logActivity({
        workspaceId: scope.workspaceId,
        actor: scope.actor || product.actor || { uid: targetUid },
        action: "product_create",
        entityType: "product",
        entityId: docRef.id,
        entityTitle: product.title || "Product",
        details: `Added product "${product.title || "Product"}" (₹${product.price || 0})`,
      });
    }

    return docRef;
  } catch (error) {
    console.error("Error adding product: ", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

// Stream live product snapshot data isolated per workspace or user ID
function listenToProducts(callback, scopeOrUserId) {
  const scope = resolveScope(scopeOrUserId);

  if (!scope.workspaceId && !scope.userId) {
    callback([]);
    return () => {};
  }

  const q = scope.workspaceId
    ? query(productsCollection, where("workspaceId", "==", scope.workspaceId))
    : query(productsCollection, where("userId", "==", scope.userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const products = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(products);
    },
    (error) => {
      console.error("Error listening to products:", error);
      callback([]);
    }
  );
}

// Update product details
async function updateProduct(id, updatedData, setLoading, scopeOrUserId) {
  if (!id) throw new Error("No product ID provided");
  setLoading?.(true);

  try {
    const docRef = doc(db, "products", id);
    const scope = resolveScope(scopeOrUserId, updatedData);
    if (scope.userId || scope.workspaceId) {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (scope.workspaceId && data.workspaceId && data.workspaceId !== scope.workspaceId) {
          throw new Error("Unauthorized: You do not have permission to update this product.");
        }
        if (!data.workspaceId && scope.userId && data.userId && data.userId !== scope.userId) {
          throw new Error("Unauthorized: You do not have permission to update this product.");
        }
      }
    }
    await updateDoc(docRef, { ...updatedData, updatedAt: serverTimestamp() });

    if (scope.workspaceId) {
      logActivity({
        workspaceId: scope.workspaceId,
        actor: scope.actor || updatedData.actor,
        action: "product_update",
        entityType: "product",
        entityId: id,
        entityTitle: updatedData.title || "Product",
        details: `Updated product details${updatedData.title ? ` (${updatedData.title})` : ""}`,
      });
    }
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

// Delete product by ID
async function deleteProduct(id, setLoading, scopeOrUserId) {
  setLoading?.(true);
  try {
    const docRef = doc(db, "products", id);
    const scope = resolveScope(scopeOrUserId);
    let productTitle = "";
    if (scope.userId || scope.workspaceId) {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        productTitle = data.title || "";
        if (scope.workspaceId && data.workspaceId && data.workspaceId !== scope.workspaceId) {
          throw new Error("Unauthorized: You do not have permission to delete this product.");
        }
        if (!data.workspaceId && scope.userId && data.userId && data.userId !== scope.userId) {
          throw new Error("Unauthorized: You do not have permission to delete this product.");
        }
      }
    }
    await deleteDoc(docRef);

    if (scope.workspaceId) {
      logActivity({
        workspaceId: scope.workspaceId,
        actor: scope.actor,
        action: "product_delete",
        entityType: "product",
        entityId: id,
        entityTitle: productTitle || id,
        details: `Deleted product "${productTitle || id}"`,
      });
    }
  } catch (error) {
    console.error("Error deleting product : ", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

export { createProduct, listenToProducts, updateProduct, deleteProduct };
