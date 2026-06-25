const mongoose = require('mongoose');
const DocumentChunk = require('../models/DocumentChunk');
const UploadedDocument = require('../models/UploadedDocument');
const { generateEmbedding } = require('./embeddingService');

/**
 * Retrieves the most relevant document chunks across all of a user's
 * uploaded documents using MongoDB Atlas Vector Search.
 *
 * @param {string} userId - The authenticated user's ID
 * @param {string} queryText - The question or search query
 * @param {number} topK - Number of top chunks to return (default 5)
 * @returns {Promise<Array<{chunkText: string, score: number, documentId: string, filename: string}>>}
 */
async function retrieveRelevantChunks(userId, queryText, topK = 5) {
  // 1. Generate embedding for the query using the same model as documents
  const queryEmbedding = await generateEmbedding(queryText);

  // Convert userId string to ObjectId for Atlas $vectorSearch pre-filter
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // 2. Run MongoDB Atlas Vector Search aggregation
  const results = await DocumentChunk.aggregate([
    {
      $vectorSearch: {
        index: 'vector_index',
        path: 'embedding',
        queryVector: queryEmbedding,
        numCandidates: topK * 20,
        limit: topK,
        filter: {
          userId: { $eq: userObjectId },
        },
      },
    },
    {
      $project: {
        _id: 1,
        chunkText: 1,
        chunkIndex: 1,
        documentId: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
    {
      // Join with UploadedDocument to get the filename
      $lookup: {
        from: 'uploadeddocuments',
        localField: 'documentId',
        foreignField: '_id',
        as: 'sourceDoc',
      },
    },
    {
      $unwind: {
        path: '$sourceDoc',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        chunkText: 1,
        chunkIndex: 1,
        score: 1,
        documentId: 1,
        filename: { $ifNull: ['$sourceDoc.filename', 'Unknown Document'] },
      },
    },
  ]);

  return results;
}

module.exports = { retrieveRelevantChunks };
