import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaPlay, FaPause, FaStepForward, FaStepBackward, FaRandom, FaInfoCircle } from 'react-icons/fa';
import { explainAlgorithm } from '../../services/aiApi';
import { useAuthStore } from '../../store/useAuthStore';

// === Algorithm Generators ===
function* bubbleSort(arr) {
  let array = [...arr];
  let n = array.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      yield { array: [...array], comparing: [j, j + 1], swapping: [], sorted: [] };
      if (array[j] > array[j + 1]) {
        yield { array: [...array], comparing: [], swapping: [j, j + 1], sorted: [] };
        let temp = array[j];
        array[j] = array[j + 1];
        array[j + 1] = temp;
        yield { array: [...array], comparing: [], swapping: [j, j + 1], sorted: [] };
      }
    }
  }
  yield { array: [...array], comparing: [], swapping: [], sorted: Array.from({length: n}, (_, i) => i) };
}

function* selectionSort(arr) {
  let array = [...arr];
  let n = array.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      yield { array: [...array], comparing: [minIdx, j], swapping: [], sorted: [] };
      if (array[j] < array[minIdx]) {
        minIdx = j;
      }
    }
    if (minIdx !== i) {
      yield { array: [...array], comparing: [], swapping: [i, minIdx], sorted: [] };
      let temp = array[i];
      array[i] = array[minIdx];
      array[minIdx] = temp;
      yield { array: [...array], comparing: [], swapping: [i, minIdx], sorted: [] };
    }
  }
  yield { array: [...array], comparing: [], swapping: [], sorted: Array.from({length: n}, (_, i) => i) };
}

function* insertionSort(arr) {
  let array = [...arr];
  let n = array.length;
  for (let i = 1; i < n; i++) {
    let key = array[i];
    let j = i - 1;
    yield { array: [...array], comparing: [i], swapping: [], sorted: [] };
    while (j >= 0 && array[j] > key) {
      yield { array: [...array], comparing: [j, j+1], swapping: [], sorted: [] };
      array[j + 1] = array[j];
      j = j - 1;
      yield { array: [...array], comparing: [], swapping: [j+1, j+2], sorted: [] };
    }
    array[j + 1] = key;
    yield { array: [...array], comparing: [], swapping: [j+1], sorted: [] };
  }
  yield { array: [...array], comparing: [], swapping: [], sorted: Array.from({length: n}, (_, i) => i) };
}

function* quickSort(arr, low = 0, high = arr.length - 1) {
  // We need a wrapper to yield states cleanly and keep the array consistent
  let array = [...arr];
  
  function* partition(l, h) {
    let pivot = array[h];
    let i = l - 1;
    for (let j = l; j <= h - 1; j++) {
      yield { array: [...array], comparing: [j, h], swapping: [], sorted: [] };
      if (array[j] < pivot) {
        i++;
        yield { array: [...array], comparing: [], swapping: [i, j], sorted: [] };
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
      }
    }
    yield { array: [...array], comparing: [], swapping: [i+1, h], sorted: [] };
    let temp = array[i + 1];
    array[i + 1] = array[h];
    array[h] = temp;
    return i + 1;
  }

  function* sort(l, h) {
    if (l < h) {
      let pi = yield* partition(l, h);
      yield* sort(l, pi - 1);
      yield* sort(pi + 1, h);
    }
  }

  yield* sort(low, high);
  yield { array: [...array], comparing: [], swapping: [], sorted: Array.from({length: array.length}, (_, i) => i) };
}

// Simplified Merge Sort for visualization (in-place-like visual)
function* mergeSort(arr) {
  let array = [...arr];
  
  function* merge(l, m, r) {
    let n1 = m - l + 1;
    let n2 = r - m;
    let L = new Array(n1);
    let R = new Array(n2);
    
    for (let i = 0; i < n1; i++) L[i] = array[l + i];
    for (let j = 0; j < n2; j++) R[j] = array[m + 1 + j];
    
    let i = 0, j = 0, k = l;
    while (i < n1 && j < n2) {
      yield { array: [...array], comparing: [l+i, m+1+j], swapping: [], sorted: [] };
      if (L[i] <= R[j]) {
        array[k] = L[i];
        i++;
      } else {
        array[k] = R[j];
        j++;
      }
      yield { array: [...array], comparing: [], swapping: [k], sorted: [] };
      k++;
    }
    
    while (i < n1) {
      array[k] = L[i];
      yield { array: [...array], comparing: [], swapping: [k], sorted: [] };
      i++;
      k++;
    }
    while (j < n2) {
      array[k] = R[j];
      yield { array: [...array], comparing: [], swapping: [k], sorted: [] };
      j++;
      k++;
    }
  }

  function* sort(l, r) {
    if (l >= r) return;
    let m = l + parseInt((r - l) / 2);
    yield* sort(l, m);
    yield* sort(m + 1, r);
    yield* merge(l, m, r);
  }

  yield* sort(0, array.length - 1);
  yield { array: [...array], comparing: [], swapping: [], sorted: Array.from({length: array.length}, (_, i) => i) };
}

function* linearSearch(arr, target) {
  let array = [...arr];
  let n = array.length;
  for (let i = 0; i < n; i++) {
    yield { array: [...array], comparing: [i], swapping: [], sorted: [] };
    if (array[i] === target) {
      yield { array: [...array], comparing: [], swapping: [], sorted: [i] };
      return;
    }
  }
  yield { array: [...array], comparing: [], swapping: [], sorted: [] };
}

function* binarySearch(arr, target) {
  // Pre-sort for binary search visually
  let array = [...arr].sort((a,b)=>a-b);
  yield { array: [...array], comparing: [], swapping: [], sorted: [] };
  
  let l = 0;
  let r = array.length - 1;
  while (l <= r) {
    let m = Math.floor(l + (r - l) / 2);
    yield { array: [...array], comparing: [m, l, r], swapping: [], sorted: [] };
    if (array[m] === target) {
      yield { array: [...array], comparing: [], swapping: [], sorted: [m] };
      return;
    }
    if (array[m] < target) {
      l = m + 1;
    } else {
      r = m - 1;
    }
  }
  yield { array: [...array], comparing: [], swapping: [], sorted: [] };
}

const algorithms = {
  'Bubble Sort': bubbleSort,
  'Selection Sort': selectionSort,
  'Insertion Sort': insertionSort,
  'Merge Sort': mergeSort,
  'Quick Sort': quickSort,
  'Linear Search': linearSearch,
  'Binary Search': binarySearch
};

export default function AlgorithmVisualizer() {
  const { token } = useAuthStore();
  const [array, setArray] = useState([]);
  const [algorithm, setAlgorithm] = useState('Bubble Sort');
  const [targetValue, setTargetValue] = useState(0);
  
  // Animation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(50); // ms delay (inverted visually)
  
  // Generator states
  const [states, setStates] = useState([]);
  const [currentStateIndex, setCurrentStateIndex] = useState(0);
  
  // Explanation state
  const [explanation, setExplanation] = useState(null);
  const [loadingExpl, setLoadingExpl] = useState(false);

  const generateArray = useCallback(() => {
    const newArr = Array.from({length: 30}, () => Math.floor(Math.random() * 100) + 10);
    setArray(newArr);
    setStates([{ array: newArr, comparing: [], swapping: [], sorted: [] }]);
    setCurrentStateIndex(0);
    setIsPlaying(false);
    
    // Pick random target for search algorithms
    setTargetValue(newArr[Math.floor(Math.random() * newArr.length)]);
  }, []);

  useEffect(() => {
    generateArray();
  }, [generateArray]);

  const loadAlgorithm = useCallback(() => {
    const generator = algorithms[algorithm](
      algorithm === 'Binary Search' ? [...array].sort((a,b)=>a-b) : array, 
      targetValue
    );
    const newStates = [];
    for (let state of generator) {
      newStates.push(state);
    }
    setStates([{ array: algorithm === 'Binary Search' ? [...array].sort((a,b)=>a-b) : array, comparing: [], swapping: [], sorted: [] }, ...newStates]);
    setCurrentStateIndex(0);
    setIsPlaying(false);
  }, [algorithm, array, targetValue]);

  useEffect(() => {
    loadAlgorithm();
  }, [algorithm, targetValue]); // don't add array or it loops

  const fetchExplanation = async () => {
    setLoadingExpl(true);
    try {
      const data = await explainAlgorithm(token, algorithm);
      setExplanation(data);
    } catch (err) {
      console.error(err);
      setExplanation({ explanation: "Failed to load explanation." });
    } finally {
      setLoadingExpl(false);
    }
  };

  useEffect(() => {
    fetchExplanation();
  }, [algorithm]);

  useEffect(() => {
    let timer;
    if (isPlaying && currentStateIndex < states.length - 1) {
      timer = setTimeout(() => {
        setCurrentStateIndex(prev => prev + 1);
      }, 1000 - speed * 9); // speed 1-100 mapped to delay
    } else if (currentStateIndex >= states.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStateIndex, states.length, speed]);

  const handlePlayPause = () => {
    if (currentStateIndex >= states.length - 1) {
      setCurrentStateIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleStepForward = () => {
    if (currentStateIndex < states.length - 1) {
      setCurrentStateIndex(prev => prev + 1);
    }
  };

  const handleStepBackward = () => {
    if (currentStateIndex > 0) {
      setCurrentStateIndex(prev => prev - 1);
    }
  };

  const currentVisualState = states[currentStateIndex] || { array: [], comparing: [], swapping: [], sorted: [] };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 max-w-6xl mx-auto space-y-6">
      
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {Object.keys(algorithms).map(algo => (
              <option key={algo} value={algo}>{algo}</option>
            ))}
          </select>
          <button 
            onClick={generateArray}
            className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
            title="Generate Random Array"
          >
            <FaRandom />
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
          <button onClick={handleStepBackward} disabled={currentStateIndex === 0} className="p-2 text-gray-600 hover:text-indigo-600 disabled:opacity-50">
            <FaStepBackward />
          </button>
          <button onClick={handlePlayPause} className="p-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-full w-10 h-10 flex items-center justify-center">
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
          <button onClick={handleStepForward} disabled={currentStateIndex >= states.length - 1} className="p-2 text-gray-600 hover:text-indigo-600 disabled:opacity-50">
            <FaStepForward />
          </button>
          
          <div className="ml-4 flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium uppercase">Speed</span>
            <input 
              type="range" 
              min="1" max="100" 
              value={speed} 
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-24 accent-indigo-600"
            />
          </div>
        </div>
      </div>

      {algorithm.includes('Search') && (
        <div className="text-center text-sm font-medium text-gray-700 dark:text-gray-300">
          Target Value: <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded">{targetValue}</span>
        </div>
      )}

      {/* Visualizer Area */}
      <div className="h-64 md:h-80 w-full flex items-end justify-center gap-1 border-b-2 border-gray-200 dark:border-gray-700 pb-2 px-2 overflow-x-auto relative pt-4">
        {currentVisualState.array.map((val, idx) => {
          let bgColor = "bg-indigo-400 dark:bg-indigo-500";
          if (currentVisualState.comparing.includes(idx)) bgColor = "bg-yellow-400 dark:bg-yellow-500";
          if (currentVisualState.swapping.includes(idx)) bgColor = "bg-rose-500";
          if (currentVisualState.sorted.includes(idx)) bgColor = "bg-emerald-500";

          return (
            <div 
              key={idx}
              className={`flex flex-col justify-end items-center transition-all duration-150 w-8 md:w-10 rounded-t-md ${bgColor}`}
              style={{ height: `${(val / 120) * 100}%` }}
            >
              <span className="text-[10px] md:text-xs text-white font-bold mb-1 opacity-90">{val}</span>
            </div>
          );
        })}
      </div>

      {/* Legend & Progress */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-400 rounded-sm"></span> Comparing</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-rose-500 rounded-sm"></span> Swapping/Active</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500 rounded-sm"></span> Sorted/Found</span>
        </div>
        <div className="text-gray-500 font-mono text-xs">
          Step {currentStateIndex} / {states.length - 1}
        </div>
      </div>

      {/* AI Explanation Area */}
      <div className="mt-8 bg-indigo-50/50 dark:bg-indigo-900/10 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
          <FaInfoCircle className="text-indigo-500" /> AI Explanation: {algorithm}
        </h3>
        
        {loadingExpl ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-indigo-200 dark:bg-indigo-800/50 rounded w-3/4"></div>
            <div className="h-4 bg-indigo-200 dark:bg-indigo-800/50 rounded w-5/6"></div>
          </div>
        ) : explanation ? (
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <p className="leading-relaxed">{explanation.explanation}</p>
            <div className="flex gap-6 mt-4 pt-4 border-t border-indigo-200 dark:border-indigo-800">
              <div>
                <strong className="text-gray-900 dark:text-gray-100 block">Time Complexity</strong>
                <span className="font-mono text-indigo-700 dark:text-indigo-400">{explanation.timeComplexity}</span>
              </div>
              <div>
                <strong className="text-gray-900 dark:text-gray-100 block">Space Complexity</strong>
                <span className="font-mono text-indigo-700 dark:text-indigo-400">{explanation.spaceComplexity}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Select an algorithm to see its explanation.</p>
        )}
      </div>

    </div>
  );
}
