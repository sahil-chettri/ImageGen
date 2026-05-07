// src/routes/rag.js
import express  from "express";
import multer   from "multer";
import fs       from "fs";
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

const router = express.Router();
const upload = multer({ dest: "uploads/rag-docs/" });

// ── Health ───────────────────────────────────────────────────
router.get("/health", async (req, res) => {
  const ollamaOk = await checkOllama();
  res.json({ ok: ollamaOk, message: ollamaOk ? "Ollama ready" : "Ollama not running — run: ollama serve" });
});

// ── Optimize prompt ──────────────────────────────────────────
router.post("/optimize", protect, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "prompt is required" });
    const result = await optimizePrompt(prompt, req.user.id);
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
    if (!q) return res.status(400).json({ error: "q is required" });
    const images = await searchImages(q, req.user.id, parseInt(limit));
    res.json({ images });
  } catch (err) {
    console.error("[RAG /search]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Upload document ──────────────────────────────────────────
router.post("/documents", protect, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  try {
    const { originalname, path: tmpPath, mimetype } = req.file;
    let text = "";

    if (mimetype === "application/pdf") {
      const { default: pdfParse } = await import("pdf-parse");
      const buffer = fs.readFileSync(tmpPath);
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } else {
      text = fs.readFileSync(tmpPath, "utf-8");
    }

    fs.unlinkSync(tmpPath);
    if (!text.trim()) return res.status(400).json({ error: "Document appears empty" });

    const result = await ingestDocument(req.user.id, originalname, text);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("[RAG /documents]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Ask from docs ────────────────────────────────────────────
router.post("/ask", protect, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "question is required" });
    const result = await answerFromDocs(question, req.user.id);
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
    if (promptHistoryId == null) return res.status(400).json({ error: "promptHistoryId required" });
    await recordFeedback(promptHistoryId, req.user.id, positive);
    res.json({ success: true });
  } catch (err) {
    console.error("[RAG /feedback]", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;