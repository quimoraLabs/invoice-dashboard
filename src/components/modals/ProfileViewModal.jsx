import { HiX } from "react-icons/hi";
import { useAuth } from "../../contexts/authContext/useAuth";
import { updateProfile } from "firebase/auth";
import { useState, useEffect } from "react";
import ImageUploader from "../ImageUploader";
import { auth } from "../../firebase/firebaseConfig";
import toast from "react-hot-toast";

export default function ProfileModal({ isOpen, onClose }) {
  const { currentUser, reloadCurrentUser } = useAuth();
  const [updating, setUpdating] = useState(false);

  // Local states for inputs and uploaded photo URL
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Sync profile details when the modal opens or currentUser updates
  useEffect(() => {
    if (currentUser && isOpen) {
      setDisplayName(currentUser.displayName || "");
      setPhotoURL(currentUser.photoURL || "");
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const originalName = currentUser?.displayName || "";
  const originalPhoto = currentUser?.photoURL || "";

  // The button is clickable if name or photo URL genuinely changed
  const hasNameChanged = displayName.trim() !== originalName;
  const hasPhotoChanged = photoURL !== originalPhoto;
  const hasChanges = hasNameChanged || hasPhotoChanged;
  const isSaveDisabled = !hasChanges || updating;

  const handleImageUploaded = (uploadedUrl) => {
    setPhotoURL(uploadedUrl);
    showNotification("Image uploaded! Click 'Save Changes' to apply.");
  };

  const showNotification = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3500);
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();

    if (!hasChanges) return;

    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;

    try {
      setUpdating(true);
      const updatePayload = {};

      if (hasNameChanged) {
        updatePayload.displayName = displayName.trim();
      }
      if (hasPhotoChanged) {
        updatePayload.photoURL = photoURL;
      }

      await updateProfile(firebaseUser, updatePayload);
      if (reloadCurrentUser) {
        reloadCurrentUser();
      }

      toast.success("Profile updated successfully!");
      showNotification("Profile updated successfully!");

      setTimeout(() => {
        onClose();
      }, 600);
    } catch (error) {
      console.error("Error updating profile details:", error);
      toast.error("Failed to update profile details.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md transform rounded-3xl bg-white p-6 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Account Settings
            </h3>
            <p className="text-xs text-slate-400">
              Update your public profile metadata
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
          >
            <HiX size={18} />
          </button>
        </div>

        {successMessage && (
          <div className="mt-4 rounded-xl bg-indigo-50 px-4 py-2.5 text-xs font-semibold text-indigo-700 animate-in fade-in slide-in-from-top-1">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSaveChanges} className="py-6 flex flex-col gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Profile Image{" "}
              {updating && (
                <span className="text-indigo-600 normal-case font-normal ml-2">
                  (Saving...)
                </span>
              )}
            </label>

            <ImageUploader
              currentImage={photoURL}
              onUpload={handleImageUploaded}
            />
          </div>

          <div className="space-y-4">
            {/* Email Field - Read-only */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Email Address (Unique ID)
              </label>
              <input
                type="email"
                disabled
                value={currentUser?.email || ""}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm font-medium text-slate-400 cursor-not-allowed focus:outline-none"
              />
            </div>

            {/* Editable Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaveDisabled}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none shadow-sm shadow-indigo-100"
            >
              {updating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
