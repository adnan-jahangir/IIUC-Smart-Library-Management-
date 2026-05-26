const express = require('express');
const router = express.Router();
const {
	getAllBooks,
	getBookById,
	getBooksByDepartment,
	createBook,
	updateBook,
	deleteBook
} = require('../controllers/book.controller');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/', getAllBooks);
router.get('/department/:dept', getBooksByDepartment);
router.get('/:id', getBookById);
router.post('/', protect, restrictTo('Librarian', 'Admin'), createBook);
router.put('/:id', protect, restrictTo('Librarian', 'Admin'), updateBook);
router.delete('/:id', protect, restrictTo('Librarian', 'Admin'), deleteBook);

module.exports = router;
