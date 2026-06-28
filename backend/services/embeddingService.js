// Local deterministic normalized word-hashing vectorizer (768 dimensions)
const EMBEDDING_MODEL = 'local-word-hash-768';
const OUTPUT_DIMENSIONS = 768;

// ---------------------------------------------------------------------------
// chunkText — split long text into overlapping word-boundary chunks
// ---------------------------------------------------------------------------
/**
 * Splits text into overlapping chunks by word count.
 * Overlap prevents losing context at chunk boundaries.
 *
 * @param {string} text - Full document text
 * @param {number} chunkSizeWords - Target words per chunk (default 400)
 * @param {number} overlapWords - Overlap between consecutive chunks (default 50)
 * @returns {string[]} Array of chunk strings
 */
function chunkText(text, chunkSizeWords = 400, overlapWords = 50) {
  if (!text || !text.trim()) return [];

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  // If the text is short enough, return as a single chunk
  if (words.length <= chunkSizeWords) {
    return [words.join(' ')];
  }

  const chunks = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + chunkSizeWords, words.length);
    const chunk = words.slice(start, end).join(' ');

    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }

    // If we've reached the end, stop
    if (end >= words.length) break;

    // Move start forward by (chunkSize - overlap)
    start += chunkSizeWords - overlapWords;
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// generateEmbedding — single text → embedding vector
// ---------------------------------------------------------------------------
/**
 * Generates a vector embedding for a single text string using Gemini.
 *
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} Embedding vector (768 dimensions)
 */
async function generateEmbedding(text) {
  const vector = new Array(768).fill(0);
  const clean = String(text || '').toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const words = clean.split(/\s+/).filter(Boolean);
  
  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    const index = Math.abs(hash) % 768;
    vector[index] += 1;
  }
  
  // Normalize vector to unit length
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < 768; i++) {
      vector[i] /= magnitude;
    }
  } else {
    vector[0] = 1.0; // fallback unit vector
  }
  
  return vector;
}

// ---------------------------------------------------------------------------
// generateEmbeddingsBatch — multiple chunks → embeddings with rate limiting
// ---------------------------------------------------------------------------
/**
 * Generates embeddings for multiple text chunks sequentially with
 * rate-limit-aware delays to stay within Gemini free tier limits.
 *
 * @param {string[]} chunks - Array of text chunks to embed
 * @param {number} delayMs - Delay between API calls in ms (default 250)
 * @returns {Promise<{index: number, embedding: number[]|null, error: string|null}[]>}
 */
async function generateEmbeddingsBatch(chunks, delayMs = 250) {
  const results = [];

  for (let i = 0; i < chunks.length; i++) {
    try {
      const embedding = await generateEmbedding(chunks[i]);
      results.push({ index: i, embedding, error: null });
    } catch (err) {
      console.error(`Embedding failed for chunk ${i}:`, err.message);
      results.push({ index: i, embedding: null, error: err.message });
    }

    // Rate-limit delay between calls (skip after last chunk)
    if (i < chunks.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

module.exports = {
  chunkText,
  generateEmbedding,
  generateEmbeddingsBatch,
  EMBEDDING_MODEL,
  OUTPUT_DIMENSIONS,
};
