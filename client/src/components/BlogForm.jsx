import { AlertCircle, ImagePlus, Upload } from "lucide-react";
import { useEffect, useState } from "react";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export default function BlogForm({
  initialData = null,
  onSubmit,
  submitting = false,
  serverError = "",
  submitLabel = "Publish",
  submittingLabel = "Uploading & Publishing...",
}) {
  const isEdit = Boolean(initialData);

  const [title, setTitle] = useState(initialData?.title || "");
  const [body, setBody] = useState(initialData?.body || "");
  const [coverFile, setCoverFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(initialData?.coverImage?.url || "");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setBody(initialData.body || "");
      setPreviewUrl(initialData.coverImage?.url || "");
    }
  }, [initialData]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setValidationError("");

    if (!file) return;

    if (!ALLOWED_TYPES.has(file.type)) {
      setValidationError("Please choose a JPG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setValidationError("Cover image must be 5MB or smaller.");
      event.target.value = "";
      return;
    }

    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setCoverFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setValidationError("");

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (trimmedTitle.length < 3 || trimmedTitle.length > 150) {
      setValidationError("Title must be between 3 and 150 characters.");
      return;
    }

    if (trimmedBody.length < 20) {
      setValidationError("Article body must be at least 20 characters.");
      return;
    }

    if (!isEdit && !coverFile) {
      setValidationError("Please upload a cover image.");
      return;
    }

    const formData = new FormData();
    formData.append("title", trimmedTitle);
    formData.append("body", trimmedBody);
    if (coverFile) {
      formData.append("coverImage", coverFile);
    }

    await onSubmit(formData);
  };

  const displayError = validationError || serverError;

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {displayError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}

      <div>
        <label
          htmlFor="blog-title"
          className="block text-sm font-medium text-stone-800 mb-2"
        >
          Title
        </label>
        <input
          id="blog-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your story a clear, compelling title"
          maxLength={150}
          className="w-full px-4 py-3 text-lg font-medium text-[#111214] bg-white border border-stone-200 rounded-xl placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent transition-shadow"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="cover-image-input"
            className="block text-sm font-medium text-stone-800"
          >
            Cover image
          </label>
          <span className="text-xs text-stone-500">JPG, PNG, or WEBP up to 5MB</span>
        </div>

        <label
          htmlFor="cover-image-input"
          className="block cursor-pointer group"
        >
          {previewUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
              <img
                src={previewUrl}
                alt="Cover preview"
                referrerPolicy="no-referrer"
                className="w-full max-h-[340px] object-cover"
              />
              <div className="px-4 py-2.5 bg-white border-t border-stone-200 flex items-center justify-between text-sm text-stone-700 group-hover:text-amber-700 transition-colors">
                <span className="inline-flex items-center gap-2 font-medium">
                  <Upload className="w-4 h-4" />
                  {isEdit || coverFile ? "Change cover image" : "Choose another image"}
                </span>
                {coverFile && (
                  <span className="text-xs text-stone-500 truncate max-w-[200px]">
                    {coverFile.name}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-6 border border-dashed border-stone-300 rounded-xl bg-white hover:border-amber-600/60 hover:bg-stone-50/60 transition-colors text-center">
              <ImagePlus className="w-8 h-8 text-stone-400 mb-3" />
              <p className="text-sm font-medium text-stone-800">
                Click to upload a cover image
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Recommended 16:9 landscape image (max 5MB)
              </p>
            </div>
          )}

          <input
            id="cover-image-input"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="blog-body"
            className="block text-sm font-medium text-stone-800"
          >
            Story
          </label>
          <span className="text-xs text-stone-500 tabular-nums">
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
        </div>
        <textarea
          id="blog-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your story here..."
          className="w-full min-h-[300px] px-4 py-3.5 text-base leading-relaxed text-[#111214] bg-white border border-stone-200 rounded-xl placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent transition-shadow resize-y"
        />
      </div>

      <div className="pt-2 flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 text-sm font-medium text-white bg-[#121316] hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
