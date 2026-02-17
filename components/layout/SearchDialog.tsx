"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Loader2 } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/lib/stores/ui-store";

interface SearchResult {
  id: string;
  title: string;
  status: string;
  contextName?: string;
  contextIcon?: string;
}

export function SearchDialog() {
  const router = useRouter();
  const { searchOpen, setSearchOpen, setTaskDetailId } = useUIStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset state when dialog closes
  useEffect(() => {
    if (!searchOpen) {
      setQuery("");
      setResults([]);
      setIsLoading(false);
    }
  }, [searchOpen]);

  // Global Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen, setSearchOpen]);

  // Debounced search
  const doSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery.trim())}`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.results ?? data ?? []);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        doSearch(value);
      }, 300);
    },
    [doSearch]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleSelect = (result: SearchResult) => {
    setSearchOpen(false);
    setTaskDetailId(result.id);
    router.push("/today");
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case "done":
        return "default";
      case "in_progress":
        return "secondary";
      case "cancelled":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
      <CommandInput
        placeholder="Search tasks..."
        value={query}
        onValueChange={handleQueryChange}
      />
      <CommandList>
        {!query.trim() && (
          <CommandEmpty>Type to search tasks...</CommandEmpty>
        )}
        {query.trim() && !isLoading && results.length === 0 && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Searching...
            </span>
          </div>
        )}
        {results.length > 0 && (
          <CommandGroup heading="Tasks">
            {results.map((result) => (
              <CommandItem
                key={result.id}
                value={result.title}
                onSelect={() => handleSelect(result)}
                className="flex items-center gap-3 py-2.5"
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex flex-1 items-center gap-2 overflow-hidden">
                  <span className="flex-1 truncate">{result.title}</span>
                  {result.contextName && (
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {result.contextIcon && (
                        <span className="mr-1">{result.contextIcon}</span>
                      )}
                      {result.contextName}
                    </Badge>
                  )}
                  <Badge
                    variant={statusVariant(result.status)}
                    className="shrink-0 text-[10px]"
                  >
                    {result.status}
                  </Badge>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
