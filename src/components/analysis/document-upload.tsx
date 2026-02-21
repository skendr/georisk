"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];
const MAX_FILE_SIZE = 32 * 1024 * 1024;
const MAX_FILES = 20;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type === "application/pdf") return FileText;
  return ImageIcon;
}

interface DocumentUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
}

export function DocumentUpload({
  files,
  onFilesChange,
  disabled,
}: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndAddFiles = useCallback(
    (newFiles: FileList | File[]) => {
      setError(null);
      const toAdd: File[] = [];

      for (const file of Array.from(newFiles)) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setError(`"${file.name}" is not a supported file type (PDF, PNG, JPEG, WebP)`);
          return;
        }
        if (file.size > MAX_FILE_SIZE) {
          setError(`"${file.name}" exceeds 32MB limit`);
          return;
        }
        toAdd.push(file);
      }

      const combined = [...files, ...toAdd];
      if (combined.length > MAX_FILES) {
        setError(`Maximum ${MAX_FILES} files allowed`);
        return;
      }

      onFilesChange(combined);
    },
    [files, onFilesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      validateAndAddFiles(e.dataTransfer.files);
    },
    [disabled, validateAndAddFiles]
  );

  const removeFile = useCallback(
    (index: number) => {
      onFilesChange(files.filter((_, i) => i !== index));
    },
    [files, onFilesChange]
  );

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        } ${disabled ? "pointer-events-none opacity-50" : ""}`}
      >
        <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">
          Drop property documents here or click to browse
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          PDF, PNG, JPEG, WebP — up to 32MB each, max {MAX_FILES} files
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) validateAndAddFiles(e.target.files);
            e.target.value = "";
          }}
          disabled={disabled}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => {
            const Icon = getFileIcon(file.type);
            return (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2"
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  disabled={disabled}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
