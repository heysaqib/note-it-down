'use client';

import { useState, useEffect } from 'react';
import { Note, useNoteStore } from '@/store/useNoteStore';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReactMarkdown from 'react-markdown';
import { X, Tag as TagIcon, Eye, Edit3, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NoteEditorProps {
  noteId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function NoteEditor({ noteId, isOpen, onClose }: NoteEditorProps) {
  const { notes, updateNote } = useNoteStore();
  const note = notes.find((n) => n._id === noteId);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('edit');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags);
    }
  }, [note]);

  const handleSave = () => {
    if (noteId) {
      updateNote(noteId, { title, content, tags });
    }
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        const newTags = [...tags, tagInput.trim()];
        setTags(newTags);
        if (noteId) updateNote(noteId, { tags: newTags });
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((t) => t !== tagToRemove);
    setTags(newTags);
    if (noteId) updateNote(noteId, { tags: newTags });
  };

  if (!note && isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 overflow-hidden glass border-none gap-0 flex flex-col rounded-3xl">
        <div className="flex-1 flex flex-col min-h-0">
          <DialogHeader className="p-8 pb-4 border-b border-white/5">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (noteId) updateNote(noteId, { title: e.target.value });
                  }}
                  placeholder="Note Title"
                  className="text-3xl font-black bg-transparent border-none p-0 focus-visible:ring-0 placeholder:text-muted-foreground/30 tracking-tight"
                />
                <div className="flex items-center gap-2">
                   <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mr-4">
                    Auto-saved
                   </div>
                   <button 
                    onClick={onClose}
                    className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                   >
                     <X size={20} />
                   </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex items-center gap-2 text-primary">
                  <TagIcon size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Tags</span>
                </div>
                {tags.map((tag) => (
                  <Badge 
                    key={tag} 
                    className="bg-primary/10 text-primary hover:bg-primary/20 border-none rounded-lg px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 group transition-all"
                  >
                    {tag}
                    <X 
                      size={10} 
                      className="cursor-pointer opacity-40 group-hover:opacity-100" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                  placeholder="Add tag..."
                  className="w-24 h-7 text-[10px] bg-white/5 border-none focus-visible:ring-1 focus-visible:ring-primary/30 rounded-lg p-2"
                />
              </div>
            </div>
          </DialogHeader>

          <Tabs 
            defaultValue="edit" 
            className="flex-1 flex flex-col min-h-0"
            onValueChange={setActiveTab}
          >
            <div className="px-8 border-b border-white/5 flex justify-between items-center bg-white/2">
              <TabsList className="bg-transparent gap-6 h-12 p-0">
                <TabsTrigger 
                  value="edit" 
                  className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full px-0 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]"
                >
                  <Edit3 size={12} /> Edit
                </TabsTrigger>
                <TabsTrigger 
                  value="preview" 
                  className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full px-0 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]"
                >
                  <Eye size={12} /> Preview
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="edit" className="flex-1 m-0 p-0 relative min-h-0">
              <Textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (noteId) updateNote(noteId, { content: e.target.value });
                }}
                placeholder="Start typing your masterpiece..."
                className="w-full h-full resize-none bg-transparent border-none p-8 focus-visible:ring-0 text-lg leading-relaxed font-medium placeholder:text-muted-foreground/20"
              />
            </TabsContent>

            <TabsContent value="preview" className="flex-1 m-0 p-0 overflow-y-auto min-h-0">
              <div className="p-8 prose prose-invert max-w-none">
                <ReactMarkdown>{content || '*No content to preview*'}</ReactMarkdown>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
