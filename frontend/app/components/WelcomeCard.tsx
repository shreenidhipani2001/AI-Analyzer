const EXAMPLE_QUESTIONS = [
  "What is the expense ratio of Mirae Asset Large Cap Fund?",
  "What is the ELSS lock-in period?",
  "How do I download my capital gains statement?",
];

interface WelcomeCardProps {
  onQuestionClick: (question: string) => void;
}

export default function WelcomeCard({ onQuestionClick }: WelcomeCardProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 px-4 text-center animate-fadeinup">
      <p className="text-orange-700 text-sm max-w-sm leading-relaxed font-body font-medium">
        Ask any factual question about Mirae Asset mutual fund schemes and get cited answers from official documents.
      </p>

      <div className="flex flex-col gap-2.5 w-full max-w-sm">
        <p className="text-xs text-orange-400 uppercase tracking-widest font-semibold">Try asking</p>
        {EXAMPLE_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onQuestionClick(q)}
            className="text-left px-4 py-3 rounded-xl sunny-card text-sm text-orange-800 hover:bg-orange-50 hover:border-coral/60 transition-all duration-200 font-body font-medium"
          >
            <span className="text-coral mr-2">›</span>{q}
          </button>
        ))}
      </div>
    </div>
  );
}
