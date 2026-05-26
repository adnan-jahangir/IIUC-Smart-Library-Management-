const PLACEHOLDER_COVER = 'https://via.placeholder.com/320x480/1a1a2e/ffffff?text=No+Cover';

const normalizeIsbn = (isbn) => {
  if (!isbn) return '';
  return String(isbn).replace(/[^0-9Xx]/g, '').toUpperCase().trim();
};

export const resolveBookCover = (book) => {
  const isbn = normalizeIsbn(book?.isbn);
  if (isbn) {
    return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  }

  return book?.image || book?.cover || book?.coverImage || book?.thumbnail || book?.thumbnailUrl || PLACEHOLDER_COVER;
};

export const getBookCoverFallback = (title = 'Book') =>
  `https://via.placeholder.com/320x480/1a1a2e/ffffff?text=${encodeURIComponent(title)}`;
