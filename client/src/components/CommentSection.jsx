import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
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

function buildCommentTree(flatComments) {
  const nodeMap = new Map();
  const roots = [];

  for (const item of flatComments) {
    nodeMap.set(item._id, { ...item, replies: [] });
  }

  for (const item of flatComments) {
    const node = nodeMap.get(item._id);
    const parentId =
      typeof item.parentComment === "object" && item.parentComment !== null
        ? item.parentComment._id
        : item.parentComment;

    if (parentId && nodeMap.has(parentId)) {
      nodeMap.get(parentId).replies.push(node);
    } else {
      roots.push(node);
    }
  }

  // Top-level comments newest first; nested replies oldest first for natural reading order.
  roots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const sortReplies = (nodes) => {
    nodes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    for (const node of nodes) {
      if (node.replies.length > 0) {
        sortReplies(node.replies);
      }
    }
  };

  for (const root of roots) {
    if (root.replies.length > 0) {
      sortReplies(root.replies);
    }
  }

  return roots;
}

function countDescendants(node) {
  let total = node.replies.length;
  for (const child of node.replies) {
    total += countDescendants(child);
  }
  return total;
}

function CommentNode({
  node,
  depth,
  user,
  blogAuthorId,
  activeReplyId,
  setActiveReplyId,
  replyDraft,
  setReplyDraft,
  replySubmittingId,
  onSubmitReply,
  confirmingId,
  setConfirmingId,
  deletingId,
  onDelete,
  collapsedIds,
  onToggleCollapse,
}) {
  const isDeleted = Boolean(node.isDeleted);
  const isOwner = !isDeleted && user && user._id === node.author?._id;
  const isPostAuthor = !isDeleted && blogAuthorId && node.author?._id === blogAuthorId;
  const authorName = node.author?.name || "Anonymous";
  const initial = authorName.charAt(0).toUpperCase();
  const isReplying = activeReplyId === node._id;
  const isCollapsed = collapsedIds.has(node._id);
  const replyTotal = countDescendants(node);

  // Cap visual indentation at depth 3 on mobile and depth 5 on desktop so deep chains stay legible.
  const indentClass =
    depth === 0
      ? ""
      : depth <= 2
      ? "ml-4 sm:ml-7 pl-3.5 sm:pl-5"
      : depth <= 4
      ? "ml-2.5 sm:ml-6 pl-3 sm:pl-5"
      : "ml-1.5 sm:ml-3 pl-2.5 sm:pl-4";

  return (
    <div className={depth === 0 ? "py-5" : `relative mt-3.5 ${indentClass}`}>
      {depth > 0 && (
        <button
          type="button"
          onClick={() => onToggleCollapse(node._id)}
          aria-label={isCollapsed ? "Expand thread" : "Collapse thread"}
          className="group/rail absolute left-0 top-0 bottom-0 w-3 flex justify-center cursor-pointer focus-visible:outline-none"
        >
          <span className="w-px h-full bg-stone-300 group-hover/rail:bg-amber-600 transition-colors" />
        </button>
      )}

      <article className="min-w-0">
        {isDeleted ? (
          <div className="flex items-center gap-2.5 py-1">
            <span
              aria-hidden="true"
              className="w-6 h-6 rounded-full bg-stone-100 border border-stone-200 text-stone-400 text-[11px] font-medium flex items-center justify-center shrink-0"
            >
              -
            </span>
            <p className="text-sm italic text-stone-400">
              This comment was deleted
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  aria-hidden="true"
                  className="w-7 h-7 rounded-full bg-[#121316] text-amber-400 text-xs font-semibold flex items-center justify-center shrink-0"
                >
                  {initial}
                </span>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500 min-w-0">
                  <span className="font-semibold text-[#111214] truncate">
                    {authorName}
                  </span>
                  {isPostAuthor && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-amber-700">Author</span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <time dateTime={node.createdAt} className="whitespace-nowrap tabular-nums">
                    {formatCommentDate(node.createdAt)}
                  </time>
                </div>
              </div>

              {isOwner && (
                <div className="shrink-0">
                  {confirmingId === node._id ? (
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        disabled={deletingId === node._id}
                        onClick={() => onDelete(node._id)}
                        className="font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {deletingId === node._id ? "Deleting..." : "Confirm"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        className="text-stone-500 hover:text-stone-900"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingId(node._id)}
                      aria-label="Delete comment"
                      className="p-1.5 text-stone-400 hover:text-red-600 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <p className="mt-2 pl-9 text-sm text-stone-700 leading-relaxed whitespace-pre-line break-words">
              {node.content}
            </p>

            <div className="mt-2 pl-9 flex flex-wrap items-center gap-4 text-xs">
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    if (isReplying) {
                      setActiveReplyId(null);
                      setReplyDraft("");
                    } else {
                      setActiveReplyId(node._id);
                      setReplyDraft("");
                    }
                  }}
                  className="inline-flex items-center gap-1.5 font-medium text-stone-500 hover:text-amber-700 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{isReplying ? "Cancel reply" : "Reply"}</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 font-medium text-stone-500 hover:text-amber-700 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Log in to reply</span>
                </Link>
              )}

              {node.replies.length > 0 && (
                <button
                  type="button"
                  onClick={() => onToggleCollapse(node._id)}
                  className="inline-flex items-center gap-1 font-medium text-stone-500 hover:text-[#111214] transition-colors tabular-nums"
                >
                  {isCollapsed ? (
                    <>
                      <ChevronRight className="w-3.5 h-3.5" />
                      <span>
                        Show {replyTotal} {replyTotal === 1 ? "reply" : "replies"}
                      </span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>
                        Hide {replyTotal} {replyTotal === 1 ? "reply" : "replies"}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>

            {isReplying && user && (
              <form
                onSubmit={(e) => onSubmitReply(e, node._id)}
                className="mt-3 pl-9"
              >
                <label htmlFor={`reply-input-${node._id}`} className="sr-only">
                  Reply to {authorName}
                </label>
                <textarea
                  id={`reply-input-${node._id}`}
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  placeholder={`Reply to ${authorName}...`}
                  rows={2}
                  maxLength={1000}
                  autoFocus
                  className="w-full px-3.5 py-2.5 text-sm text-[#111214] bg-white border border-stone-300 rounded-lg placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent resize-y"
                />
                <div className="mt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveReplyId(null);
                      setReplyDraft("");
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-[#111214] rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={replySubmittingId === node._id}
                    className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#121316] hover:bg-stone-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap"
                  >
                    {replySubmittingId === node._id ? "Replying..." : "Post Reply"}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {isDeleted && node.replies.length > 0 && (
          <div className="mt-1 pl-8">
            <button
              type="button"
              onClick={() => onToggleCollapse(node._id)}
              className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-[#111214] transition-colors tabular-nums"
            >
              {isCollapsed ? (
                <>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span>
                    Show {replyTotal} {replyTotal === 1 ? "reply" : "replies"}
                  </span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>
                    Hide {replyTotal} {replyTotal === 1 ? "reply" : "replies"}
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {!isCollapsed && node.replies.length > 0 && (
          <div>
            {node.replies.map((child) => (
              <CommentNode
                key={child._id}
                node={child}
                depth={depth + 1}
                user={user}
                blogAuthorId={blogAuthorId}
                activeReplyId={activeReplyId}
                setActiveReplyId={setActiveReplyId}
                replyDraft={replyDraft}
                setReplyDraft={setReplyDraft}
                replySubmittingId={replySubmittingId}
                onSubmitReply={onSubmitReply}
                confirmingId={confirmingId}
                setConfirmingId={setConfirmingId}
                deletingId={deletingId}
                onDelete={onDelete}
                collapsedIds={collapsedIds}
                onToggleCollapse={onToggleCollapse}
              />
            ))}
          </div>
        )}
      </article>
    </div>
  );
}

export default function CommentSection({
  blogId,
  blogAuthorId,
  comments,
  onCommentAdded,
  onCommentDeleted,
}) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [replySubmittingId, setReplySubmittingId] = useState(null);

  const [confirmingId, setConfirmingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [collapsedIds, setCollapsedIds] = useState(() => new Set());

  const tree = useMemo(() => buildCommentTree(comments), [comments]);
  const activeCount = useMemo(
    () => comments.filter((c) => !c.isDeleted).length,
    [comments]
  );

  const toggleCollapse = (commentId) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const handleSubmitTopLevel = async (event) => {
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

  const handleSubmitReply = async (event, parentCommentId) => {
    event.preventDefault();
    const trimmed = replyDraft.trim();
    if (!trimmed) {
      setError("Please enter a reply before posting.");
      return;
    }

    setError("");
    setReplySubmittingId(parentCommentId);
    try {
      const { data } = await client.post(`/blogs/${blogId}/comments`, {
        content: trimmed,
        parentComment: parentCommentId,
      });
      onCommentAdded(data);
      setActiveReplyId(null);
      setReplyDraft("");
      setCollapsedIds((prev) => {
        if (!prev.has(parentCommentId)) return prev;
        const next = new Set(prev);
        next.delete(parentCommentId);
        return next;
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post reply.");
    } finally {
      setReplySubmittingId(null);
    }
  };

  const handleDelete = async (commentId) => {
    setDeletingId(commentId);
    setError("");
    try {
      const { data } = await client.delete(`/comments/${commentId}`);
      onCommentDeleted(commentId, data);
      setConfirmingId(null);
      if (activeReplyId === commentId) {
        setActiveReplyId(null);
        setReplyDraft("");
      }
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
        className="font-display text-xl font-semibold tracking-tight text-[#111214] tabular-nums"
      >
        Comments ({activeCount})
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
        <form onSubmit={handleSubmitTopLevel} className="mt-5">
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
            className="w-full px-4 py-3 text-sm text-[#111214] bg-white border border-stone-200 rounded-xl placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent transition-shadow resize-y"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-[#121316] hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap"
            >
              {submitting ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-5 p-4 bg-white border border-stone-200 rounded-xl flex items-center justify-between gap-4">
          <p className="text-sm text-stone-600">Log in to leave a comment or reply.</p>
          <Link
            to="/login"
            className="px-3.5 py-1.5 text-sm font-medium text-white bg-[#121316] hover:bg-stone-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Log in
          </Link>
        </div>
      )}

      <div className="mt-8 divide-y divide-stone-200">
        {tree.length === 0 ? (
          <p className="py-6 text-sm text-stone-500">
            No comments yet. Be the first to respond.
          </p>
        ) : (
          tree.map((rootNode) => (
            <CommentNode
              key={rootNode._id}
              node={rootNode}
              depth={0}
              user={user}
              blogAuthorId={blogAuthorId}
              activeReplyId={activeReplyId}
              setActiveReplyId={setActiveReplyId}
              replyDraft={replyDraft}
              setReplyDraft={setReplyDraft}
              replySubmittingId={replySubmittingId}
              onSubmitReply={handleSubmitReply}
              confirmingId={confirmingId}
              setConfirmingId={setConfirmingId}
              deletingId={deletingId}
              onDelete={handleDelete}
              collapsedIds={collapsedIds}
              onToggleCollapse={toggleCollapse}
            />
          ))
        )}
      </div>
    </section>
  );
}
