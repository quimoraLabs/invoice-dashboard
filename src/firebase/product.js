import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

// Firestore collection reference
const productsCollection = collection(db, "products");

// Create a new product
async function createProduct(product, setLoading) {
  setLoading?.(true);
  try {
    const docRef = await addDoc(productsCollection, product);
    console.log("product add with ID : ", docRef.id);
    return docRef;
  } catch (error) {
    console.error("Error adding product: ", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

// Read (real-time listener for products)
function listenToProducts(callback) {
  return onSnapshot(productsCollection, (snapshot) => {
    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(products);
  });
}

async function updateProduct(id, updatedData, setLoading) {
  if (!id) throw new Error("No product ID provided");
  setLoading?.(true);

  try {
    const docRef = doc(db, "products", id);
    await updateDoc(docRef, updatedData);
    console.log("Product updated:", id, updatedData);
  } catch (error) {
    // console.log(updatedData);
    console.error("Error updating product:", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

// Delete a product by ID
async function deleteProduct(id, setLoading) {
  setLoading?.(true);
  try {
    const docRef = doc(db, "products", id);
    await deleteDoc(docRef);
    console.log("Product deleted : ", id);
  } catch (error) {
    console.error("Error deleteing product : ", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

export { createProduct, listenToProducts, updateProduct, deleteProduct };
