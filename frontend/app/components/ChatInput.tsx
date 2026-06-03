"use client";

import { KeyboardEvent } from "react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const MAX_LENGTH = 500;

export default function ChatInput({ value, onChange, onSubmit, disabled }: ChatInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= MAX_LENGTH) onChange(e.target.value);
  };

  return (
    <div className="flex items-end gap-3 px-4 py-3 max-w-3xl mx-auto w-full">
      <div className="flex-1 relative">
        <textarea
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask a factual question about Mirae Asset mutual fund schemes…"
          rows={1}
          className="w-full resize-none rounded-2xl bg-white border-2 border-orange-200 text-orange-900 placeholder-orange-300 px-4 py-2.5 text-sm font-body focus:outline-none focus:border-coral/70 focus:ring-2 focus:ring-coral/20 transition-all pr-16 shadow-card font-medium"
        />
        {value.length > MAX_LENGTH * 0.8 && (
          <span className="absolute right-3 bottom-2.5 text-xs text-orange-400 font-medium">
            {value.length}/{MAX_LENGTH}
          </span>
        )}
      </div>
      <button
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        className="bg-coral text-white font-bold rounded-2xl px-5 py-2.5 text-sm font-body disabled:opacity-30 disabled:cursor-not-allowed hover:bg-coral-dark transition-colors shadow-button whitespace-nowrap"
      >
        Send →
      </button>
    </div>
  );
}
