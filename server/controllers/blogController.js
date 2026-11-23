import { deleteImage, uploadImageBuffer } from "../config/cloudinary.js";
import Blog from "../models/Blog.js";
import Comment from "../models/Comment.js";
import { serializeComment } from "./commentController.js";

export async function getAllBlogs(_req, res, next) {
  try {
    const blogs = await Blog.find()
      .populate("author", "name")
      .sort({ createdAt: -1 });
    res.status(200).json(blogs);
  } catch (err) {
    next(err);
  }
}

export async function getMyBlogs(req, res, next) {
  try {
    const blogs = await Blog.find({ author: req.user._id })
      .populate("author", "name")
      .sort({ createdAt: -1 });
    res.status(200).json(blogs);
  } catch (err) {
    next(err);
  }
}

export async function getBlogById(req, res, next) {
  try {
    const blog = await Blog.findById(req.params.id).populate("author", "name email");
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const comments = await Comment.find({ blog: blog._id })
      .populate("author", "name")
      .sort({ createdAt: 1 });

    res.status(200).json({
      blog,
      comments: comments.map(serializeComment),
    });
  } catch (err) {
    next(err);
  }
}

export async function createBlog(req, res, next) {
  let uploadedCover = null;

  try {
    const { title, body } = req.body;

    if (typeof title !== "string" || typeof body !== "string") {
      return res.status(400).json({ message: "Title and body are required" });
    }

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (trimmedTitle.length < 3 || trimmedTitle.length > 150) {
      return res.status(400).json({ message: "Title must be between 3 and 150 characters" });
    }
    if (trimmedBody.length < 20) {
      return res.status(400).json({ message: "Blog body must be at least 20 characters" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Cover image is required" });
    }

    uploadedCover = await uploadImageBuffer(req.file.buffer);

    const blog = await Blog.create({
      title: trimmedTitle,
      body: trimmedBody,
      coverImage: uploadedCover,
      author: req.user._id,
    });

    const populated = await blog.populate("author", "name");
    res.status(201).json(populated);
  } catch (err) {
    if (uploadedCover?.publicId) {
      await deleteImage(uploadedCover.publicId);
    }
    next(err);
  }
}

export async function updateBlog(req, res, next) {
  let newlyUploadedCover = null;

  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to edit this blog" });
    }

    const { title, body } = req.body;
    if (title !== undefined) {
      if (typeof title !== "string") {
        return res.status(400).json({ message: "Invalid title format" });
      }
      const trimmedTitle = title.trim();
      if (trimmedTitle.length < 3 || trimmedTitle.length > 150) {
        return res.status(400).json({ message: "Title must be between 3 and 150 characters" });
      }
      blog.title = trimmedTitle;
    }

    if (body !== undefined) {
      if (typeof body !== "string") {
        return res.status(400).json({ message: "Invalid body format" });
      }
      const trimmedBody = body.trim();
      if (trimmedBody.length < 20) {
        return res.status(400).json({ message: "Blog body must be at least 20 characters" });
      }
      blog.body = trimmedBody;
    }

    const previousPublicId = blog.coverImage?.publicId;

    // Upload replacement image before saving so a failed upload preserves the existing cover.
    if (req.file) {
      newlyUploadedCover = await uploadImageBuffer(req.file.buffer);
      blog.coverImage = newlyUploadedCover;
    }

    await blog.save();

    if (newlyUploadedCover && previousPublicId) {
      await deleteImage(previousPublicId);
    }

    const populated = await blog.populate("author", "name");
    res.status(200).json(populated);
  } catch (err) {
    if (newlyUploadedCover?.publicId) {
      await deleteImage(newlyUploadedCover.publicId);
    }
    next(err);
  }
}

export async function deleteBlog(req, res, next) {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to delete this blog" });
    }

    await deleteImage(blog.coverImage?.publicId);
    await Comment.deleteMany({ blog: blog._id });
    await blog.deleteOne();

    res.status(200).json({ message: "Blog deleted" });
  } catch (err) {
    next(err);
  }
}
