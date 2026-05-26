const Book = require('../models/Book');

// @desc    Return simple AI-based book recommendations (mock)
// @route   POST /api/ai/recommend
// @access  Private
exports.recommend = async (req, res) => {
  try {
    const { interests } = req.body; // e.g., ['compiler', 'algorithms']

    // Simple heuristic: find books with title or author matching interests
    const query = interests && interests.length ? { $or: interests.map(i => ({ title: new RegExp(i, 'i') })) } : {};
    const books = await Book.find(query).limit(6);

    res.json({ recommendations: books });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'AI recommend error', error: error.message });
  }
};

// @desc    Summarize a text or book (mock)
// @route   POST /api/ai/summarize
// @access  Private
exports.summarize = async (req, res) => {
  try {
    const { text, bookId } = req.body;
    if (bookId) {
      const book = await Book.findById(bookId);
      if (!book) return res.status(404).json({ message: 'Book not found' });
      // mock summary
      return res.json({ summary: `Summary of ${book.title}: A concise overview (mock).` });
    }
    if (!text) return res.status(400).json({ message: 'Text is required for summarization' });

    // mock summarization
    const snippet = text.slice(0, 200);
    res.json({ summary: `Summary (mock): ${snippet}...` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'AI summarize error', error: error.message });
  }
};