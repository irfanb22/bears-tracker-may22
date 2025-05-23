import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, X, ChevronDown, ChevronRight } from 'lucide-react';
import { usePredictions } from '../lib/PredictionContext';

interface DebugSection {
  title: string;
  data: any;
}

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const { 
    aggregatedPredictions,
    userPredictions,
    predictions,
    stats,
    loading,
    error
  } = usePredictions();

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  const debugSections: DebugSection[] = [
    {
      title: 'Aggregated Predictions',
      data: aggregatedPredictions
    },
    {
      title: 'User Predictions',
      data: userPredictions
    },
    {
      title: 'Raw Predictions',
      data: predictions
    },
    {
      title: 'Stats',
      data: stats
    },
    {
      title: 'State',
      data: {
        loading,
        error
      }
    }
  ];

  const toggleSection = (title: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const renderValue = (value: any): React.ReactNode => {
    if (value === null) return <span className="text-gray-400">null</span>;
    if (value === undefined) return <span className="text-gray-400">undefined</span>;
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'string' || typeof value === 'number') return value;
    if (Array.isArray(value)) {
      return (
        <div className="pl-4">
          {value.map((item, index) => (
            <div key={index} className="font-mono text-sm">
              {index}: {renderValue(item)}
            </div>
          ))}
        </div>
      );
    }
    if (typeof value === 'object') {
      return (
        <div className="pl-4">
          {Object.entries(value).map(([key, val]) => (
            <div key={key} className="font-mono text-sm">
              {key}: {renderValue(val)}
            </div>
          ))}
        </div>
      );
    }
    return String(value);
  };

  return (
    <>
      <motion.button
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-bears-navy text-white p-3 rounded-full shadow-lg hover:bg-bears-navy/90 transition-colors z-50"
      >
        <Bug className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-xl z-50 overflow-y-auto"
            >
              <div className="sticky top-0 bg-bears-navy text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bug className="w-5 h-5" />
                  <h2 className="text-lg font-semibold">Debug Panel</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {debugSections.map(({ title, data }) => {
                  const isExpanded = expandedSections.has(title);
                  return (
                    <div key={title} className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSection(title)}
                        className="w-full px-4 py-2 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
                      >
                        <span className="font-medium text-gray-700">{title}</span>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="p-4 bg-gray-50 border-t">
                          {renderValue(data)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}