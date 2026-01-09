"use client";
import React, { useState, useEffect } from "react";
import {
  MdUploadFile,
  MdClose,
  MdInsertPhoto,
  MdVideoLibrary,
  MdAudiotrack,
  MdInsertDriveFile,
} from "react-icons/md";

interface AssetFile {
  name: string;
  path: string;
  size: number;
  modified: number;
  type: string;
}

interface AssetBrowserProps {
  onSelect: (path: string) => void;
  onClose: () => void;
}

export default function AssetBrowser({ onSelect, onClose }: AssetBrowserProps) {
  const [assets, setAssets] = useState<AssetFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const isLocalhost =
    typeof window !== "undefined" && window.location.hostname === "localhost";
  const apiBase = isLocalhost ? "http://localhost:8080" : "";

  useEffect(() => {
    loadAssets();
  }, []);

  async function loadAssets() {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/php/list_assets.php`);
      const data = await res.json();
      setAssets(data.files || []);
    } catch (err) {
      console.error("Chyba při načítání assets:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append("assetfile", file);

    try {
      const res = await fetch(`${apiBase}/php/upload_asset.php`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setUploadMessage("Soubor byl úspěšně nahrán.");
        setTimeout(() => setUploadMessage(null), 3000);
        loadAssets();
      } else {
        setUploadMessage("Chyba: " + (data.error || "Neznámá chyba"));
        setTimeout(() => setUploadMessage(null), 4000);
      }
    } catch (err) {
      setUploadMessage("Chyba spojení s PHP skriptem.");
      setTimeout(() => setUploadMessage(null), 4000);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function getFileIcon(type: string) {
    if (type.startsWith("image/"))
      return <MdInsertPhoto className="text-blue-500" size={24} />;
    if (type.startsWith("video/"))
      return <MdVideoLibrary className="text-purple-500" size={24} />;
    if (type.startsWith("audio/"))
      return <MdAudiotrack className="text-green-500" size={24} />;
    return <MdInsertDriveFile className="text-gray-500" size={24} />;
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString("cs-CZ");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Správa souborů
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Zavřít"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Upload section */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-md hover:bg-blue-600 dark:hover:bg-blue-700 cursor-pointer transition-all w-fit">
            <MdUploadFile size={20} />
            <span className="text-sm font-semibold">
              {uploading ? "Nahrávám..." : "Nahrát nový soubor"}
            </span>
            <input
              type="file"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
          {uploadMessage && (
            <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
              {uploadMessage}
            </div>
          )}
        </div>

        {/* File list */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Žádné soubory nejsou nahrané.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {assets.map((asset) => (
                <button
                  key={asset.path}
                  onClick={() => {
                    onSelect(asset.path);
                    onClose();
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left group"
                >
                  <div className="flex-shrink-0">{getFileIcon(asset.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                      {asset.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(asset.size)} •{" "}
                      {formatDate(asset.modified)}
                    </div>
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Vložit
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
