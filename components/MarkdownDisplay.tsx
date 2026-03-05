import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownDisplayProps {
  content: string;
}

const MarkdownDisplay: React.FC<MarkdownDisplayProps> = ({ content }) => {
  return (
    <div className="prose prose-invert prose-sm max-w-none text-steel-100">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({node, ...props}) => (
            <div className="overflow-x-auto my-4 border border-steel-600 rounded-lg">
              <table className="min-w-full divide-y divide-steel-600" {...props} />
            </div>
          ),
          thead: ({node, ...props}) => <thead className="bg-steel-800" {...props} />,
          tbody: ({node, ...props}) => <tbody className="divide-y divide-steel-700 bg-steel-800/50" {...props} />,
          tr: ({node, ...props}) => <tr className="hover:bg-steel-700/50 transition-colors" {...props} />,
          th: ({node, ...props}) => <th className="px-4 py-3 text-left text-xs font-medium text-steel-300 uppercase tracking-wider" {...props} />,
          td: ({node, ...props}) => <td className="px-4 py-3 text-sm whitespace-pre-wrap text-steel-200" {...props} />,
          h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-white mt-8 mb-4 pb-2 border-b border-steel-600" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-blue-400 mt-6 mb-3" {...props} />,
          p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-1" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-1" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownDisplay;
