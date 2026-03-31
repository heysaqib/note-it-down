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

  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(note ? new Date(note.updatedAt) : null);
  
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
      <DialogContent 
        showCloseButton={false} 
        className="max-w-7xl w-[95vw] h-[85vh] p-0 overflow-hidden border border-white/10 bg-background/95 backdrop-blur-2xl flex flex-col rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] m-0 select-none"
      >
        
        {/* Top Navigation - Full Width - Hidden when sidebar is open */}
        <AnimatePresence>
          {!isSidebarOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 80, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="h-20 flex items-center justify-between px-10 border-b border-white/5 z-50 shrink-0 overflow-hidden"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
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

              <div className="flex items-center gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setIsSidebarOpen(true)} 
                        className="rounded-full hover:bg-white/5 transition-all duration-300"
                      >
                        <Info size={20} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Note Intelligence</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="h-5 w-px bg-white/10 mx-1" />

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors">
                        <X size={20} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Close Editor</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Body - Split into Canvas and Sidebar */}
        <div className="flex-1 flex flex-row overflow-hidden relative">
          
          {/* Canvas Area */}
          <div className="flex-1 flex flex-col min-w-0 relative h-full">
            <ScrollArea className="flex-1 w-full h-full">
              <div className="max-w-4xl mx-auto px-10 pt-4 pb-40 transition-all duration-700">
                <LayoutGroup>
                  <motion.div layout className="space-y-8 w-full">
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Untitled Note"
                      className="w-full text-5xl font-bold bg-transparent border-none p-0 focus:outline-none placeholder:text-muted-foreground/10 tracking-tight text-foreground selection:bg-primary/30"
                    />
                    
                    <div className="flex items-center gap-5 text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-primary/40" />
                        {formattedCreatedAt}
                      </div>
                      <div className="size-1 rounded-full bg-white/10" />
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-primary/40" />
                        {stats.readingTime} min read
                      </div>
                    </div>

                    <div className="pt-6 w-full h-full">
                      <AnimatePresence mode="wait">
                        {viewMode === 'edit' ? (
                          <motion.div
                            key="edit"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="w-full"
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
                            className="prose prose-invert prose-p:text-muted-foreground/90 prose-headings:text-foreground prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary max-w-none prose-lg w-full break-words"
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
          </div>

          {/* Floating Dock Toolbar - Hidden when sidebar is open */}
          <AnimatePresence>
            {!isSidebarOpen && (
              <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
              >
                <div className="flex items-center gap-1.5 p-2 rounded-2xl glass border-white/10 shadow-2xl pointer-events-auto">
                  <TooltipProvider delayDuration={0}>
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
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info Sidebar - Animated Width for Pushing Canvas */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '100%', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="bg-white/[0.01] backdrop-blur-3xl flex flex-col h-full overflow-hidden shrink-0 z-[60]"
              >
                <div className="w-full flex flex-col h-full">
                  <div className="h-20 flex items-center justify-between px-10 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Zap size={18} />
                      </div>
                      <span className="text-xs font-black uppercase tracking-[0.2em]">Note Intelligence</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="rounded-full h-10 w-10 hover:bg-white/5">
                        <ChevronRight size={20} />
                      </Button>
                      <div className="h-5 w-px bg-white/10 mx-1" />
                      <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-10 w-10 hover:bg-destructive/10 hover:text-destructive">
                        <X size={20} />
                      </Button>
                    </div>
                  </div>

                  <ScrollArea className="flex-1 h-full">
                    <div className="max-w-6xl mx-auto px-6 py-16 space-y-24 pb-32">
                      {/* Performance Section */}
                      <section className="space-y-12 w-full">
                        <div className="flex items-center gap-2 text-primary/60">
                          <Zap size={16} />
                          <h3 className="text-[10px] font-black uppercase tracking-widest">Performance Insights</h3>
                        </div>
                        <div className="flex justify-center w-full">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-5xl">
                            <div className="flex flex-col items-center justify-center text-center relative group p-6">
                              <div className="absolute inset-0 bg-primary/[0.03] rounded-3xl blur-[30px] opacity-100 transition-opacity duration-500 border border-white/5 backdrop-blur-[1px]" />
                              <span className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-[0.2em] mb-3 z-10">Total Words</span>
                              <p className="text-6xl font-black tracking-tighter group-hover:text-primary transition-all duration-500 leading-none z-10 relative">
                                {stats.words}
                              </p>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center relative group p-6">
                              <div className="absolute inset-0 bg-primary/[0.03] rounded-3xl blur-[30px] opacity-100 transition-opacity duration-500 border border-white/5 backdrop-blur-[1px]" />
                              <span className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-[0.2em] mb-3 z-10">Characters</span>
                              <p className="text-6xl font-black tracking-tighter group-hover:text-primary transition-all duration-500 leading-none z-10 relative">
                                {stats.chars}
                              </p>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center relative group p-6">
                              <div className="absolute inset-0 bg-primary/[0.03] rounded-3xl blur-[30px] opacity-100 transition-opacity duration-500 border border-white/5 backdrop-blur-[1px]" />
                              <span className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-[0.2em] mb-3 z-10">Reading Est.</span>
                              <p className="text-6xl font-black tracking-tighter group-hover:text-primary transition-all duration-500 leading-none flex items-baseline z-10 relative">
                                {stats.readingTime}<span className="text-xl ml-1 text-muted-foreground/20 font-black">m</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* Organization Section */}
                      <section className="space-y-12 w-full">
                        <div className="flex items-center gap-2 text-primary/60">
                          <Hash size={16} />
                          <h3 className="text-[10px] font-black uppercase tracking-widest">Organizational Layer</h3>
                        </div>
                        <div className="flex flex-col items-center space-y-10 w-full">
                          <div className="flex flex-wrap justify-center gap-4 max-w-3xl">
                            {tags.length > 0 ? tags.map((tag) => (
                              <Badge 
                                key={tag}
                                className="bg-white/[0.03] text-muted-foreground hover:bg-primary/10 hover:text-primary border border-white/5 hover:border-primary/20 rounded-2xl px-8 py-3 text-sm font-bold transition-all flex items-center gap-3 group"
                              >
                                {tag}
                                <X 
                                  size={14} 
                                  className="cursor-pointer opacity-20 group-hover:opacity-100 hover:text-destructive transition-all" 
                                  onClick={() => removeTag(tag)}
                                />
                              </Badge>
                            )) : (
                              <span className="text-sm text-muted-foreground/20 italic font-medium">No collections added yet</span>
                            )}
                          </div>
                          <div className="relative w-full max-w-md group">
                            <TagIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/20 group-focus-within:text-primary/40 transition-colors" size={20} />
                            <input
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={addTag}
                              placeholder="Add to collection..."
                              className="w-full bg-white/[0.02] border border-white/5 rounded-[2rem] pl-16 pr-8 py-6 text-base focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/10 text-center font-medium"
                            />
                          </div>
                        </div>
                      </section>

                      {/* Chronology Section */}
                      <section className="space-y-12 w-full">
                        <div className="flex items-center gap-2 text-primary/60">
                          <History size={16} />
                          <h3 className="text-[10px] font-black uppercase tracking-widest">Historical Chronology</h3>
                        </div>
                        <div className="flex justify-center w-full">
                          <div className="space-y-16 relative before:absolute before:left-1 before:top-2 before:bottom-2 before:w-px before:bg-white/5 max-w-md w-full ml-4">
                            <div className="flex items-start gap-10 relative group">
                              <div className="size-3 rounded-full bg-primary mt-1.5 shrink-0 shadow-[0_0_20px_rgba(var(--primary-rgb),0.8)] z-10 group-hover:scale-150 transition-transform duration-500" />
                              <div className="space-y-2">
                                <p className="text-lg font-bold text-foreground/90 group-hover:text-primary transition-colors">Last Modification Cycle</p>
                                <p className="text-[11px] text-muted-foreground/40 font-black tracking-[0.2em] uppercase">{formattedLastModified}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-10 relative group opacity-40 hover:opacity-100 transition-all duration-500">
                              <div className="size-3 rounded-full bg-white/20 mt-1.5 shrink-0 z-10 group-hover:bg-white/40 group-hover:scale-150 transition-all duration-500" />
                              <div className="space-y-2">
                                <p className="text-lg font-bold text-foreground/70 group-hover:text-foreground transition-colors">Initial Entry Created</p>
                                <p className="text-[11px] text-muted-foreground/30 font-black tracking-[0.2em] uppercase">{formattedFullCreatedAt}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>
                  </ScrollArea>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </DialogContent>
    </Dialog>
  );
}
