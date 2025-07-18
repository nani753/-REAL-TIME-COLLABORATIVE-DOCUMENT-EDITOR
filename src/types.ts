export interface Document {
  _id: string;
  title: string;
  content: string;
  lastEdited: string;
  collaborators: User[];
}

export interface User {
  id: string;
  name: string;
  color: string;
  cursor?: CursorPosition;
  joinedAt?: string;
}

export interface CursorPosition {
  x: number;
  y: number;
  line: number;
  column: number;
}

export interface DocumentOperation {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
}