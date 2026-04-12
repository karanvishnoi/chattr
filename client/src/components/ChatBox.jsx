import { useState, useEffect, useRef } from 'react';
import socket from '../socket';

export default function ChatBox({ status, compact = false }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const EMOJIS = ['😀', '😂', '🤣', '😍', '🥰', '😎', '🤔', '😮', '😢', '😡', '👍', '👎', '❤️', '🔥', '💯', '🎉', '🤝', '✌️', '👋', '🙏'];

  // Listen for messages and typing
  useEffect(() => {
    function onReceiveMessage({ message, timestamp }) {
      setMessages((prev) => [...prev, { text: message, sender: 'stranger', timestamp }]);
      setIsTyping(false);
    }

    function onStrangerTyping() {
      setIsTyping(true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
    }

    function onStrangerStopTyping() {
      setIsTyping(false);
    }

    function onRateLimited({ message }) {
      setMessages((prev) => [...prev, { text: message, sender: 'system', timestamp: Date.now() }]);
    }

    socket.on('receive_message', onReceiveMessage);
    socket.on('stranger_typing', onStrangerTyping);
    socket.on('stranger_stop_typing', onStrangerStopTyping);
    socket.on('rate_limited', onRateLimited);

    return () => {
      socket.off('receive_message', onReceiveMessage);
      socket.off('stranger_typing', onStrangerTyping);
      socket.off('stranger_stop_typing', onStrangerStopTyping);
      socket.off('rate_limited', onRateLimited);
      clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Clear messages on new match
  useEffect(() => {
    if (status === 'searching') {
      setMessages([]);
      setIsTyping(false);
    }
    if (status === 'connected') {
      setMessages([{ text: 'Connected! Say hi 👋', sender: 'system', timestamp: Date.now() }]);
    }
    if (status === 'disconnected') {
      setMessages((prev) => [...prev, { text: 'Stranger disconnected', sender: 'system', timestamp: Date.now() }]);
    }
  }, [status]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  function sendMessage(e) {
    e?.preventDefault();
    if (!input.trim() || status !== 'connected') return;

    const text = input.trim();
    setMessages((prev) => [...prev, { text, sender: 'you', timestamp: Date.now() }]);
    socket.emit('send_message', { message: text });
    socket.emit('stop_typing');
    setInput('');
    setShowEmojis(false);
  }

  function handleInputChange(e) {
    setInput(e.target.value);
    socket.emit('typing');
  }

  function addEmoji(emoji) {
    setInput((prev) => prev + emoji);
    setShowEmojis(false);
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className={`flex flex-col bg-dark-card border border-dark-border ${compact ? 'rounded-xl' : 'rounded-2xl'} overflow-hidden ${compact ? 'h-full' : 'h-[500px]'}`}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-text-secondary text-sm">
            {status === 'connected' ? 'Start typing...' : 'Messages will appear here'}
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.sender === 'you' ? 'justify-end' : msg.sender === 'system' ? 'justify-center' : 'justify-start'}`}
          >
            {msg.sender === 'system' ? (
              <span className="text-xs text-text-secondary bg-dark/50 px-3 py-1 rounded-full">
                {msg.text}
              </span>
            ) : (
              <div className="group relative max-w-[80%]">
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm ${
                    msg.sender === 'you'
                      ? 'bg-accent text-white rounded-br-md'
                      : 'bg-dark-border text-text-primary rounded-bl-md'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="absolute -bottom-4 text-[10px] text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                  style={msg.sender === 'you' ? { right: 0 } : { left: 0 }}
                >
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="px-4 py-2.5 bg-dark-border rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-dark-border">
        <form onSubmit={sendMessage} className="flex items-center gap-2 relative">
          {/* Emoji button */}
          <button
            type="button"
            onClick={() => setShowEmojis(!showEmojis)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-dark-border transition-colors text-text-secondary hover:text-text-primary cursor-pointer"
          >
            😊
          </button>

          {/* Emoji picker */}
          {showEmojis && (
            <div className="absolute bottom-14 left-0 bg-dark-card border border-dark-border rounded-xl p-3 grid grid-cols-10 gap-1 z-10 shadow-xl">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => addEmoji(emoji)}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-dark-border transition-colors text-lg cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder={status === 'connected' ? 'Type a message...' : 'Waiting for connection...'}
            disabled={status !== 'connected'}
            className="flex-1 px-4 py-2.5 bg-dark border border-dark-border rounded-full text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={!input.trim() || status !== 'connected'}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-accent text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
