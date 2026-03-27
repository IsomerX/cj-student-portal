'use client';

import React, { useState } from 'react';
import { Check, Clock, X as XIcon } from 'lucide-react';
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
  const [selectedOptions, setSelectedOptions] = useState<string[]>(myVotes);
  const [isVoting, setIsVoting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleOptionToggle = (optionId: string) => {
    if (poll.hasVoted && poll.status === 'ACTIVE') {
      // Can change vote if already voted
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
    if (!onVote || selectedOptions.length === 0 || poll.status !== 'ACTIVE') return;

    setIsVoting(true);
    try {
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
  const showResults = poll.hasVoted || poll.showResultsBeforeVote || poll.status !== 'ACTIVE';
  const voteChanged = JSON.stringify([...selectedOptions].sort()) !== JSON.stringify([...myVotes].sort());

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="font-medium text-gray-900">{poll.question}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span>{poll.createdBy.name}</span>
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

      {/* Options */}
      <div className="space-y-2">
        {poll.options.map((option) => {
          const isSelected = selectedOptions.includes(option.id);
          const percentage = option.percentage || 0;

          return (
            <button
              key={option.id}
              onClick={() => handleOptionToggle(option.id)}
              disabled={poll.status !== 'ACTIVE' || !canVote || isVoting}
              className={cn(
                'w-full text-left rounded-lg border transition-all relative overflow-hidden',
                canVote && !isVoting && 'cursor-pointer hover:border-[#283618]/30',
                isSelected && canVote && 'border-[#283618] bg-[#283618]/5',
                !isSelected && 'border-gray-200',
                (poll.status !== 'ACTIVE' || !canVote || isVoting) && 'cursor-default'
              )}
            >
              {/* Progress bar background */}
              {showResults && (
                <div
                  className="absolute inset-0 bg-[#283618]/10 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              )}

              {/* Option content */}
              <div className="relative flex items-center justify-between gap-2 p-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
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
                  <span className="text-sm font-medium text-gray-900 truncate">{option.text}</span>
                </div>

                {showResults && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-medium text-gray-900">{percentage}%</span>
                    <span className="text-xs text-gray-500">({option.voteCount})</span>
                  </div>
                )}
              </div>

              {/* Voters list (if not anonymous and has voters) */}
              {showResults && !poll.isAnonymous && option.voters && option.voters.length > 0 && (
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
          disabled={selectedOptions.length === 0 || isVoting || (!voteChanged && poll.hasVoted)}
          className={cn(
            'w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors',
            'bg-[#283618] text-white hover:bg-[#283618]/90',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isVoting ? 'Submitting...' : poll.hasVoted && voteChanged ? 'Change Vote' : poll.hasVoted ? 'Voted' : 'Submit Vote'}
        </button>
      )}

      {/* Poll settings info */}
      <div className="flex flex-wrap gap-2 pt-1">
        {poll.allowMultipleAnswers && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
            Multiple answers allowed
          </span>
        )}
        {poll.isAnonymous && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
            Anonymous
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
