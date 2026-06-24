const AiUsageLog = require('../models/AiUsageLog');

/**
 * Logs AI API usage (tokens) to the database.
 * @param {Object} user - The user object from req.user
 * @param {String} feature - The AI feature used (e.g. 'chat', 'roadmap', 'recommend')
 * @param {Number} tokensUsed - Number of tokens used in the API call
 */
const logAiUsage = async (user, feature, tokensUsed) => {
  try {
    if (!user || !user._id || !feature) return;
    
    await AiUsageLog.create({
      userId: user._id,
      role: user.role ? user.role.toLowerCase() : 'student',
      feature,
      tokensUsed: tokensUsed || 0
    });
  } catch (error) {
    console.error('Failed to log AI usage:', error);
  }
};

module.exports = { logAiUsage };
