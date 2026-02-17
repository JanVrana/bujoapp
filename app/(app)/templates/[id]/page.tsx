"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Save,
} from "lucide-react";

interface TemplateItem {
  id: string;
  title: string;
  order: number;
}

interface Template {
  id: string;
  name: string;
  icon: string;
  color: string;
  items: TemplateItem[];
}

interface TemplateEditorPageProps {
  params: Promise<{ id: string }>;
}

export default function TemplateEditorPage({ params }: TemplateEditorPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = id === "new";

  const [template, setTemplate] = useState<Template>({
    id: "",
    name: "",
    icon: "📋",
    color: "#6366f1",
    items: [],
  });
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");

  const fetchTemplate = useCallback(async () => {
    try {
      const res = await fetch(`/api/templates/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTemplate(data);
      }
    } catch (error) {
      console.error("Failed to fetch template:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isNew) {
      fetchTemplate();
    }
  }, [isNew, fetchTemplate]);

  async function handleSave() {
    setIsSaving(true);
    try {
      const method = isNew ? "POST" : "PUT";
      const url = isNew ? "/api/templates" : `/api/templates/${id}`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      });
      if (res.ok) {
        router.push("/templates");
      }
    } catch (error) {
      console.error("Failed to save template:", error);
    } finally {
      setIsSaving(false);
    }
  }

  function handleAddItem() {
    if (!newItemTitle.trim()) return;
    const newItem: TemplateItem = {
      id: crypto.randomUUID(),
      title: newItemTitle.trim(),
      order: template.items.length,
    };
    setTemplate((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setNewItemTitle("");
  }

  function handleRemoveItem(itemId: string) {
    setTemplate((prev) => ({
      ...prev,
      items: prev.items
        .filter((item) => item.id !== itemId)
        .map((item, index) => ({ ...item, order: index })),
    }));
  }

  function handleUpdateItem(itemId: string, title: string) {
    setTemplate((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, title } : item
      ),
    }));
  }

  function handleMoveItem(itemId: string, direction: "up" | "down") {
    setTemplate((prev) => {
      const items = [...prev.items];
      const index = items.findIndex((item) => item.id === itemId);
      if (
        (direction === "up" && index === 0) ||
        (direction === "down" && index === items.length - 1)
      ) {
        return prev;
      }
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
      return {
        ...prev,
        items: items.map((item, i) => ({ ...item, order: i })),
      };
    });
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/templates")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            {isNew ? "Nová šablona" : "Upravit šablonu"}
          </h1>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-1" />
          {isSaving ? "Ukládám..." : "Uložit"}
        </Button>
      </div>

      {/* Template Details */}
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Ikona</label>
              <Input
                value={template.icon}
                onChange={(e) =>
                  setTemplate((prev) => ({ ...prev, icon: e.target.value }))
                }
                className="w-16 text-center text-xl"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-sm font-medium">Název</label>
              <Input
                value={template.name}
                onChange={(e) =>
                  setTemplate((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Název šablony"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Barva</label>
              <Input
                type="color"
                value={template.color}
                onChange={(e) =>
                  setTemplate((prev) => ({ ...prev, color: e.target.value }))
                }
                className="w-16 h-9 p-1 cursor-pointer"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Položky</h2>

        {template.items.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex items-center gap-2 py-2 px-3">
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleMoveItem(item.id, "up")}
                  disabled={item.order === 0}
                >
                  &uarr;
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleMoveItem(item.id, "down")}
                  disabled={item.order === template.items.length - 1}
                >
                  &darr;
                </Button>
              </div>
              <Input
                value={item.title}
                onChange={(e) => handleUpdateItem(item.id, e.target.value)}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive shrink-0"
                onClick={() => handleRemoveItem(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}

        {/* Add New Item */}
        <div className="flex gap-2">
          <Input
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="Nová položka..."
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddItem();
            }}
          />
          <Button variant="outline" onClick={handleAddItem}>
            <Plus className="h-4 w-4 mr-1" />
            Přidat
          </Button>
        </div>
      </div>
    </div>
  );
}
