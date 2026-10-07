import { uploadMedia } from "../firebase/mediaAdapter";
import { IoCloudUpload, IoCameraOutline } from "react-icons/io5";
import { useState, useEffect, useRef } from "react";

export default function ImageUploader({
  onUpload,
  currentImage,
  id = "image-uploader",
  label = "Upload Photo",
  subtext = "PNG, JPG, or WEBP. 1:1 square ratio recommended.",
}) {
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

      const { url: imageUrl } = await uploadMedia(file);
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
        id={id}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleChange}
        disabled={loading}
        ref={fileInputRef}
      />

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div
          onClick={handleAvatarClick}
          className={`relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-full border-4 border-surface-elevated bg-surface shadow-md ring-1 ring-border overflow-hidden flex items-center justify-center transition-all ${
            loading ? "animate-pulse ring-primary" : ""
          } 
          cursor-pointer active:scale-95 sm:cursor-default sm:active:scale-100 group`}
        >
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="Profile preview"
                className={`h-full w-full object-cover ${loading ? "opacity-40 blur-[1px]" : ""}`}
              />
              {!loading && (
                <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-200 max-sm:group-hover:opacity-100 flex items-center justify-center text-white sm:hidden">
                  <IoCameraOutline size={20} />
                </div>
              )}
            </>
          ) : (
            !loading && (
              <div className="flex flex-col items-center text-muted-foreground transition-colors max-sm:group-hover:text-primary">
                <IoCameraOutline size={28} className="sm:size-8" />
              </div>
            )
          )}

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>

        {/* Side Text Controls */}
        <div className="hidden sm:flex flex-col items-start text-left">
          {loading ? (
            <div className="flex flex-col items-start gap-2 w-44">
              <div className="h-9 w-32 animate-pulse rounded-xl bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
            </div>
          ) : (
            <>
              <label
                htmlFor={id}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-surface hover:border-border cursor-pointer active:scale-95"
              >
                <IoCloudUpload size={16} className="text-muted-foreground" />
                <span>{label}</span>
              </label>
              <p className="mt-2 text-xs text-muted-foreground">
                {subtext}
              </p>
            </>
          )}
        </div>

      </div>
    </div>
  );
}