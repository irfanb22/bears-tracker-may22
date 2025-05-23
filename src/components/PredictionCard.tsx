import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface PredictionCardProps {
  title: string;
  description: string;
  imageUrl: string;
  buttonText: string;
}

export function PredictionCard({ title, description, imageUrl, buttonText }: PredictionCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bears-navy to-bears-navy/90 text-white"
    >
      {/* Coming Soon Banner */}
      <div className="absolute top-0 right-0 bg-yellow-400 text-gray-900 font-bold py-2 px-6 rounded-bl-xl transform rotate-0 z-20 shadow-lg">
        COMING SOON
      </div>

      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=1000"
          alt={title}
          className="w-full h-full object-cover opacity-20"
        />
      </div>
      <div className="relative z-10 p-8">
        <h2 className="text-3xl font-bold mb-4">{title}</h2>
        <p className="text-lg text-gray-200 mb-8">{description}</p>
        <button className="flex items-center gap-2 px-6 py-3 bg-bears-orange text-white rounded-lg hover:bg-bears-orange/90 transition-colors">
          {buttonText}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}