const Book = require('../models/Book');
const BorrowRequest = require('../models/BorrowRequest');
const AiUsageLog = require('../models/AiUsageLog');
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
 * @desc    Get personalized book recommendations for student
 * @route   POST /api/ai/recommend/books
 * @access  Private (Student)
 */
exports.recommendForStudent = async (req, res) => {
  try {
    const { interests, recentlyBorrowedBookIds, subject } = req.body;
    const userId = req.user.id;
    const userRole = String(req.user.role || 'student').toLowerCase();

    // 1. Fetch borrowing history for user
    const borrowHistory = await BorrowRequest.find({ user: userId }).populate('book');
    const borrowHistoryTexts = borrowHistory
      .map(b => b.book ? `${b.book.title} by ${b.book.author} (Category/Subject: ${b.book.category || b.book.department || 'General'})` : null)
      .filter(Boolean);
    const uniqueBorrowHistory = Array.from(new Set(borrowHistoryTexts));

    // 2. Fetch available books (copies > 0)
    const availableBooks = await Book.find({ availableCopies: { $gt: 0 } }).lean();

    if (availableBooks.length === 0) {
      return res.json({ recommendations: [] });
    }

    // Sort/score available books based on interests and subject to send the most relevant ones to context
    let selectedBooks = [...availableBooks];
    if ((interests && (Array.isArray(interests) ? interests.length > 0 : String(interests).trim())) || subject) {
      const interestList = Array.isArray(interests) 
        ? interests 
        : [interests].filter(Boolean);
      const lowerInterests = interestList.map(i => String(i).toLowerCase());
      const lowerSubject = subject ? String(subject).toLowerCase() : '';

      selectedBooks.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        const titleA = (a.title || '').toLowerCase();
        const authorA = (a.author || '').toLowerCase();
        const catA = (a.category || '').toLowerCase();
        const deptA = (a.department || '').toLowerCase();

        const titleB = (b.title || '').toLowerCase();
        const authorB = (b.author || '').toLowerCase();
        const catB = (b.category || '').toLowerCase();
        const deptB = (b.department || '').toLowerCase();

        for (const interest of lowerInterests) {
          if (titleA.includes(interest) || authorA.includes(interest) || catA.includes(interest) || deptA.includes(interest)) scoreA += 5;
          if (titleB.includes(interest) || authorB.includes(interest) || catB.includes(interest) || deptB.includes(interest)) scoreB += 5;
        }

        if (lowerSubject) {
          if (titleA.includes(lowerSubject) || catA.includes(lowerSubject) || deptA.includes(lowerSubject)) scoreA += 10;
          if (titleB.includes(lowerSubject) || catB.includes(lowerSubject) || deptB.includes(lowerSubject)) scoreB += 10;
        }

        return scoreB - scoreA;
      });
    }

    // Limit catalog size to 100 books for prompt efficiency
    const promptBooksCatalog = selectedBooks.slice(0, 100).map(b => ({
      bookId: b._id.toString(),
      title: b.title,
      author: b.author,
      category: b.category || b.department || 'General'
    }));

    // 3. Construct prompt
    const promptMessages = [
      {
        role: 'system',
        content: `You are the IIUC Smart Library AI Recommendation Engine. 
You recommend books to students based on their profile and our exact inventory.
CRITICAL RULE: You must ONLY recommend books that are present in the provided "Available Books Catalog". Do NOT recommend or mention any other books. If the catalog is empty or has no matches, recommend any 5 books from the catalog.

Format your output as a valid JSON array of objects. Do not include any markdown fences, code blocks, or preamble. Return ONLY the raw JSON string:
[
  {
    "bookId": "string (the database id of the book)",
    "title": "string (the exact title of the book)",
    "reason": "string (a concise, one-line reason of max 15 words explaining why this book is recommended)"
  }
]`
      },
      {
        role: 'user',
        content: `Please recommend exactly 5 books for a student with the following profile:
- Stated Interests: ${Array.isArray(interests) ? interests.join(', ') : interests || 'None'}
- Target Subject: ${subject || 'None'}
- Stated Recently Borrowed Books: ${Array.isArray(recentlyBorrowedBookIds) ? recentlyBorrowedBookIds.join(', ') : 'None'}
- Actual Library Borrowing History:
${uniqueBorrowHistory.length > 0 ? uniqueBorrowHistory.map(t => `- ${t}`).join('\n') : 'No borrowing history found.'}

Available Books Catalog:
${JSON.stringify(promptBooksCatalog, null, 2)}

Recommend 5 books from the Available Books Catalog. Return ONLY the JSON array.`
      }
    ];

    // 4. Call OpenAI
    let replyText = '';
    let tokensUsed = 0;
    try {
      const { reply, usage } = await getChatCompletion(promptMessages, { temperature: 0.2 });
      replyText = reply;
      tokensUsed = usage?.total_tokens || 0;
    } catch (aiErr) {
      console.error('OpenAI recommendation error:', aiErr.message);
      // Fallback: return top 5 available books
      const fallbackList = availableBooks.slice(0, 5).map(b => ({
        ...b,
        reason: 'Recommended general reading.'
      }));
      return res.json({ recommendations: fallbackList });
    }

    // 5. Parse JSON response
    let parsed = [];
    try {
      let cleanReply = replyText.trim();
      if (cleanReply.startsWith('```')) {
        cleanReply = cleanReply.replace(/^```(json)?\n?/, '');
        cleanReply = cleanReply.replace(/\n?```$/, '');
      }
      parsed = JSON.parse(cleanReply.trim());
    } catch (parseErr) {
      console.error('Failed to parse recommendations JSON:', parseErr.message, replyText);
    }

    // 6. Validate book IDs in DB
    const recommendations = [];
    for (const rec of parsed) {
      if (!rec.bookId) continue;
      try {
        const book = await Book.findOne({ _id: rec.bookId, availableCopies: { $gt: 0 } }).lean();
        if (book) {
          recommendations.push({
            ...book,
            reason: rec.reason || 'Recommended based on your academic profile.'
          });
        }
      } catch (err) {
        // invalid object id or db error, skip
      }
    }

    // 7. Fallback padding to ensure exactly 5 books if database validation filter dropped some
    if (recommendations.length < 5) {
      for (const b of availableBooks) {
        if (recommendations.length >= 5) break;
        const alreadyAdded = recommendations.some(r => r._id.toString() === b._id.toString());
        if (!alreadyAdded) {
          recommendations.push({
            ...b,
            reason: 'Popular academic resource in our library.'
          });
        }
      }
    }

    // 8. Log usage
    await logUsage(userId, userRole, 'recommend', tokensUsed);

    return res.json({ recommendations: recommendations.slice(0, 5) });
  } catch (error) {
    console.error('Student recommendation endpoint error:', error);
    return res.status(500).json({ message: 'An unexpected error occurred during recommendation generation.', error: error.message });
  }
};

/**
 * @desc    Get book recommendations for class (teacher feature)
 * @route   POST /api/ai/recommend/class-books
 * @access  Private (Teacher)
 */
exports.recommendForClass = async (req, res) => {
  try {
    const { subject, gradeLevel, count } = req.body;
    const userId = req.user.id;
    const userRole = String(req.user.role || 'teacher').toLowerCase();
    const targetCount = Math.min(Math.max(parseInt(count) || 5, 1), 10);

    // 1. Fetch available books (copies > 0)
    const availableBooks = await Book.find({ availableCopies: { $gt: 0 } }).lean();

    if (availableBooks.length === 0) {
      return res.json({ recommendations: [] });
    }

    // Sort/score available books based on subject
    let selectedBooks = [...availableBooks];
    if (subject) {
      const lowerSubject = String(subject).toLowerCase();
      selectedBooks.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        const titleA = (a.title || '').toLowerCase();
        const catA = (a.category || '').toLowerCase();
        const deptA = (a.department || '').toLowerCase();

        const titleB = (b.title || '').toLowerCase();
        const catB = (b.category || '').toLowerCase();
        const deptB = (b.department || '').toLowerCase();

        if (titleA.includes(lowerSubject) || catA.includes(lowerSubject) || deptA.includes(lowerSubject)) scoreA += 10;
        if (titleB.includes(lowerSubject) || catB.includes(lowerSubject) || deptB.includes(lowerSubject)) scoreB += 10;

        return scoreB - scoreA;
      });
    }

    // Limit catalog size to 100 books for prompt efficiency
    const promptBooksCatalog = selectedBooks.slice(0, 100).map(b => ({
      bookId: b._id.toString(),
      title: b.title,
      author: b.author,
      category: b.category || b.department || 'General'
    }));

    // 2. Construct prompt
    const promptMessages = [
      {
        role: 'system',
        content: `You are the IIUC Smart Library AI Recommendation Engine. 
You recommend books to teachers for their classes based on the subject, grade level, and our exact inventory.
CRITICAL RULE: You must ONLY recommend books that are present in the provided "Available Books Catalog". Do NOT recommend or mention any other books.

Format your output as a valid JSON array of objects. Do not include any markdown fences, code blocks, or preamble. Return ONLY the raw JSON string:
[
  {
    "bookId": "string (the database id of the book)",
    "title": "string (the exact title of the book)",
    "reason": "string (a concise, one-line reason of max 15 words explaining why this book is recommended for this subject and grade level)"
  }
]`
      },
      {
        role: 'user',
        content: `Please recommend exactly ${targetCount} books for a class with the following requirements:
- Subject: ${subject || 'General'}
- Grade/Student Level: ${gradeLevel || 'Any'}

Available Books Catalog:
${JSON.stringify(promptBooksCatalog, null, 2)}

Recommend ${targetCount} books from the Available Books Catalog. Return ONLY the JSON array.`
      }
    ];

    // 3. Call OpenAI
    let replyText = '';
    let tokensUsed = 0;
    try {
      const { reply, usage } = await getChatCompletion(promptMessages, { temperature: 0.2 });
      replyText = reply;
      tokensUsed = usage?.total_tokens || 0;
    } catch (aiErr) {
      console.error('OpenAI class recommendation error:', aiErr.message);
      // Fallback: return top targetCount available books
      const fallbackList = availableBooks.slice(0, targetCount).map(b => ({
        ...b,
        reason: `Recommended reference material for ${subject || 'class'}.`
      }));
      return res.json({ recommendations: fallbackList });
    }

    // 4. Parse JSON response
    let parsed = [];
    try {
      let cleanReply = replyText.trim();
      if (cleanReply.startsWith('```')) {
        cleanReply = cleanReply.replace(/^```(json)?\n?/, '');
        cleanReply = cleanReply.replace(/\n?```$/, '');
      }
      parsed = JSON.parse(cleanReply.trim());
    } catch (parseErr) {
      console.error('Failed to parse recommendations JSON:', parseErr.message, replyText);
    }

    // 5. Validate book IDs in DB
    const recommendations = [];
    for (const rec of parsed) {
      if (!rec.bookId) continue;
      try {
        const book = await Book.findOne({ _id: rec.bookId, availableCopies: { $gt: 0 } }).lean();
        if (book) {
          recommendations.push({
            ...book,
            reason: rec.reason || `Recommended reference material for ${subject || 'class'}.`
          });
        }
      } catch (err) {
        // invalid object id or db error, skip
      }
    }

    // 6. Fallback padding
    if (recommendations.length < targetCount) {
      for (const b of availableBooks) {
        if (recommendations.length >= targetCount) break;
        const alreadyAdded = recommendations.some(r => r._id.toString() === b._id.toString());
        if (!alreadyAdded) {
          recommendations.push({
            ...b,
            reason: `Recommended reference resource for ${subject || 'class'}.`
          });
        }
      }
    }

    // 7. Log usage
    await logUsage(userId, userRole, 'recommend', tokensUsed);

    return res.json({ recommendations: recommendations.slice(0, targetCount) });
  } catch (error) {
    console.error('Teacher class recommendation endpoint error:', error);
    return res.status(500).json({ message: 'An unexpected error occurred during class recommendation generation.', error: error.message });
  }
};
