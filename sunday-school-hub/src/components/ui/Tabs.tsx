import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn("inline-flex items-center gap-1 rounded-full border border-black/10 bg-black/5 p-1", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "rounded-full px-4 py-1.5 text-sm font-medium text-twilight-200 transition-all data-[state=active]:bg-aurora-500 data-[state=active]:text-white data-[state=active]:shadow-glow",
        className
      )}
      {...props}
    />
  );
}

export const TabsContent = TabsPrimitive.Content;
