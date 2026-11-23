import express from "express";
import {
  createBlog,
  deleteBlog,
  getAllBlogs,
  getBlogById,
  getMyBlogs,
  updateBlog,
} from "../controllers/blogController.js";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/", getAllBlogs);
router.get("/my", protect, getMyBlogs);
router.get("/:id", getBlogById);
router.post("/", protect, upload.single("coverImage"), createBlog);
router.put("/:id", protect, upload.single("coverImage"), updateBlog);
router.delete("/:id", protect, deleteBlog);

export default router;
