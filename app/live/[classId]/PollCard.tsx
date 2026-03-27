'use client';

import React, { useState } from 'react';
import { Check, Clock, X as XIcon, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PollOption {
  id: string;
  text: string;
  voteCount: number;
  percentage?: number;
  voters?: Array<{ id: string; name: string; profilePic?: string | null }>;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  allowMultipleAnswers: boolean;
  isAnonymous: boolean;
  showResultsBeforeVote: boolean;
  allowVoteChange?: boolean;
  isRevealed?: boolean;
  isQuiz?: boolean;
  correctOptionIds?: string[];
  showCorrectAnswers?: boolean;
  userScore?: { correct: number; total: number; percentage: number };
  status: 'ACTIVE' | 'CLOSED' | 'EXPIRED';
  createdBy: { id: string; name: string; profilePic?: string | null };
  createdAt: string;
  hasVoted: boolean;
  myVotes: string[];
}

export interface PollCardProps {
  poll: Poll;
  onVote?: (optionIds: string[]) => Promise<void>;
  onClose?: (pollId: string) => Promise<void>;
  isHost?: boolean;
}

export default function PollCard({ poll, onVote, onClose, isHost = false }: PollCardProps) {
  const myVotes = poll.myVotes || [];
  const options = poll.options || [];
  const [selectedOptions, setSelectedOptions] = useState<string[]>(myVotes);
  const [isVoting, setIsVoting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleOptionToggle = (optionId: string) => {
    // Don't allow toggling if vote is locked (already voted and change not allowed)
    if (poll.hasVoted && !canChangeVote) {
      return; // Vote is locked, cannot change selection
    }

    if (poll.hasVoted && poll.status === 'ACTIVE') {
      // Can change vote if already voted AND changing is allowed
      if (poll.allowMultipleAnswers) {
        setSelectedOptions((prev) =>
          prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
        );
      } else {
        setSelectedOptions([optionId]);
      }
    } else if (!poll.hasVoted && poll.status === 'ACTIVE') {
      // Initial vote
      if (poll.allowMultipleAnswers) {
        setSelectedOptions((prev) =>
          prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
        );
      } else {
        setSelectedOptions([optionId]);
      }
    }
  };

  const handleSubmitVote = async () => {
    console.log('handleSubmitVote called', {
      hasOnVote: !!onVote,
      selectedOptions,
      pollStatus: poll.status,
      pollId: poll.id,
      canProceed: !(!onVote || selectedOptions.length === 0 || poll.status !== 'ACTIVE')
    });

    if (!onVote || selectedOptions.length === 0 || poll.status !== 'ACTIVE') {
      console.warn('Early return from handleSubmitVote:', {
        noOnVote: !onVote,
        noSelection: selectedOptions.length === 0,
        notActive: poll.status !== 'ACTIVE'
      });
      return;
    }

    setIsVoting(true);
    try {
      console.log('Calling onVote with:', selectedOptions);
      await onVote(selectedOptions);
    } catch (error) {
      console.error('Failed to vote:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleClosePoll = async () => {
    if (!onClose || poll.status !== 'ACTIVE') return;

    setIsClosing(true);
    try {
      await onClose(poll.id);
    } catch (error) {
      console.error('Failed to close poll:', error);
    } finally {
      setIsClosing(false);
    }
  };

  const canVote = poll.status === 'ACTIVE' && !isHost && onVote;
  // Students can see results if:
  // - For quizzes: ONLY after quiz is closed (status !== 'ACTIVE')
  // - For polls: showResultsBeforeVote is enabled, OR poll is closed, OR (not anonymous and voted), OR revealed
  const showResults = poll.isQuiz
    ? poll.status !== 'ACTIVE'  // Quiz: only show results after closing
    : (poll.showResultsBeforeVote ||
       poll.status !== 'ACTIVE' ||
       (!poll.isAnonymous && poll.hasVoted) ||
       poll.isRevealed);
  const voteChanged = JSON.stringify([...selectedOptions].sort()) !== JSON.stringify([...myVotes].sort());
  // Use allowVoteChange setting to control vote changing (defaults to true if not set)
  const canChangeVote = poll.allowVoteChange !== false;

  // Quiz-specific logic
  const isQuiz = poll.isQuiz || false;
  const showQuizResults = isQuiz && poll.status !== 'ACTIVE' && poll.hasVoted;
  const canSeeCorrectAnswers = showQuizResults && (poll.showCorrectAnswers || false);
  const correctOptionIds = poll.correctOptionIds || [];

  // Calculate quiz statistics
  const totalStudents = poll.totalVotes;
  const correctVotersCount = canSeeCorrectAnswers
    ? options
        .filter((opt) => correctOptionIds.includes(opt.id))
        .reduce((sum, opt) => sum + (opt.voteCount || 0), 0)
    : 0;
  const correctStudentsPercentage =
    totalStudents > 0 && canSeeCorrectAnswers
      ? Math.round((correctVotersCount / totalStudents) * 100)
      : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="font-medium text-gray-900">{poll.question}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span>{poll.createdBy?.name || 'Unknown'}</span>
            <span>•</span>
            <span>{poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'}</span>
            {poll.status !== 'ACTIVE' && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <XIcon className="w-3 h-3" />
                  {poll.status === 'CLOSED' ? 'Closed' : 'Expired'}
                </span>
              </>
            )}
          </div>
        </div>
        {isHost && poll.status === 'ACTIVE' && onClose && (
          <button
            onClick={handleClosePoll}
            disabled={isClosing}
            className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {isClosing ? 'Closing...' : 'Close Poll'}
          </button>
        )}
      </div>

      {/* Quiz Score Display */}
      {showQuizResults && poll.userScore && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {poll.userScore.percentage >= 70 ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : poll.userScore.percentage >= 40 ? (
                <Clock className="w-5 h-5 text-orange-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Your Score: {poll.userScore.correct}/{poll.userScore.total}
                </p>
                <p className="text-xs text-gray-600">
                  {poll.userScore.percentage >= 70
                    ? 'Great job!'
                    : poll.userScore.percentage >= 40
                    ? 'Good effort!'
                    : 'Keep practicing!'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{poll.userScore.percentage}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Overall Quiz Statistics */}
      {showQuizResults && canSeeCorrectAnswers && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-700 mb-1">Class Performance</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${correctStudentsPercentage}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-900 min-w-[3rem] text-right">
              {correctStudentsPercentage}%
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {correctVotersCount} out of {totalStudents} {totalStudents === 1 ? 'student' : 'students'} got it right
          </p>
        </div>
      )}

      {/* Options */}
      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = selectedOptions.includes(option.id);
          const percentage = option.percentage || 0;
          const isCorrect = canSeeCorrectAnswers && correctOptionIds.includes(option.id);
          const isIncorrect = canSeeCorrectAnswers && isSelected && !correctOptionIds.includes(option.id);
          const wasMyVote = myVotes.includes(option.id);

          return (
            <button
              key={option.id}
              onClick={() => handleOptionToggle(option.id)}
              disabled={poll.status !== 'ACTIVE' || !canVote || isVoting || (poll.hasVoted && !canChangeVote)}
              className={cn(
                'w-full text-left rounded-lg border transition-all relative overflow-hidden',
                // Quiz results styling
                canSeeCorrectAnswers && isCorrect && 'border-green-500 bg-green-50',
                canSeeCorrectAnswers && isIncorrect && 'border-red-500 bg-red-50',
                // Regular poll styling
                !canSeeCorrectAnswers && canVote && !isVoting && 'cursor-pointer hover:border-[#283618]/30',
                !canSeeCorrectAnswers && isSelected && canVote && 'border-[#283618] bg-[#283618]/5',
                !canSeeCorrectAnswers && !isSelected && 'border-gray-200',
                (poll.status !== 'ACTIVE' || !canVote || isVoting) && 'cursor-default'
              )}
            >
              {/* Progress bar background (only for non-quiz or before results) */}
              {showResults && !canSeeCorrectAnswers && (
                <div
                  className="absolute inset-0 bg-[#283618]/10 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              )}

              {/* Option content */}
              <div className="relative flex items-center justify-between gap-2 p-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* Voting checkbox (only when active) */}
                  {canVote && poll.status === 'ACTIVE' && (
                    <div
                      className={cn(
                        'w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center',
                        poll.allowMultipleAnswers ? 'rounded' : 'rounded-full',
                        isSelected ? 'bg-[#283618] border-[#283618]' : 'border-gray-300'
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  )}

                  {/* Quiz result indicator */}
                  {canSeeCorrectAnswers && (
                    <div className="flex-shrink-0">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : wasMyVote ? (
                        <XCircle className="w-5 h-5 text-red-600" />
                      ) : null}
                    </div>
                  )}

                  <span className={cn(
                    'text-sm font-medium truncate',
                    canSeeCorrectAnswers && isCorrect && 'text-green-900',
                    canSeeCorrectAnswers && isIncorrect && 'text-red-900',
                    !canSeeCorrectAnswers && 'text-gray-900'
                  )}>
                    {option.text}
                  </span>

                  {/* "Your answer" badge */}
                  {showQuizResults && wasMyVote && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex-shrink-0">
                      Your answer
                    </span>
                  )}
                </div>

                {showResults && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn(
                      'text-sm font-medium',
                      canSeeCorrectAnswers && isCorrect && 'text-green-900',
                      canSeeCorrectAnswers && isIncorrect && 'text-red-900',
                      !canSeeCorrectAnswers && 'text-gray-900'
                    )}>
                      {percentage}%
                    </span>
                    <span className="text-xs text-gray-500">({option.voteCount})</span>
                  </div>
                )}
              </div>

              {/* Voters list - only show if teacher enabled showCorrectAnswers */}
              {showResults && canSeeCorrectAnswers && option.voters && option.voters.length > 0 && (
                <div className="relative px-3 pb-2 text-xs text-gray-600">
                  <span className="font-medium">Who answered this: </span>
                  {option.voters.slice(0, 3).map((voter) => voter.name).join(', ')}
                  {option.voters.length > 3 && ` +${option.voters.length - 3} more`}
                </div>
              )}

              {/* Voters list for regular polls (backend controls visibility) */}
              {showResults && !isQuiz && option.voters && option.voters.length > 0 && (
                <div className="relative px-3 pb-2 text-xs text-gray-600">
                  {option.voters.slice(0, 3).map((voter) => voter.name).join(', ')}
                  {option.voters.length > 3 && ` +${option.voters.length - 3} more`}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Vote button */}
      {canVote && poll.status === 'ACTIVE' && (
        <button
          onClick={handleSubmitVote}
          disabled={selectedOptions.length === 0 || isVoting || (!voteChanged && poll.hasVoted) || (poll.hasVoted && !canChangeVote)}
          className={cn(
            'w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors',
            'bg-[#283618] text-white hover:bg-[#283618]/90',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isVoting ? 'Submitting...' : poll.hasVoted && !canChangeVote ? 'Vote Locked' : poll.hasVoted && voteChanged ? 'Change Vote' : poll.hasVoted ? 'Voted' : 'Submit Vote'}
        </button>
      )}

      {/* Vote locked hint */}
      {canVote && poll.hasVoted && !canChangeVote && (
        <p className="text-xs text-gray-600 text-center -mt-1">
          Vote changing disabled by instructor
        </p>
      )}

      {/* Poll settings info */}
      <div className="flex flex-wrap gap-2 pt-1">
        {isQuiz && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
            Quiz
          </span>
        )}
        {poll.allowMultipleAnswers && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
            Multiple answers allowed
          </span>
        )}
        {poll.isAnonymous && !poll.isRevealed && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
            Anonymous
          </span>
        )}
        {poll.isAnonymous && poll.isRevealed && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700">
            Results Revealed
          </span>
        )}
        {poll.expiresAt && poll.status === 'ACTIVE' && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Expires {new Date(poll.expiresAt).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}
