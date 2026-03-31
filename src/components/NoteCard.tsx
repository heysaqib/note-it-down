'use client';

import { Note, useNoteStore } from '@/store/useNoteStore';
import { motion } from 'framer-motion';
import { Trash2, Tag, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
}

export function NoteCard({ note, onClick }: NoteCardProps) {
  const deleteNote = useNoteStore((state) => state.deleteNote);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <Card 
        onClick={onClick}
        className="glass glass-hover h-full flex flex-col cursor-pointer overflow-hidden border-none group"
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-xl font-bold line-clamp-2 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text">
              {note.title || 'Untitled Note'}
            </CardTitle>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this note?')) {
                  deleteNote(note._id);
                }
              }}
              className="opacity-0 group-hover:opacity-100 p-2 hover:bg-destructive/10 hover:text-destructive rounded-full transition-all duration-200"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-muted-foreground line-clamp-4 text-sm leading-relaxed">
            {note.content || 'No content...'}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-3 pt-2">
          <div className="flex flex-wrap gap-1.5">
            {note.tags.map((tag) => (
              <Badge 
                key={tag} 
                variant="secondary" 
                className="bg-primary/5 hover:bg-primary/10 border-none text-[10px] uppercase tracking-wider font-semibold py-0"
              >
                <Tag size={10} className="mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex items-center text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
            <Calendar size={10} className="mr-1" />
            {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
