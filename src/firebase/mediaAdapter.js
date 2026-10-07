import { uploadToCloudinary } from "./getFileUrl";

let bucketEnsured = false;

/**
 * Ensures bucket exists in the local Floci emulator and configures CORS
 * to allow direct browser uploads from the Vite dev server.
 */
async function ensureBucketWithCors(s3, bucket, S3Commands) {
  if (bucketEnsured) return;
  const { CreateBucketCommand, PutBucketCorsCommand } = S3Commands;

  try {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
  } catch {
    // Bucket already exists or created previously
  }

  try {
    await s3.send(
      new PutBucketCorsCommand({
        Bucket: bucket,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:3000",
              ],
              AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
              AllowedHeaders: ["*"],
              ExposeHeaders: ["ETag"],
              MaxAgeSeconds: 3000,
            },
          ],
        },
      })
    );
  } catch (err) {
    console.warn("[mediaAdapter] Failed to set CORS on local bucket:", err?.message);
  }

  bucketEnsured = true;
}

/**
 * Local Floci S3 upload handler
 */
async function uploadToFloci(file, options = {}) {
  const {
    S3Client,
    PutObjectCommand,
    CreateBucketCommand,
    PutBucketCorsCommand,
  } = await import("@aws-sdk/client-s3");

  const endpoint = import.meta.env.VITE_FLOCI_ENDPOINT || "http://localhost:4566";
  const bucket = import.meta.env.VITE_FLOCI_BUCKET || "invoicing-media-local";
  const region = "us-east-1";

  const s3 = new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId: import.meta.env.VITE_FLOCI_ACCESS_KEY || "test",
      secretAccessKey: import.meta.env.VITE_FLOCI_SECRET_KEY || "test",
    },
    forcePathStyle: true,
  });

  await ensureBucketWithCors(s3, bucket, {
    CreateBucketCommand,
    PutBucketCorsCommand,
  });

  const fileExt = file?.name ? file.name.split(".").pop() : "png";
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const key = options.key || `uploads/${timestamp}-${randomStr}.${fileExt}`;

  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: uint8Array,
      ContentType: file?.type || "application/octet-stream",
    })
  );

  const cleanEndpoint = endpoint.replace(/\/$/, "");
  const url = `${cleanEndpoint}/${bucket}/${key}`;

  return { url, path: key };
}

/**
 * Local Floci S3 delete handler
 */
async function deleteFromFloci(path) {
  const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");

  const endpoint = import.meta.env.VITE_FLOCI_ENDPOINT || "http://localhost:4566";
  const bucket = import.meta.env.VITE_FLOCI_BUCKET || "invoicing-media-local";

  const s3 = new S3Client({
    endpoint,
    region: "us-east-1",
    credentials: {
      accessKeyId: import.meta.env.VITE_FLOCI_ACCESS_KEY || "test",
      secretAccessKey: import.meta.env.VITE_FLOCI_SECRET_KEY || "test",
    },
    forcePathStyle: true,
  });

  let key = path;
  if (path.includes(`/${bucket}/`)) {
    key = path.split(`/${bucket}/`)[1];
  }

  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );

  return true;
}

/**
 * Universal Media Adapter:
 * Routes media uploads to local Floci (if import.meta.env.DEV and VITE_USE_FLOCI is "true")
 * or delegates to production Cloudinary without altering production code paths.
 *
 * @param {File|Blob} file - Browser File/Blob to upload
 * @param {object} options - Optional settings (e.g. custom key)
 * @returns {Promise<{ url: string, path: string }>}
 */
export async function uploadMedia(file, options = {}) {
  const isFlociEnabled =
    import.meta.env.DEV && import.meta.env.VITE_USE_FLOCI === "true";

  if (isFlociEnabled) {
    return await uploadToFloci(file, options);
  }

  // Production path: delegate directly to existing Cloudinary code
  const url = await uploadToCloudinary(file);
  return { url, path: url };
}

/**
 * Universal Media Delete Adapter
 *
 * @param {string} path - Storage key or URL path to remove
 * @returns {Promise<boolean>}
 */
export async function deleteMedia(path) {
  const isFlociEnabled =
    import.meta.env.DEV && import.meta.env.VITE_USE_FLOCI === "true";

  if (isFlociEnabled) {
    return await deleteFromFloci(path);
  }

  // Cloudinary client unsigned preset cannot delete without secret key; safe no-op.
  return true;
}
