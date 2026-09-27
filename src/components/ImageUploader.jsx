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
    if (!file) return;
    try {
      setLoading(true);

      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);

      const imageUrl = await uploadToCloudinary(file);
      if (onUpload) onUpload(imageUrl, file);
    } catch (err) {
      console.error("Image upload failed:", err);
      setPreviewUrl(currentImage || "");
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Triggers input ONLY on mobile screens (window width under 640px)
  const handleAvatarClick = () => {
    if (window.innerWidth < 640 && fileInputRef.current && !loading) {
      fileInputRef.current.click();
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

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
        
        {/* Changed from <label htmlFor="..."> to a standard <div> to drop built-in click actions */}
        <div
          onClick={handleAvatarClick}
          className={`relative h-24 w-24 sm:h-28 sm:w-28 flex-shrink-0 rounded-full border-4 border-white bg-slate-50 shadow-md ring-1 ring-slate-200/80 overflow-hidden flex items-center justify-center transition-all ${
            loading ? "animate-pulse ring-indigo-300" : ""
          } 
          /* 100% STRICT STYLING: Interactive only on mobile, completely dead layout on desktop */
          cursor-pointer active:scale-95 sm:cursor-default sm:active:scale-100 group`}
        >
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="Profile preview"
                className={`h-full w-full object-cover ${loading ? "opacity-40 blur-[1px]" : ""}`}
              />
              {/* HOVER HOOK: Visible ONLY on mobile screens via max-sm: selector */}
              {!loading && (
                <div className="absolute inset-0 bg-slate-900/30 opacity-0 transition-opacity duration-200 max-sm:group-hover:opacity-100 flex items-center justify-center text-white sm:hidden">
                  <IoCameraOutline size={20} />
                </div>
              )}
            </>
          ) : (
            // Static placeholder camera graphic
            !loading && (
              <div className="flex flex-col items-center text-slate-300 transition-colors max-sm:group-hover:text-indigo-500">
                <IoCameraOutline size={28} className="sm:size-[32px]" />
              </div>
            )
          )}

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/10">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            </div>
          )}
        </div>

        {/* Side Text Controls: Hidden completely on mobile view */}
        <div className="hidden sm:flex flex-col items-start text-left">
          {loading ? (
            <div className="flex flex-col items-start gap-2 w-44">
              <div className="h-9 w-32 animate-pulse rounded-xl bg-slate-200" />
              <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
            </div>
          ) : (
            <>
              {/* Using a real target label here makes this the ONLY trigger path for desktop view */}
              <label
                htmlFor="image-uploader"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 cursor-pointer active:scale-95"
              >
                <IoCloudUpload size={16} className="text-slate-500" />
                <span>Upload Photo</span>
              </label>
              <p className="mt-2 text-xs text-slate-400">
                PNG, JPG, or WEBP. 1:1 square ratio recommended.
              </p>
            </>
          )}
        </div>

      </div>
    </div>
  );
}