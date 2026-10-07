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
const productsCollection = collection(db, "products");

// Create a new product attached to current user ID
async function createProduct(product, setLoading, userId) {
  setLoading?.(true);
  try {
    const targetUid = userId || product.userId;
    if (!targetUid) {
      throw new Error("User authentication required to create product.");
    }
    const productPayload = {
      ...product,
      userId: targetUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(productsCollection, productPayload);
    return docRef;
  } catch (error) {
    console.error("Error adding product: ", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

// Stream live product snapshot data isolated per user ID
function listenToProducts(callback, userId) {
  const targetUid = userId;

  if (!targetUid) {
    callback([]);
    return () => {};
  }


  const q = query(productsCollection, where("userId", "==", targetUid));

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
async function updateProduct(id, updatedData, setLoading, userId) {
  if (!id) throw new Error("No product ID provided");
  setLoading?.(true);

  try {
    const docRef = doc(db, "products", id);
    if (userId) {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().userId && docSnap.data().userId !== userId) {
        throw new Error("Unauthorized: You do not have permission to update this product.");
      }
    }
    await updateDoc(docRef, { ...updatedData, updatedAt: serverTimestamp() });
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

// Delete product by ID
async function deleteProduct(id, setLoading, userId) {
  setLoading?.(true);
  try {
    const docRef = doc(db, "products", id);
    if (userId) {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().userId && docSnap.data().userId !== userId) {
        throw new Error("Unauthorized: You do not have permission to delete this product.");
      }
    }
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleteing product : ", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

export { createProduct, listenToProducts, updateProduct, deleteProduct };
