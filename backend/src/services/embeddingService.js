// services/embeddingService.js
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";

export async function embed(text) {
  if (!text || typeof text !== "string") throw new Error("embed(): text is required");

  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text.trim() }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ollama embedding failed: ${err}`);
  }

  const data = await res.json();
  return data.embedding;
}

export async function embedBatch(texts, batchSize = 5) {
  const results = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const embeddings = await Promise.all(batch.map(embed));
    results.push(...embeddings);
  }
  return results;
}

export function toPgVector(vec) {
  return `[${vec.join(",")}]`;
}

export async function checkOllama() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!res.ok) return false;
    const data = await res.json();
    const models = data.models?.map((m) => m.name) || [];
    const available = models.some((m) => m.includes("nomic-embed-text"));
    if (!available) {
      console.warn(`[RAG] nomic-embed-text not found. Run: ollama pull nomic-embed-text`);
    }
    return available;
  } catch {
    console.warn("[RAG] Ollama not running at", OLLAMA_URL);
    return false;
  }
}