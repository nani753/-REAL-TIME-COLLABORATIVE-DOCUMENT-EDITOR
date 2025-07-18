import React, { useState, useEffect } from 'react';
import { FileText, Plus, Users, Clock, Share2 } from 'lucide-react';
import DocumentEditor from './components/DocumentEditor';
import DocumentList from './components/DocumentList';
import { Document } from './types';

function App() {
  const [currentView, setCurrentView] = useState<'list' | 'editor'>('list');
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/documents');
      const docs = await response.json();
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async (title: string) => {
    try {
      const response = await fetch('http://localhost:3001/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });
      
      const newDoc = await response.json();
      setDocuments(prev => [newDoc, ...prev]);
      setCurrentDocument(newDoc);
      setCurrentView('editor');
    } catch (error) {
      console.error('Error creating document:', error);
    }
  };

  const openDocument = async (documentId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/documents/${documentId}`);
      const doc = await response.json();
      setCurrentDocument(doc);
      setCurrentView('editor');
    } catch (error) {
      console.error('Error opening document:', error);
    }
  };

  const backToList = () => {
    setCurrentView('list');
    setCurrentDocument(null);
    fetchDocuments(); // Refresh the document list
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentView === 'list' ? (
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Collaborative Documents</h1>
            </div>
            <p className="text-gray-600 text-lg">
              Create and edit documents in real-time with your team
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Create New Document Card */}
            <div 
              onClick={() => {
                const title = prompt('Enter document title:');
                if (title) createDocument(title);
              }}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed border-gray-200 hover:border-blue-300"
            >
              <div className="p-6 text-center">
                <Plus className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Create New Document</h3>
                <p className="text-gray-600">Start a new collaborative document</p>
              </div>
            </div>

            {/* Document List */}
            <DocumentList 
              documents={documents}
              onDocumentClick={openDocument}
            />
          </div>
        </div>
      ) : (
        <DocumentEditor 
          document={currentDocument}
          onBack={backToList}
        />
      )}
    </div>
  );
}

export default App;