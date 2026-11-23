import Blog from "../models/Blog.js";
import Comment from "../models/Comment.js";

export async function addComment(req, res, next) {
  try {
    const { content } = req.body;
    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const blog = await Blog.findById(req.params.blogId);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const comment = await Comment.create({
      content: content.trim(),
      blog: blog._id,
      author: req.user._id,
    });

    const populated = await comment.populate("author", "name");
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
}

export async function deleteComment(req, res, next) {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to delete this comment" });
    }

    await comment.deleteOne();
    res.status(200).json({ message: "Comment deleted" });
  } catch (err) {
    next(err);
  }
}
