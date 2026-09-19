import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

/* =========================================================
   UPLOAD IMAGE
   Shared with Profile.jsx's existing photo-upload flow —
   same storage layout (a safe filename under a caller-given
   path prefix), just factored out so café/marketplace forms
   can reuse it instead of asking sellers for a hosted URL.
========================================================= */
export async function uploadImageFile(file, pathPrefix) {
  const storage = getStorage();
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileRef = storageRef(
    storage,
    `${pathPrefix}/${Date.now()}_${safeFileName}`,
  );
  const uploadResult = await uploadBytes(fileRef, file);
  return getDownloadURL(uploadResult.ref);
}
