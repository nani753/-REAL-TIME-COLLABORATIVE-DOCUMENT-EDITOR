import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Users, Save, Share2, Download, Clock } from 'lucide-react';
import io, { Socket } from 'socket.io-client';
import { Document, User } from '../types';
import RichTextEditor from './RichTextEditor';
import UserPresence from './UserPresence';

interface DocumentEditorProps {
  document: Document | null;
  onBack: () => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({ document, onBack }) => {
  const [title, setTitle] = useState(document?.title || '');
  const [content, setContent] = useState(document?.content || '');
  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize socket connection
  useEffect(() => {
    if (!document) return;

    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      // Join document room with user data
      newSocket.emit('join-document', document._id, {
        name: `User ${Math.floor(Math.random() * 1000)}`,
        color: getRandomColor()
      });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Handle real-time updates
    newSocket.on('document-updated', (data) => {
      setContent(data.content);
      setLastSaved(data.timestamp);
    });

    newSocket.on('title-updated', (data) => {
      setTitle(data.title);
    });

    newSocket.on('current-users', (users) => {
      setConnectedUsers(users);
    });

    newSocket.on('user-joined', (user) => {
      setConnectedUsers(prev => [...prev, user]);
    });

    newSocket.on('user-left', (userId) => {
      setConnectedUsers(prev => prev.filter(user => user.id !== userId));
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    newSocket.on('user-typing-update', (data) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (data.isTyping) {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [document]);

  // Auto-save functionality
  const saveDocument = useCallback(async () => {
    if (!document || isSaving) return;

    setIsSaving(true);
    try {
      const response = await fetch(`http://localhost:3001/api/documents/${document._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content }),
      });

      if (response.ok) {
        const updatedDoc = await response.json();
        setLastSaved(updatedDoc.lastEdited);
      }
    } catch (error) {
      console.error('Error saving document:', error);
    } finally {
      setIsSaving(false);
    }
  }, [document, title, content, isSaving]);

  // Handle content changes
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    
    // Emit real-time change
    if (socket && document) {
      socket.emit('document-change', document._id, newContent, 'content-update');
      
      // Emit typing indicator
      socket.emit('user-typing', document._id, true);
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set typing to false after 2 seconds
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('user-typing', document._id, false);
      }, 2000);
    }

    // Auto-save after 3 seconds of inactivity
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(saveDocument, 3000);
  }, [socket, document, saveDocument]);

  // Handle title changes
  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    
    // Emit real-time title change
    if (socket && document) {
      socket.emit('title-change', document._id, newTitle);
    }

    // Auto-save after 2 seconds of inactivity
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(saveDocument, 2000);
  }, [socket, document, saveDocument]);

  // Export document
  const exportDocument = () => {
    const element = document.createElement('a');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1, h2, h3 { color: #333; }
            blockquote { border-left: 4px solid #ddd; padding-left: 16px; margin: 16px 0; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${content}
        </body>
      </html>
    `;
    
    const file = new Blob([htmlContent], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `${title}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Share document
  const shareDocument = () => {
    if (document) {
      navigator.clipboard.writeText(window.location.href);
      alert('Document link copied to clipboard!');
    }
  };

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No document selected</p>
          <button 
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-xl font-semibold bg-transparent border-none focus:outline-none focus:ring-0 min-w-0 flex-1"
                placeholder="Untitled Document"
              />
              
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Saving...</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Saved {new Date(lastSaved).toLocaleTimeString()}</span>
                  </>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <UserPresence users={connectedUsers} typingUsers={typingUsers} />
              
              <div className="flex items-center gap-2">
                <button
                  onClick={shareDocument}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                  title="Share Document"
                >
                  <Share2 className="h-5 w-5" />
                </button>
                
                <button
                  onClick={exportDocument}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                  title="Export Document"
                >
                  <Download className="h-5 w-5" />
                </button>
                
                <button
                  onClick={saveDocument}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <div className="text-gray-500">
              {connectedUsers.length} {connectedUsers.length === 1 ? 'user' : 'users'} online
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm min-h-96">
          <RichTextEditor 
            content={content}
            onChange={handleContentChange}
          />
        </div>
      </div>
    </div>
  );
};

// Helper function to generate random colors
function getRandomColor() {
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', 
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export default DocumentEditor;