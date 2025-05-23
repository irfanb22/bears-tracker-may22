import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

interface GameCardProps {
  opponent: string;
  date: string;
  location: string;
  imageUrl: string;
}

export function GameCard({ opponent, date, location, imageUrl }: GameCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-lg shadow-md overflow-hidden transition-shadow hover:shadow-lg"
    >
      <div className="relative h-48">
        <img
          src={imageUrl}
          alt={`Bears vs ${opponent}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bears-navy/80 to-transparent" />
      </div>
      <div className="p-4">
        <h3 className="text-xl font-semibold text-bears-navy">
          Bears vs {opponent}
        </h3>
        <div className="mt-2 flex items-center text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          <span>{date}</span>
        </div>
        <p className="mt-1 text-gray-500">{location}</p>
        <button className="mt-4 w-full bg-bears-orange text-white py-2 px-4 rounded-md hover:bg-bears-orange/90 transition-colors">
          Make Prediction
        </button>
      </div>
    </motion.div>
  );
}