import React, { useRef, useCallback } from "react";
import { Upload, CheckCircle2 } from "lucide-react";

interface FileUploadBoxProps {
  label: string;
  file: File | null;
  preview: string;
  onFileChange: (file: File | null) => void;
  icon?: React.ElementType;
  accept?: string;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileUploadBox = React.memo(function FileUploadBox({
  label,
  file,
  preview,
  onFileChange,
  icon: Icon = Upload,
  accept = "image/*",
}: FileUploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasSelection = Boolean(file);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (inputRef.current) {
        inputRef.current.value = "";
        inputRef.current.click();
      }
    },
    []
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0] || null;
      onFileChange(f);
    },
    [onFileChange]
  );

  return (
    <div
      onClick={handleClick}
      className={`group relative cursor-pointer rounded-xl border-2 transition-all overflow-hidden ${
        hasSelection
          ? "border-primary/30 bg-primary/5"
          : "border-dashed border-border hover:border-primary/50 bg-muted/30 hover:bg-muted/50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onClick={(e) => e.stopPropagation()}
        onChange={handleChange}
      />

      {hasSelection ? (
        <div className="relative">
          <div className="aspect-[4/3] bg-muted/40">
            {preview ? (
              <img
                src={preview}
                alt={label}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Icon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-background text-xs font-medium">
                পরিবর্তন করুন
              </p>
            </div>
          </div>
          <div className="p-2 bg-primary/10 border-t border-primary/20">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-foreground truncate">
                  {label} ✓
                </p>
                {file && (
                  <p className="text-[9px] text-muted-foreground truncate">
                    {file.name} • {formatFileSize(file.size)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="aspect-[4/3] flex flex-col items-center justify-center gap-2 p-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <p className="text-xs font-medium text-foreground">{label}</p>
          <p className="text-[10px] text-muted-foreground">
            ক্লিক করে আপলোড করুন
          </p>
        </div>
      )}
    </div>
  );
});

export default FileUploadBox;
