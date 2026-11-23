import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    body: {
      type: String,
      required: [true, "Body is required"],
      trim: true,
      minlength: [20, "Blog body must be at least 20 characters"],
    },
    coverImage: {
      url: {
        type: String,
        required: [true, "Cover image URL is required"],
      },
      publicId: {
        type: String,
        required: [true, "Cover image public ID is required"],
      },
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

const Blog = mongoose.model("Blog", blogSchema);
export default Blog;
