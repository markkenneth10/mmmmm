import React, { useState } from 'react';
import { X, Award, CheckCircle2, XCircle, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import { useClimate } from '../context/ClimateContext';

export const QuizModal: React.FC = () => {
  const { quizzes, setShowQuizModal, completeQuiz, currentUser, openAuthModal } = useClimate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = quizzes[currentIndex];

  const handleSelectOption = (idx: number) => {
    if (!isAnswerSubmitted) {
      setSelectedOption(idx);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswerSubmitted(true);
    if (selectedOption === currentQ.correctAnswerIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < quizzes.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsFinished(true);
      if (currentUser) {
        completeQuiz(score + (selectedOption === currentQ.correctAnswerIndex ? 0 : 0), quizzes.length);
      }
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setIsFinished(false);
  };

  const options = currentQ ? [currentQ.optionA, currentQ.optionB, currentQ.optionC, currentQ.optionD] : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-700 to-green-600 text-white">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-300" />
            <h3 className="font-extrabold text-base tracking-tight">Climate Action Quiz</h3>
          </div>
          <button
            onClick={() => setShowQuizModal(false)}
            className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isFinished ? (
            <div className="space-y-5">
              {/* Progress and Category */}
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  {currentQ.category}
                </span>
                <span className="text-slate-500 font-mono">
                  Question {currentIndex + 1} of {quizzes.length}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / quizzes.length) * 100}%` }}
                />
              </div>

              {/* Question Text */}
              <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {currentQ.question}
              </h4>

              {/* Options */}
              <div className="space-y-2.5">
                {options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQ.correctAnswerIndex;

                  let optStyle = 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50 text-slate-800';

                  if (isAnswerSubmitted) {
                    if (isCorrect) {
                      optStyle = 'border-emerald-500 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20';
                    } else if (isSelected) {
                      optStyle = 'border-red-400 bg-red-50 text-red-950 ring-2 ring-red-400/20';
                    } else {
                      optStyle = 'border-slate-200 bg-slate-50/50 text-slate-400 opacity-60';
                    }
                  } else if (isSelected) {
                    optStyle = 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-600/30';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={isAnswerSubmitted}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 ${optStyle}`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full border border-slate-300 bg-slate-100 flex items-center justify-center font-bold text-[11px] shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt}</span>
                      </span>
                      {isAnswerSubmitted && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      {isAnswerSubmitted && isSelected && !isCorrect && (
                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation (revealed after submitting answer) */}
              {isAnswerSubmitted && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 animate-in fade-in">
                  <span className="font-bold text-slate-700 block">Explanation:</span>
                  <p className="text-slate-600 leading-relaxed">{currentQ.explanation}</p>
                </div>
              )}

              {/* Action button */}
              <div className="pt-2 flex justify-end">
                {!isAnswerSubmitted ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={selectedOption === null}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm"
                  >
                    Confirm Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <span>
                      {currentIndex + 1 < quizzes.length ? 'Next Question' : 'View Results'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Finished Results Screen */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center border-4 border-amber-200 shadow-inner">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Quiz Completed!</h3>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                You scored <span className="font-bold text-emerald-700 text-base">{score}</span> out of{' '}
                <span className="font-bold text-slate-800">{quizzes.length}</span>!
              </p>

              {currentUser ? (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-900 inline-block font-medium">
                  🎉 +10 Eco-Points added to your citizen balance!
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900">
                  <p>Want to record your points on the community leaderboard?</p>
                  <button
                    onClick={() => {
                      setShowQuizModal(false);
                      openAuthModal('login');
                    }}
                    className="mt-2 bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                  >
                    Sign In or Register
                  </button>
                </div>
              )}

              <div className="pt-4 flex gap-3 justify-center">
                <button
                  onClick={handleRestart}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Retake Quiz
                </button>
                <button
                  onClick={() => setShowQuizModal(false)}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
