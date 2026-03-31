'use client';

import { useState } from 'react';
import { Note, useNoteStore } from '@/store/useNoteStore';
import { motion } from 'framer-motion';
import { Trash2, Tag, Calendar, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
}

export function NoteCard({ note, onClick }: NoteCardProps) {
  const deleteNote = useNoteStore((state) => state.deleteNote);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteNote(note._id);
    setIsConfirmOpen(false);
    setIsDeleting(false);
  };

  return (
    <>
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
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsConfirmOpen(true);
                }}
                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-destructive/10 hover:text-destructive rounded-full transition-all duration-200"
              >
                <Trash2 size={16} />
              </Button>
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

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent showCloseButton={false} className="max-w-[400px] p-0 overflow-hidden border border-white/10 bg-background/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl">
          <div className="p-8 flex flex-col items-center text-center space-y-6">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 300 }}
              className="size-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive"
            >
              <AlertTriangle size={32} />
            </motion.div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight">Delete Note?</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-[280px]">
                This action cannot be undone. Your note &quot;<span className="text-foreground font-medium">{note.title || 'Untitled'}</span>&quot; will be permanently removed.
              </p>
            </div>

            <div className="flex flex-col w-full gap-3">
              <Button 
                variant="destructive" 
                size="lg"
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full rounded-2xl font-bold h-12 shadow-[0_0_20px_rgba(var(--destructive),0.3)] hover:shadow-[0_0_30px_rgba(var(--destructive),0.5)] transition-all"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </Button>
              <Button 
                variant="ghost" 
                size="lg"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isDeleting}
                className="w-full rounded-2xl font-bold h-12 hover:bg-white/5"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
