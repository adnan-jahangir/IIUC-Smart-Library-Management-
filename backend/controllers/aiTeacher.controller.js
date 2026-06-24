const { getChatCompletion } = require('../services/openaiService');
const Book = require('../models/Book');
const BorrowRequest = require('../models/BorrowRequest');
const User = require('../models/User');

/**
 * @desc    Generate a reading list based on a subject, grounded in actual DB books
 * @route   POST /api/ai/teacher/reading-list
 * @access  Private (Teacher)
 */
exports.generateReadingList = async (req, res) => {
  const { subject, gradeLevel, numberOfWeeks } = req.body;
  if (!subject) {
    return res.status(400).json({ message: 'Subject is required' });
  }

  try {
    // 1. Fetch available books related to subject (or just fetch general books to match)
    // We will do a regex search on title, author, subject, category
    const regex = new RegExp(subject, 'i');
    const availableBooks = await Book.find({
      $or: [
        { title: regex },
        { subject: regex },
        { category: regex },
        { description: regex }
      ],
      availableCopies: { $gt: 0 }
    }).limit(50); // Get up to 50 relevant books

    // 2. Prepare the prompt
    const promptMessages = [
      {
        role: 'system',
        content: `You are an expert academic curriculum designer. You must create a ${numberOfWeeks || 4}-week reading list for a ${gradeLevel || 'university'} level class on the subject of "${subject}".
CRITICAL REQUIREMENT: You MUST base the weekly readings ONLY on the books provided in the "Available Library Books" list. Do NOT invent or suggest books that are not in the list. If there aren't enough exact matches, use the closest available books and explain how they relate.

Format your response exactly as a JSON object matching this schema:
{
  "title": "Course Reading List Title",
  "overview": "Short description of the course and reading goals.",
  "weeks": [
    {
      "week": 1,
      "theme": "Week theme",
      "readingAssignment": "Specific chapters or pages to read",
      "bookTitle": "Exact Title of Book from provided list",
      "bookId": "The _id of the book from the provided list",
      "rationale": "Why this book?"
    }
  ]
}`
      },
      {
        role: 'user',
        content: `Available Library Books:\n${JSON.stringify(
          availableBooks.map(b => ({
            _id: b._id,
            title: b.title,
            author: b.author,
            subject: b.subject || b.category
          }))
        )}`
      }
    ];

    // 3. Call OpenAI
    const { reply } = await getChatCompletion(promptMessages, {
      response_format: { type: "json_object" },
      temperature: 0.5
    });

    const parsedData = JSON.parse(reply.trim());
    res.json(parsedData);
  } catch (error) {
    console.error('Failed to generate reading list:', error);
    res.status(500).json({ message: 'Failed to generate reading list', error: error.message });
  }
};

/**
 * @desc    Generate a multiple choice quiz from syllabus topic text
 * @route   POST /api/ai/teacher/quiz-from-syllabus
 * @access  Private (Teacher)
 */
exports.generateQuiz = async (req, res) => {
  const { topic, numberOfQuestions } = req.body;
  if (!topic) {
    return res.status(400).json({ message: 'Topic is required' });
  }

  const count = numberOfQuestions || 5;

  try {
    const promptMessages = [
      {
        role: 'system',
        content: `You are an academic test creator. Based on the provided syllabus topic, generate ${count} multiple-choice questions.
Ensure the questions test comprehension and critical thinking, not just trivial facts.
Format exactly as a JSON object matching this schema:
{
  "questions": [
    {
      "question": "The question text",
      "options": ["A) option 1", "B) option 2", "C) option 3", "D) option 4"],
      "correctAnswer": "A) option 1",
      "explanation": "Why this is correct"
    }
  ]
}`
      },
      {
        role: 'user',
        content: `Syllabus Topic: ${topic}`
      }
    ];

    const { reply } = await getChatCompletion(promptMessages, {
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const parsedData = JSON.parse(reply.trim());
    res.json(parsedData);
  } catch (error) {
    console.error('Failed to generate quiz:', error);
    res.status(500).json({ message: 'Failed to generate quiz', error: error.message });
  }
};

/**
 * @desc    Get overall student borrowing insights via AI narration
 * @route   GET /api/ai/teacher/class-insights
 * @access  Private (Teacher)
 */
exports.getClassInsights = async (req, res) => {
  try {
    // Fetch recent borrow requests from students
    // To limit data size, just fetch the last 100 approved/returned requests from students
    const studentUsers = await User.find({ role: 'Student' }).select('_id');
    const studentIds = studentUsers.map(u => u._id);

    const recentBorrows = await BorrowRequest.find({
      user: { $in: studentIds },
      status: { $in: ['Approved', 'Returned'] }
    })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('book', 'title author subject category');

    // Aggregate by subject/category
    const categoryCount = {};
    recentBorrows.forEach(br => {
      if (br.book) {
        const cat = br.book.subject || br.book.category || 'General';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      }
    });

    const statsSummary = {
      totalRecentBorrows: recentBorrows.length,
      topCategories: Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([cat, count]) => ({ category: cat, count }))
    };

    const promptMessages = [
      {
        role: 'system',
        content: `You are an analytical assistant for a university library teacher portal. I will provide you with raw aggregated data about recent student book borrowing trends.
Your task is to write a single, cohesive, engaging paragraph (3-4 sentences max) summarizing these insights for a teacher.
Highlight the most popular subjects. Speak directly to the teacher (e.g., "Recently, your students have been highly interested in..."). Do NOT make up any numbers; use only the data provided.`
      },
      {
        role: 'user',
        content: JSON.stringify(statsSummary)
      }
    ];

    const { reply } = await getChatCompletion(promptMessages, { temperature: 0.7 });

    res.json({
      insightText: reply,
      rawStats: statsSummary
    });
  } catch (error) {
    console.error('Failed to get class insights:', error);
    res.status(500).json({ message: 'Failed to generate insights', error: error.message });
  }
};
