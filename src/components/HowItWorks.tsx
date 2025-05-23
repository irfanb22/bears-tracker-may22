import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Trophy, Brain, Users, Target, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { RegisterModal } from './RegisterModal';

export function HowItWorks() {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Split the paragraph into sentences for staggered animation
  const sentences = [
    "Every Bears fan has opinions.",
    "We've all had those passionate debates with friends and family about what's going to happen next season.",
    "Is this finally our year for a playoff run?",
    "Those heated discussions with my brother about the Bears' future inspired this tracker."
  ];

  // Animation variants for staggered text
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.4,
        delayChildren: 0.6
      }
    }
  };

  const sentenceVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  // Highlight animation for key phrases
  const highlightVariants = {
    initial: { backgroundSize: "0% 100%" },
    animate: { 
      backgroundSize: "100% 100%",
      transition: { duration: 1, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onRegisterClick={() => setIsRegisterModalOpen(true)} />
      
      {/* Hero Section */}
      <section className="bg-bears-navy text-white py-20">
        <div className="max-w-4xl mx-auto px-4">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.8,
              ease: "easeOut"
            }}
            className="text-4xl md:text-5xl font-bold mb-8"
          >
            <motion.span
              initial={{ color: "rgb(255, 255, 255)" }}
              animate={{ color: "rgb(200, 56, 3)" }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              Beyond
            </motion.span>{" "}
            the Debate: Track Your Bears Predictions
          </motion.h1>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {sentences.map((sentence, index) => (
              <motion.p
                key={index}
                variants={sentenceVariants}
                className="text-xl text-gray-300 leading-relaxed"
              >
                {sentence}
              </motion.p>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8 md:p-12">
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-bears-navy mb-4">The Problem?</h2>
                <p className="text-lg text-gray-700">
                  Those predictions would fade into memory, with no way to track who was actually right.
                </p>
                <p className="text-xl font-semibold text-bears-orange mt-4">
                  Bears Prediction Tracker solves that problem.
                </p>
              </div>

              <div className="mb-12">
                <h2 className="text-3xl font-bold text-bears-navy mb-6">What We're About</h2>
                <p className="text-lg text-gray-700 mb-6">
                  This site isn't about gambling or betting money. It's about putting your football knowledge to the test by making public declarations about what you believe will happen during the Bears season.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      icon: Target,
                      text: "Make clear predictions about games, player stats, and team performance"
                    },
                    {
                      icon: Brain,
                      text: "Assign confidence levels to your predictions"
                    },
                    {
                      icon: Users,
                      text: "See how your forecasts compare with the community"
                    },
                    {
                      icon: Trophy,
                      text: "Earn bragging rights when you call it right"
                    }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="p-2 bg-bears-navy/5 rounded-lg">
                        <item.icon className="w-6 h-6 text-bears-navy" />
                      </div>
                      <p className="text-gray-700">{item.text}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="mb-12">
                <h2 className="text-3xl font-bold text-bears-navy mb-6">The Bears Fan Community</h2>
                <p className="text-lg text-gray-700 mb-4">
                  When you make a prediction, you're not just recording it for yourself—you're contributing to a collective snapshot of Bears fan sentiment. This creates a fascinating picture of how optimistic or pessimistic the fanbase is about different aspects of the team.
                </p>
                <p className="text-lg text-gray-700">
                  As the season progresses, we all learn together about our biases, blind spots, and occasionally brilliant insights.
                </p>
              </div>

              <div className="mt-12 text-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="inline-flex items-center px-8 py-4 bg-bears-orange text-white text-lg font-semibold rounded-lg hover:bg-bears-orange/90 transition-colors"
                >
                  Start Making Predictions
                  <ArrowRight className="ml-2 w-6 h-6" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <RegisterModal 
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
    </div>
  );
}