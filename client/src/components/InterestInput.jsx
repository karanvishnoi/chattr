import { useState } from 'react';

const SUGGESTIONS = [
  'gaming', 'music', 'movies', 'anime', 'sports', 'tech',
  'art', 'cooking', 'travel', 'photography', 'coding',
  'fitness', 'books', 'fashion', 'science', 'memes',
];

export default function InterestInput({ interests, setInterests }) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  function addInterest(tag) {
    const cleaned = tag.toLowerCase().trim();
    if (cleaned && !interests.includes(cleaned) && interests.length < 10) {
      setInterests([...interests, cleaned]);
    }
    setInput('');
    setShowSuggestions(false);
  }

  function removeInterest(tag) {
    setInterests(interests.filter((i) => i !== tag));
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (input.trim()) addInterest(input);
    } else if (e.key === 'Backspace' && !input && interests.length) {
      removeInterest(interests[interests.length - 1]);
    }
  }

  const filtered = SUGGESTIONS.filter(
    (s) => s.includes(input.toLowerCase()) && !interests.includes(s)
  );

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex flex-wrap gap-2 mb-2">
        {interests.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-3 py-1 bg-accent/20 text-accent-light rounded-full text-sm"
          >
            {tag}
            <button
              onClick={() => removeInterest(tag)}
              className="ml-1 hover:text-white transition-colors cursor-pointer"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={interests.length ? 'Add more interests...' : 'Add interests (e.g. gaming, music)'}
          className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-xl text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent transition-colors"
        />
        {showSuggestions && input && filtered.length > 0 && (
          <div className="absolute top-full mt-1 w-full bg-dark-card border border-dark-border rounded-xl overflow-hidden z-10 max-h-40 overflow-y-auto">
            {filtered.slice(0, 6).map((s) => (
              <button
                key={s}
                onMouseDown={() => addInterest(s)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-accent/10 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
