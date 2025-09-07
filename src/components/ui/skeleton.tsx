import { cn } from "@/lib/utils"

/**
 * Skeleton Component
 * Loading placeholder with animated pulse effect
 * Used to show content structure while data is loading
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
