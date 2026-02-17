"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ContextTemplateSelector } from "./ContextTemplateSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateTask } from "@/lib/hooks/use-tasks";
import { useConfetti } from "@/components/feedback/ConfettiAnimation";

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [taskTitle, setTaskTitle] = useState("");
  const createTask = useCreateTask();
  const fireConfetti = useConfetti();

  const handleAddTask = () => {
    if (!taskTitle.trim()) return;
    createTask.mutate(
      { title: taskTitle.trim(), contextId: "", status: "inbox" },
      { onSuccess: () => setStep(3) }
    );
  };

  const handleComplete = () => {
    fireConfetti(true);
    setTimeout(() => {
      fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingCompleted: true }),
      }).then(() => router.push("/today"));
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {step === 1 && "Vítejte v BuJo+GTD!"}
            {step === 2 && "Přidejte první úkol"}
            {step === 3 && "Dokončete ho!"}
            {step === 4 && "Hotovo!"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Vyberte si šablonu kontextů pro začátek:
              </p>
              <ContextTemplateSelector onComplete={() => setStep(2)} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Co potřebujete udělat?
              </p>
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Můj první úkol..."
                onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              />
              <Button onClick={handleAddTask} disabled={!taskTitle.trim()} className="w-full">
                Přidat
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Klikněte na tlačítko a podívejte se co se stane!
              </p>
              <Button size="lg" onClick={handleComplete} className="w-full">
                Dokončit úkol ✕
              </Button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 text-center">
              <p className="text-lg">🎉</p>
              <p className="text-sm text-muted-foreground">
                Jste připraveni! Přesměrováváme vás...
              </p>
            </div>
          )}

          <div className="flex justify-center gap-1 mt-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
