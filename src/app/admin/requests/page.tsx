
"use client";

import { useEffect, useState, useMemo } from "react";
import { useFirestore } from "@/firebase";
import { collection, doc, updateDoc, query, orderBy, onSnapshot } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Check, X, Search, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from 'date-fns';
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ContentRequest {
    id: string;
    requestText: string;
    userId: string;
    userName: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: any; // Firestore Timestamp
}

function StatusBadge({ status }: { status: ContentRequest['status'] }) {
    const variant = {
        pending: 'secondary',
        approved: 'default',
        rejected: 'destructive',
    }[status] as "secondary" | "default" | "destructive";

    return <Badge variant={variant}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}

function RequestRow({ request, onStatusChange }: { request: ContentRequest; onStatusChange: (requestId: string, newStatus: ContentRequest['status']) => Promise<void> }) {
    const [isUpdating, setIsUpdating] = useState(false);

    const handleStatusUpdate = async (newStatus: ContentRequest['status']) => {
        setIsUpdating(true);
        try {
            await onStatusChange(request.id, newStatus);
            toast({
                title: "Status Updated",
                description: `Request status changed to ${newStatus}.`,
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error Updating Status",
                description: error.message,
            });
        } finally {
            setIsUpdating(false);
        }
    };
    
    return (
        <TableRow>
            <TableCell>
                <div className="font-medium">{request.userName}</div>
                <div className="text-sm text-muted-foreground">{request.userId}</div>
            </TableCell>
            <TableCell>{request.requestText}</TableCell>
            <TableCell className="hidden md:table-cell">
                {request.createdAt ? formatDistanceToNow(request.createdAt.toDate(), { addSuffix: true }) : 'N/A'}
            </TableCell>
            <TableCell><StatusBadge status={request.status} /></TableCell>
            <TableCell className="text-right">
                 {request.status === 'pending' && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isUpdating}>
                                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreVertical className="h-4 w-4" />}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleStatusUpdate('approved')}>
                                <Check className="mr-2 h-4 w-4 text-green-500" /> Approve
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleStatusUpdate('rejected')} className="text-destructive">
                                <X className="mr-2 h-4 w-4" /> Reject
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                 )}
            </TableCell>
        </TableRow>
    );
}

export default function RequestsPage() {
    const firestore = useFirestore();
    const [requests, setRequests] = useState<ContentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("pending");

    useEffect(() => {
        if (!firestore) return;

        setLoading(true);
        const requestsCollectionRef = collection(firestore, "content-requests");
        const q = query(requestsCollectionRef, orderBy("createdAt", "desc"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requestList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as ContentRequest));
            setRequests(requestList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching content requests: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not load content requests.",
            });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [firestore]);

    const handleStatusChange = (requestId: string, newStatus: ContentRequest['status']) => {
        if (!firestore) throw new Error("Firestore not available");
        
        const requestDocRef = doc(firestore, "content-requests", requestId);
        
        return updateDoc(requestDocRef, { status: newStatus })
            .catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: requestDocRef.path,
                    operation: 'update',
                    requestResourceData: { status: newStatus },
                });
                errorEmitter.emit('permission-error', permissionError);
                throw serverError;
            });
    };
    
    const filteredRequests = useMemo(() => {
        let filtered = requests.filter(req => req.status === activeTab);
        
        if (searchTerm) {
            filtered = filtered.filter(req =>
                req.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                req.requestText.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return filtered;
    }, [requests, searchTerm, activeTab]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Content Requests</CardTitle>
                <CardDescription>View and manage content requests submitted by users.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                     <div className="flex justify-between items-center pb-4">
                        <TabsList>
                            <TabsTrigger value="pending">Pending</TabsTrigger>
                            <TabsTrigger value="approved">Approved</TabsTrigger>
                            <TabsTrigger value="rejected">Rejected</TabsTrigger>
                        </TabsList>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by user or request..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Request</TableHead>
                                    <TableHead className="hidden md:table-cell">Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredRequests.length > 0 ? (
                                    filteredRequests.map(req => (
                                        <RequestRow
                                            key={req.id}
                                            request={req}
                                            onStatusChange={handleStatusChange}
                                        />
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">
                                            No {activeTab} requests found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Tabs>
            </CardContent>
        </Card>
    );
}
