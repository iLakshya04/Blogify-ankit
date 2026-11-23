import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../api/client.js";
import BlogForm from "../components/BlogForm.jsx";

export default function CreateBlog() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (formData) => {
    setSubmitting(true);
    setError("");
    try {
      const { data } = await client.post("/blogs", formData);
      navigate(`/blogs/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to publish blog.");
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto py-10 px-4">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-[#111214] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to stories</span>
      </Link>

      <div className="mt-6 mb-8 pb-5 border-b border-stone-200">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#111214]">
          Write a new story
        </h1>
        <p className="mt-1.5 text-sm text-stone-600">
          Add a cover image and share your article with readers.
        </p>
      </div>

      <BlogForm
        onSubmit={handleCreate}
        submitting={submitting}
        serverError={error}
        submitLabel="Publish story"
        submittingLabel="Uploading & Publishing..."
      />
    </main>
  );
}
