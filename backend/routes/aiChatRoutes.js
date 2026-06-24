const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const { logAiUsage } = require('../utils/aiUsageLogger');
const { protect } = require('../middleware/auth');

const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

router.post('/', protect, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    if (!ai) {
      return res.status(401).json({ message: 'Missing API Key. Add it to your backend .env file.' });
    }

    const systemPrompt = `You are a helpful Library Management System AI assistant. 
If the user asks you to explain or visualize an algorithm (like bubble sort, selection sort, binary search, merge sort, quick sort, etc.), 
you MUST return a JSON object with the following structure:
{
  "isAlgorithm": true,
  "algorithmId": "bubble-sort", // Use kebab-case string like 'selection-sort', 'binary-search', 'merge-sort', 'quick-sort', 'insertion-sort'
  "complexity": "simple", // Return "simple" for bubble, selection, insertion, binary search. Return "complex" for merge, quick, or longer algorithms
  "explanation": "Brief explanation of how the algorithm works."
}
If the user's request is NOT about an algorithm, answer normally as a helpful assistant in plain text.`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: message,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
          maxOutputTokens: 500,
          tools: [{ googleSearch: {} }],
        }
      });
    } catch (error) {
      console.error("Gemini API Error:", error.message);
      let userMsg = 'Failed to process chat message due to an AI error.';
      if (error.message.toLowerCase().includes('api key')) {
        userMsg = 'Invalid API key. Please check your .env configuration.';
        return res.status(401).json({ message: userMsg });
      } else if (error.message.toLowerCase().includes('quota')) {
        userMsg = 'Quota exceeded or rate limit reached. Please check your API billing details.';
        return res.status(429).json({ message: userMsg });
      }
      return res.status(500).json({ message: userMsg, error: error.message });
    }

    const content = response.text || '';
    const tokensUsed = response.usageMetadata?.totalTokenCount || 0;

    // Log the usage asynchronously
    logAiUsage(req.user, 'chat', tokensUsed);

    // Try to parse as JSON if it's an algorithm response
    try {
      // Remove any markdown formatting like ```json ... ```
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```/, '').replace(/```$/, '').trim();
      }

      if (cleanContent.startsWith('{') && cleanContent.endsWith('}')) {
        const jsonResponse = JSON.parse(cleanContent);
        if (jsonResponse.isAlgorithm) {
          // Keep sources if available even for algorithm responses
          jsonResponse.sources = response.candidates?.[0]?.groundingMetadata || null;
          return res.json(jsonResponse);
        }
      }
    } catch (e) {
      // Not JSON, just return text
    }

    // Default response format
    res.json({
      isAlgorithm: false,
      explanation: content,
      sources: response.candidates?.[0]?.groundingMetadata || null
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'An unexpected error occurred while processing your request.' });
    }
  }
});

module.exports = router;
