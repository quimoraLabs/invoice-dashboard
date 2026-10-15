import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

const activityCollection = collection(db, "activity_logs");

/**
 * Record an audit log entry for any workspace mutation
 */
export async function logActivity({
  workspaceId,
  actor,
  action,
  entityType,
  entityId,
  entityTitle,
  details,
}) {
  if (!workspaceId) return null;

  try {
    const actorUid = actor?.uid || actor?.id || "";
    const actorName =
      actor?.displayName || actor?.name || actor?.email?.split("@")[0] || "User";
    const actorEmail = actor?.email || "";

    const docRef = await addDoc(activityCollection, {
      workspaceId,
      actorUid,
      actorName,
      actorEmail,
      action: action || "change", // e.g. "invoice_create", "invoice_update", "invoice_delete", "customer_create", "customer_update", "customer_delete", "product_create", "product_update", "product_delete", "member_invite", "member_remove", "member_join"
      entityType: entityType || "general", // "invoice", "customer", "product", "member", "workspace"
      entityId: entityId || "",
      entityTitle: entityTitle || "",
      details: details || "",
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (err) {
    console.warn("Could not record activity log:", err.message);
    return null;
  }
}

/**
 * Real-time listener for workspace activity logs
 */
export function listenToActivityLogs(workspaceId, callback, maxCount = 100) {
  if (!workspaceId) {
    callback([]);
    return () => {};
  }

  const q = query(
    activityCollection,
    where("workspaceId", "==", workspaceId),
    orderBy("createdAt", "desc"),
    limit(maxCount)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const logs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(logs);
    },
    (error) => {
      console.error("Error listening to activity logs:", error);
      callback([]);
    }
  );
}
