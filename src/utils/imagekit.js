import { uploadToCloudinary } from "../firebase/getFileUrl";

/**
 * Checks whether ImageKit frontend environment variables are set.
 */
export function isImageKitConfigured() {
  return Boolean(
    import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT &&
    import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY
  );
}

/**
 * Transforms an image URL with ImageKit's AI-assisted smart pad, crop, and blurred background.
 * If the image is not from ImageKit, returns the original URL safely.
 * 
 * @param {string} url - Original image URL
 * @param {Object} options
 * @param {number} [options.width=300]
 * @param {number} [options.height=300]
 * @param {"pad_resize" | "pad_extract" | "maintain_ratio" | "force"} [options.mode="pad_resize"]
 * @param {string} [options.background="blurred"] - "blurred" or hex like "F3F4F6"
 */
export function getSmartImageUrl(url, { width = 300, height = 300, mode = "pad_resize", background = "blurred" } = {}) {
  if (!url || typeof url !== "string") return "";

  // Check if it's an ImageKit URL
  if (url.includes("ik.imagekit.io")) {
    const separator = url.includes("?") ? "&" : "?";
    // cm-pad_resize ensures zero cut, zero stretch; bg-blurred fills odd aspect ratio borders
    return `${url}${separator}tr=w-${width},h-${height},cm-${mode},bg-${background},fo-auto`;
  }

  // Cloudinary smart fallback transformation if applicable
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace("/upload/", `/upload/c_pad,w_${width},h_${height},b_auto:predominant,q_auto,f_auto/`);
  }

  return url;
}

/**
 * Securely uploads a file to ImageKit using client-to-cloud upload with server-signed authentication.
 * Supports structured folders and duplicate-prevention (useUniqueFileName: false).
 * 
 * @param {File} file - File object to upload
 * @param {Object} options
 * @param {string} [options.fileName] - Exact custom name (e.g. "PRD-00045.jpg")
 * @param {string} [options.folder="/invomora"] - Target folder path on ImageKit
 * @param {string} [options.tags=""] - Comma-separated tags
 */
export async function uploadToImageKit(file, { fileName, folder = "/invomora", tags = "" } = {}) {
  const endpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT;
  const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;

  if (!endpoint || !publicKey) {
    throw new Error("ImageKit environment variables (VITE_IMAGEKIT_URL_ENDPOINT, VITE_IMAGEKIT_PUBLIC_KEY) are missing.");
  }

  // 1. Fetch serverless authentication signature
  const authRes = await fetch("/api/imagekit-auth");
  if (!authRes.ok) {
    const errData = await authRes.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to authenticate with ImageKit server endpoint.");
  }
  const { token, expire, signature } = await authRes.json();

  // 2. Prepare FormData for ImageKit direct upload API
  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileName", fileName || file.name);
  formData.append("publicKey", publicKey);
  formData.append("signature", signature);
  formData.append("expire", String(expire));
  formData.append("token", token);
  formData.append("folder", folder);
  formData.append("useUniqueFileName", "false"); // Overwrite if same code/name uploaded, avoiding duplicates
  if (tags) {
    formData.append("tags", tags);
  }

  // 3. Post to ImageKit upload API
  const uploadRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    body: formData,
  });

  if (!uploadRes.ok) {
    const errorJson = await uploadRes.json().catch(() => ({}));
    throw new Error(errorJson.message || "ImageKit upload failed.");
  }

  const result = await uploadRes.json();
  return {
    url: result.url,
    fileId: result.fileId,
    name: result.name,
    filePath: result.filePath,
    thumbnailUrl: result.thumbnailUrl,
  };
}

/**
 * Universal media uploader:
 * Uses ImageKit if configured, otherwise falls back smoothly to Cloudinary.
 * 
 * @param {File} file
 * @param {Object} options
 */
export async function smartUploadMedia(file, { fileName, folder = "/invomora", tags = "" } = {}) {
  if (isImageKitConfigured()) {
    try {
      const res = await uploadToImageKit(file, { fileName, folder, tags });
      return { url: res.url, provider: "imagekit" };
    } catch (err) {
      console.warn("ImageKit upload failed, falling back to Cloudinary:", err?.message);
    }
  }

  // Fallback to Cloudinary without disrupting existing setups
  const cloudinaryUrl = await uploadToCloudinary(file);
  return { url: cloudinaryUrl, provider: "cloudinary" };
}
