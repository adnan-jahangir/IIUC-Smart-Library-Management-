import React from 'react';
import { Link } from 'react-router-dom';
import { FaBook, FaCheckCircle, FaClock, FaYoutube, FaExternalLinkAlt, FaBookOpen } from 'react-icons/fa';

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

              {stage.recommendedBooks && stage.recommendedBooks.length > 0 ? (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <FaBook className="text-blue-500" /> Recommended Books (Available in Library)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {stage.recommendedBooks.map((book) => {
                      const bookId = book._id || book;
                      const bookCard = (
                        <div className="flex gap-3 bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-900/10 dark:hover:bg-blue-900/20 p-3 rounded-lg border border-blue-100/50 hover:border-blue-300 dark:border-blue-800/50 dark:hover:border-blue-700 transition-all h-full">
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
                      );

                      if (book._id) {
                        return (
                          <Link key={book._id} to={`/book/${book._id}`} className="block hover:no-underline">
                            {bookCard}
                          </Link>
                        );
                      }

                      return <div key={bookId}>{bookCard}</div>;
                    })}
                  </div>
                </div>
              ) : (
                stage.realBooks && stage.realBooks.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <FaBookOpen className="text-teal-500" /> Recommended Books (from Internet)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {stage.realBooks.map((b, i) => (
                        <a
                          key={i}
                          href={`https://www.google.com/search?q=${encodeURIComponent(b.title + ' ' + (b.author || ''))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-teal-50/40 hover:bg-teal-50 dark:bg-teal-950/10 dark:hover:bg-teal-950/20 rounded-lg border border-teal-100/50 hover:border-teal-300 dark:border-teal-900/30 dark:hover:border-teal-700 transition-all group h-full"
                        >
                          <div className="min-w-0">
                            <h5 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate" title={b.title}>
                              {b.title}
                            </h5>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={b.author}>
                              {b.author || 'Unknown Author'}
                            </p>
                          </div>
                          <FaExternalLinkAlt className="text-xs text-gray-400 group-hover:text-teal-500 transition-colors flex-shrink-0 ml-2" />
                        </a>
                      ))}
                    </div>
                  </div>
                )
              )}

              {/* YouTube Channels */}
              {stage.youtubeChannels && stage.youtubeChannels.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <FaYoutube className="text-red-500 text-lg" /> Recommended YouTube Channels
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {stage.youtubeChannels.map((channel, i) => (
                      <a
                        key={i}
                        href={channel.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-red-50/40 hover:bg-red-50 dark:bg-red-950/10 dark:hover:bg-red-950/20 rounded-lg border border-red-100/50 dark:border-red-900/30 transition-colors group"
                      >
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {channel.name}
                        </span>
                        <FaExternalLinkAlt className="text-xs text-gray-400 group-hover:text-red-500 transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Online Docs & Web Resources */}
              {stage.onlineResources && stage.onlineResources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <FaExternalLinkAlt className="text-indigo-500" /> Helpful Online Resources & Docs
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    {stage.onlineResources.map((res, i) => (
                      <a
                        key={i}
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        {res.title} <FaExternalLinkAlt className="text-[10px] text-slate-400" />
                      </a>
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
