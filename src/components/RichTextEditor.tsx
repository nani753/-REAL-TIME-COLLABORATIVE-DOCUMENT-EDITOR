import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Quote, Heading1, Heading2, Heading3 } from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Update editor content when content prop changes (from real-time updates)
  useEffect(() => {
    if (editorRef.current && !isUpdating) {
      const currentContent = editorRef.current.innerHTML;
      if (currentContent !== content) {
        editorRef.current.innerHTML = content;
      }
    }
  }, [content, isUpdating]);

  // Handle content changes
  const handleInput = () => {
    if (editorRef.current) {
      setIsUpdating(true);
      const newContent = editorRef.current.innerHTML;
      onChange(newContent);
      setTimeout(() => setIsUpdating(false), 100);
    }
  };

  // Formatting commands
  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const formatButtons = [
    { icon: Bold, command: 'bold', title: 'Bold' },
    { icon: Italic, command: 'italic', title: 'Italic' },
    { icon: Underline, command: 'underline', title: 'Underline' },
    { icon: AlignLeft, command: 'justifyLeft', title: 'Align Left' },
    { icon: AlignCenter, command: 'justifyCenter', title: 'Align Center' },
    { icon: AlignRight, command: 'justifyRight', title: 'Align Right' },
    { icon: List, command: 'insertUnorderedList', title: 'Bullet List' },
    { icon: ListOrdered, command: 'insertOrderedList', title: 'Numbered List' },
    { icon: Quote, command: 'formatBlock', value: 'blockquote', title: 'Quote' },
  ];

  const headingButtons = [
    { icon: Heading1, command: 'formatBlock', value: 'h1', title: 'Heading 1' },
    { icon: Heading2, command: 'formatBlock', value: 'h2', title: 'Heading 2' },
    { icon: Heading3, command: 'formatBlock', value: 'h3', title: 'Heading 3' },
  ];

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Heading buttons */}
          <div className="flex items-center gap-1 border-r pr-3">
            {headingButtons.map((button, index) => (
              <button
                key={index}
                onClick={() => executeCommand(button.command, button.value)}
                className="p-2 rounded hover:bg-gray-200 transition-colors"
                title={button.title}
              >
                <button.icon className="h-4 w-4" />
              </button>
            ))}
          </div>

          {/* Format buttons */}
          <div className="flex items-center gap-1">
            {formatButtons.map((button, index) => (
              <button
                key={index}
                onClick={() => executeCommand(button.command, button.value)}
                className="p-2 rounded hover:bg-gray-200 transition-colors"
                title={button.title}
              >
                <button.icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-6 min-h-96 focus:outline-none prose prose-lg max-w-none"
        style={{
          fontSize: '16px',
          lineHeight: '1.6',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
};

export default RichTextEditor;