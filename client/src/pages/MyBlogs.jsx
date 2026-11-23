import { AlertCircle, Eye, FileText, Pencil, PenLine, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client.js";

function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MyBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [failedImages, setFailedImages] = useState({});

  const fetchMyBlogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await client.get("/blogs/my");
      setBlogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load your blogs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyBlogs();
  }, [fetchMyBlogs]);

  const handleDelete = async (blogId) => {
    setDeletingId(blogId);
    setError("");
    try {
      await client.delete(`/blogs/${blogId}`);
      setBlogs((prev) => prev.filter((item) => item._id !== blogId));
      setConfirmId(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete blog.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#111214]">
            My Blogs
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Manage your published stories.
          </p>
        </div>

        <Link
          to="/write"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#121316] hover:bg-stone-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <PenLine className="w-4 h-4 text-amber-400" />
          <span>Write New Blog</span>
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="p-4 bg-white border border-stone-200 rounded-xl flex items-center gap-4 animate-pulse"
            >
              <div className="w-24 h-16 rounded-lg bg-stone-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-stone-200 rounded w-1/2" />
                <div className="h-3.5 bg-stone-100 rounded w-28" />
              </div>
            </div>
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className="mt-10 p-10 bg-white border border-stone-200 rounded-xl text-center">
          <h2 className="font-display text-lg font-semibold text-[#111214]">
            You haven&apos;t published any stories yet
          </h2>
          <p className="mt-1.5 text-sm text-stone-600">
            Write your first blog post to see it listed here.
          </p>
          <Link
            to="/write"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#121316] hover:bg-stone-800 rounded-lg transition-colors"
          >
            <PenLine className="w-4 h-4 text-amber-400" />
            <span>Write New Blog</span>
          </Link>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-stone-200 bg-white border border-stone-200 rounded-xl overflow-hidden">
          {blogs.map((blog) => {
            const imageUrl = blog.coverImage?.url;
            const hasSafeImage =
              !failedImages[blog._id] &&
              typeof imageUrl === "string" &&
              (imageUrl.startsWith("https://") ||
                imageUrl.startsWith("http://") ||
                imageUrl.startsWith("/api/uploads/"));

            return (
              <div
                key={blog._id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <Link
                    to={`/blogs/${blog._id}`}
                    className="w-24 h-16 rounded-lg bg-stone-100 border border-stone-200 overflow-hidden shrink-0"
                  >
                    {hasSafeImage ? (
                      <img
                        src={imageUrl}
                        alt={blog.title}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [blog._id]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400">
                        <FileText className="w-5 h-5" />
                      </div>
                    )}
                  </Link>

                  <div className="min-w-0">
                    <Link
                      to={`/blogs/${blog._id}`}
                      className="block font-display text-base font-semibold text-[#111214] hover:text-amber-700 truncate transition-colors"
                    >
                      {blog.title}
                    </Link>
                    <p className="mt-1 text-xs text-stone-500 tabular-nums">
                      Published {formatDate(blog.createdAt)}
                    </p>
                  </div>
                </div>

                {confirmId === blog._id ? (
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-xs font-medium text-red-700">
                      Delete post?
                    </span>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      disabled={deletingId === blog._id}
                      className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(blog._id)}
                      disabled={deletingId === blog._id}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg"
                    >
                      {deletingId === blog._id ? "Deleting..." : "Confirm"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/blogs/${blog._id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-200 hover:border-stone-300 hover:text-[#111214] rounded-lg transition-colors whitespace-nowrap"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </Link>
                    <Link
                      to={`/edit/${blog._id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-200 hover:border-stone-300 hover:text-[#111214] rounded-lg transition-colors whitespace-nowrap"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setConfirmId(blog._id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
