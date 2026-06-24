import React from 'react';
import { FaBook, FaCheckCircle, FaClock } from 'react-icons/fa';

export default function RoadmapView({ roadmapData }) {
  if (!roadmapData || !roadmapData.stages) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-6">
      <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Roadmap Overview</h2>
        <p className="text-gray-700 dark:text-gray-300">{roadmapData.overview}</p>
      </div>

      <div className="relative border-l-4 border-indigo-200 dark:border-indigo-800 ml-4 md:ml-6 space-y-8 pb-4">
        {roadmapData.stages.map((stage, index) => (
          <div key={index} className="relative pl-6 md:pl-8">
            {/* Timeline dot */}
            <span className="absolute -left-[14px] flex items-center justify-center w-6 h-6 bg-indigo-500 rounded-full ring-4 ring-white dark:ring-gray-900">
              <span className="text-white text-xs font-bold">{index + 1}</span>
            </span>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 gap-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {stage.stageTitle}
                </h3>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 whitespace-nowrap">
                  <FaClock /> {stage.estimatedDuration}
                </span>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {stage.description}
              </p>

              {stage.subtopics && stage.subtopics.length > 0 && (
                <div className="mb-5">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <FaCheckCircle className="text-green-500" /> Key Topics
                  </h4>
                  <ul className="flex flex-wrap gap-2">
                    {stage.subtopics.map((topic, i) => (
                      <li key={i} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300">
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {stage.recommendedBooks && stage.recommendedBooks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <FaBook className="text-blue-500" /> Recommended Library Books
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {stage.recommendedBooks.map((book) => (
                      <div key={book._id || book} className="flex gap-3 bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100/50 dark:border-blue-800/50">
                        <div className="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                          {book.image ? (
                            <img src={book.image} alt={book.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <FaBook />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate" title={book.title}>
                            {book.title || 'Unknown Book'}
                          </h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={book.author}>
                            {book.author || 'Unknown Author'}
                          </p>
                          <p className="text-[10px] uppercase font-semibold text-indigo-500 mt-1">
                            {book.department || 'General'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
