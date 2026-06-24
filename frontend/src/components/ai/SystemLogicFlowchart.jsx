import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import { explainSystemLogic } from '../../services/aiApi';
import { useAuthStore } from '../../store/useAuthStore';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 200;
const nodeHeight = 60;

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  dagreGraph.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = { ...node };

    // Set position and style
    newNode.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    // Make nodes look nicer
    newNode.style = {
      background: node.type === 'input' ? '#dcfce7' : node.type === 'output' ? '#fee2e2' : '#e0e7ff',
      color: '#1e293b',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      padding: '10px',
      fontSize: '12px',
      fontWeight: '600',
      width: nodeWidth,
      textAlign: 'center',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
    };

    return newNode;
  });

  const newEdges = edges.map((edge) => ({
    ...edge,
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#64748b', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#64748b',
    },
    labelStyle: { fill: '#334155', fontWeight: 700, fontSize: 12 },
    labelBgStyle: { fill: '#f8fafc', fillOpacity: 0.8 },
    labelBgPadding: [4, 4],
    labelBgBorderRadius: 4,
  }));

  return { nodes: newNodes, edges: newEdges };
};

export default function SystemLogicFlowchart({ logicType, onClose }) {
  const { token } = useAuthStore();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [narrative, setNarrative] = useState('');
  const [title, setTitle] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFlowchart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await explainSystemLogic(token, logicType);
      
      setTitle(data.title || 'System Logic');
      setNarrative(data.narrative || '');
      
      // Calculate layout
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        data.nodes || [],
        data.edges || []
      );
      
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      
    } catch (err) {
      console.error(err);
      setError('Failed to generate logic flowchart. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [logicType, token, setNodes, setEdges]);

  useEffect(() => {
    fetchFlowchart();
  }, [fetchFlowchart]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-fadeIn">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {loading ? 'Generating Logic Graph...' : title}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2"
          >
            ✕ Close
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col md:flex-row relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-800/80">
              <FaSpinner className="animate-spin text-4xl text-indigo-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-300 font-medium">AI is mapping our internal system rules...</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white dark:bg-gray-800 p-8 text-center">
              <FaExclamationTriangle className="text-5xl text-rose-500 mb-4" />
              <p className="text-gray-800 dark:text-gray-200 font-medium text-lg mb-2">{error}</p>
              <button 
                onClick={fetchFlowchart}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Retry
              </button>
            </div>
          )}

          {/* Flowchart Area */}
          <div className="flex-1 h-full relative bg-slate-50 dark:bg-slate-900">
            {!loading && !error && nodes.length > 0 && (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                attributionPosition="bottom-right"
              >
                <Controls />
                <MiniMap zoomable pannable nodeColor={(n) => n.style?.background || '#eee'} />
                <Background color="#ccc" gap={16} />
              </ReactFlow>
            )}
          </div>

          {/* Narrative Sidebar */}
          {!loading && !error && (
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-800 overflow-y-auto">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                How It Works
              </h3>
              <div className="prose prose-sm dark:prose-invert text-gray-700 dark:text-gray-300">
                {narrative}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
