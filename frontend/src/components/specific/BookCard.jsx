import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, AlertCircle } from 'lucide-react';
import Button from '../common/Button';
import { resolveBookCover, getBookCoverFallback } from '../../utils/bookCover';

const BookCard = ({ book }) => {
  const isAvailable = book.availableCopies > 0;

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-xl group"
    >
      <div className="relative aspect-[3/4] w-full bg-slate-100 flex items-center justify-center overflow-hidden">
        <img
          src={resolveBookCover(book)}
          alt={book.title}
          title={resolveBookCover(book)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.onerror = null; e.target.src = getBookCoverFallback(book.title); }}
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm ${
            isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
          }`}>
            {isAvailable ? 'Available' : 'Out of Stock'}
          </span>
          <span className="px-2.5 py-1 text-xs font-semibold bg-white/90 backdrop-blur text-dark-800 rounded-full shadow-sm w-max">
            {book.department}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col justify-between" style={{ minHeight: '190px' }}>
        <div>
          <h3 className="text-lg font-bold text-dark-900 leading-tight mb-1 line-clamp-2">
            {book.title}
          </h3>
          <p className="text-sm text-slate-500 mb-3 line-clamp-1">{book.author}</p>
        </div>

        <div className="mt-auto space-y-3">
          <div className="flex items-center text-xs text-slate-400 capitalize bg-slate-50 p-2 rounded-lg gap-2">
            <span className="flex-1">{book.category}</span>
            <span className="font-medium text-slate-600">
              {book.availableCopies}/{book.totalCopies} copies
            </span>
          </div>

          <div className="flex gap-2">
            <Link to={`/book/${book.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Details
              </Button>
            </Link>
            <Button 
              variant="primary" 
              size="sm" 
              className={`flex-1 text-xs ${!isAvailable && 'opacity-50 cursor-not-allowed'}`}
              disabled={!isAvailable}
            >
              Borrow
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BookCard;
