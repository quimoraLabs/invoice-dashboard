import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  sendPasswordResetEmail,
  updatePassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { auth } from "./firebaseConfig";

// include displayName in the user creation process
export const doCreateUserWithEmailAndPassword = async (
  email,
  displayName,
  password
) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  // update profile with displayName
  await updateProfile(userCredential.user, {
    displayName: displayName,
  });

  return userCredential;
};

export const doSignInWithEmailAndPassword = async (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const doSignInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    const result = await signInWithPopup(auth, provider);
    return result;
  } catch (error) {
    // If popup is blocked by browser/mobile policy, fallback seamlessly to redirect mode
    if (
      error.code === "auth/popup-blocked" ||
      error.code === "auth/popup-closed-by-user" ||
      error.code === "auth/cancelled-popup-request"
    ) {
      console.warn("Popup blocked by browser policy. Falling back to signInWithRedirect...");
      await signInWithRedirect(auth, provider);
      return;
    }
    throw error;
  }
};

export const doSignOut = () => {
  return auth.signOut();
};

export const doPasswordReset = (email) => {
  return sendPasswordResetEmail(auth, email);
};

export const doPasswordChange = (password) => {
  return updatePassword(auth.currentUser, password);
};

export const doSendEmailVerification = () => {
  return sendEmailVerification(auth.currentUser, {
    url: `${window.location.origin}/home`,
  });
};
