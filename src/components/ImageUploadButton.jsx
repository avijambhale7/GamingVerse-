import { useRef, useState } from "react";
import { uploadImageFile } from "../utils/uploadImage.js";
import "./ImageUploadButton.css";

/* =========================================================
   IMAGE UPLOAD BUTTON
   A file-picker button that uploads to Firebase Storage and
   hands the resulting URL(s) back to the caller. The caller
   still owns the form field — this only replaces "paste a
   URL" with "pick a file" as the way to fill it.
========================================================= */
export default function ImageUploadButton({
  className = "",
  label = "Upload Photo",
  multiple = false,
  onError,
  onUploaded,
  pathPrefix,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    setUploading(true);
    try {
      const urls = await Promise.all(
        files.map((file) => uploadImageFile(file, pathPrefix)),
      );
      onUploaded(multiple ? urls : urls[0]);
    } catch (error) {
      console.error("Image upload error:", error);
      onError?.("Could not upload the image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={className || "image-upload-button"}
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : `📷 ${label}`}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleChange}
        style={{ display: "none" }}
      />
    </>
  );
}
