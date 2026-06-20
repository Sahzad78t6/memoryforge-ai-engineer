import React from 'react';
import { User, Cpu, FileJson, Copy, Check } from 'lucide-react';
import { useState } from 'react';

// A simple custom formatter to parse markdown elements like code blocks, lists, and bold text
const formatResponseText = (text) => {
  if (!text) return '';

  const segments = text.split(/(```[\s\S]*?```)/g);

  return segments.map((segment, index) => {
    // 1. Code blocks formatting
    if (segment.startsWith('```') && segment.endsWith('```')) {
      const codeLines = segment.slice(3, -3).trim().split('\n');
      let language = 'code';
      let code = codeLines.join('\n');

      if (codeLines[0] && /^[a-zA-Z0-9_-]+$/.test(codeLines[0])) {
        language = codeLines[0];
        code = codeLines.slice(1).join('\n');
      }

      return <CodeBlock key={index} code={code} language={language} />;
    }

    // 2. Standard text paragraph, bolding, lists
    const lines = segment.split('\n');
    return lines.map((line, lineIndex) => {
      // Check for bullet list
      const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
      // Check for numbered list
      const isNumbered = /^\d+\.\s/.test(line.trim());

      // Parse bold **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const renderedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-extrabold text-white">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (isBullet) {
        return (
          <li key={lineIndex} className="ml-5 list-disc text-sm text-slate-300 my-1 font-sans">
            {line.trim().slice(2)}
          </li>
        );
      }
      if (isNumbered) {
        const dotIndex = line.indexOf('.');
        const num = line.slice(0, dotIndex + 1);
        const rest = line.slice(dotIndex + 1);
        return (
          <div key={lineIndex} className="ml-5 text-sm text-slate-300 my-1 font-sans">
            <span className="font-bold text-brand-400 mr-1.5">{num}</span>
            {rest}
          </div>
        );
      }

      // Empty line renders spacing
      if (line.trim() === '') {
        return <div key={lineIndex} className="h-2" />;
      }

      return (
        <p key={lineIndex} className="text-sm leading-relaxed text-slate-300 font-sans my-1 text-justify">
          {renderedLine}
        </p>
      );
    });
  });
};

const CodeBlock = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 font-mono shadow-inner">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-2 text-2xs uppercase tracking-wider text-slate-400">
        <div className="flex items-center gap-1.5 font-semibold">
          <FileJson size={12} className="text-brand-400" />
          <span>{language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
        >
          {copied ? (
            <>
              <Check size={11} className="text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={11} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-slate-200 selection:bg-brand-500/20">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const MessageBubble = ({ role, content }) => {
  const isUser = role === 'user';

  return (
    <div className={`flex w-full gap-3 py-4 ${isUser ? 'justify-end' : 'justify-start border-b border-slate-900/30'}`}>
      
      {/* Avatar Icons */}
      {!isUser && (
        <div className="flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-md shadow-brand-500/10">
          <Cpu size={16} />
        </div>
      )}

      {/* Bubble Container */}
      <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
        isUser
          ? 'bg-gradient-to-br from-brand-600 to-indigo-600 text-white rounded-br-none border border-brand-500/30'
          : 'bg-slate-900/50 text-slate-200 rounded-bl-none border border-slate-800/60'
      }`}>
        {/* Message Sender Header */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-2xs font-bold tracking-wider uppercase opacity-60">
            {isUser ? 'You' : 'MemoryForge AI'}
          </span>
        </div>

        {/* Message Body */}
        <div className="space-y-1">
          {isUser ? (
            <p className="text-sm font-sans leading-relaxed break-words">{content}</p>
          ) : (
            <div className="break-words space-y-1.5">{formatResponseText(content)}</div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-xl bg-slate-800 text-slate-300 border border-slate-700/60">
          <User size={16} />
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
