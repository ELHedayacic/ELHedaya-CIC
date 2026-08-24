import { useRef, useState } from "react";
import { Camera, Image as ImageIcon, Loader2 } from "lucide-react";
import { useSignedPhotoUrl } from "@/hooks/useSignedPhotoUrl";
import { uploadToPrivateBucket } from "@/lib/utils";

export function PhotoPicker({
  studentId,
  currentPath,
  onUploaded,
}: {
  studentId: string;
  currentPath: string | null;
  onUploaded: (path: string) => void;
}) {
  const currentUrl = useSignedPhotoUrl(currentPath);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const { path } = await uploadToPrivateBucket("student-photos", file, studentId, {
        maxSizeMB: 5,
        allowedTypePrefixes: ["image/"],
      });
      onUploaded(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't upload the photo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 shrink-0">
        {currentUrl ? (
          <img src={currentUrl} alt="" className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-black/15 bg-black/[0.02]">
            <ImageIcon className="h-6 w-6 text-twilight-200" />
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-twilight-950/70">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        )}
      </div>
      <div>
        <label className="btn-secondary cursor-pointer !py-2 !text-xs">
          <Camera className="h-3.5 w-3.5" /> {currentPath ? "Change photo" : "Add photo"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <p className="mt-1.5 text-[11px] text-twilight-200">JPG or PNG, up to 5MB</p>
        {error && <p className="mt-1 text-[11px] text-coral-700">{error}</p>}
      </div>
    </div>
  );
}
