import { useState } from 'react';
import socket from '../socket';

const REASONS = [
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'spam', label: 'Spam / Advertising' },
  { value: 'underage', label: 'Underage user' },
  { value: 'harassment', label: 'Harassment / Threats' },
  { value: 'other', label: 'Other' },
];

export default function ReportModal({ isOpen, onClose }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  function handleSubmit() {
    if (!selectedReason) return;
    socket.emit('report_user', { reason: selectedReason });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedReason('');
      onClose();
    }, 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 w-full max-w-md mx-4 animate-fade-in">
        {submitted ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">✓</div>
            <p className="text-lg font-medium text-success">Report submitted</p>
            <p className="text-sm text-text-secondary mt-1">Thanks for keeping Chattr safe</p>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold mb-1">Report User</h3>
            <p className="text-sm text-text-secondary mb-4">
              Select a reason for reporting this user
            </p>
            <div className="space-y-2 mb-6">
              {REASONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedReason === r.value
                      ? 'border-accent bg-accent/10'
                      : 'border-dark-border hover:border-accent/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={selectedReason === r.value}
                    onChange={() => setSelectedReason(r.value)}
                    className="accent-accent"
                  />
                  <span className="text-sm">{r.label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-full border border-dark-border text-text-secondary hover:text-text-primary hover:border-text-secondary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedReason}
                className="flex-1 py-2.5 rounded-full bg-danger text-white font-medium hover:bg-danger/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Report
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
