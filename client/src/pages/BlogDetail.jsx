import { AlertCircle, ArrowLeft, FileText, Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import client from "../api/client.js";
import CommentSection from "../components/CommentSection.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function BlogDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchBlog = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await client.get(`/blogs/${id}`);
      setBlog(data.blog);
      setComments(Array.isArray(data.comments) ? data.comments : []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load this story.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBlog();
  }, [fetchBlog]);

  const handleDeleteBlog = async () => {
    setDeleting(true);
    setError("");
    try {
      await client.delete(`/blogs/${id}`);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete blog.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleCommentDeleted = (deletedId, responseData) => {
    if (responseData?.softDeleted && responseData.comment) {
      setComments((prev) =>
        prev.map((c) => (c._id === deletedId ? responseData.comment : c))
      );
      return;
    }

    const idsToRemove = new Set(
      Array.isArray(responseData?.removedIds) && responseData.removedIds.length > 0
        ? responseData.removedIds
        : [deletedId]
    );
    setComments((prev) => prev.filter((c) => !idsToRemove.has(c._id)));
  };

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto py-10 px-4 animate-pulse">
        <div className="h-4 bg-stone-200 rounded w-32 mb-8" />
        <div className="h-9 bg-stone-200 rounded w-3/4 mb-4" />
        <div className="h-4 bg-stone-100 rounded w-48 mb-8" />
        <div className="h-[340px] bg-stone-200 rounded-xl mb-8" />
        <div className="space-y-3">
          <div className="h-4 bg-stone-100 rounded w-full" />
          <div className="h-4 bg-stone-100 rounded w-full" />
          <div className="h-4 bg-stone-100 rounded w-5/6" />
        </div>
      </main>
    );
  }

  if (error || !blog) {
    return (
      <main className="max-w-3xl mx-auto py-12 px-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-[#111214] mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all blogs</span>
        </Link>

        <div className="p-8 bg-white border border-stone-200 rounded-xl text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
          <h1 className="font-display text-lg font-semibold text-[#111214]">
            Story unavailable
          </h1>
          <p className="mt-1.5 text-sm text-stone-600">
            {error || "This blog could not be found."}
          </p>
        </div>
      </main>
    );
  }

  const isAuthor = user && user._id === blog.author?._id;
  const authorName = blog.author?.name || "Anonymous";
  const authorInitial = authorName.charAt(0).toUpperCase();
  const imageUrl = blog.coverImage?.url;
  const hasSafeImage =
    !imageError &&
    typeof imageUrl === "string" &&
    (imageUrl.startsWith("https://") ||
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("/api/uploads/"));

  return (
    <main className="max-w-3xl mx-auto py-10 px-4">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-[#111214] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to all blogs</span>
      </Link>

      <article className="mt-6">
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#111214] leading-tight [text-wrap:balance]">
          {blog.title}
        </h1>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="w-9 h-9 rounded-full bg-[#121316] text-amber-400 text-sm font-semibold flex items-center justify-center shrink-0"
            >
              {authorInitial}
            </span>
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <span className="font-medium text-[#111214]">{authorName}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={blog.createdAt} className="tabular-nums">
                {formatDate(blog.createdAt)}
              </time>
            </div>
          </div>

          {isAuthor && (
            <div className="flex items-center gap-2.5">
              <Link
                to={`/edit/${blog._id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-700 bg-white border border-stone-200 hover:border-stone-300 hover:text-[#111214] rounded-lg transition-colors whitespace-nowrap"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit</span>
              </Link>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>

        {confirmDelete && (
          <div
            role="alertdialog"
            aria-label="Confirm blog deletion"
            className="mt-5 p-4 bg-red-50 border border-red-200 rounded-xl flex flex-wrap items-center justify-between gap-3"
          >
            <p className="text-sm font-medium text-red-800">
              Delete this story permanently? This also removes all comments.
            </p>
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBlog}
                disabled={deleting}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg"
              >
                {deleting ? "Deleting..." : "Confirm delete"}
              </button>
            </div>
          </div>
        )}

        <div className="my-6 rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
          {hasSafeImage ? (
            <img
              src={imageUrl}
              alt={blog.title}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full max-h-[440px] object-cover"
            />
          ) : (
            <div className="h-[260px] w-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 text-stone-400">
              <FileText className="w-9 h-9 mb-2" />
              <span className="text-sm text-stone-500">Cover image unavailable</span>
            </div>
          )}
        </div>

        <div className="whitespace-pre-line text-lg leading-8 text-stone-800">
          {blog.body}
        </div>
      </article>

      <hr className="mt-12 border-stone-200" />

      <CommentSection
        blogId={blog._id}
        blogAuthorId={blog.author?._id}
        comments={comments}
        onCommentAdded={(newComment) =>
          setComments((prev) => [...prev, newComment])
        }
        onCommentDeleted={handleCommentDeleted}
      />
    </main>
  );
}
