
"use client";

import * as React from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useFirestore } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";
import type { Content } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Film, Tv } from "lucide-react";

type ClientContent = Omit<Content, 'createdAt' | 'updatedAt'> & {
  id: string;
};

interface SearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const firestore = useFirestore();
  const router = useRouter();
  const [content, setContent] = React.useState<ClientContent[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  React.useEffect(() => {
    if (!firestore || !open) return;

    const fetchAllContent = async () => {
      setLoading(true);
      const contentCollection = collection(firestore, "content");
      const contentSnapshot = await getDocs(contentCollection);
      const allContent = contentSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
      } as ClientContent));
      setContent(allContent);
      setLoading(false);
    };

    fetchAllContent();
  }, [firestore, open]);
  
  const runCommand = (command: () => unknown) => {
    onOpenChange(false);
    command();
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue) {
        runCommand(() => router.push(`/search?q=${encodeURIComponent(inputValue)}`));
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search movies, series, tags..."
        value={inputValue}
        onValueChange={setInputValue}
        onKeyDown={handleKeyDown}
      />
      <CommandList>
        {loading && <CommandEmpty>Loading content...</CommandEmpty>}
        {!loading && content.length === 0 && <CommandEmpty>No content found.</CommandEmpty>}

        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Suggestions">
          {content.map((item) => (
            <CommandItem
              key={item.id}
              value={`${item.title} ${item.description} ${item.categories?.join(" ")}`}
              onSelect={() => {
                runCommand(() => router.push(`/watch/${item.id}`));
              }}
            >
              {item.type === 'movie' ? <Film className="mr-2 h-4 w-4" /> : <Tv className="mr-2 h-4 w-4" />}
              <span>{item.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
