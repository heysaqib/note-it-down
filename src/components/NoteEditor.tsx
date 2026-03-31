'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNoteStore } from '@/store/useNoteStore';
import { 
  Dialog, 
  DialogContent, 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { 
  X, 
  Tag as TagIcon, 
  Eye, 
  Edit3, 
  Check, 
  Undo2, 
  ChevronRight,
  Copy, 
  Clock, 
  Bold,
  Italic,
  List,
  Loader2,
  Info,
  Calendar,
  Zap,
  History,
  Hash
} from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NoteEditorProps {
  noteId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = 'edit' | 'preview';

export function NoteEditor({ noteId, isOpen, onClose }: NoteEditorProps) {
  const { notes, updateNote } = useNoteStore();
  const note = notes.find((n) => n._id === noteId);

  // Initializing state from note directly
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(note ? new Date(note.updatedAt) : null);
  
  // Default to preview mode
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [history, setHistory] = useState<string[]>(note ? [note.content] : []);
  const [canUndo, setCanUndo] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSave = useCallback(async () => {
    if (noteId) {
      setIsSaving(true);
      const success = await updateNote(noteId, { title, content, tags });
      setIsSaving(false);
      if (success) {
        setLastSaved(new Date());
      }
    }
  }, [noteId, title, content, tags, updateNote, setIsSaving, setLastSaved]);

  useEffect(() => {
    if (!noteId || !isOpen || !note) return;

    if (title === note.title && 
        content === note.content && 
        JSON.stringify(tags) === JSON.stringify(note.tags)) {
      return;
    }

    const timer = setTimeout(() => {
      handleSave();
    }, 1500);

    return () => clearTimeout(timer);
  }, [title, content, tags, noteId, isOpen, note, handleSave]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    
    const lastEntry = history[history.length - 1];
    if (newContent !== lastEntry) {
      setHistory(prev => {
        const newHistory = [...prev, newContent].slice(-50);
        setCanUndo(true);
        return newHistory;
      });
    }
  };

  const handleUndo = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      const previousContent = newHistory[newHistory.length - 1];
      setContent(previousContent);
      setHistory(newHistory);
      setCanUndo(newHistory.length > 1);
    }
  };

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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = useMemo(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const chars = content.length;
    const readingTime = Math.ceil(words / 200);
    return { words, chars, readingTime };
  }, [content]);

  const formattedCreatedAt = useMemo(() => {
    const dateSource = note?.createdAt || 0;
    return dateSource ? new Date(dateSource).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    }) : 'Just now';
  }, [note?.createdAt]);

  const formattedLastModified = useMemo(() => {
    return lastSaved?.toLocaleString() || 'Just now';
  }, [lastSaved]);

  const formattedFullCreatedAt = useMemo(() => {
    const dateSource = note?.createdAt || 0;
    return dateSource ? new Date(dateSource).toLocaleString() : 'Just now';
  }, [note?.createdAt]);

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    const newContent = `${before}${prefix}${selection}${suffix}${after}`;
    handleContentChange(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        end + prefix.length
      );
    }, 0);
  };

  if (!note && isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-[100vw] w-full h-[100vh] p-0 overflow-hidden border-none bg-background/80 backdrop-blur-3xl gap-0 flex flex-row rounded-none shadow-none m-0 select-none">
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 relative h-full">
          
          {/* Top Navigation */}
          <div className="h-16 flex items-center justify-between px-8 border-b border-white/5 z-50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                {isSaving ? (
                  <>
                    <Loader2 size={12} className="animate-spin text-primary" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Syncing</span>
                  </>
                ) : (
                  <>
                    <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {lastSaved ? `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Draft'}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                      className={cn("rounded-full transition-colors", isSidebarOpen && "bg-primary/10 text-primary")}
                    >
                      <Info size={20} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Note Details</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="h-4 w-px bg-white/10 mx-2" />

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
                      <X size={20} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Close Editor</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Editor Canvas */}
          <ScrollArea className="flex-1 w-full">
            <div className="max-w-3xl mx-auto px-8 pt-40 pb-56 transition-all duration-700">
              <LayoutGroup>
                <motion.div layout className="space-y-6">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Untitled Note"
                    className="w-full text-4xl font-bold bg-transparent border-none p-0 focus:outline-none placeholder:text-muted-foreground/10 tracking-tight text-foreground selection:bg-primary/30"
                  />
                  
                  <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      {formattedCreatedAt}
                    </div>
                    <div className="size-1 rounded-full bg-white/10" />
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />
                      {stats.readingTime} min read
                    </div>
                  </div>

                  <div className="min-h-[60vh] pt-4">
                    <AnimatePresence mode="wait">
                      {viewMode === 'edit' ? (
                        <motion.div
                          key="edit"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                        >
                          <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={(e) => handleContentChange(e.target.value)}
                            placeholder="Start writing something amazing..."
                            className="w-full min-h-[500px] resize-none bg-transparent border-none p-0 focus:outline-none text-xl leading-relaxed font-medium placeholder:text-muted-foreground/10 selection:bg-primary/20"
                            autoFocus
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="preview"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="prose prose-invert prose-p:text-muted-foreground/90 prose-headings:text-foreground prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary max-w-none prose-lg"
                        >
                          <ReactMarkdown>{content || '*No content to preview yet.*'}</ReactMarkdown>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </LayoutGroup>
            </div>
          </ScrollArea>

          {/* Floating Dock Toolbar */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-1.5 p-2 rounded-2xl glass border-white/10 shadow-2xl">
              <TooltipProvider delayDuration={0}>
                {/* Mode Toggles */}
                <div className="flex items-center gap-1 px-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant={viewMode === 'edit' ? 'default' : 'ghost'} 
                        size="icon" 
                        onClick={() => setViewMode('edit')} 
                        className="h-10 w-10 rounded-xl"
                      >
                        <Edit3 size={18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit Mode</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant={viewMode === 'preview' ? 'default' : 'ghost'} 
                        size="icon" 
                        onClick={() => setViewMode('preview')} 
                        className="h-10 w-10 rounded-xl"
                      >
                        <Eye size={18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Preview Mode</TooltipContent>
                  </Tooltip>
                </div>

                <div className="w-px h-6 bg-white/10 mx-1" />

                {/* Format Tools */}
                {viewMode === 'edit' && (
                  <div className="flex items-center gap-1 px-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => insertMarkdown('**', '**')} className="h-10 w-10 rounded-xl hover:bg-white/10"><Bold size={18} /></Button>
                      </TooltipTrigger>
                      <TooltipContent>Bold</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => insertMarkdown('*', '*')} className="h-10 w-10 rounded-xl hover:bg-white/10"><Italic size={18} /></Button>
                      </TooltipTrigger>
                      <TooltipContent>Italic</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => insertMarkdown('- ')} className="h-10 w-10 rounded-xl hover:bg-white/10"><List size={18} /></Button>
                      </TooltipTrigger>
                      <TooltipContent>Bullet List</TooltipContent>
                    </Tooltip>
                  </div>
                )}

                {viewMode === 'edit' && <div className="w-px h-6 bg-white/10 mx-1" />}

                {/* Action Tools */}
                <div className="flex items-center gap-1 px-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleUndo} 
                        disabled={!canUndo}
                        className="h-10 w-10 rounded-xl disabled:opacity-20"
                      >
                        <Undo2 size={18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Undo</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={copyToClipboard} 
                        className={cn("h-10 w-10 rounded-xl transition-all", copied && "text-green-500")}
                      >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{copied ? 'Copied!' : 'Copy Content'}</TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>
          </div>

        </div>

        {/* Info Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-[350px] border-l border-white/5 bg-white/[0.02] backdrop-blur-xl flex flex-col"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">Note Intelligence</span>
                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="rounded-full h-8 w-8">
                  <ChevronRight size={16} />
                </Button>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-8 space-y-12">
                  {/* Stats Section */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-2 text-primary">
                      <Zap size={16} />
                      <h3 className="text-[10px] font-black uppercase tracking-widest">Performance</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">Words</span>
                        <p className="text-2xl font-black">{stats.words}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">Characters</span>
                        <p className="text-2xl font-black">{stats.chars}</p>
                      </div>
                    </div>
                  </section>

                  {/* Tags Section */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-2 text-primary">
                      <Hash size={16} />
                      <h3 className="text-[10px] font-black uppercase tracking-widest">Organization</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <Badge 
                            key={tag}
                            className="bg-white/5 text-muted-foreground hover:bg-primary/10 hover:text-primary border border-white/5 hover:border-primary/20 rounded-xl px-3 py-1 text-xs font-bold transition-all flex items-center gap-2 group"
                          >
                            {tag}
                            <X 
                              size={12} 
                              className="cursor-pointer opacity-30 group-hover:opacity-100 hover:text-destructive transition-all" 
                              onClick={() => removeTag(tag)}
                            />
                          </Badge>
                        ))}
                      </div>
                      <div className="relative">
                        <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30" size={14} />
                        <input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={addTag}
                          placeholder="Add a collection..."
                          className="w-full bg-white/5 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/20"
                        />
                      </div>
                    </div>
                  </section>

                  {/* History Section */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-2 text-primary">
                      <History size={16} />
                      <h3 className="text-[10px] font-black uppercase tracking-widest">Chronology</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div>
                          <p className="text-sm font-bold">Last Modified</p>
                          <p className="text-xs text-muted-foreground/60">{formattedLastModified}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 opacity-40">
                        <div className="size-2 rounded-full bg-white/20 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-sm font-bold">Note Created</p>
                          <p className="text-xs text-muted-foreground/60">{formattedFullCreatedAt}</p>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

      </DialogContent>
    </Dialog>
  );
}
