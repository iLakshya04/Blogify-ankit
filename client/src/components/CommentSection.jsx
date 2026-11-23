import { AlertCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

function formatCommentDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CommentSection({
  blogId,
  comments,
  onCommentAdded,
  onCommentDeleted,
}) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      setError("Please enter a comment before posting.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const { data } = await client.post(`/blogs/${blogId}/comments`, {
        content: trimmed,
      });
      onCommentAdded(data);
      setContent("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    setDeletingId(commentId);
    setError("");
    try {
      await client.delete(`/comments/${commentId}`);
      onCommentDeleted(commentId);
      setConfirmingId(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete comment.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section aria-labelledby="comments-heading" className="pt-8">
      <h2
        id="comments-heading"
        className="text-xl font-semibold tracking-tight text-gray-900 tabular-nums"
      >
        Comments ({comments.length})
      </h2>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {user ? (
        <form onSubmit={handleSubmit} className="mt-5">
          <label htmlFor="comment-input" className="sr-only">
            Add a comment
          </label>
          <textarea
            id="comment-input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts on this story..."
            rows={3}
            maxLength={1000}
            className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-200 rounded-xl placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-shadow resize-y"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap"
            >
              {submitting ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-5 p-4 bg-white border border-gray-200 rounded-xl flex items-center justify-between gap-4">
          <p className="text-sm text-gray-600">Log in to leave a comment.</p>
          <Link
            to="/login"
            className="px-3.5 py-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Log in
          </Link>
        </div>
      )}

      <div className="mt-8 divide-y divide-gray-200">
        {comments.length === 0 ? (
          <p className="py-6 text-sm text-gray-500">
            No comments yet. Be the first to respond.
          </p>
        ) : (
          comments.map((comment) => {
            const isOwner = user && user._id === comment.author?._id;
            const authorName = comment.author?.name || "Anonymous";
            const initial = authorName.charAt(0).toUpperCase();

            return (
              <article key={comment._id} className="py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      aria-hidden="true"
                      className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold flex items-center justify-center shrink-0"
                    >
                      {initial}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-gray-500 min-w-0">
                      <span className="font-medium text-gray-900 truncate">
                        {authorName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <time dateTime={comment.createdAt} className="whitespace-nowrap">
                        {formatCommentDate(comment.createdAt)}
                      </time>
                    </div>
                  </div>

                  {isOwner && (
                    <div className="shrink-0">
                      {confirmingId === comment._id ? (
                        <div className="flex items-center gap-2 text-xs">
                          <button
                            type="button"
                            disabled={deletingId === comment._id}
                            onClick={() => handleDelete(comment._id)}
                            className="font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                          >
                            {deletingId === comment._id ? "Deleting..." : "Confirm"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingId(null)}
                            className="text-gray-500 hover:text-gray-800"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmingId(comment._id)}
                          aria-label="Delete comment"
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <p className="mt-2.5 pl-9 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {comment.content}
                </p>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
