import { AlertCircle, PenLine, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client.js";
import BlogCard from "../components/BlogCard.jsx";
import MythicPrism3D from "../components/MythicPrism3D.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Home() {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slowLoading, setSlowLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    setSlowLoading(false);
    setError("");

    const timer = setTimeout(() => {
      setSlowLoading(true);
    }, 4000);

    try {
      const { data } = await client.get("/blogs");
      setBlogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load stories right now.");
    } finally {
      clearTimeout(timer);
      setLoading(false);
      setSlowLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <section className="mb-10 rounded-2xl bg-[#121316] border border-stone-800 p-6 sm:p-8 text-stone-100">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          <div className="lg:col-span-7">
            <p className="text-xs font-medium tracking-wider text-amber-400">
              Full-Stack MERN Publishing Platform
            </p>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-white [text-wrap:balance]">
              Latest Stories
            </h1>
            <p className="mt-3 text-sm sm:text-base text-stone-300 leading-relaxed max-w-xl">
              Thoughtful essays, engineering notes, and independent perspectives—with
              threaded discussions and distraction-free reading.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                to={user ? "/write" : "/signup"}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#111214] bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#121316]"
              >
                <PenLine className="w-4 h-4" />
                <span>{user ? "Write a story" : "Start writing"}</span>
              </Link>
              <span className="text-xs text-stone-400 tabular-nums">
                {loading
                  ? "Loading feed..."
                  : `${blogs.length} ${blogs.length === 1 ? "published story" : "published stories"}`}
              </span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <MythicPrism3D />
          </div>
        </div>
      </section>

      {loading ? (
        <div>
          {slowLoading && (
            <p className="mb-6 text-sm text-stone-500">
              Waking up the server, this may take a moment...
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white border border-stone-200 rounded-xl overflow-hidden animate-pulse"
              >
                <div className="aspect-video bg-stone-200" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-stone-200 rounded w-4/5" />
                  <div className="h-4 bg-stone-100 rounded w-full" />
                  <div className="h-4 bg-stone-100 rounded w-2/3" />
                  <div className="pt-4 border-t border-stone-100 flex items-center gap-2">
                    <div className="h-3 bg-stone-200 rounded w-24" />
                    <div className="h-3 bg-stone-100 rounded w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="max-w-lg mx-auto my-12 p-6 bg-white border border-stone-200 rounded-xl text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
          <h2 className="font-display text-base font-semibold text-[#111214]">
            Could not load stories
          </h2>
          <p className="mt-1.5 text-sm text-stone-600">{error}</p>
          <button
            type="button"
            onClick={fetchBlogs}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#121316] hover:bg-stone-800 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      ) : blogs.length === 0 ? (
        <div className="max-w-lg mx-auto my-12 p-8 bg-white border border-stone-200 rounded-xl text-center">
          <h2 className="font-display text-lg font-semibold text-[#111214]">
            No stories yet
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            Be the first to share an engineering note or essay on Blogify.
          </p>
          <Link
            to={user ? "/write" : "/signup"}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#121316] hover:bg-stone-800 rounded-lg transition-colors"
          >
            <PenLine className="w-4 h-4 text-amber-400" />
            <span>{user ? "Publish the first blog" : "Get started"}</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <BlogCard key={blog._id} blog={blog} />
          ))}
        </div>
      )}
    </main>
  );
}
