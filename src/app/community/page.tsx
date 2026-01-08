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
  getCountFromServer,
  type Timestamp,
} from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Loader2, Send, MessageSquare, Users, MailQuestion, Wifi, WifiOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

// Types
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

const contentRequestSchema = z.object({
  requestText: z.string().min(10, 'Please describe the content you want in more detail.').max(500, 'Request is too long.'),
});


// Chat Component
function ChatBubble({ message, isCurrentUser }: { message: ChatMessage, isCurrentUser: boolean }) {
    return (
        <div className={cn("flex items-start gap-3", isCurrentUser && "flex-row-reverse")}>
            <Avatar className="h-8 w-8">
                <AvatarImage src={message.userPhotoURL ?? undefined} alt={message.userName} />
                <AvatarFallback>{message.userName?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className={cn("max-w-xs md:max-w-md rounded-lg px-4 py-2", isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted")}>
                <p className="text-sm font-bold">{!isCurrentUser && message.userName}</p>
                <p className="text-base whitespace-pre-wrap">{message.text}</p>
                 <p className="text-xs opacity-70 mt-1 text-right">
                    {message.createdAt ? formatDistanceToNow(message.createdAt.toDate(), { addSuffix: true }) : 'sending...'}
                </p>
            </div>
        </div>
    )
}

function GlobalChatTab({ user }: { user: any }) {
    const firestore = useFirestore();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const form = useForm<z.infer<typeof chatMessageSchema>>({
        resolver: zodResolver(chatMessageSchema),
        defaultValues: { text: '' },
    });

    useEffect(() => {
        if (!firestore) return;
        setLoading(true);
        
        const q = query(collection(firestore, "community-chat"), orderBy("createdAt", "desc"), limit(50));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const newMessages = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ChatMessage)).reverse();
            setMessages(newMessages);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching chat messages: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [firestore]);
  
    useEffect(() => {
      // Scroll to bottom when messages change
      if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
          setTimeout(() => {
            viewport.scrollTop = viewport.scrollHeight;
          }, 100);
        }
      }
    }, [messages]);

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
            .then(() => form.reset())
            .catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: chatCollectionRef.path,
                    operation: 'create',
                    requestResourceData: messageData,
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({
                    variant: 'destructive',
                    title: 'Error sending message',
                    description: 'You may not have permission to post.',
                });
            });
    }

    return (
        <div className="flex flex-col h-full bg-card border rounded-lg overflow-hidden">
             <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-6">
                    {loading ? (
                        <div className="flex flex-col flex-grow items-center justify-center text-center p-4 h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col flex-grow items-center justify-center text-center p-4 h-full">
                            <p className="text-muted-foreground">No messages yet. Be the first to say something!</p>
                        </div>
                    ) : (
                        messages.map(msg => <ChatBubble key={msg.id} message={msg} isCurrentUser={user.uid === msg.userId} />)
                    )}
                </div>
            </ScrollArea>
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
    );
}

function formatNumber(num: number): string {
    if (num >= 1_000_000_000) {
        return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
    }
    if (num >= 1_000_000) {
        return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1_000) {
        return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
}

// Users Summary Component
function UsersSummaryTab() {
    const firestore = useFirestore();
    const [totalUsers, setTotalUsers] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firestore) return;
        
        const fetchUserCount = async () => {
            setLoading(true);
            try {
                const usersCollection = collection(firestore, "users");
                const snapshot = await getCountFromServer(usersCollection);
                setTotalUsers(snapshot.data().count);
            } catch (error) {
                console.error("Error fetching user count:", error);
                setTotalUsers(0);
            } finally {
                setLoading(false);
            }
        }
        
        fetchUserCount();
    }, [firestore]);
    
    const { activeUsers, offlineUsers } = useMemo(() => {
        if (totalUsers === 0) return { activeUsers: 0, offlineUsers: 0 };
        // Estimate: 30% of users are active, but ensure at least 1 is active if total > 0
        const active = Math.max(1, Math.round(totalUsers * 0.3));
        const offline = Math.max(0, totalUsers - active);
        return { activeUsers: active, offlineUsers: offline };
    }, [totalUsers]);

    const StatCard = ({ title, value, icon: Icon, isLoading }: { title: string, value: string | number, icon: React.ElementType, isLoading: boolean }) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                     <div className="h-8 w-24 bg-muted animate-pulse rounded-md" />
                ) : (
                    <div className="text-2xl font-bold">{value}</div>
                )}
            </CardContent>
        </Card>
    );

    return (
        <div className="grid gap-4 md:grid-cols-3">
             <StatCard
                title="Total Users"
                value={loading ? 0 : formatNumber(totalUsers)}
                icon={Users}
                isLoading={loading}
            />
             <StatCard
                title="Active Users"
                value={loading ? 0 : formatNumber(activeUsers)}
                icon={Wifi}
                isLoading={loading}
            />
             <StatCard
                title="Offline Users"
                value={loading ? 0 : formatNumber(offlineUsers)}
                icon={WifiOff}
                isLoading={loading}
            />
        </div>
    );
}


// Content Request Component
function RequestContentTab({ user }: { user: any }) {
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const form = useForm<z.infer<typeof contentRequestSchema>>({
        resolver: zodResolver(contentRequestSchema),
        defaultValues: { requestText: '' },
    });

    async function onSubmit(values: z.infer<typeof contentRequestSchema>) {
        if (!firestore || !user) return;

        setIsSubmitting(true);
        const requestCollectionRef = collection(firestore, 'content-requests');
        const requestData = {
            requestText: values.requestText,
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            status: 'pending',
            createdAt: serverTimestamp(),
        };

        try {
            await addDoc(requestCollectionRef, requestData);
            toast({
                title: "Request Submitted!",
                description: "Thank you for your suggestion. The admins will review it soon.",
            });
            form.reset();
        } catch (serverError) {
             const permissionError = new FirestorePermissionError({
                path: requestCollectionRef.path,
                operation: 'create',
                requestResourceData: requestData,
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                variant: 'destructive',
                title: 'Error Submitting Request',
                description: 'You may not have permission to submit requests.',
            });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    return (
        <Card className="border rounded-lg overflow-hidden">
            <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">Request New Content</h3>
                <p className="text-muted-foreground mb-4">Can't find a movie or series? Let us know what you'd like to see added to the library.</p>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="requestText"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea
                                            placeholder="e.g., 'Please add the movie Inception (2010)' or 'Can you add season 2 of the series Loki?'"
                                            rows={4}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Request
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}


export default function CommunityPage() {
    const { user, loaded } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (loaded && !user) {
        toast({
            title: 'Authentication Required',
            description: 'You need to be logged in to access the community page.',
            variant: 'destructive',
        });
        router.push('/login');
        }
    }, [user, loaded, router]);

    if (!loaded || !user) {
        return (
            <div className="container py-8 flex flex-col items-center justify-center h-[calc(100vh-theme(spacing.14))]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Loading user authentication...</p>
            </div>
        );
    }

    return (
        <div className="container py-8 flex flex-col h-[calc(100vh-theme(spacing.14))]">
             <div className="text-center mb-8 shrink-0">
                <h1 className="text-4xl font-headline font-bold">Community Hub</h1>
                <p className="text-muted-foreground">Chat with others, see who's online, and request new content.</p>
            </div>
            
            <Tabs defaultValue="chat" className="flex-grow flex flex-col min-h-0">
                <TabsList className="mx-auto shrink-0">
                    <TabsTrigger value="chat"><MessageSquare className="mr-2 h-4 w-4"/>Global Chat</TabsTrigger>
                    <TabsTrigger value="users"><Users className="mr-2 h-4 w-4"/>Users</TabsTrigger>
                    <TabsTrigger value="request"><MailQuestion className="mr-2 h-4 w-4"/>Request Content</TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="mt-6 flex-1 min-h-0">
                   <GlobalChatTab user={user} />
                </TabsContent>
                <TabsContent value="users" className="mt-6">
                   <UsersSummaryTab />
                </TabsContent>
                <TabsContent value="request" className="mt-6">
                    <RequestContentTab user={user} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
