import React from 'react';

type UserMode = 'hiring' | 'visiting' | null;

interface PillOption {
  id: string;
  label: string;
  context: string;
}

// Pills for recruiters/hiring managers
const ROLE_OPTIONS: PillOption[] = [
  { id: 'ai-ml', label: 'AI/ML', context: 'Hiring for an AI/ML Engineer role. Focus on machine learning, model development, and AI systems.' },
  { id: 'frontend', label: 'FRONTEND', context: 'Hiring for a Frontend Developer role. Focus on React, TypeScript, UI/UX skills.' },
  { id: 'fullstack', label: 'FULL-STACK', context: 'Hiring for a Full-Stack Developer role. Focus on both frontend and backend capabilities.' },
  { id: 'lead', label: 'TECH LEAD', context: 'Hiring for a Technical Lead position. Focus on leadership, architecture decisions, and team management experience.' },
];

// Pills for visitors
const VISITOR_OPTIONS: PillOption[] = [
  { id: 'projects', label: 'PROJECTS', context: 'Visitor wants to see portfolio projects. Show off the coolest work with enthusiasm. Be proud of achievements.' },
  { id: 'tech', label: 'HOW I BUILT THIS', context: 'Visitor is curious about the tech behind this portfolio. Explain the Gemini Live API, React architecture, and design decisions. Be technical but accessible.' },
  { id: 'background', label: 'MY STORY', context: 'Visitor wants to know about Erhan\'s background and journey. Share the career path, motivations, and what drives the passion for AI.' },
  { id: 'collab', label: 'COLLAB', context: 'Visitor might be interested in collaboration or networking. Be open, friendly, and discuss potential ways to work together or connect.' },
];

// Tech focus pills (shared between modes)
const FOCUS_OPTIONS: PillOption[] = [
  { id: 'voice', label: 'VOICE AI', context: 'Particularly interested in voice/audio AI, real-time speech processing, and conversational AI.' },
  { id: 'vision', label: 'VISION', context: 'Particularly interested in computer vision, image processing, and visual AI systems.' },
  { id: 'llm', label: 'LLM/RAG', context: 'Particularly interested in Large Language Models, RAG systems, and generative AI.' },
  { id: 'react', label: 'REACT', context: 'Particularly interested in React ecosystem, modern frontend architecture, and TypeScript.' },
];

interface ContextPillsProps {
  mode: UserMode;
  selectedRole: string | null;
  selectedFocus: string | null;
  onModeSelect: (mode: UserMode) => void;
  onRoleSelect: (role: string | null) => void;
  onFocusSelect: (focus: string | null) => void;
}

const ContextPills: React.FC<ContextPillsProps> = ({
  mode,
  selectedRole,
  selectedFocus,
  onModeSelect,
  onRoleSelect,
  onFocusSelect,
}) => {
  const secondaryOptions = mode === 'hiring' ? ROLE_OPTIONS : VISITOR_OPTIONS;
  const secondaryLabel = mode === 'hiring' ? 'ROLE_TARGET' : 'INTEREST';

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div>
        <div className="text-[10px] sm:text-[11px] text-[#008F11] uppercase tracking-widest mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#008F11]" />
          WHO_ARE_YOU
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              onModeSelect(mode === 'hiring' ? null : 'hiring');
              onRoleSelect(null);
            }}
            className={`
              py-2.5 px-3 text-xs sm:text-sm font-bold uppercase tracking-wider
              border-2 transition-all duration-200
              ${mode === 'hiring'
                ? 'bg-[#00FF41] text-[#0d0208] border-[#00FF41] shadow-[0_0_15px_rgba(0,255,65,0.4)]'
                : 'bg-transparent text-[#008F11] border-[#003B00] hover:border-[#00FF41] hover:text-[#00FF41]'
              }
            `}
          >
            HIRING
          </button>
          <button
            onClick={() => {
              onModeSelect(mode === 'visiting' ? null : 'visiting');
              onRoleSelect(null);
            }}
            className={`
              py-2.5 px-3 text-xs sm:text-sm font-bold uppercase tracking-wider
              border-2 transition-all duration-200
              ${mode === 'visiting'
                ? 'bg-[#00FF41] text-[#0d0208] border-[#00FF41] shadow-[0_0_15px_rgba(0,255,65,0.4)]'
                : 'bg-transparent text-[#008F11] border-[#003B00] hover:border-[#00FF41] hover:text-[#00FF41]'
              }
            `}
          >
            VISITING
          </button>
        </div>
      </div>

      {/* Secondary Options - Only show if mode is selected */}
      {mode && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="text-[10px] sm:text-[11px] text-[#008F11] uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#008F11]" />
            {secondaryLabel}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {secondaryOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => onRoleSelect(selectedRole === option.id ? null : option.id)}
                className={`
                  px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider
                  border transition-all duration-200
                  ${selectedRole === option.id
                    ? 'bg-[#00FF41] text-[#0d0208] border-[#00FF41] shadow-[0_0_10px_rgba(0,255,65,0.4)]'
                    : 'bg-transparent text-[#008F11] border-[#003B00] hover:border-[#00FF41] hover:text-[#00FF41]'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tech Focus Row - Always available */}
      {mode && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300 delay-100">
          <div className="text-[10px] sm:text-[11px] text-[#008F11] uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#008F11]" />
            TECH_FOCUS
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FOCUS_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => onFocusSelect(selectedFocus === option.id ? null : option.id)}
                className={`
                  px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider
                  border transition-all duration-200
                  ${selectedFocus === option.id
                    ? 'bg-[#00FF41] text-[#0d0208] border-[#00FF41] shadow-[0_0_10px_rgba(0,255,65,0.4)]'
                    : 'bg-transparent text-[#008F11] border-[#003B00] hover:border-[#00FF41] hover:text-[#00FF41]'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Context Preview */}
      {(mode || selectedRole || selectedFocus) && (
        <div className="pt-3 border-t border-[#003B00]">
          <div className="text-[10px] sm:text-[11px] text-[#00FF41] uppercase tracking-widest mb-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#00FF41] animate-pulse" />
            CONTEXT_LOADED
          </div>
          <div className="text-[11px] sm:text-xs text-[#008F11] leading-relaxed font-medium">
            {[
              mode === 'hiring' ? 'Recruiter' : mode === 'visiting' ? 'Visitor' : null,
              selectedRole && (mode === 'hiring' 
                ? ROLE_OPTIONS.find(r => r.id === selectedRole)?.label 
                : VISITOR_OPTIONS.find(r => r.id === selectedRole)?.label),
              selectedFocus && FOCUS_OPTIONS.find(f => f.id === selectedFocus)?.label
            ].filter(Boolean).join(' → ')}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper to generate context string from selections
export const generateContextFromPills = (
  mode: UserMode,
  roleId: string | null, 
  focusId: string | null
): string => {
  const parts: string[] = [];
  
  // Add mode context
  if (mode === 'hiring') {
    parts.push('This user is a recruiter or hiring manager looking to evaluate Erhan for a position.');
  } else if (mode === 'visiting') {
    parts.push('This user is a visitor exploring the portfolio. Be friendly, engaging, and show personality.');
  }
  
  // Add role/interest context
  if (roleId) {
    const options = mode === 'hiring' ? ROLE_OPTIONS : VISITOR_OPTIONS;
    const role = options.find(r => r.id === roleId);
    if (role) parts.push(role.context);
  }
  
  // Add tech focus context
  if (focusId) {
    const focus = FOCUS_OPTIONS.find(f => f.id === focusId);
    if (focus) parts.push(focus.context);
  }
  
  return parts.join('\n\n');
};

export default ContextPills;
