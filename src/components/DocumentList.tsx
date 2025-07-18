import React from 'react';
import { FileText, Users, Clock } from 'lucide-react';
import { Document } from '../types';

interface DocumentListProps {
  documents: Document[];
  onDocumentClick: (id: string) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, onDocumentClick }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getPreviewText = (content: string) => {
    const div = document.createElement('div');
    div.innerHTML = content;
    const text = div.textContent || div.innerText || '';
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  };

  return (
    <>
      {documents.map((doc) => (
        <div
          key={doc._id}
          onClick={() => onDocumentClick(doc._id)}
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-6 group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {doc.title}
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  {getPreviewText(doc.content)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatDate(doc.lastEdited)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{doc.collaborators.length} collaborators</span>
              </div>
            </div>
            
            <div className="flex items-center -space-x-2">
              {doc.collaborators.slice(0, 3).map((user, index) => (
                <div
                  key={user.id || index}
                  className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: user.color || '#6b7280' }}
                  title={user.name}
                >
                  {user.name?.charAt(0).toUpperCase() || '?'}
                </div>
              ))}
              {doc.collaborators.length > 3 && (
                <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-500 flex items-center justify-center text-white text-xs font-medium">
                  +{doc.collaborators.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default DocumentList;