import { HiX } from "react-icons/hi";
import { useAuth } from "../../contexts/authContext/useAuth";
import { useState, useEffect } from "react";
import ImageUploader from "../ImageUploader";
import toast from "react-hot-toast";

export default function ProfileModal({ isOpen, onClose }) {
  const { currentUser, reloadCurrentUser } = useAuth();
  const [updating, setUpdating] = useState(false);

  // Local states for inputs and uploaded photo URL/file
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Sync profile details when the modal opens or currentUser updates
  useEffect(() => {
    if (currentUser && isOpen) {
      setDisplayName(currentUser.displayName || "");
      setPhotoURL(currentUser.photoURL || "");
      setSelectedFile(null);
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const originalName = currentUser?.displayName || "";
  const originalPhoto = currentUser?.photoURL || "";

  // The button is clickable if name or photo URL genuinely changed
  const hasNameChanged = displayName.trim() !== originalName;
  const hasPhotoChanged = Boolean(selectedFile) || photoURL !== originalPhoto;
  const hasChanges = hasNameChanged || hasPhotoChanged;
  const isSaveDisabled = !hasChanges || updating;

  const handleImageUploaded = (uploadedUrl, file) => {
    setPhotoURL(uploadedUrl);
    if (file) {
      setSelectedFile(file);
    }
    showNotification("Image selected! Click 'Save Changes' to update profile photo.");
  };

  const showNotification = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3500);
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();

    if (!hasChanges) return;

    try {
      setUpdating(true);

      if (currentUser?.clerkUser) {
        // 1. Upload & save profile image directly to Clerk user backend
        if (selectedFile) {
          await currentUser.clerkUser.setProfileImage({ file: selectedFile });
        }

        // 2. Update user names in Clerk backend
        const nameParts = displayName.trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        await currentUser.clerkUser.update({
          firstName,
          lastName,
        });
      }

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
      toast.error(error.message || "Failed to update profile details.");
    } finally {
      setUpdating(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md transform rounded-3xl bg-surface-elevated border border-border p-6 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Account Settings
            </h3>
            <p className="text-xs text-muted-foreground">
              Update your public profile metadata
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground transition hover:bg-surface hover:text-foreground"
          >
            <HiX size={18} />
          </button>
        </div>

        {successMessage && (
          <div className="mt-4 rounded-xl bg-primary-muted px-4 py-2.5 text-xs font-semibold text-primary animate-in fade-in slide-in-from-top-1">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSaveChanges} className="py-6 flex flex-col gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Profile Image{" "}
              {updating && (
                <span className="text-primary normal-case font-normal ml-2">
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
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Email Address (Unique ID)
              </label>
              <input
                type="email"
                disabled
                value={currentUser?.email || ""}
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-muted-foreground cursor-not-allowed focus:outline-none"
              />
            </div>

            {/* Editable Full Name */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-foreground transition placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-muted-foreground transition hover:bg-surface-elevated hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaveDisabled}
              className="rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {updating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
