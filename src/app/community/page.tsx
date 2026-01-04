
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useFirestore } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import {
  addDoc,
  collection,
  query,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  type Timestamp,
} from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Loader2, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface ChatMessage {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userPhotoURL: string | null;
  createdAt: Timestamp;
}

const chatMessageSchema = z.object({
  text: z.string().min(1, 'Message cannot be empty.').max(500, 'Message is too long.'),
});

function MessageBubble({ message, isCurrentUser }: { message: ChatMessage, isCurrentUser: boolean }) {
    return (
        <div className={cn("flex items-start gap-3", isCurrentUser && "flex-row-reverse")}>
            <Avatar className="h-8 w-8">
                <AvatarImage src={message.userPhotoURL ?? undefined} alt={message.userName} />
                <AvatarFallback>{message.userName?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className={cn("max-w-xs md:max-w-md rounded-lg px-4 py-2", isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted")}>
                <p className="text-sm font-bold">{!isCurrentUser && message.userName}</p>
                <p className="text-base">{message.text}</p>
                 <p className="text-xs opacity-70 mt-1 text-right">
                    {formatDistanceToNow(message.createdAt.toDate(), { addSuffix: true })}
                </p>
            </div>
        </div>
    )
}

export default function CommunityChatPage() {
  const firestore = useFirestore();
  const { user, loaded } = useUser();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof chatMessageSchema>>({
    resolver: zodResolver(chatMessageSchema),
    defaultValues: {
      text: '',
    },
  });

  useEffect(() => {
    if (loaded && !user) {
      toast({
        title: 'Authentication Required',
        description: 'You need to be logged in to access the community chat.',
        variant: 'destructive',
      });
      router.push('/login');
    }
  }, [user, loaded, router]);
  
  useEffect(() => {
      if (!firestore) return;
      setLoading(true);
      
      const q = query(collection(firestore, "community-chat"), orderBy("createdAt", "desc"), limit(50));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const newMessages = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
          } as ChatMessage)).reverse(); // Reverse to show oldest first
          setMessages(newMessages);
          setLoading(false);
      }, (error) => {
          console.error("Error fetching chat messages: ", error);
          toast({
              title: "Error",
              description: "Could not load chat messages.",
              variant: "destructive"
          });
          setLoading(false);
      });

      return () => unsubscribe();

  }, [firestore]);
  
  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages])

  async function onSubmit(values: z.infer<typeof chatMessageSchema>) {
    if (!firestore || !user) return;

    const chatCollectionRef = collection(firestore, 'community-chat');
    const messageData = {
        text: values.text,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userPhotoURL: user.photoURL || null,
        createdAt: serverTimestamp(),
      };

    addDoc(chatCollectionRef, messageData)
        .then(() => {
            form.reset();
        })
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: chatCollectionRef.path,
                operation: 'create',
                requestResourceData: messageData,
            });
            errorEmitter.emit('permission-error', permissionError);
            
            // Show a generic error toast to the user
            toast({
                variant: 'destructive',
                title: 'Error sending message',
                description: 'You may not have permission to post.',
            });
        });
  }
  
  if (!loaded || !user) {
      return (
        <div className="flex flex-col flex-grow items-center justify-center text-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Loading user authentication...</p>
        </div>
      )
  }

  return (
    <div className="container py-8 flex flex-col h-[calc(100vh-80px)]">
       <div className="text-center mb-8">
            <h1 className="text-4xl font-headline font-bold">Community Chat</h1>
            <p className="text-muted-foreground">Chat with other members of the community.</p>
        </div>

      <div className="flex-grow flex flex-col bg-card border rounded-lg overflow-hidden">
        <div className="flex-grow p-4 space-y-6 overflow-y-auto">
          {loading ? (
             <div className="flex flex-col flex-grow items-center justify-center text-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
             <div className="flex flex-col flex-grow items-center justify-center text-center p-4">
                <p className="text-muted-foreground">No messages yet. Be the first to say something!</p>
            </div>
          ) : (
            messages.map(msg => <MessageBubble key={msg.id} message={msg} isCurrentUser={user.uid === msg.userId} />)
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-background border-t">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormControl>
                      <Input
                        placeholder="Type your message..."
                        autoComplete="off"
                        {...field}
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="icon" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Send className="h-4 w-4" />
                )}
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
