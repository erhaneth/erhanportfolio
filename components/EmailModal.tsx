import React, { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (email: string, name: string) => Promise<void>;
  isLoading?: boolean;
}

const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const { translate } = useLanguage();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      await onConfirm(email, name.trim() || "there");
      setEmail("");
      setName("");
    } catch (err) {
      setError("Failed to send resume. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass-terminal border border-[#00FF41] p-6 w-full max-w-md mx-4 shadow-[0_0_30px_rgba(0,255,65,0.3)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-[#003B00] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#00FF41] animate-pulse" />
            <h2 className="text-sm font-bold text-[#00FF41] uppercase tracking-wider">
              {translate("email.modal.title")}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-[#008F11] hover:text-[#00FF41] transition-colors text-lg font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-[#008F11] uppercase tracking-widest mb-2">
              {translate("email.modal.name")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              disabled={isLoading}
              placeholder="John Doe"
              className="w-full bg-[#020202]/50 border border-[#003B00] p-3 text-sm text-[#00FF41] focus:outline-none focus:border-[#00FF41] mono placeholder:text-[#003B00] disabled:opacity-50"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[10px] text-[#008F11] uppercase tracking-widest mb-2">
              {translate("email.modal.email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              disabled={isLoading}
              placeholder="recruiter@company.com"
              className="w-full bg-[#020202]/50 border border-[#003B00] p-3 text-sm text-[#00FF41] focus:outline-none focus:border-[#00FF41] mono placeholder:text-[#003B00] disabled:opacity-50"
            />
            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          </div>

          <div className="text-[10px] text-[#008F11] leading-relaxed">
            Erhan's resume will be sent to this email address with a
            personalized greeting.
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2 px-4 border border-[#003B00] text-[#008F11] hover:border-[#00FF41] hover:text-[#00FF41] transition-all uppercase tracking-wider text-xs font-bold disabled:opacity-50"
            >
              {translate("email.modal.cancel")}
            </button>
            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="flex-1 py-2 px-4 bg-[#00FF41] text-[#0d0208] hover:bg-white hover:shadow-[0_0_20px_#00FF41] transition-all uppercase tracking-wider text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? translate("email.modal.loading")
                : translate("email.modal.send")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailModal;
