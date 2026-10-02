import React, { useState } from 'react';
import { X, Award, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { useClimate } from '../context/ClimateContext';

export const QuizModal: React.FC = () => {
  const { quizModalOpen, setQuizModalOpen, quizzes, currentUser, setCurrentUser } = useClimate();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (!quizModalOpen) return null;

  const q = quizzes[currentIdx];

  const handleOptionSelect = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    setShowExplanation(true);
    if (idx === q.correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < quizzes.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setCompleted(true);
      if (currentUser) {
        setCurrentUser(prev => prev ? { ...prev, ecoPoints: prev.ecoPoints + 50 } : null);
      }
    }
  };

  const handleReset = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setScore(0);
    setShowExplanation(false);
    setCompleted(false);
    setQuizModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <button
          onClick={handleReset}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {completed ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-extrabold text-white">Quiz Completed!</h3>
            <p className="text-sm text-slate-300 mt-2">
              You scored <span className="font-extrabold text-emerald-400">{score}</span> out of {quizzes.length}!
            </p>
            <p className="text-xs text-emerald-400 font-bold mt-1">
              +50 Eco-Points added to your Citizen Account!
            </p>

            <button
              onClick={handleReset}
              className="mt-6 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              Done & Return
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold text-slate-400">
                  Question {currentIdx + 1} of {quizzes.length}
                </span>
              </div>
              <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800/60">
                +50 Points
              </span>
            </div>

            <h3 className="text-lg font-extrabold text-white mb-4 leading-snug">{q.question}</h3>

            <div className="space-y-2.5 mb-6">
              {q.options.map((opt, idx) => {
                let btnStyle = 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700';
                if (selectedOption !== null) {
                  if (idx === q.correctAnswer) {
                    btnStyle = 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold';
                  } else if (idx === selectedOption) {
                    btnStyle = 'bg-rose-950 border-rose-500 text-rose-300';
                  } else {
                    btnStyle = 'bg-slate-900 border-slate-800 text-slate-500 opacity-50';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(idx)}
                    disabled={selectedOption !== null}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all ${btnStyle}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {showExplanation && (
              <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-xl mb-6 text-xs">
                <div className="font-bold text-emerald-400 mb-0.5">Explanation</div>
                <p className="text-slate-300">{q.explanation}</p>
              </div>
            )}

            {selectedOption !== null && (
              <button
                onClick={handleNext}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all"
              >
                {currentIdx < quizzes.length - 1 ? 'Next Question →' : 'Finish Quiz & Claim Points'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
