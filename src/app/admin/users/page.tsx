
"use client";

import { useEffect, useState, useMemo } from "react";
import { useFirestore } from "@/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Search } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/firebase/auth/use-user";
import { useAdminStatus } from "@/firebase/auth/use-admin-status";
import { Input } from "@/components/ui/input";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

interface AppUser {
    id: string;
    displayName: string;
    email: string;
    photoURL?: string;
    admin?: boolean;
    isSuperAdmin?: boolean;
}

function RoleBadge({ user }: { user: AppUser }) {
    if (user.isSuperAdmin) {
        return <Badge variant="destructive">Super Admin</Badge>;
    }
    if (user.admin) {
        return <Badge variant="secondary">Admin</Badge>;
    }
    return <Badge variant="outline">User</Badge>;
}

function UserRow({
    user,
    currentUser,
    isCurrentUserSuperAdmin,
    onRoleChange
}: {
    user: AppUser;
    currentUser: any;
    isCurrentUserSuperAdmin: boolean;
    onRoleChange: (userId: string, newRole: { admin: boolean, isSuperAdmin?: boolean }) => Promise<void>;
}) {
    const [isUpdating, setIsUpdating] = useState(false);
    const isSelf = user.id === currentUser.uid;

    const handleRoleUpdate = async (newRole: { admin: boolean, isSuperAdmin?: boolean }) => {
        setIsUpdating(true);
        try {
            await onRoleChange(user.id, newRole);
            toast({
                title: "Role Updated",
                description: `${user.displayName}'s role has been changed.`,
            });
        } catch (error: any) {
             // This catch block is for general errors, not permission errors which are now handled globally.
            toast({
                variant: "destructive",
                title: "Error Updating Role",
                description: error.message,
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const canManage = isCurrentUserSuperAdmin && !isSelf;

    return (
        <TableRow key={user.id}>
            <TableCell>
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={user.photoURL} alt={user.displayName} />
                        <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{user.displayName}</div>
                </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">{user.email}</TableCell>
            <TableCell>
                <RoleBadge user={user} />
            </TableCell>
            <TableCell className="text-right">
                {canManage && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isUpdating}>
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Manage Role</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {user.admin ? (
                                <DropdownMenuItem
                                    disabled={user.isSuperAdmin}
                                    onClick={() => handleRoleUpdate({ admin: false })}
                                    className="text-destructive"
                                >
                                    Demote to User
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem onClick={() => handleRoleUpdate({ admin: true })}>
                                    Promote to Admin
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </TableCell>
        </TableRow>
    );
}

export default function UsersPage() {
    const firestore = useFirestore();
    const { user: currentUser } = useUser();
    const { isSuperAdmin } = useAdminStatus();
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchUsers = async () => {
        if (!firestore) return;
        setLoading(true);
        const usersCollection = collection(firestore, "users");
        const usersSnapshot = await getDocs(usersCollection);
        const userList = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as AppUser));
        setUsers(userList.sort((a, b) => (a.isSuperAdmin ? -1 : 1))); // Show super admins first
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, [firestore]);

    const handleRoleChange = (userId: string, newRole: { admin: boolean, isSuperAdmin?: boolean }) => {
        if (!firestore) throw new Error("Firestore not available");
        
        const userDocRef = doc(firestore, "users", userId);
        
        // Return the promise chain
        return updateDoc(userDocRef, newRole)
            .then(() => {
                // Refresh local state on success
                setUsers(users.map(u => u.id === userId ? { ...u, ...newRole } : u));
            })
            .catch((serverError) => {
                // Create and emit the rich, contextual error
                const permissionError = new FirestorePermissionError({
                    path: userDocRef.path,
                    operation: 'update',
                    requestResourceData: newRole,
                });
                errorEmitter.emit('permission-error', permissionError);
                
                // We re-throw the original error to allow the calling component's catch block to run if needed
                throw serverError;
            });
    };
    
    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users;
        return users.filter(user =>
            user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View all registered users and manage their roles.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center pb-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or email..."
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
                                <TableHead className="hidden md:table-cell">Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        Loading users...
                                    </TableCell>
                                </TableRow>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map(user => (
                                    <UserRow
                                        key={user.id}
                                        user={user}
                                        currentUser={currentUser}
                                        isCurrentUserSuperAdmin={isSuperAdmin}
                                        onRoleChange={handleRoleChange}
                                    />
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
