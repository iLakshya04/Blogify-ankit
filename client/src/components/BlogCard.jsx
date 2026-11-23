import { FileText } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";

function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function canTilt() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function BlogCard({ blog }) {
  const [imageError, setImageError] = useState(false);
  const surfaceRef = useRef(null);

  const authorName = blog.author?.name || "Anonymous";
  const imageUrl = blog.coverImage?.url;
  const hasSafeImage =
    !imageError &&
    typeof imageUrl === "string" &&
    (imageUrl.startsWith("https://") ||
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("/api/uploads/"));

  const handlePointerMove = (event) => {
    const el = surfaceRef.current;
    if (!el || !canTilt()) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;

    const rotateY = (px - 0.5) * 7;
    const rotateX = (0.5 - py) * 7;

    el.style.setProperty("--rx", `${rotateX.toFixed(2)}deg`);
    el.style.setProperty("--ry", `${rotateY.toFixed(2)}deg`);
    el.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
    el.style.setProperty("--glare-opacity", "1");
  };

  const handlePointerLeave = () => {
    const el = surfaceRef.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--glare-opacity", "0");
  };

  return (
    <div className="card-3d-stage h-full">
      <Link
        ref={surfaceRef}
        to={`/blogs/${blog._id}`}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="card-3d-surface group relative flex flex-col h-full bg-white border border-stone-200 rounded-xl overflow-hidden hover:border-amber-600/45 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
      >
        <div className="relative aspect-video w-full bg-stone-100 overflow-hidden border-b border-stone-200/80">
          {hasSafeImage ? (
            <img
              src={imageUrl}
              alt={blog.title}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 text-stone-400 px-4">
              <FileText className="w-7 h-7 mb-1.5" />
              <span className="text-xs font-medium text-stone-500 text-center line-clamp-1">
                {blog.title}
              </span>
            </div>
          )}
          <div
            aria-hidden="true"
            className="card-3d-glare pointer-events-none absolute inset-0"
          />
        </div>

        <div className="flex flex-col flex-1 p-5">
          <h2 className="font-display text-lg font-semibold tracking-tight text-[#111214] line-clamp-2 leading-snug group-hover:text-amber-700 transition-colors">
            {blog.title}
          </h2>

          <p className="mt-2.5 text-sm text-stone-600 leading-relaxed line-clamp-3 flex-1">
            {blog.body}
          </p>

          <div className="mt-5 pt-4 border-t border-stone-100 flex items-center gap-2 text-xs text-stone-500">
            <span className="font-medium text-stone-800 truncate">{authorName}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={blog.createdAt} className="whitespace-nowrap shrink-0 tabular-nums">
              {formatDate(blog.createdAt)}
            </time>
          </div>
        </div>
      </Link>
    </div>
  );
}
