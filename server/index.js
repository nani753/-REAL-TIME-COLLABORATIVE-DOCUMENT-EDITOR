import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (replace with MongoDB in production)
const documents = new Map();
const documentSessions = new Map();

// Initialize with a sample document
const sampleDoc = {
  _id: 'sample-doc-1',
  title: 'Welcome to Collaborative Editor',
  content: `<h1>Welcome to Real-time Collaborative Document Editor</h1>
<p>This is a <strong>real-time collaborative document editor</strong> built with React, Node.js, and Socket.IO!</p>

<h2>Features:</h2>
<ul>
  <li>Real-time collaborative editing</li>
  <li>Multiple users can edit simultaneously</li>
  <li>Auto-save functionality</li>
  <li>User presence indicators</li>
  <li>Rich text formatting</li>
</ul>

<p>Try opening this document in multiple tabs to see the real-time collaboration in action!</p>

<blockquote>
  <p>"The best way to predict the future is to create it." - Peter Drucker</p>
</blockquote>

<p>Start editing this document and watch as your changes appear instantly across all connected users!</p>`,
  lastEdited: new Date().toISOString(),
  collaborators: []
};

documents.set(sampleDoc._id, sampleDoc);

// REST API Routes
app.get('/api/documents', (req, res) => {
  const docList = Array.from(documents.values()).map(doc => ({
    _id: doc._id,
    title: doc.title,
    lastEdited: doc.lastEdited,
    collaborators: doc.collaborators
  }));
  res.json(docList);
});

app.get('/api/documents/:id', (req, res) => {
  const doc = documents.get(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }
  res.json(doc);
});

app.post('/api/documents', (req, res) => {
  const { title } = req.body;
  const newDoc = {
    _id: uuidv4(),
    title: title || 'Untitled Document',
    content: '<p>Start writing your document here...</p>',
    lastEdited: new Date().toISOString(),
    collaborators: []
  };
  
  documents.set(newDoc._id, newDoc);
  res.status(201).json(newDoc);
});

app.put('/api/documents/:id', (req, res) => {
  const { title, content } = req.body;
  const doc = documents.get(req.params.id);
  
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }
  
  if (title !== undefined) doc.title = title;
  if (content !== undefined) doc.content = content;
  doc.lastEdited = new Date().toISOString();
  
  documents.set(req.params.id, doc);
  res.json(doc);
});

// WebSocket handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join document room
  socket.on('join-document', (documentId, userData) => {
    socket.join(documentId);
    
    // Initialize session tracking
    if (!documentSessions.has(documentId)) {
      documentSessions.set(documentId, new Map());
    }
    
    const session = documentSessions.get(documentId);
    session.set(socket.id, {
      id: socket.id,
      name: userData.name || `User ${socket.id.substring(0, 4)}`,
      color: userData.color || getRandomColor(),
      cursor: null,
      joinedAt: new Date().toISOString()
    });
    
    // Update collaborators in document
    const doc = documents.get(documentId);
    if (doc) {
      doc.collaborators = Array.from(session.values());
      documents.set(documentId, doc);
    }
    
    // Broadcast user joined
    socket.to(documentId).emit('user-joined', session.get(socket.id));
    
    // Send current users to new user
    socket.emit('current-users', Array.from(session.values()));
    
    console.log(`User ${socket.id} joined document ${documentId}`);
  });
  
  // Handle document content changes
  socket.on('document-change', (documentId, content, operation) => {
    const doc = documents.get(documentId);
    if (doc) {
      doc.content = content;
      doc.lastEdited = new Date().toISOString();
      documents.set(documentId, doc);
      
      // Broadcast to all other users in the document
      socket.to(documentId).emit('document-updated', {
        content,
        operation,
        userId: socket.id,
        timestamp: doc.lastEdited
      });
    }
  });
  
  // Handle title changes
  socket.on('title-change', (documentId, title) => {
    const doc = documents.get(documentId);
    if (doc) {
      doc.title = title;
      doc.lastEdited = new Date().toISOString();
      documents.set(documentId, doc);
      
      // Broadcast to all other users in the document
      socket.to(documentId).emit('title-updated', {
        title,
        userId: socket.id,
        timestamp: doc.lastEdited
      });
    }
  });
  
  // Handle cursor position updates
  socket.on('cursor-update', (documentId, cursorData) => {
    const session = documentSessions.get(documentId);
    if (session && session.has(socket.id)) {
      const user = session.get(socket.id);
      user.cursor = cursorData;
      session.set(socket.id, user);
      
      // Broadcast cursor position to others
      socket.to(documentId).emit('cursor-updated', {
        userId: socket.id,
        cursor: cursorData,
        user: user
      });
    }
  });
  
  // Handle user typing indicators
  socket.on('user-typing', (documentId, isTyping) => {
    socket.to(documentId).emit('user-typing-update', {
      userId: socket.id,
      isTyping
    });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove user from all document sessions
    for (const [documentId, session] of documentSessions.entries()) {
      if (session.has(socket.id)) {
        session.delete(socket.id);
        
        // Update document collaborators
        const doc = documents.get(documentId);
        if (doc) {
          doc.collaborators = Array.from(session.values());
          documents.set(documentId, doc);
        }
        
        // Broadcast user left
        socket.to(documentId).emit('user-left', socket.id);
      }
    }
  });
});

// Helper function to generate random colors for users
function getRandomColor() {
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', 
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});