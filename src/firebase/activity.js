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
      action: action || "change", // e.g. "invoice_create", "invoice_update", "invoice_delete", "customer_create", "customer_update", "customer_delete", "product_create", "product_update", "product_delete", "member_invite", "member_remove", "member_join", "workspace_create", "security_alert"
      entityType: entityType || "general", // "invoice", "customer", "product", "member", "workspace"
      entityId: entityId || "",
      entityTitle: entityTitle || "",
      details: details || "",
      createdAt: serverTimestamp(),
    });

    if (import.meta.env.DEV) {
      console.log(`[Audit Log Saved] ${action} on ${entityType}: ${entityTitle || entityId}`);
    }

    return docRef.id;
  } catch (err) {
    console.warn("Could not record activity log:", err.message);
    return null;
  }
}

/**
 * Real-time listener for workspace activity logs.
 * Uses client-side sorting fallback so it never fails even if the composite index is pending on Firebase.
 */
export function listenToActivityLogs(workspaceId, callback, maxCount = 100) {
  if (!workspaceId) {
    callback([]);
    return () => {};
  }

  const helperSort = (docs) => {
    return docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })).sort((a, b) => {
      const getMillis = (val) => {
        if (!val) return 0;
        if (typeof val.toMillis === "function") return val.toMillis();
        if (typeof val.toDate === "function") return val.toDate().getTime();
        if (val.seconds) return val.seconds * 1000;
        if (val instanceof Date) return val.getTime();
        return Number(val) || 0;
      };
      return getMillis(b.createdAt) - getMillis(a.createdAt);
    });
  };

  // 1. Try with composite query first
  try {
    const qWithOrder = query(
      activityCollection,
      where("workspaceId", "==", workspaceId),
      orderBy("createdAt", "desc"),
      limit(maxCount)
    );

    return onSnapshot(
      qWithOrder,
      (snapshot) => {
        const logs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(logs);
      },
      (error) => {
        console.warn("Composite query index pending or error, falling back to in-memory sort:", error.message);
        // Fallback: Query by workspaceId only (requires NO composite index)
        const qFallback = query(
          activityCollection,
          where("workspaceId", "==", workspaceId),
          limit(maxCount)
        );

        return onSnapshot(
          qFallback,
          (fallbackSnapshot) => {
            const sortedLogs = helperSort(fallbackSnapshot.docs);
            callback(sortedLogs);
          },
          (fallbackError) => {
            console.error("Error listening to activity logs:", fallbackError);
            callback([]);
          }
        );
      }
    );
  } catch {
    // If query construction fails synchronously, use fallback
    const qFallback = query(
      activityCollection,
      where("workspaceId", "==", workspaceId),
      limit(maxCount)
    );
    return onSnapshot(
      qFallback,
      (snapshot) => {
        callback(helperSort(snapshot.docs));
      },
      () => callback([])
    );
  }
}
