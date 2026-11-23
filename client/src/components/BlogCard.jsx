import { FileText } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function BlogCard({ blog }) {
  const [imageError, setImageError] = useState(false);
  const authorName = blog.author?.name || "Anonymous";
  const imageUrl = blog.coverImage?.url;
  const hasSafeImage =
    !imageError &&
    typeof imageUrl === "string" &&
    (imageUrl.startsWith("https://") ||
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("/api/uploads/"));

  return (
    <Link
      to={`/blogs/${blog._id}`}
      className="group flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
    >
      <div className="aspect-video w-full bg-gray-100 overflow-hidden border-b border-gray-100">
        {hasSafeImage ? (
          <img
            src={imageUrl}
            alt={blog.title}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 px-4">
            <FileText className="w-7 h-7 mb-1.5" />
            <span className="text-xs font-medium text-gray-500 text-center line-clamp-1">
              {blog.title}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-5">
        <h2 className="text-lg font-semibold tracking-tight text-gray-900 line-clamp-2 leading-snug group-hover:text-gray-700 transition-colors">
          {blog.title}
        </h2>

        <p className="mt-2.5 text-sm text-gray-600 leading-relaxed line-clamp-3 flex-1">
          {blog.body}
        </p>

        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
          <span className="font-medium text-gray-700 truncate">{authorName}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={blog.createdAt} className="whitespace-nowrap shrink-0">
            {formatDate(blog.createdAt)}
          </time>
        </div>
      </div>
    </Link>
  );
}
