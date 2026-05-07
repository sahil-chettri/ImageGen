// src/services/ragService.js
import { embed, embedBatch, toPgVector } from "./embeddingService.js";
import pool from "../db.js";  // your existing pg pool

const OLLAMA_URL  = process.env.OLLAMA_URL        || "http://localhost:11434";
const CHAT_MODEL  = process.env.OLLAMA_CHAT_MODEL  || "llama3";

// ─────────────────────────────────────────────────────────────
// 1. PROMPT OPTIMIZATION
// ─────────────────────────────────────────────────────────────

export async function optimizePrompt(rawPrompt, userId) {
  const queryVec = await embed(rawPrompt);
  const pgVec    = toPgVector(queryVec);

  const { rows: similarPrompts } = await pool.query(
    `SELECT prompt, optimized, quality
     FROM prompt_history
     WHERE user_id = $1 AND embedding IS NOT NULL
     ORDER BY embedding <=> $2::vector
     LIMIT 3`,
    [userId, pgVec]
  );

  const { rows: templates } = await pool.query(
    `SELECT category, template
     FROM prompt_templates
     WHERE embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT 2`,
    [pgVec]
  );

  const { rows: similarImages } = await pool.query(
    `SELECT prompt_raw
     FROM generations
     WHERE user_id = $1 AND embedding IS NOT NULL
     ORDER BY embedding <=> $2::vector
     LIMIT 3`,
    [userId, pgVec]
  );

  const context  = buildContext(similarPrompts, templates, similarImages);
  const optimized = await callOllamaOptimize(rawPrompt, context);

  const { rows: saved } = await pool.query(
    `INSERT INTO prompt_history (user_id, prompt, optimized, embedding)
     VALUES ($1, $2, $3, $4::vector) RETURNING id`,
    [userId, rawPrompt, optimized, pgVec]
  );

  return { optimized, promptHistoryId: saved[0].id, context: { similarPrompts, templates, similarImages } };
}

function buildContext(similarPrompts, templates, similarImages) {
  let ctx = "";

  if (templates.length > 0) {
    ctx += `\nBest-performing prompt templates:\n`;
    templates.forEach((t) => { ctx += `  [${t.category}] ${t.template}\n`; });
  }

  if (similarPrompts.length > 0) {
    ctx += `\nUser's past successful prompts:\n`;
    similarPrompts
      .sort((a, b) => b.quality - a.quality)
      .forEach((p) => {
        ctx += `  - Original: "${p.prompt}"\n`;
        if (p.optimized) ctx += `    Optimized: "${p.optimized}"\n`;
      });
  }

  if (similarImages.length > 0) {
    ctx += `\nPast generated images with similar themes:\n`;
    similarImages.forEach((img) => {
      if (img.prompt_raw) ctx += `  - "${img.prompt_raw}"\n`;
    });
  }

  return ctx;
}

async function callOllamaOptimize(rawPrompt, context) {
  const systemMsg = `You are an expert AI image prompt engineer.
Enhance the user's prompt for better image generation.
Rules:
- Keep the original intent and subject
- Add lighting, style, quality modifiers
- Add camera/composition details when relevant
- Be specific and descriptive
- Output ONLY the optimized prompt, nothing else
- Keep it under 200 words`;

  const userMsg = `${context ? `Context:\n${context}\n\n` : ""}User's prompt: "${rawPrompt}"\n\nReturn only the optimized prompt:`;

  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [
          { role: "system", content: systemMsg },
          { role: "user",   content: userMsg   },
        ],
        stream: false,
      }),
    });
    if (!res.ok) throw new Error("Ollama chat failed");
    const data = await res.json();
    return data.message?.content?.trim() || rawPrompt;
  } catch (err) {
    console.error("[RAG] Prompt optimization failed:", err.message);
    return rawPrompt;
  }
}

// ─────────────────────────────────────────────────────────────
// 2. EMBED IMAGE after generation
// ─────────────────────────────────────────────────────────────

export async function embedImage(imageId, prompt) {
  try {
    const vec = await embed(prompt);
    await pool.query(
      `UPDATE generations SET embedding = $1::vector, prompt_raw = $2 WHERE id = $3`,
      [toPgVector(vec), prompt, imageId]
    );
  } catch (err) {
    console.error("[RAG] embedImage failed:", err.message);
  }
}

// ─────────────────────────────────────────────────────────────
// 3. SEMANTIC IMAGE SEARCH
// ─────────────────────────────────────────────────────────────

export async function searchImages(query, userId, limit = 6) {
  const vec = await embed(query);
  const { rows } = await pool.query(
    `SELECT id, image_url, prompt_raw, created_at,
            1 - (embedding <=> $1::vector) AS similarity
     FROM generations
     WHERE user_id = $2 AND embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT $3`,
    [toPgVector(vec), userId, limit]
  );
  return rows;
}

// ─────────────────────────────────────────────────────────────
// 4. DOCUMENT INGESTION
// ─────────────────────────────────────────────────────────────

export async function ingestDocument(userId, filename, fullText, chunkSize = 800) {
  const chunks     = chunkText(fullText, chunkSize);
  const embeddings = await embedBatch(chunks);

  await pool.query(
    `DELETE FROM documents WHERE user_id = $1 AND filename = $2`,
    [userId, filename]
  );

  for (let i = 0; i < chunks.length; i++) {
    await pool.query(
      `INSERT INTO documents (user_id, filename, chunk_index, chunk_text, embedding)
       VALUES ($1, $2, $3, $4, $5::vector)`,
      [userId, filename, i, chunks[i], toPgVector(embeddings[i])]
    );
  }

  return { chunks: chunks.length, filename };
}

export async function answerFromDocs(question, userId) {
  const vec = await embed(question);

  const { rows: chunks } = await pool.query(
    `SELECT filename, chunk_text,
            1 - (embedding <=> $1::vector) AS similarity
     FROM documents
     WHERE user_id = $2 AND embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT 5`,
    [toPgVector(vec), userId]
  );

  if (chunks.length === 0) {
    return { answer: "No relevant documents found. Please upload some documents first.", sources: [] };
  }

  const context = chunks.map((c) => `[${c.filename}]\n${c.chunk_text}`).join("\n\n---\n\n");

  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [
          { role: "system", content: "Answer questions based only on the provided context. If the answer is not in the context, say so." },
          { role: "user",   content: `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer:` },
        ],
        stream: false,
      }),
    });
    const data   = await res.json();
    const answer = data.message?.content?.trim() || "Could not generate an answer.";
    return { answer, sources: chunks.map((c) => ({ filename: c.filename, similarity: c.similarity })) };
  } catch (err) {
    console.error("[RAG] QA failed:", err.message);
    return { answer: "Error generating answer. Make sure Ollama is running.", sources: [] };
  }
}

// ─────────────────────────────────────────────────────────────
// 5. PROMPT SUGGESTIONS
// ─────────────────────────────────────────────────────────────

export async function suggestPrompts(userId) {
  const { rows } = await pool.query(
    `SELECT prompt, optimized, quality
     FROM prompt_history
     WHERE user_id = $1
     ORDER BY quality DESC, created_at DESC
     LIMIT 10`,
    [userId]
  );

  if (rows.length === 0) {
    return [
      "A serene mountain landscape at golden hour, photorealistic, 8k",
      "Portrait of a warrior, dramatic lighting, fantasy art, detailed",
      "Futuristic cityscape at night, cyberpunk, neon lights, cinematic",
      "Abstract fluid art, vibrant colors, 4k, trending on ArtStation",
      "Cozy cabin in snowy forest, warm light, oil painting style",
    ];
  }

  const history = rows.map((r) => r.optimized || r.prompt).join("\n- ");

  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [
          { role: "system", content: "You are an AI image prompt generator. Based on user history, suggest 5 new creative prompts. Output ONLY a JSON array of strings, nothing else." },
          { role: "user",   content: `User's past prompts:\n- ${history}\n\nSuggest 5 new prompts as a JSON array:` },
        ],
        stream: false,
      }),
    });
    const data  = await res.json();
    const text  = data.message?.content?.trim() || "[]";
    const match = text.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    return [];
  } catch (err) {
    console.error("[RAG] suggestPrompts failed:", err.message);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// 6. FEEDBACK
// ─────────────────────────────────────────────────────────────

export async function recordFeedback(promptHistoryId, userId, positive) {
  await pool.query(
    `UPDATE prompt_history SET quality = $1 WHERE id = $2 AND user_id = $3`,
    [positive ? 1.0 : 0.0, promptHistoryId, userId]
  );
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function chunkText(text, size) {
  const chunks    = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current     = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > size && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += (current ? " " : "") + sentence;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}