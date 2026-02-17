"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SyncIndicator } from "@/components/layout/SyncIndicator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Download,
  Trash2,
  ExternalLink,
} from "lucide-react";

interface Settings {
  theme: "light" | "dark" | "system";
  confettiEnabled: boolean;
  encouragingMessagesEnabled: boolean;
  hapticFeedbackEnabled: boolean;
  taskAgeColorEnabled: boolean;
  progressBarEnabled: boolean;
}

interface Profile {
  name: string;
  email: string;
}

const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  confettiEnabled: true,
  encouragingMessagesEnabled: true,
  hapticFeedbackEnabled: true,
  taskAgeColorEnabled: true,
  progressBarEnabled: true,
};

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [profile, setProfile] = useState<Profile>({ name: "", email: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings ?? DEFAULT_SETTINGS);
        setProfile(data.profile ?? { name: "", email: "" });
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function saveSettings(updates: Partial<Settings>) {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    setIsSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const res = await fetch("/api/export");
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bujo-export-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to export data:", error);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/settings", {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/");
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Nastavení</h1>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profil</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Jméno</span>
            <span className="text-sm font-medium">{profile.name || "---"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{profile.email || "---"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vzhled</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-sm">Motiv</span>
            <Select
              value={settings.theme}
              onValueChange={(value) =>
                saveSettings({ theme: value as Settings["theme"] })
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Světlý</SelectItem>
                <SelectItem value="dark">Tmavý</SelectItem>
                <SelectItem value="system">Systémový</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Motivation & Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Motivace a zpětná vazba</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm">Konfety</span>
              <p className="text-xs text-muted-foreground">
                Animace při dokončení úkolu
              </p>
            </div>
            <Switch
              checked={settings.confettiEnabled}
              onCheckedChange={(checked) =>
                saveSettings({ confettiEnabled: checked })
              }
            />
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm">Povzbuzující zprávy</span>
              <p className="text-xs text-muted-foreground">
                Motivační texty při postupu
              </p>
            </div>
            <Switch
              checked={settings.encouragingMessagesEnabled}
              onCheckedChange={(checked) =>
                saveSettings({ encouragingMessagesEnabled: checked })
              }
            />
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm">Haptická odezva</span>
              <p className="text-xs text-muted-foreground">
                Vibrace při interakcích
              </p>
            </div>
            <Switch
              checked={settings.hapticFeedbackEnabled}
              onCheckedChange={(checked) =>
                saveSettings({ hapticFeedbackEnabled: checked })
              }
            />
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm">Barva stáří úkolu</span>
              <p className="text-xs text-muted-foreground">
                Starší úkoly se zvýrazní
              </p>
            </div>
            <Switch
              checked={settings.taskAgeColorEnabled}
              onCheckedChange={(checked) =>
                saveSettings({ taskAgeColorEnabled: checked })
              }
            />
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm">Ukazatel postupu</span>
              <p className="text-xs text-muted-foreground">
                Progress bar na stránce Dnes
              </p>
            </div>
            <Switch
              checked={settings.progressBarEnabled}
              onCheckedChange={(checked) =>
                saveSettings({ progressBarEnabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Contexts & Templates Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Správa</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            variant="outline"
            className="justify-between"
            onClick={() => router.push("/contexts")}
          >
            Kontexty
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="justify-between"
            onClick={() => router.push("/templates")}
          >
            Šablony
            <ExternalLink className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Offline & Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Offline a synchronizace</CardTitle>
        </CardHeader>
        <CardContent>
          <SyncIndicator />
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exportuji..." : "Exportovat data (JSON)"}
          </Button>

          <Separator />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                Smazat účet
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Opravdu smazat účet?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tato akce je nevratná. Budou smazána všechna vaše data
                  včetně úkolů, kontextů, šablon a záznamů dnů.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Zrušit</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Mazání..." : "Smazat účet"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Saving indicator */}
      {isSaving && (
        <p className="text-xs text-muted-foreground text-center">
          Ukládání...
        </p>
      )}
    </div>
  );
}
