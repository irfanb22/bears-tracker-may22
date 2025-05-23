import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Loader2, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface AggregationTest {
  questionId: string;
  yes: number;
  no: number;
  total: number;
}

export function DebugPredictionAccess() {
  const [data, setData] = useState<any[] | null>(null);
  const [aggregations, setAggregations] = useState<AggregationTest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  useEffect(() => {
    const testAccess = async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const testClient = createClient(supabaseUrl, supabaseKey);
      
      try {
        console.log("Starting comprehensive access tests...");
        
        // Test 1: Basic Predictions Access
        const { data: basicData, error: basicError } = await testClient
          .from('predictions')
          .select('question_id, prediction')
          .limit(5);
          
        if (basicError) throw basicError;
        console.log("✓ Basic select test passed:", { data: basicData });

        // Test 2: Questions Access
        const { data: questionsData, error: questionsError } = await testClient
          .from('questions')
          .select(`
            id,
            text,
            question_type,
            choices (
              id,
              text
            )
          `)
          .eq('question_type', 'yes_no')
          .limit(5);

        if (questionsError) throw questionsError;
        console.log("✓ Questions test passed:", { data: questionsData });

        // Test 3: Detailed Aggregation
        const aggregationResults: AggregationTest[] = [];
        
        for (const question of questionsData || []) {
          const { data: predictionData, error: predError } = await testClient
            .from('predictions')
            .select('prediction')
            .eq('question_id', question.id);

          if (predError) throw predError;

          const counts = predictionData?.reduce((acc, curr) => {
            acc[curr.prediction.toLowerCase()] = (acc[curr.prediction.toLowerCase()] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          aggregationResults.push({
            questionId: question.id,
            yes: counts?.yes || 0,
            no: counts?.no || 0,
            total: predictionData?.length || 0
          });
        }

        console.log("✓ Aggregation test passed:", aggregationResults);

        setData([
          { type: 'Basic Access', data: basicData },
          { type: 'Questions', data: questionsData },
        ]);
        setAggregations(aggregationResults);

      } catch (err) {
        console.error("❌ Test failed:", err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };
    
    testAccess();
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };
  
  return (
    <div className="p-6 border-2 border-bears-orange rounded-xl bg-white shadow-lg my-8">
      <h2 className="text-2xl font-bold text-bears-navy mb-4 flex items-center gap-2">
        Prediction Access Debug Panel
      </h2>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          Running comprehensive access tests...
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Access Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-medium">All access tests passed successfully!</p>
          </div>

          {/* Aggregation Results */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('aggregation')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium text-bears-navy">Prediction Aggregations</span>
              {expandedSection === 'aggregation' ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {expandedSection === 'aggregation' && (
              <div className="p-4 space-y-4">
                {aggregations.map((agg) => (
                  <div key={agg.questionId} className="border border-gray-100 rounded p-4">
                    <p className="text-sm text-gray-600 mb-2">Question ID: {agg.questionId}</p>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-green-50 p-2 rounded">
                        <p className="text-sm text-green-600">Yes</p>
                        <p className="font-bold">{agg.yes}</p>
                      </div>
                      <div className="bg-red-50 p-2 rounded">
                        <p className="text-sm text-red-600">No</p>
                        <p className="font-bold">{agg.no}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="font-bold">{agg.total}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Raw Data */}
          {data?.map((test, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(test.type)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-bears-navy">{test.type} Data</span>
                {expandedSection === test.type ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {expandedSection === test.type && (
                <div className="p-4">
                  <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-48">
                    <pre className="text-xs">
                      {JSON.stringify(test.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}