'use client';

import { useNoteStore } from '@/store/useNoteStore';
import { Search, Plus, Hash, XCircle, Moon, Sun, Monitor } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useIsHydrated } from '@/hooks/useIsHydrated';

export function Sidebar() {
  const { notes, searchTerm, setSearchTerm, selectedTag, setSelectedTag, addNote } = useNoteStore();
  const { theme, setTheme } = useTheme();
  const hydrated = useIsHydrated();

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags)));

  const handleNewNote = () => {
    addNote({
      title: '',
      content: '',
      tags: [],
    });
  };

  if (!hydrated) return null;

  return (
    <aside className="w-80 glass flex flex-col h-screen border-r border-border/50">
      <div className="p-8 pb-4 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-br from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            AERO.NOTES
          </h1>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-xl glass-hover text-muted-foreground hover:text-primary transition-all duration-300"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
          </div>
        </div>

        <Button 
          onClick={handleNewNote}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-2xl py-6 font-bold flex items-center gap-2 group transition-all duration-300 transform active:scale-95"
        >
          <div className="bg-white/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
            <Plus size={18} strokeWidth={3} />
          </div>
          NEW NOTE
        </Button>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notes..."
            className="pl-10 h-11 bg-black/5 dark:bg-white/5 border-none focus-visible:ring-1 focus-visible:ring-primary/30 rounded-2xl transition-all duration-300"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-8 py-4">
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">
                CATEGORIES
              </h2>
              {selectedTag && (
                <button 
                  onClick={() => setSelectedTag(null)}
                  className="text-[10px] flex items-center gap-1 text-primary hover:opacity-70 transition-opacity font-bold uppercase"
                >
                  <XCircle size={10} /> CLEAR
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setSelectedTag(null)}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  !selectedTag 
                    ? 'bg-primary/10 text-primary shadow-sm shadow-primary/10 border border-primary/20' 
                    : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1 rounded-md ${!selectedTag ? 'bg-primary/20' : 'bg-muted-foreground/10'}`}>
                    <Monitor size={14} />
                  </div>
                  All Notes
                </div>
                <span className="text-[10px] opacity-60 font-mono">{notes.length}</span>
              </button>
              
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    selectedTag === tag 
                      ? 'bg-primary/10 text-primary shadow-sm shadow-primary/10 border border-primary/20' 
                      : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1 rounded-md ${selectedTag === tag ? 'bg-primary/20' : 'bg-muted-foreground/10'}`}>
                      <Hash size={14} />
                    </div>
                    {tag}
                  </div>
                  <span className="text-[10px] opacity-60 font-mono">
                    {notes.filter((n) => n.tags.includes(tag)).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
