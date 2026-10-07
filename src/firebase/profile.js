import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

/**
 * Save or update organization/user business profile
 * Stored at: business_profiles/{orgId}
 */
export async function saveBusinessProfile(orgId, profileData, actorUserId, setLoading) {
  if (!orgId) {
    throw new Error("Organization or User ID is required to save business profile.");
  }
  setLoading?.(true);

  try {
    const profileRef = doc(db, "business_profiles", orgId);
    const existingSnap = await getDoc(profileRef);

    const payload = {
      orgId,
      userId: actorUserId || orgId,
      companyName: (profileData.companyName || "").trim(),
      ownerName: (profileData.ownerName || "").trim(),
      email: (profileData.email || "").trim(),
      phone: String(profileData.phone || "").trim(),
      address: (profileData.address || "").trim(),
      gstin: (profileData.gstin || "").trim().toUpperCase(),
      website: (profileData.website || "").trim(),
      bankName: (profileData.bankName || "").trim(),
      accountNumber: String(profileData.accountNumber || "").trim(),
      ifscCode: (profileData.ifscCode || "").trim().toUpperCase(),
      logoUrl: profileData.logoUrl || "",
      signatureUrl: profileData.signatureUrl || "",
      updatedAt: serverTimestamp(),
    };

    if (!existingSnap.exists()) {
      payload.createdBy = actorUserId || orgId;
      payload.createdAt = serverTimestamp();
      await setDoc(profileRef, payload);
    } else {
      await setDoc(profileRef, payload, { merge: true });
    }

    return payload;
  } catch (error) {
    console.error("Error saving business profile:", error);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

/**
 * Fetch business profile document once
 */
export async function getBusinessProfile(orgId) {
  if (!orgId) return null;
  try {
    const profileRef = doc(db, "business_profiles", orgId);
    const snap = await getDoc(profileRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching business profile:", error);
    throw error;
  }
}

/**
 * Listen to realtime business profile updates
 */
export function listenToBusinessProfile(orgId, callback) {
  if (!orgId) {
    callback(null);
    return () => {};
  }
  const profileRef = doc(db, "business_profiles", orgId);
  return onSnapshot(
    profileRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() });
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error("Error listening to business profile:", error);
      callback(null);
    }
  );
}
