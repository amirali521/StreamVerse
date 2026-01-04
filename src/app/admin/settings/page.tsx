
"use client";

import { useEffect, useState } from "react";
import { useFirestore } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const firestore = useFirestore();
  const [globalDownloadEnabled, setGlobalDownloadEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;
    const fetchSettings = async () => {
      setIsLoading(true);
      const settingsRef = doc(firestore, 'settings', 'downloadControls');
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        setGlobalDownloadEnabled(settingsSnap.data().globalDownloadEnabled);
      } else {
        // Default to false if no setting is found
        setGlobalDownloadEnabled(false);
      }
      setIsLoading(false);
    };
    fetchSettings();
  }, [firestore]);

  const handleToggleChange = async (checked: boolean) => {
    if (!firestore) return;
    setGlobalDownloadEnabled(checked);
    try {
      const settingsRef = doc(firestore, 'settings', 'downloadControls');
      await setDoc(settingsRef, { globalDownloadEnabled: checked });
      toast({
        title: "Settings Updated",
        description: `Global downloads have been ${checked ? 'enabled' : 'disabled'}.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Updating Settings",
        description: error.message || "Could not save your changes.",
      });
      // Revert UI on failure
      setGlobalDownloadEnabled(!checked);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Settings</CardTitle>
        <CardDescription>Manage site-wide settings for your application.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin"/>
                <span>Loading settings...</span>
            </div>
        ) : (
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                    <Label htmlFor="global-download-switch" className="text-base font-semibold">Master Download Switch</Label>
                    <p className="text-sm text-muted-foreground">
                        Turn this on to enable download buttons across the entire site. Individual content must also have downloads enabled.
                    </p>
                </div>
                <Switch
                    id="global-download-switch"
                    checked={globalDownloadEnabled}
                    onCheckedChange={handleToggleChange}
                    aria-label="Toggle global downloads"
                />
            </div>
        )}
      </CardContent>
    </Card>
  );
}
