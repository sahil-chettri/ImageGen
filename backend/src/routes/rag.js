// src/routes/rag.js
import express  from "express";
import multer   from "multer";
import path     from "path";
import fs       from "fs";
import { fileURLToPath } from "url";
import { protect } from "../middleware/auth.js";
import {
  optimizePrompt,
  searchImages,
  ingestDocument,
  answerFromDocs,
  suggestPrompts,
  recordFeedback,
} from "../services/ragService.js";
import { checkOllama } from "../services/embeddingService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// BUG FIX: original dest "uploads/rag-docs/" was relative to CWD (wherever
// `node` is invoked from), causing ENOENT on first upload.
// Use an absolute path anchored to this file instead.
const RAG_UPLOAD_DIR = path.join(__dirname, "../../uploads/rag-docs");
if (!fs.existsSync(RAG_UPLOAD_DIR)) fs.mkdirSync(RAG_UPLOAD_DIR, { recursive: true });

const upload = multer({
  dest: RAG_UPLOAD_DIR,
  // BUG FIX: no file-type filter existed — anyone could upload any file type.
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "text/plain"];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error("Only PDF and TXT files are accepted for document ingestion."));
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max for documents
});

const router = express.Router();

// ── Health ───────────────────────────────────────────────────
// BUG FIX: health endpoint had no error handling — if checkOllama threw it
// would crash the process instead of returning a clean JSON error.
router.get("/health", async (_req, res) => {
  try {
    const ollamaOk = await checkOllama();
    res.json({
      ok: ollamaOk,
      message: ollamaOk ? "Ollama ready" : "Ollama not running — run: ollama serve",
    });
  } catch (err) {
    res.json({ ok: false, message: "Health check failed: " + err.message });
  }
});

// ── Optimize prompt ──────────────────────────────────────────
router.post("/optimize", protect, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt?.trim()) return res.status(400).json({ error: "prompt is required" });
    const result = await optimizePrompt(prompt.trim(), req.user.id);
    res.json(result);
  } catch (err) {
    console.error("[RAG /optimize]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Search images ────────────────────────────────────────────
router.get("/search", protect, async (req, res) => {
  try {
    const { q, limit = 6 } = req.query;
    if (!q?.trim()) return res.status(400).json({ error: "q is required" });
    // BUG FIX: parseInt(limit) with no radix — always pass radix 10
    const images = await searchImages(q.trim(), req.user.id, parseInt(limit, 10));
    res.json({ images });
  } catch (err) {
    console.error("[RAG /search]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Upload document ──────────────────────────────────────────
router.post("/documents", protect, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const { originalname, path: tmpPath, mimetype } = req.file;

  // Helper: always clean up the tmp file, even on error
  const cleanup = () => {
    try { fs.unlinkSync(tmpPath); } catch (_) {}
  };

  try {
    let text = "";

    if (mimetype === "application/pdf") {
      // BUG FIX: dynamic import of pdf-parse fails in some ESM setups.
      // Use a try/catch with a clear error message so users know to install it.
      let pdfParse;
      try {
        ({ default: pdfParse } = await import("pdf-parse"));
      } catch {
        cleanup();
        return res.status(500).json({
          error: "pdf-parse is not installed. Run: npm install pdf-parse",
        });
      }
      const buffer = fs.readFileSync(tmpPath);
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } else {
      // Plain text
      text = fs.readFileSync(tmpPath, "utf-8");
    }

    cleanup();

    if (!text.trim()) {
      return res.status(400).json({ error: "Document appears empty or could not be parsed" });
    }

    const result = await ingestDocument(req.user.id, originalname, text);
    res.json({ success: true, ...result });
  } catch (err) {
    cleanup(); // BUG FIX: original code only cleaned up before the error path, not after
    console.error("[RAG /documents]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Ask from docs ────────────────────────────────────────────
router.post("/ask", protect, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question?.trim()) return res.status(400).json({ error: "question is required" });
    const result = await answerFromDocs(question.trim(), req.user.id);
    res.json(result);
  } catch (err) {
    console.error("[RAG /ask]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Suggest prompts ──────────────────────────────────────────
router.get("/suggest", protect, async (req, res) => {
  try {
    const suggestions = await suggestPrompts(req.user.id);
    res.json({ suggestions });
  } catch (err) {
    console.error("[RAG /suggest]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Feedback ─────────────────────────────────────────────────
router.post("/feedback", protect, async (req, res) => {
  try {
    const { promptHistoryId, positive } = req.body;
    if (promptHistoryId == null) {
      return res.status(400).json({ error: "promptHistoryId required" });
    }
    // BUG FIX: positive was not validated — anything truthy/falsy worked but
    // null would write NULL to DB instead of 0.0, breaking ORDER BY quality.
    const qualityValue = positive ? 1.0 : 0.0;
    await recordFeedback(promptHistoryId, req.user.id, qualityValue);
    res.json({ success: true });
  } catch (err) {
    console.error("[RAG /feedback]", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;