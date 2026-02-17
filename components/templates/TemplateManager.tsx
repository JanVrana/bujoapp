"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Play, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  icon: string;
  color: string;
  _count?: { items: number };
}

export function TemplateManager() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📋");
  const [color, setColor] = useState("#6B7280");

  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ["templates"],
    queryFn: async () => {
      const res = await fetch("/api/templates");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (data: { name: string; icon: string; color: string }) => {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      setShowCreate(false);
      setName("");
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["templates"] }),
  });

  const activateTemplate = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/templates/${id}/activate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["daylog"] });
      toast.success(`Vytvořeno ${Array.isArray(data) ? data.length : 0} úkolů`);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Šablony</h2>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nová šablona
        </Button>
      </div>

      <div className="space-y-2">
        {templates.map((tmpl) => (
          <Card key={tmpl.id}>
            <CardContent className="flex items-center gap-3 p-3">
              <span className="text-lg">{tmpl.icon}</span>
              <span className="flex-1 font-medium text-sm">{tmpl.name}</span>
              <span className="text-xs text-muted-foreground">
                {tmpl._count?.items || 0} položek
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => activateTemplate.mutate(tmpl.id)}
              >
                <Play className="h-3.5 w-3.5 mr-1" /> Aktivovat
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => deleteTemplate.mutate(tmpl.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {templates.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Žádné šablony. Vytvořte si první!
          </p>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nová šablona</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Název</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Název šablony" />
            </div>
            <div>
              <Label>Emoji</Label>
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} className="w-20" />
            </div>
            <div>
              <Label>Barva</Label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
            </div>
            <Button className="w-full" onClick={() => createTemplate.mutate({ name, icon, color })}>
              Vytvořit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
