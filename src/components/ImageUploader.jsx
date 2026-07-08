import { uploadToCloudinary } from "../firebase/getFileUrl";
import { IoCloudUpload, IoCameraOutline } from "react-icons/io5";
import { useState, useEffect, useRef } from "react";

export default function ImageUploader({ onUpload, currentImage }) {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImage || "");
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPreviewUrl(currentImage || "");
  }, [currentImage]);

  const handleChange = async (event) => {
    const file = event.target.files[0];
    try {
      setLoading(true);

      // Create a local URL for immediate preview.
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);

      const imageUrl = await uploadToCloudinary(file);
      if (onUpload) onUpload(imageUrl);
    } catch (err) {
      // If upload fails, revert to the original image.
      console.error("Image upload failed:", err);
      setPreviewUrl(currentImage || "");
    } finally {
      setLoading(false);
      // Reset file input to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="w-full">
      <input
        id="image-uploader"
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleChange}
        disabled={loading}
        ref={fileInputRef}
      />

      {/* Responsive layout wrapper */}
      <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:gap-6">
        {/* Image preview circle */}
        <label
          htmlFor="image-uploader"

          className={`relative group h-28 w-28 flex-shrink-0 rounded-full border-4 border-white bg-slate-100 shadow-md ring-1 ring-slate-200/60 overflow-hidden flex items-center justify-center pointer-events-none max-md:pointer-events-auto max-md:cursor-pointer ${
            loading ? "animate-pulse ring-slate-300" : ""
          }`}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Profile preview"
              className={`h-full w-full object-cover transition-all duration-300 ${
                loading ? "opacity-40 blur-[2px]" : "max-md:group-hover:scale-105"
              }`}
            />
          ) : (
            // Show camera icon on mobile if no image
            !loading && (
              <IoCameraOutline
                size={32}
                className="text-slate-400 transition-colors max-md:group-hover:text-slate-600 md:hidden"
              />
            )
          )}

          {/* Hover overlay - ONLY WORKS ON MOBILE NOW */}
          {previewUrl && !loading && (
            <div className="absolute inset-0 bg-slate-950/40 text-white flex flex-col items-center justify-center opacity-0 transition-opacity duration-200 md:hidden max-md:group-hover:opacity-100">
              <IoCameraOutline size={22} />
            </div>
          )}
        </label>

        {/* Upload button and text */}
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          {loading ? (
            // Skeleton loader for loading state
            <div className="flex flex-col items-center md:items-start gap-2 w-48">
              <div className="h-9 w-36 animate-pulse rounded-xl bg-slate-200" />
              <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
            </div>
          ) : (
            // Default state with upload button and helper text
            <>
              <label
                htmlFor="image-uploader"
                className="hidden md:inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer active:scale-95"
              >
                <IoCloudUpload size={16} className="text-slate-500" />
                <span>Upload Photo</span>
              </label>
              <p className="mt-2 text-xs text-slate-500 hidden md:block">
                PNG, JPG, or WEBP. 1:1 ratio recommended.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}