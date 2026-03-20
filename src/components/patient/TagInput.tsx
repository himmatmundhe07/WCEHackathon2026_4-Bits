import { useState, useRef } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  quickAddOptions?: string[];
  chipColor?: 'red' | 'amber' | 'teal';
}

const chipColors = {
  red: { bg: 'bg-white', border: 'border-destructive', text: 'text-destructive' },
  amber: { bg: 'bg-white', border: 'border-gold', text: 'text-gold' },
  teal: { bg: 'bg-white', border: 'border-teal', text: 'text-teal' },
};

const TagInput = ({ tags, onChange, placeholder, quickAddOptions, chipColor = 'teal' }: TagInputProps) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const colors = chipColors[chipColor];

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div>
      <div className="field-input flex flex-wrap gap-2 min-h-[42px] cursor-text" onClick={() => inputRef.current?.focus()}>
        {tags.map((tag, i) => (
          <span key={i} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${colors.bg} ${colors.border} ${colors.text}`}>
            {tag}
            <button type="button" onClick={() => removeTag(i)} className="hover:opacity-70">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground"
        />
      </div>
      {quickAddOptions && quickAddOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {quickAddOptions
            .filter((opt) => !tags.includes(opt))
            .map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => addTag(opt)}
                className="px-2.5 py-1 rounded-full text-xs font-medium border transition-all hover:opacity-80"
                style={{ borderColor: '#0891B2', color: '#0891B2', background: 'white' }}
              >
                + {opt}
              </button>
            ))}
        </div>
      )}
    </div>
  );
};

export default TagInput;
