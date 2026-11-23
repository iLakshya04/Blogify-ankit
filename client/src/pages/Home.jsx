import { AlertCircle, PenLine, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client.js";
import BlogCard from "../components/BlogCard.jsx";
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
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
      <div className="mb-8 pb-6 border-b border-gray-200">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
          Latest Stories
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Thoughtful essays, engineering notes, and independent perspectives.
        </p>
      </div>

      {loading ? (
        <div>
          {slowLoading && (
            <p className="mb-6 text-sm text-gray-500">
              Waking up the server, this may take a moment...
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse"
              >
                <div className="aspect-video bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-4/5" />
                  <div className="h-4 bg-gray-100 rounded w-full" />
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                  <div className="pt-4 border-t border-gray-100 flex items-center gap-2">
                    <div className="h-3 bg-gray-200 rounded w-24" />
                    <div className="h-3 bg-gray-100 rounded w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="max-w-lg mx-auto my-12 p-6 bg-white border border-gray-200 rounded-xl text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-gray-900">
            Could not load stories
          </h2>
          <p className="mt-1.5 text-sm text-gray-600">{error}</p>
          <button
            type="button"
            onClick={fetchBlogs}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      ) : blogs.length === 0 ? (
        <div className="max-w-lg mx-auto my-12 p-8 bg-white border border-gray-200 rounded-xl text-center">
          <h2 className="text-lg font-semibold text-gray-900">No stories yet</h2>
          <p className="mt-2 text-sm text-gray-600">
            Be the first to share an idea or write a post on Blogify.
          </p>
          <Link
            to={user ? "/write" : "/signup"}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <PenLine className="w-4 h-4" />
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
