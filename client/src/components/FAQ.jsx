import { useState } from 'react';

const FAQS = [
  {
    q: 'How does interest matching work?',
    a: "Just type in what you're into — gaming, music, art, anything — and Chattr pairs you with someone who shares those interests. If nothing overlaps, we'll still find someone for you in seconds.",
  },
  {
    q: 'How does Chattr help keep chats safer?',
    a: 'All chats are moderated with automatic filters for offensive content. You can report users anytime, and repeat offenders get auto-banned. No personal info is shared — stay anonymous, stay safe.',
  },
  {
    q: 'Why choose Chattr to chat with strangers online?',
    a: 'Chattr is fast, free, and truly global. No sign-up needed for basic chat, interest-based matching, real-time text + video, and strong moderation. Premium plans unlock gender filter, unlimited video, and more.',
  },
  {
    q: 'Can I use Chattr on my phone?',
    a: 'Yes! Chattr works perfectly on any smartphone, tablet, or computer. Just open the website in your browser — no app download needed. Camera and mic permissions are requested when you start a video chat.',
  },
  {
    q: 'Is Chattr really free?',
    a: 'Yes — text chat is 100% free, forever. Video chat is free up to 30 minutes per day. Want unlimited video and gender filter? Check out our Premium plans starting at ₹299/month.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
      <div className="space-y-3">
        {FAQS.map((item, i) => (
          <div
            key={i}
            className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden transition-colors hover:border-accent/50"
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
            >
              <span className="font-medium text-sm md:text-base">{item.q}</span>
              <span className={`text-accent text-xl transition-transform duration-200 ${open === i ? 'rotate-45' : ''}`}>
                +
              </span>
            </button>
            {open === i && (
              <div className="px-5 pb-4 text-sm text-text-secondary animate-fade-in">
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
