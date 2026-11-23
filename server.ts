import bcrypt from "bcryptjs";
import crypto from "crypto";
import dotenv from "dotenv";
import express, { type NextFunction, type Request, type Response } from "express";
import fs from "fs";
import jwt from "jsonwebtoken";
import multer from "multer";
import os from "os";
import path from "path";
import { createServer as createViteServer } from "vite";

dotenv.config();

interface StoredUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

interface StoredBlog {
  _id: string;
  title: string;
  body: string;
  coverImage: {
    url: string;
    publicId: string;
  };
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

interface StoredComment {
  _id: string;
  content: string;
  blogId: string;
  authorId: string;
  parentComment: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface StoreData {
  users: StoredUser[];
  blogs: StoredBlog[];
  comments: StoredComment[];
  uploads: Record<string, { filename: string; mimetype: string }>;
}

interface AuthedRequest extends Request {
  user?: StoredUser;
}

const STORE_DIR = path.join(os.tmpdir(), "blogify-preview");
const STORE_FILE = path.join(STORE_DIR, "store.json");
const UPLOADS_DIR = path.join(STORE_DIR, "uploads");
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

let fallbackJwtSecret: string | undefined;
function getJwtSecret(): string {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  if (!fallbackJwtSecret) {
    fallbackJwtSecret = crypto.randomBytes(32).toString("hex");
  }
  return fallbackJwtSecret;
}

function readStore(): StoreData {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, "utf-8");
      const parsed = JSON.parse(raw) as Partial<StoreData>;
      return {
        users: Array.isArray(parsed.users) ? parsed.users : [],
        blogs: Array.isArray(parsed.blogs) ? parsed.blogs : [],
        comments: Array.isArray(parsed.comments) ? parsed.comments : [],
        uploads: parsed.uploads && typeof parsed.uploads === "object" ? parsed.uploads : {},
      };
    }
  } catch {
    // Fall back to empty store if unreadable
  }
  return { users: [], blogs: [], comments: [], uploads: {} };
}

function writeStore(data: StoreData): void {
  fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function createId(): string {
  return crypto.randomBytes(12).toString("hex");
}

function saveUploadedFile(file: Express.Multer.File, store: StoreData): { url: string; publicId: string } {
  const id = createId();
  const ext = file.mimetype === "image/png" ? ".png" : file.mimetype === "image/webp" ? ".webp" : ".jpg";
  const filename = `${id}${ext}`;
  const targetPath = path.resolve(UPLOADS_DIR, filename);
  if (!targetPath.startsWith(UPLOADS_DIR + path.sep)) {
    throw new Error("Invalid upload path");
  }
  fs.writeFileSync(targetPath, file.buffer);
  store.uploads[id] = { filename, mimetype: file.mimetype };
  return {
    url: `/api/uploads/${id}`,
    publicId: id,
  };
}

function removeUploadedFile(publicId: string | undefined, store: StoreData): void {
  if (!publicId) return;
  const meta = store.uploads[publicId];
  if (meta) {
    const filePath = path.resolve(UPLOADS_DIR, meta.filename);
    if (filePath.startsWith(UPLOADS_DIR + path.sep) && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        // Ignore cleanup failures
      }
    }
    delete store.uploads[publicId];
  }
}

function populateBlog(blog: StoredBlog, users: StoredUser[], includeAuthorEmail = false) {
  const author = users.find((u) => u._id === blog.authorId);
  return {
    _id: blog._id,
    title: blog.title,
    body: blog.body,
    coverImage: blog.coverImage,
    author: author
      ? includeAuthorEmail
        ? { _id: author._id, name: author.name, email: author.email }
        : { _id: author._id, name: author.name }
      : { _id: blog.authorId, name: "Anonymous" },
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt,
  };
}

function populateComment(comment: StoredComment, users: StoredUser[]) {
  if (comment.isDeleted) {
    return {
      _id: comment._id,
      content: "",
      blog: comment.blogId,
      parentComment: comment.parentComment ?? null,
      isDeleted: true,
      author: null,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt || comment.createdAt,
    };
  }
  const author = users.find((u) => u._id === comment.authorId);
  return {
    _id: comment._id,
    content: comment.content,
    blog: comment.blogId,
    parentComment: comment.parentComment ?? null,
    isDeleted: false,
    author: author
      ? { _id: author._id, name: author.name }
      : { _id: comment.authorId, name: "Anonymous" },
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt || comment.createdAt,
  };
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      const err = new Error("Only JPG, PNG, and WEBP images are allowed") as Error & { statusCode?: number };
      err.statusCode = 400;
      return cb(err);
    }
    cb(null, true);
  },
});

function protect(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, missing token" });
    }
    const token = authHeader.slice(7).trim();
    if (!token) {
      return res.status(401).json({ message: "Not authorized, missing token" });
    }
    const decoded = jwt.verify(token, getJwtSecret()) as { id: string };
    const store = readStore();
    const user = store.users.find((u) => u._id === decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Not authorized, user not found" });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Not authorized, invalid or expired token" });
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.get("/api/uploads/:id", (req, res) => {
    const { id } = req.params;
    if (!/^[a-f0-9]+$/i.test(id)) {
      return res.status(400).json({ message: "Invalid image ID" });
    }
    const store = readStore();
    const meta = store.uploads[id];
    if (!meta) {
      return res.status(404).json({ message: "Image not found" });
    }
    const filePath = path.resolve(UPLOADS_DIR, meta.filename);
    if (!filePath.startsWith(UPLOADS_DIR + path.sep) || !fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Image not found" });
    }
    res.setHeader("Content-Type", meta.mimetype);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.sendFile(filePath);
  });

  app.post("/api/auth/signup", async (req, res) => {
    const { name, email, password } = req.body ?? {};
    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2 || trimmedName.length > 60) {
      return res.status(400).json({ message: "Name must be between 2 and 60 characters" });
    }
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const store = readStore();
    if (store.users.some((u) => u.email === normalizedEmail)) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const newUser: StoredUser = {
      _id: createId(),
      name: trimmedName,
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    store.users.push(newUser);
    writeStore(store);

    const token = jwt.sign({ id: newUser._id }, getJwtSecret(), { expiresIn: "7d" });
    return res.status(201).json({
      token,
      user: { _id: newUser._id, name: newUser.name, email: newUser.email },
    });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body ?? {};
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const store = readStore();
    const user = store.users.find((u) => u.email === normalizedEmail);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id }, getJwtSecret(), { expiresIn: "7d" });
    return res.status(200).json({
      token,
      user: { _id: user._id, name: user.name, email: user.email },
    });
  });

  app.get("/api/auth/me", protect, (req: AuthedRequest, res) => {
    const user = req.user!;
    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    });
  });

  app.get("/api/blogs", (_req, res) => {
    const store = readStore();
    const sorted = [...store.blogs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((blog) => populateBlog(blog, store.users));
    return res.status(200).json(sorted);
  });

  app.get("/api/blogs/my", protect, (req: AuthedRequest, res) => {
    const store = readStore();
    const mine = store.blogs
      .filter((blog) => blog.authorId === req.user!._id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((blog) => populateBlog(blog, store.users));
    return res.status(200).json(mine);
  });

  app.get("/api/blogs/:id", (req, res) => {
    const store = readStore();
    const blog = store.blogs.find((b) => b._id === req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    const comments = store.comments
      .filter((c) => c.blogId === blog._id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((c) => populateComment(c, store.users));

    return res.status(200).json({
      blog: populateBlog(blog, store.users, true),
      comments,
    });
  });

  app.post("/api/blogs", protect, upload.single("coverImage"), (req: AuthedRequest, res) => {
    const { title, body } = req.body ?? {};
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

    const store = readStore();
    const coverImage = saveUploadedFile(req.file, store);
    const now = new Date().toISOString();
    const newBlog: StoredBlog = {
      _id: createId(),
      title: trimmedTitle,
      body: trimmedBody,
      coverImage,
      authorId: req.user!._id,
      createdAt: now,
      updatedAt: now,
    };

    store.blogs.push(newBlog);
    writeStore(store);

    return res.status(201).json(populateBlog(newBlog, store.users));
  });

  app.put("/api/blogs/:id", protect, upload.single("coverImage"), (req: AuthedRequest, res) => {
    const store = readStore();
    const blog = store.blogs.find((b) => b._id === req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    if (blog.authorId !== req.user!._id) {
      return res.status(403).json({ message: "You are not authorized to edit this blog" });
    }

    const { title, body } = req.body ?? {};
    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length < 3 || title.trim().length > 150) {
        return res.status(400).json({ message: "Title must be between 3 and 150 characters" });
      }
      blog.title = title.trim();
    }
    if (body !== undefined) {
      if (typeof body !== "string" || body.trim().length < 20) {
        return res.status(400).json({ message: "Blog body must be at least 20 characters" });
      }
      blog.body = body.trim();
    }

    const oldPublicId = blog.coverImage?.publicId;
    if (req.file) {
      blog.coverImage = saveUploadedFile(req.file, store);
      removeUploadedFile(oldPublicId, store);
    }

    blog.updatedAt = new Date().toISOString();
    writeStore(store);

    return res.status(200).json(populateBlog(blog, store.users));
  });

  app.delete("/api/blogs/:id", protect, (req: AuthedRequest, res) => {
    const store = readStore();
    const blogIndex = store.blogs.findIndex((b) => b._id === req.params.id);
    if (blogIndex === -1) {
      return res.status(404).json({ message: "Blog not found" });
    }
    const blog = store.blogs[blogIndex];
    if (blog.authorId !== req.user!._id) {
      return res.status(403).json({ message: "You are not authorized to delete this blog" });
    }

    removeUploadedFile(blog.coverImage?.publicId, store);
    store.comments = store.comments.filter((c) => c.blogId !== blog._id);
    store.blogs.splice(blogIndex, 1);
    writeStore(store);

    return res.status(200).json({ message: "Blog deleted" });
  });

  app.post("/api/blogs/:blogId/comments", protect, (req: AuthedRequest, res) => {
    const { content, parentComment } = req.body ?? {};
    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }
    if (content.trim().length > 1000) {
      return res.status(400).json({ message: "Comment cannot exceed 1000 characters" });
    }

    const store = readStore();
    const blog = store.blogs.find((b) => b._id === req.params.blogId);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    let resolvedParentId: string | null = null;
    if (parentComment !== undefined && parentComment !== null && parentComment !== "") {
      if (typeof parentComment !== "string") {
        return res.status(400).json({ message: "Invalid parent comment ID" });
      }
      const parent = store.comments.find((c) => c._id === parentComment);
      if (!parent) {
        return res.status(404).json({ message: "Parent comment not found" });
      }
      if (parent.blogId !== blog._id) {
        return res.status(400).json({ message: "Parent comment does not belong to this blog" });
      }
      if (parent.isDeleted) {
        return res.status(400).json({ message: "Cannot reply to a deleted comment" });
      }
      resolvedParentId = parent._id;
    }

    const now = new Date().toISOString();
    const comment: StoredComment = {
      _id: createId(),
      content: content.trim(),
      blogId: blog._id,
      authorId: req.user!._id,
      parentComment: resolvedParentId,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    store.comments.push(comment);
    writeStore(store);

    return res.status(201).json(populateComment(comment, store.users));
  });

  app.delete("/api/comments/:commentId", protect, (req: AuthedRequest, res) => {
    const store = readStore();
    const idx = store.comments.findIndex((c) => c._id === req.params.commentId);
    if (idx === -1) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const comment = store.comments[idx];
    if (comment.isDeleted) {
      return res.status(400).json({ message: "Comment is already deleted" });
    }
    if (comment.authorId !== req.user!._id) {
      return res.status(403).json({ message: "You are not authorized to delete this comment" });
    }

    const hasReplies = store.comments.some((c) => c.parentComment === comment._id);
    if (hasReplies) {
      comment.isDeleted = true;
      comment.content = "";
      comment.updatedAt = new Date().toISOString();
      writeStore(store);
      return res.status(200).json({
        message: "Comment deleted",
        softDeleted: true,
        comment: populateComment(comment, store.users),
      });
    }

    const removedIds: string[] = [comment._id];
    let ancestorId = comment.parentComment ?? null;
    store.comments.splice(idx, 1);

    // Prune any soft-deleted ancestors that no longer have remaining child replies.
    while (ancestorId) {
      const ancestorIdx = store.comments.findIndex((c) => c._id === ancestorId);
      if (ancestorIdx === -1) break;
      const ancestor = store.comments[ancestorIdx];
      if (!ancestor.isDeleted) break;

      const remainingChildren = store.comments.some((c) => c.parentComment === ancestor._id);
      if (remainingChildren) break;

      removedIds.push(ancestor._id);
      ancestorId = ancestor.parentComment ?? null;
      store.comments.splice(ancestorIdx, 1);
    }

    writeStore(store);
    return res.status(200).json({
      message: "Comment deleted",
      softDeleted: false,
      removedIds,
    });
  });

  app.use("/api", (_req, res) => {
    res.status(404).json({ message: "API route not found" });
  });

  app.use((err: Error & { statusCode?: number; code?: string }, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof multer.MulterError) {
      const msg = err.code === "LIMIT_FILE_SIZE" ? "Image must be smaller than 5MB" : err.message;
      return res.status(400).json({ message: msg });
    }
    const status = err.statusCode || 500;
    return res.status(status).json({ message: err.message || "Internal server error" });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Blogify preview server running on port ${PORT}`);
  });
}

startServer();
