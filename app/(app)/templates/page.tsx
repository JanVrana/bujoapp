"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Pencil } from "lucide-react";

interface Template {
  id: string;
  name: string;
  icon: string;
  color: string;
  itemCount: number;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  async function handleActivate(templateId: string) {
    setActivatingId(templateId);
    try {
      const res = await fetch(`/api/templates/${templateId}/activate`, {
        method: "POST",
      });
      if (res.ok) {
        router.push("/today");
      }
    } catch (error) {
      console.error("Failed to activate template:", error);
    } finally {
      setActivatingId(null);
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
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Šablony</h1>
          <p className="text-muted-foreground text-sm">
            Předpřipravené sady úkolů
          </p>
        </div>
        <Button onClick={() => router.push("/templates/new")}>
          <Plus className="h-4 w-4 mr-1" />
          Nová šablona
        </Button>
      </div>

      {/* Templates List */}
      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground text-lg mb-4">
            Zatím nemáte žádné šablony
          </p>
          <Button onClick={() => router.push("/templates/new")}>
            <Plus className="h-4 w-4 mr-1" />
            Vytvořit první šablonu
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-xl">{template.icon}</span>
                    {template.name}
                  </CardTitle>
                  <Badge variant="secondary">
                    {template.itemCount}{" "}
                    {template.itemCount === 1
                      ? "položka"
                      : template.itemCount >= 2 && template.itemCount <= 4
                        ? "položky"
                        : "položek"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex items-end pt-2">
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/templates/${template.id}`)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Upravit
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    disabled={activatingId === template.id}
                    onClick={() => handleActivate(template.id)}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    {activatingId === template.id
                      ? "Aktivuji..."
                      : "Aktivovat"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
