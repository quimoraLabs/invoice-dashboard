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
      created_at: serverTimestamp(),
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
async function updateProduct(id, updatedData, setLoading) {
  if (!id) throw new Error("No product ID provided");
  setLoading?.(true);

  try {
    const docRef = doc(db, "products", id);
    await updateDoc(docRef, updatedData);
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

// Delete product by ID
async function deleteProduct(id, setLoading) {
  setLoading?.(true);
  try {
    const docRef = doc(db, "products", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleteing product : ", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

export { createProduct, listenToProducts, updateProduct, deleteProduct };
