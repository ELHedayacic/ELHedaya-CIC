import { cn } from "@/lib/utils";
import { useSignedPhotoUrl } from "@/hooks/useSignedPhotoUrl";

export function Avatar({
  name,
  photoPath,
  className,
  size = "md",
}: {
  name: string;
  /** Storage path in the private student-photos bucket, if this avatar has one. */
  photoPath?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const photoUrl = useSignedPhotoUrl(photoPath);

  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sizeClass = { sm: "h-7 w-7 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-base" }[size];

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={cn("shrink-0 rounded-full object-cover", sizeClass, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-aurora-500 to-aurora-700 font-display font-semibold text-white",
        sizeClass,
        className
      )}
    >
      {initials}
    </div>
  );
}
