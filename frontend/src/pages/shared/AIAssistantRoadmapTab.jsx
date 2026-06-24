import React, { useState, useEffect } from 'react';
import RoadmapGenerator from '../../components/ai/RoadmapGenerator';
import RoadmapView from '../../components/ai/RoadmapView';
import { listRoadmapHistory, getRoadmapById } from '../../services/aiApi';
import { useAuthStore } from '../../store/useAuthStore';
import { FaPlus, FaHistory, FaArrowLeft, FaSpinner } from 'react-icons/fa';

export default function AIAssistantRoadmapTab() {
  const { token } = useAuthStore();
  
  // Modes: 'generate', 'view', 'history'
  const [mode, setMode] = useState('generate');
  const [currentRoadmap, setCurrentRoadmap] = useState(null);
  
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (mode === 'history') {
      fetchHistory();
    }
  }, [mode]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await listRoadmapHistory(token);
      setHistory(data || []);
    } catch (err) {
      console.error('Failed to load roadmap history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRoadmapGenerated = (roadmap) => {
    setCurrentRoadmap(roadmap);
    setMode('view');
  };

  const loadRoadmapDetails = async (id) => {
    setLoadingDetails(true);
    try {
      const data = await getRoadmapById(token, id);
      setCurrentRoadmap(data);
      setMode('view');
    } catch (err) {
      console.error('Failed to load roadmap details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation / Toolbar */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex gap-2">
          {mode !== 'generate' && (
            <button
              onClick={() => {
                setCurrentRoadmap(null);
                setMode('generate');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors font-medium text-sm"
            >
              <FaPlus /> New Roadmap
            </button>
          )}
          
          {mode !== 'history' && (
            <button
              onClick={() => setMode('history')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors font-medium text-sm"
            >
              <FaHistory /> View History
            </button>
          )}

          {mode === 'view' && (
            <button
              onClick={() => setMode('history')}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm ml-2"
            >
              <FaArrowLeft /> Back to History
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[600px]">
        {mode === 'generate' && (
          <div className="pt-4">
            <RoadmapGenerator onRoadmapGenerated={handleRoadmapGenerated} />
          </div>
        )}

        {mode === 'view' && currentRoadmap && (
          <div className="animate-fadeIn">
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white capitalize">
                {currentRoadmap.topic}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Level: {currentRoadmap.currentLevel} • Duration: {currentRoadmap.durationWeeks || '?'} weeks
              </p>
            </div>
            <RoadmapView roadmapData={currentRoadmap.roadmapData} />
          </div>
        )}

        {mode === 'history' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
              <FaHistory className="text-indigo-500" /> Saved Roadmaps
            </h2>

            {loadingHistory ? (
              <div className="flex justify-center py-12">
                <FaSpinner className="animate-spin text-4xl text-indigo-500" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">You haven't generated any roadmaps yet.</p>
                <button
                  onClick={() => setMode('generate')}
                  className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors"
                >
                  Create Your First Roadmap
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {history.map((roadmap) => (
                  <div
                    key={roadmap._id}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition-shadow bg-gray-50 dark:bg-gray-900/50 flex flex-col h-full"
                  >
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white capitalize mb-1 truncate" title={roadmap.topic}>
                        {roadmap.topic}
                      </h3>
                      <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                        <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                          {roadmap.currentLevel}
                        </span>
                        <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                          {roadmap.durationWeeks} weeks
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
                        {roadmap.roadmapData?.overview}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => loadRoadmapDetails(roadmap._id)}
                      disabled={loadingDetails}
                      className="w-full mt-auto py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-indigo-600 dark:text-indigo-400 rounded-lg font-medium text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                    >
                      {loadingDetails ? 'Loading...' : 'View Roadmap'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
