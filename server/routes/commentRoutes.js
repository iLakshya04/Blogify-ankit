import express from "express";
import { addComment, deleteComment } from "../controllers/commentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/blogs/:blogId/comments", protect, addComment);
router.delete("/comments/:commentId", protect, deleteComment);

export default router;
