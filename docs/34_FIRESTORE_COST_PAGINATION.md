# 34. Firestore Cost Optimization & Pagination Strategy

---

## 1. Cost & Read Reduction Principles

Firestore charges per document read, write, and delete operation. Unbounded collection reads can cause high charges.

### Optimization Rules:
1. **Bounded Queries:** Always enforce `limit(20)` on initial page queries.
2. **Context Caching:** Store fetched invoice lists in React Context / local state cache. Avoid re-querying Firestore on every route navigation unless mutated.
3. **Selective Document Fields:** Avoid fetching entire document history when rendering summary cards.

---

## 2. Cursor-Based Pagination Implementation

```javascript
import { collection, query, where, orderBy, limit, startAfter, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";

// Initial Page Read (Page 1)
export const getInvoicesFirstPage = async (userId, pageSize = 15) => {
  const q = query(
    collection(db, "invoices"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );
  const snapshot = await getDocs(q);
  const lastVisible = snapshot.docs[snapshot.docs.length - 1];
  const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return { items, lastVisible };
};

// Subsequent Page Read (Page 2+)
export const getInvoicesNextPage = async (userId, lastVisibleDoc, pageSize = 15) => {
  const q = query(
    collection(db, "invoices"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    startAfter(lastVisibleDoc),
    limit(pageSize)
  );
  const snapshot = await getDocs(q);
  const lastVisible = snapshot.docs[snapshot.docs.length - 1];
  const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return { items, lastVisible };
};
```

---

## 3. Real-Time Listener Lifecycle Management
Use `onSnapshot` only on active views (e.g. Dashboard summary) and always unsubscribe in React `useEffect` cleanup return:

```javascript
useEffect(() => {
  if (!user) return;
  const q = query(collection(db, "invoices"), where("userId", "==", user.uid));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    // Process snapshot update
  });
  return () => unsubscribe(); // Cleanup listener on unmount!
}, [user]);
```
