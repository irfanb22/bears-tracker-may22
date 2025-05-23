import { motion } from 'framer-motion';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  Icon: LucideIcon;
}

export function FeatureCard({ title, description, Icon }: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white p-6 rounded-lg shadow-md"
    >
      <div className="inline-block p-3 bg-bears-navy/5 rounded-lg">
        <Icon className="w-6 h-6 text-bears-navy" />
      </div>
      <h3 className="mt-4 text-xl font-semibold text-bears-navy">{title}</h3>
      <p className="mt-2 text-gray-600">{description}</p>
    </motion.div>
  );
}