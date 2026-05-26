const Book = require('../models/Book');
const BorrowRequest = require('../models/BorrowRequest');

const findBookByIdOrCustomId = async (id) => {
  if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
    const byId = await Book.findById(id);
    if (byId) return byId;
  }
  return Book.findOne({ customId: id });
};

// Get all books (supports optional search and department filters)
const getAllBooks = async (req, res) => {
  try {
    const { search, dept } = req.query;

    const query = {};

    if (dept) {
      query.department = new RegExp(`^${dept.trim()}$`, 'i');
    }

    if (search) {
      // case-insensitive partial match on title, author, isbn or customId
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { author: regex },
        { isbn: regex },
        { customId: regex }
      ];
    }

    const books = await Book.find(query).limit(200);
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch books', error: error.message });
  }
};

// Get a single book by customId or database _id
const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const book = await findBookByIdOrCustomId(id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch book details', error: error.message });
  }
};

// Get books by department
const getBooksByDepartment = async (req, res) => {
  try {
    const { dept } = req.params;
    const books = await Book.find({ department: new RegExp(`^${dept.trim()}$`, 'i') });
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch books for department', error: error.message });
  }
};

// Create a new book (Librarian/Admin)
const createBook = async (req, res) => {
  try {
    const {
      customId,
      title,
      author,
      department,
      isbn,
      category,
      totalCopies,
      availableCopies,
      image
    } = req.body;

    if (!customId || !title || !author || !department || !isbn) {
      return res.status(400).json({ message: 'customId, title, author, department and isbn are required' });
    }

    const existing = await Book.findOne({ customId: String(customId).trim() });
    if (existing) {
      return res.status(400).json({ message: 'A book with this customId already exists' });
    }

    const parsedTotal = Number(totalCopies ?? 1);
    const parsedAvailable = Number(availableCopies ?? parsedTotal);
    if (Number.isNaN(parsedTotal) || Number.isNaN(parsedAvailable) || parsedTotal < 0 || parsedAvailable < 0) {
      return res.status(400).json({ message: 'Copies must be valid non-negative numbers' });
    }
    if (parsedAvailable > parsedTotal) {
      return res.status(400).json({ message: 'Available copies cannot exceed total copies' });
    }

    const book = await Book.create({
      customId: String(customId).trim(),
      title: String(title).trim(),
      author: String(author).trim(),
      department: String(department).trim(),
      isbn: String(isbn).trim(),
      category: category ? String(category).trim() : undefined,
      totalCopies: parsedTotal,
      availableCopies: parsedAvailable,
      image: image ? String(image).trim() : 'https://via.placeholder.com/320x480/0f172a/ffffff?text=No+Cover'
    });

    res.status(201).json({ message: 'Book created successfully', book });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create book', error: error.message });
  }
};

// Update an existing book (Librarian/Admin)
const updateBook = async (req, res) => {
  try {
    const book = await findBookByIdOrCustomId(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const fields = ['customId', 'title', 'author', 'department', 'isbn', 'category', 'image'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        book[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
      }
    });

    if (req.body.totalCopies !== undefined) {
      const parsedTotal = Number(req.body.totalCopies);
      if (Number.isNaN(parsedTotal) || parsedTotal < 0) {
        return res.status(400).json({ message: 'totalCopies must be a non-negative number' });
      }
      book.totalCopies = parsedTotal;
    }

    if (req.body.availableCopies !== undefined) {
      const parsedAvailable = Number(req.body.availableCopies);
      if (Number.isNaN(parsedAvailable) || parsedAvailable < 0) {
        return res.status(400).json({ message: 'availableCopies must be a non-negative number' });
      }
      book.availableCopies = parsedAvailable;
    }

    if (Number(book.availableCopies) > Number(book.totalCopies)) {
      return res.status(400).json({ message: 'Available copies cannot exceed total copies' });
    }

    const dup = await Book.findOne({ customId: book.customId, _id: { $ne: book._id } });
    if (dup) {
      return res.status(400).json({ message: 'Another book already uses this customId' });
    }

    await book.save();
    res.status(200).json({ message: 'Book updated successfully', book });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update book', error: error.message });
  }
};

// Delete a book (Librarian/Admin)
const deleteBook = async (req, res) => {
  try {
    const book = await findBookByIdOrCustomId(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Guard deletion only when there are active approved borrows for this book.
    // This is more reliable than total/available arithmetic when inventory was edited manually.
    const activeBorrows = await BorrowRequest.countDocuments({
      book: book._id,
      status: 'Approved'
    });

    if (activeBorrows > 0) {
      return res.status(400).json({
        message: `Cannot delete a book while copies are issued (${activeBorrows} active borrow records)`
      });
    }

    await book.deleteOne();
    res.status(200).json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete book', error: error.message });
  }
};

module.exports = {
  getAllBooks,
  getBookById,
  getBooksByDepartment,
  createBook,
  updateBook,
  deleteBook
};
