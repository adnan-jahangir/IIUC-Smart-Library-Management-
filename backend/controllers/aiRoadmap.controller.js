const RoadmapHistory = require('../models/RoadmapHistory');
const AiUsageLog = require('../models/AiUsageLog');
const Book = require('../models/Book');
const { getChatCompletion } = require('../services/openaiService');

// Helper: log usage
async function logUsage(userId, role, feature, tokensUsed) {
  try {
    await AiUsageLog.create({
      userId,
      role: String(role || 'student').toLowerCase(),
      feature,
      tokensUsed: tokensUsed || 0,
    });
  } catch (err) {
    console.error('Failed to log AI usage:', err.message);
  }
}

/**
 * @desc    Generate a learning roadmap using AI
 * @route   POST /api/ai/roadmap
 * @access  Private
 */
exports.generateRoadmap = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = String(req.user.role || 'student').toLowerCase();
    const { topic, currentLevel, goal, durationWeeks } = req.body;

    if (!topic || !currentLevel) {
      return res.status(400).json({ message: 'Topic and currentLevel are required.' });
    }

    const durationText = durationWeeks ? `${durationWeeks} weeks` : 'an appropriate duration';
    const goalText = goal ? `The ultimate goal is to ${goal}.` : '';

    const systemPrompt = `You are an AI academic advisor. Generate a structured learning roadmap.
The output MUST be a valid JSON object matching the exact structure below, without Markdown blocks or additional text:

{
  "overview": "String summarizing the roadmap",
  "stages": [
    {
      "stageTitle": "String",
      "description": "String",
      "estimatedDuration": "String (e.g., '2 weeks')",
      "subtopics": ["String", "String"],
      "realBooks": [
        { "title": "String (title of a real, popular published book on this stage's topic)", "author": "String" }
      ],
      "youtubeChannels": [
        { "name": "String (name of a popular YouTube channel or tutorial series for this stage's topic)", "link": "String (full URL, e.g. 'https://www.youtube.com/...')" }
      ],
      "onlineResources": [
        { "title": "String (name of official documentation or tutorial guide)", "url": "String (full URL, e.g. 'https://...')" }
      ]
    }
  ]
}`;

    const userPrompt = `Create a learning roadmap for the topic: "${topic}".
The learner's current level is: "${currentLevel}".
Duration: ${durationText}.
${goalText}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    let replyText = '';
    let tokensUsed = 0;

    try {
      // Use response_format: { type: "json_object" } supported by Gemini via our wrapper
      const { reply, usage } = await getChatCompletion(messages, { 
        temperature: 0.7, 
        maxTokens: 4096,
        response_format: { type: "json_object" } 
      });
      replyText = reply;
      tokensUsed = usage?.total_tokens || 0;
    } catch (err) {
      console.error('OpenAI roadmap generation error:', err.message);
      return res.status(502).json({ message: 'AI failed to generate a roadmap. Please try again later.' });
    }

    // Log usage
    await logUsage(userId, userRole, 'roadmap', tokensUsed);

    let roadmapData;
    try {
      let cleanJson = replyText.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '').trim();
      }
      roadmapData = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error('Failed to parse generated roadmap JSON:', parseErr.message, replyText);
      return res.status(502).json({ message: 'The AI generated an invalid roadmap format (token limit issue or invalid structure). Please try again.' });
    }

    // Secondary Step: Match books from DB based on subtopics
    // We will find available books that match any subtopic keywords
    for (let stage of roadmapData.stages) {
      stage.recommendedBooks = [];
      const subtopicsText = (stage.subtopics || []).join(' ').toLowerCase();
      // Simple keyword extraction (words > 4 letters)
      const keywords = subtopicsText.split(/[^a-z0-9]+/i).filter(k => k.length > 4);

      if (keywords.length > 0) {
        // Build regex for each keyword
        const regexes = keywords.map(kw => new RegExp(kw, 'i'));
        
        // Find matching books with available copies
        const matchingBooks = await Book.find({
          availableCopies: { $gt: 0 },
          $or: [
            { title: { $in: regexes } },
            { department: { $in: regexes } },
            { category: { $in: regexes } },
            { author: { $in: regexes } }
          ]
        }).limit(3).select('_id');

        stage.recommendedBooks = matchingBooks.map(b => b._id);
      }
    }

    // Save to RoadmapHistory
    const roadmapRecord = await RoadmapHistory.create({
      userId,
      topic,
      currentLevel,
      goal,
      durationWeeks,
      roadmapData
    });

    return res.json({ roadmap: roadmapRecord });

  } catch (error) {
    console.error('Generate roadmap error:', error);
    return res.status(500).json({ message: 'An unexpected error occurred during roadmap generation.', error: error.message });
  }
};

/**
 * @desc    Get user's roadmap history
 * @route   GET /api/ai/roadmap
 * @access  Private
 */
exports.getRoadmapHistory = async (req, res) => {
  try {
    const roadmaps = await RoadmapHistory.find({ userId: req.user.id })
      .select('topic currentLevel durationWeeks createdAt roadmapData.overview')
      .sort({ createdAt: -1 });

    return res.json({ roadmaps });
  } catch (error) {
    console.error('Get roadmap history error:', error);
    return res.status(500).json({ message: 'Failed to retrieve roadmap history.' });
  }
};

/**
 * @desc    Get specific roadmap by ID
 * @route   GET /api/ai/roadmap/:id
 * @access  Private
 */
exports.getRoadmapById = async (req, res) => {
  try {
    const roadmap = await RoadmapHistory.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('roadmapData.stages.recommendedBooks');

    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found.' });
    }

    return res.json({ roadmap });
  } catch (error) {
    console.error('Get roadmap error:', error);
    return res.status(500).json({ message: 'Failed to retrieve roadmap details.' });
  }
};
