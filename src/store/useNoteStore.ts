import { create } from 'zustand';

export interface Note {
  _id: string;
  id?: string; // For backward compatibility if needed
  title: string;
  content: string;
  tags: string[];
  createdAt: string | number;
  updatedAt: string | number;
}

interface NoteState {
  notes: Note[];
  searchTerm: string;
  selectedTag: string | null;
  loading: boolean;
  error: string | null;
  fetchNotes: () => Promise<void>;
  addNote: (note: Omit<Note, '_id' | 'createdAt' | 'updatedAt'>) => Promise<Note | undefined>;
  updateNote: (id: string, updates: Partial<Omit<Note, '_id' | 'createdAt'>>) => Promise<boolean>;
  deleteNote: (id: string) => Promise<void>;
  setSearchTerm: (term: string) => void;
  setSelectedTag: (tag: string | null) => void;
}

export const useNoteStore = create<NoteState>((set) => ({
  notes: [],
  searchTerm: '',
  selectedTag: null,
  loading: false,
  error: null,

  fetchNotes: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/notes');
      if (!res.ok) throw new Error('Failed to fetch notes');
      const data = await res.json();
      set({ notes: data, loading: false });
    } catch (error: unknown) {
      set({ error: error instanceof Error ? error.message : 'An unknown error occurred', loading: false });
    }
  },

  addNote: async (note) => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note),
      });
      if (!res.ok) throw new Error('Failed to add note');
      const newNote = await res.json();
      set((state) => ({
        notes: [newNote, ...state.notes],
      }));
      return newNote;
    } catch (error: unknown) {
      set({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
      return undefined;
    }
  },

  updateNote: async (id, updates) => {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update note');
      const updatedNote = await res.json();
      set((state) => ({
        notes: state.notes.map((n) => (n._id === id ? updatedNote : n)),
      }));
      return true;
    } catch (error: unknown) {
      set({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
      return false;
    }
  },

  deleteNote: async (id) => {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete note');
      set((state) => ({
        notes: state.notes.filter((n) => n._id !== id),
      }));
    } catch (error: unknown) {
      set({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
    }
  },

  setSearchTerm: (term) => set({ searchTerm: term }),
  setSelectedTag: (tag) => set({ selectedTag: tag }),
}));
