'use client';

import { useState, useEffect } from 'react';
import { useNoteStore } from '@/store/useNoteStore';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { X, Tag as TagIcon, Eye, Edit3, Save, Loader2, Check } from 'lucide-react';

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
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Synchronize local state with the selected note
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags);
      setLastSaved(new Date(note.updatedAt));
      setSaveError(null);
    }
  }, [noteId, note]);

  const handleSave = async () => {
    if (noteId) {
      setIsSaving(true);
      setSaveError(null);
      const success = await updateNote(noteId, { title, content, tags });
      setIsSaving(false);
      if (success) {
        setLastSaved(new Date());
      } else {
        setSaveError('Failed to save');
      }
    }
  };

  // Debounced auto-save
  useEffect(() => {
    if (!noteId || !isOpen || !note) return;

    // Don't auto-save if the values haven't changed from the current note in store
    if (title === note.title && 
        content === note.content && 
        JSON.stringify(tags) === JSON.stringify(note.tags)) {
      return;
    }

    const timer = setTimeout(() => {
      handleSave();
    }, 1500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, tags, noteId, isOpen]);

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        const newTags = [...tags, tagInput.trim()];
        setTags(newTags);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((t) => t !== tagToRemove);
    setTags(newTags);
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
                    setSaveError(null);
                  }}
                  placeholder="Note Title"
                  className="text-3xl font-black bg-transparent border-none p-0 focus-visible:ring-0 placeholder:text-muted-foreground/30 tracking-tight"
                />
                <div className="flex items-center gap-4">
                   <div className="flex flex-col items-end">
                     <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {isSaving ? (
                        <>
                          <Loader2 size={10} className="animate-spin text-primary" />
                          Saving...
                        </>
                      ) : saveError ? (
                        <>
                          <X size={10} className="text-destructive" />
                          <span className="text-destructive">{saveError}</span>
                        </>
                      ) : (
                        <>
                          <Check size={10} className="text-green-500" />
                          Saved
                        </>
                      )}
                     </div>
                     {lastSaved && !isSaving && (
                       <span className="text-[8px] text-muted-foreground/50 tabular-nums">
                         {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                       </span>
                     )}
                   </div>
                   
                   <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-8 px-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
                   >
                     <Save size={14} />
                     Save Now
                   </Button>

                   <button 
                    onClick={onClose}
                    className="p-2 hover:bg-white/5 rounded-xl transition-colors text-muted-foreground hover:text-foreground"
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
                  setSaveError(null);
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
