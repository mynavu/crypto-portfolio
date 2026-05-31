import React from "react";

type BaseModalProps = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function BaseModal({ title, onClose, children }: BaseModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0f0f0f] border border-[#222] rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <span className="text-sm font-bold text-zinc-200">{title}</span>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
