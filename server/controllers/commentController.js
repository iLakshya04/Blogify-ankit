import mongoose from "mongoose";
import Blog from "../models/Blog.js";
import Comment from "../models/Comment.js";

export function serializeComment(commentDoc) {
  const obj = commentDoc.toObject ? commentDoc.toObject() : { ...commentDoc };
  if (obj.isDeleted) {
    return {
      _id: obj._id,
      content: "",
      blog: obj.blog,
      parentComment: obj.parentComment || null,
      isDeleted: true,
      author: null,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    };
  }
  return {
    _id: obj._id,
    content: obj.content,
    blog: obj.blog,
    parentComment: obj.parentComment || null,
    isDeleted: false,
    author: obj.author,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

export async function addComment(req, res, next) {
  try {
    const { content, parentComment } = req.body;
    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }
    if (content.trim().length > 1000) {
      return res.status(400).json({ message: "Comment cannot exceed 1000 characters" });
    }

    const blog = await Blog.findById(req.params.blogId);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    let resolvedParentId = null;
    if (parentComment !== undefined && parentComment !== null && parentComment !== "") {
      if (typeof parentComment !== "string" || !mongoose.Types.ObjectId.isValid(parentComment)) {
        return res.status(400).json({ message: "Invalid parent comment ID" });
      }

      const parent = await Comment.findById(parentComment);
      if (!parent) {
        return res.status(404).json({ message: "Parent comment not found" });
      }
      if (parent.blog.toString() !== blog._id.toString()) {
        return res.status(400).json({ message: "Parent comment does not belong to this blog" });
      }
      if (parent.isDeleted) {
        return res.status(400).json({ message: "Cannot reply to a deleted comment" });
      }

      resolvedParentId = parent._id;
    }

    const comment = await Comment.create({
      content: content.trim(),
      blog: blog._id,
      author: req.user._id,
      parentComment: resolvedParentId,
    });

    const populated = await comment.populate("author", "name");
    res.status(201).json(serializeComment(populated));
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

    if (comment.isDeleted) {
      return res.status(400).json({ message: "Comment is already deleted" });
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to delete this comment" });
    }

    const hasReplies = await Comment.exists({ parentComment: comment._id });
    if (hasReplies) {
      comment.isDeleted = true;
      comment.content = "";
      await comment.save();

      return res.status(200).json({
        message: "Comment deleted",
        softDeleted: true,
        comment: serializeComment(comment),
      });
    }

    const removedIds = [comment._id.toString()];
    let ancestorId = comment.parentComment;
    await comment.deleteOne();

    // Prune any soft-deleted ancestor that no longer has remaining child replies.
    while (ancestorId) {
      const ancestor = await Comment.findById(ancestorId);
      if (!ancestor || !ancestor.isDeleted) {
        break;
      }

      const remainingChildren = await Comment.exists({ parentComment: ancestor._id });
      if (remainingChildren) {
        break;
      }

      removedIds.push(ancestor._id.toString());
      ancestorId = ancestor.parentComment;
      await ancestor.deleteOne();
    }

    res.status(200).json({
      message: "Comment deleted",
      softDeleted: false,
      removedIds,
    });
  } catch (err) {
    next(err);
  }
}
