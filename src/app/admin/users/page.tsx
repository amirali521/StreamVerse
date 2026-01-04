
"use client";

import { useEffect, useState, useMemo } from "react";
import { useFirestore } from "@/firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Shield, ShieldOff, UserX, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/firebase/auth/use-user";
import { useAdminStatus } from "@/firebase/auth/use-admin-status";
import { Input } from "@/components/ui/input";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface AppUser {
    id: string;
    displayName: string;
    email: string;
    photoURL?: string;
    admin?: boolean;
    isSuperAdmin?: boolean;
    blocked?: boolean;
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

export default function UsersPage() {
    const firestore = useFirestore();
    const { user: currentUser } = useUser();
    const { isSuperAdmin } = useAdminStatus();
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingUser, setEditingUser] = useState<AppUser | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const fetchUsers = async () => {
        if (!firestore) return;
        setLoading(true);
        const usersCollection = collection(firestore, "users");
        const usersSnapshot = await getDocs(usersCollection);
        const userList = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as AppUser));
        setUsers(userList.sort((a, b) => (a.isSuperAdmin ? -1 : 1)));
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, [firestore]);
    
    const handleUpdateUser = async (userId: string, data: Partial<AppUser>) => {
        if (!firestore) throw new Error("Firestore not available");
        setIsSubmitting(true);
        const userDocRef = doc(firestore, "users", userId);
        
        try {
            await updateDoc(userDocRef, data);
            setUsers(users.map(u => u.id === userId ? { ...u, ...data } : u));
            toast({ title: "User Updated", description: "The user's details have been successfully updated." });
            return true;
        } catch (serverError) {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: data,
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: "destructive", title: "Update Failed", description: "You don't have permission to perform this action." });
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteUser = async (userId: string) => {
        if (!firestore) throw new Error("Firestore not available");
        setIsSubmitting(true);
        const userDocRef = doc(firestore, "users", userId);
        
        try {
            await deleteDoc(userDocRef);
            setUsers(users.filter(u => u.id !== userId));
            toast({ title: "User Deleted", description: "The user has been permanently deleted." });
            setEditingUser(null); // Close dialog on successful delete
        } catch (serverError) {
             const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: "destructive", title: "Delete Failed", description: "You don't have permission to delete this user." });
        } finally {
            setIsSubmitting(false);
            setShowDeleteConfirm(false);
        }
    };

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users;
        return users.filter(user =>
            user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);
    
    const canManage = (user: AppUser) => isSuperAdmin && !user.isSuperAdmin;

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>View all registered users and manage their roles and status.</CardDescription>
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
                                    <TableHead>Status</TableHead>
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
                                        <TableRow key={user.id} onClick={() => isSuperAdmin && setEditingUser(user)} className={isSuperAdmin ? "cursor-pointer" : ""}>
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
                                             <TableCell>
                                                {user.blocked && <Badge variant="destructive">Blocked</Badge>}
                                            </TableCell>
                                        </TableRow>
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

            {editingUser && (
                <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Manage: {editingUser.displayName}</DialogTitle>
                            <DialogDescription>
                                Update roles, status, or delete this user. Changes are immediate.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-6">
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <Label htmlFor="admin-switch" className="font-semibold">Administrator</Label>
                                    <p className="text-xs text-muted-foreground">Admins can add, edit, and delete content.</p>
                                </div>
                                <Switch
                                    id="admin-switch"
                                    checked={editingUser.admin}
                                    onCheckedChange={(checked) => handleUpdateUser(editingUser.id, { admin: checked })}
                                    disabled={isSubmitting || !canManage(editingUser)}
                                />
                            </div>
                             <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <Label htmlFor="block-switch" className="font-semibold">Block User</Label>
                                    <p className="text-xs text-muted-foreground">Blocked users cannot log in to the application.</p>
                                </div>
                                <Switch
                                    id="block-switch"
                                    checked={editingUser.blocked}
                                    onCheckedChange={(checked) => handleUpdateUser(editingUser.id, { blocked: checked })}
                                    disabled={isSubmitting || !canManage(editingUser)}
                                />
                            </div>
                            
                            {!canManage(editingUser) && (
                                <p className="text-center text-sm text-yellow-500">Super Admins cannot be modified.</p>
                            )}
                        </div>
                        <DialogFooter className="flex-col sm:flex-row sm:justify-between w-full">
                             <Button
                                variant="destructive"
                                onClick={() => setShowDeleteConfirm(true)}
                                disabled={isSubmitting || !canManage(editingUser)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete User
                            </Button>
                            <Button variant="outline" onClick={() => setEditingUser(null)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {editingUser && (
                <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the account for <span className="font-bold">{editingUser.displayName}</span> and all associated data.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => handleDeleteUser(editingUser.id)}
                                disabled={isSubmitting}
                                className="bg-destructive hover:bg-destructive/90"
                            >
                                {isSubmitting ? "Deleting..." : "Yes, delete user"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </>
    );
}
