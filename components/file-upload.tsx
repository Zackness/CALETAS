"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input"; // Importar el input de shadcn

interface FileUploadProps {
  onChange: (file?: File) => void;
}

export const FileUpload = ({ onChange }: FileUploadProps) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    onChange(file);
  };

  return (
    <div>
      <Input type="file" onChange={handleFileChange} />
    </div>
  );
};