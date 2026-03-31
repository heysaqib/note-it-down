'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useNoteStore } from '@/store/useNoteStore';
import { Sidebar } from '@/components/Sidebar';
import { NoteCard } from '@/components/NoteCard';
import { NoteEditor } from '@/components/NoteEditor';
import { useIsHydrated } from '@/hooks/useIsHydrated';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Inbox, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { notes, searchTerm, selectedTag, addNote, fetchNotes, loading } = useNoteStore();
  const hydrated = useIsHydrated();
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotes();
    }
  }, [status, fetchNotes]);

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesSearch = 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTag = !selectedTag || note.tags.includes(selectedTag);
      
      return matchesSearch && matchesTag;
    });
  }, [notes, searchTerm, selectedTag]);

  if (!hydrated || status === 'loading') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/20 animate-pulse border border-primary/30" />
          <div className="h-4 w-32 bg-muted/20 rounded-full animate-pulse" />
        </motion.div>
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <main className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header decoration */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 relative z-10">
          <div className="max-w-7xl mx-auto flex flex-col gap-8">
            <header className="flex justify-between items-end">
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.3em] mb-2"
                >
                  <Sparkles size={14} />
                  Workspace
                </motion.div>
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-4xl font-black tracking-tight"
                >
                  {selectedTag ? `#${selectedTag}` : searchTerm ? `Results for "${searchTerm}"` : 'All Notes'}
                </motion.h2>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="text-right hidden sm:block"
              >
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Notes</div>
                <div className="text-3xl font-black text-primary/40 font-mono">
                  {filteredNotes.length.toString().padStart(2, '0')}
                </div>
              </motion.div>
            </header>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <Loader2 className="animate-spin text-primary/20" size={40} />
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredNotes.length > 0 ? (
                  <motion.div 
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  >
                    {filteredNotes.map((note) => (
                      <NoteCard 
                        key={note._id} 
                        note={note} 
                        onClick={() => setEditingNoteId(note._id)} 
                      />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center justify-center py-32 text-center"
                  >
                    <div className="w-24 h-24 rounded-3xl bg-primary/5 flex items-center justify-center mb-6 border border-primary/10 shadow-inner">
                      <Inbox className="text-primary/20" size={40} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No notes found</h3>
                    <p className="text-muted-foreground max-w-xs mx-auto mb-8 text-sm">
                      {searchTerm || selectedTag 
                        ? "We couldn't find any notes matching your current filters." 
                        : "Start your journey by creating your first note."}
                    </p>
                    {!searchTerm && !selectedTag && (
                      <Button 
                        onClick={() => addNote({ title: '', content: '', tags: [] })}
                        className="rounded-2xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 px-8 py-6 font-bold"
                      >
                        <Plus className="mr-2" size={18} />
                        CREATE FIRST NOTE
                      </Button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      <NoteEditor 
        noteId={editingNoteId} 
        isOpen={!!editingNoteId} 
        onClose={() => setEditingNoteId(null)} 
      />
    </main>
  );
}
