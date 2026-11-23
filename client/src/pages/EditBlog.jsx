import { AlertCircle, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import client from "../api/client.js";
import BlogForm from "../components/BlogForm.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function EditBlog() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadBlog() {
      setLoading(true);
      setLoadError("");
      try {
        const { data } = await client.get(`/blogs/${id}`);
        if (!active) return;

        if (data.blog.author?._id !== user?._id) {
          navigate(`/blogs/${id}`, { replace: true });
          return;
        }
        setBlog(data.blog);
      } catch (err) {
        if (active) {
          setLoadError(err.response?.data?.message || "Unable to load this blog.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBlog();
    return () => {
      active = false;
    };
  }, [id, user?._id, navigate]);

  const handleUpdate = async (formData) => {
    setSubmitting(true);
    setSubmitError("");
    try {
      await client.put(`/blogs/${id}`, formData);
      navigate(`/blogs/${id}`);
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Failed to save changes.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto py-10 px-4 animate-pulse">
        <div className="h-4 bg-stone-200 rounded w-28 mb-8" />
        <div className="h-8 bg-stone-200 rounded w-1/2 mb-8" />
        <div className="h-12 bg-stone-100 rounded-xl mb-6" />
        <div className="h-64 bg-stone-100 rounded-xl" />
      </main>
    );
  }

  if (loadError || !blog) {
    return (
      <main className="max-w-3xl mx-auto py-12 px-4">
        <div className="p-8 bg-white border border-stone-200 rounded-xl text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
          <h1 className="font-display text-lg font-semibold text-[#111214]">
            Could not open editor
          </h1>
          <p className="mt-1.5 text-sm text-stone-600">
            {loadError || "Blog not found."}
          </p>
          <Link
            to="/my-blogs"
            className="mt-5 inline-block px-4 py-2 text-sm font-medium text-white bg-[#121316] rounded-lg"
          >
            Go to My Blogs
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto py-10 px-4">
      <Link
        to={`/blogs/${id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-[#111214] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to story</span>
      </Link>

      <div className="mt-6 mb-8 pb-5 border-b border-stone-200">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#111214]">
          Edit story
        </h1>
        <p className="mt-1.5 text-sm text-stone-600">
          Update your title, cover image, or content below.
        </p>
      </div>

      <BlogForm
        initialData={blog}
        onSubmit={handleUpdate}
        submitting={submitting}
        serverError={submitError}
        submitLabel="Save changes"
        submittingLabel="Saving changes..."
      />
    </main>
  );
}
