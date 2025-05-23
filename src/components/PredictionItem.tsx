import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Trophy } from 'lucide-react';
import { questionAssets } from '../lib/PredictionContext';

interface PredictionItemProps {
  id: string;
  question: string;
  questionId: string;
  prediction: string;
  confidence: 'low' | 'medium' | 'high';
  pointsEarned: number | null;
  createdAt: string;
  isNew?: boolean;
}

export function PredictionItem({
  id,
  question,
  questionId,
  prediction,
  confidence,
  pointsEarned,
  createdAt,
  isNew = false,
}: PredictionItemProps) {
  const asset = questionAssets[questionId];

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 border-b border-gray-100 transition-colors ${
        isNew ? 'bg-green-50' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-bears-navy/5 flex items-center justify-center flex-shrink-0">
            {asset?.image ? (
              <img
                src={asset.image}
                alt={question}
                className="w-full h-full object-cover"
              />
            ) : asset?.icon ? (
              <asset.icon className="w-8 h-8 text-bears-navy" />
            ) : (
              <Trophy className="w-8 h-8 text-bears-navy" />
            )}
          </div>
          
          <div className="space-y-1">
            <h3 className="font-medium text-gray-900">{question}</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Your answer:</span>
              <div className="flex items-center gap-1.5">
                {prediction.toLowerCase() === 'yes' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="font-medium text-gray-700">
                  {prediction}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              {new Date(createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            confidence === 'high'
              ? 'bg-green-100 text-green-800'
              : confidence === 'medium'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {confidence.charAt(0).toUpperCase() + confidence.slice(1)}
          </span>

          {pointsEarned !== null && (
            <span className={`font-medium ${
              pointsEarned > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {pointsEarned > 0 ? '+' : ''}{pointsEarned} pts
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}