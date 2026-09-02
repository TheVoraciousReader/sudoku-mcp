"use client";

import { Bot, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Activity } from "@/hooks/use-studio";

type Props = {
  activity: Activity[];
};

export function ActivityLog({ activity }: Props) {
  return (
    <Card className="bg-[var(--paper-card)] shadow-none ring-ink/10">
      <CardHeader className="border-b border-ink/10">
        <CardTitle className="font-serif text-xl">Shared log</CardTitle>
        <CardDescription>Your clicks and its tool calls both land here, so you can see who did what.</CardDescription>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No moves yet. Ask for a hint or enter a digit.</p>
        ) : (
          <ScrollArea className="h-56 pr-3">
            <ol className="space-y-3">
              {activity.map((entry) => (
                <li key={entry.id} className="flex gap-2 text-sm leading-5">
                  <span className="mt-0.5 text-ink/50">
                    {entry.source === "agent" ? <Bot className="size-3.5" /> : <User className="size-3.5" />}
                  </span>
                  <div>
                    <p className="font-mono text-[11px] tracking-wide text-ink/50 uppercase">{entry.tool}</p>
                    <p>{entry.message}</p>
                  </div>
                </li>
              ))}
            </ol>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
