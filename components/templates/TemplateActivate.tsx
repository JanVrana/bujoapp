"use client";

import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TemplateItem {
  id: string;
  title: string;
  description?: string | null;
  contextId: string;
}

interface TemplateActivateProps {
  templateId: string;
  templateName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateActivate({ templateId, templateName, open, onOpenChange }: TemplateActivateProps) {
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery<TemplateItem[]>({
    queryKey: ["template-items", templateId],
    queryFn: async () => {
      const res = await fetch(`/api/templates/${templateId}/items`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: open,
  });

  const activate = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/templates/${templateId}/activate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["daylog"] });
      toast.success(`Šablona "${templateName}" aktivována`);
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Aktivovat šablonu: {templateName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 my-4">
          <p className="text-sm text-muted-foreground">
            Budou vytvořeny následující úkoly na dnešek:
          </p>
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
              <span>•</span>
              <span>{item.title}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button onClick={() => activate.mutate()} disabled={activate.isPending}>
            Aktivovat ({items.length} úkolů)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
