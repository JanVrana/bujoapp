"use client";

import { useState } from "react";
import { useContexts, useCreateContext, useUpdateContext, useDeleteContext } from "@/lib/hooks/use-contexts";
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
import { Trash2, Edit2, Plus, GripVertical } from "lucide-react";

export function ContextManager() {
  const { data: contexts = [] } = useContexts();
  const createContext = useCreateContext();
  const updateContext = useUpdateContext();
  const deleteContext = useDeleteContext();

  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📋");
  const [color, setColor] = useState("#6B7280");

  const handleCreate = () => {
    if (!name.trim()) return;
    createContext.mutate(
      { name: name.trim(), icon, color },
      {
        onSuccess: () => {
          setName("");
          setIcon("📋");
          setColor("#6B7280");
          setShowCreate(false);
        },
      }
    );
  };

  const handleEdit = () => {
    if (!editId || !name.trim()) return;
    updateContext.mutate(
      { id: editId, name: name.trim(), icon, color },
      {
        onSuccess: () => {
          setEditId(null);
          setName("");
        },
      }
    );
  };

  const openEdit = (ctx: { id: string; name: string; icon: string; color: string }) => {
    setEditId(ctx.id);
    setName(ctx.name);
    setIcon(ctx.icon);
    setColor(ctx.color);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Kontexty</h2>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nový kontext
        </Button>
      </div>

      <div className="space-y-2">
        {contexts.map((ctx) => (
          <Card key={ctx.id}>
            <CardContent className="flex items-center gap-3 p-3">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              <span className="text-lg">{ctx.icon}</span>
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: ctx.color }}
              />
              <span className="flex-1 font-medium text-sm">{ctx.name}</span>
              {ctx.isSystem && (
                <span className="text-xs text-muted-foreground">Systémový</span>
              )}
              {!ctx.isSystem && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openEdit(ctx)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => deleteContext.mutate(ctx.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showCreate || !!editId} onOpenChange={(open) => { if (!open) { setShowCreate(false); setEditId(null); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editId ? "Upravit kontext" : "Nový kontext"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Název</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="@kontext" />
            </div>
            <div>
              <Label>Emoji ikona</Label>
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="📋" className="w-20" />
            </div>
            <div>
              <Label>Barva</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                <Input value={color} onChange={(e) => setColor(e.target.value)} className="flex-1" />
              </div>
            </div>
            <Button className="w-full" onClick={editId ? handleEdit : handleCreate}>
              {editId ? "Uložit" : "Vytvořit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
