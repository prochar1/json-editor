"use client";
import React, { useState, useEffect } from "react";
import {
  MdUploadFile,
  MdClose,
  MdInsertPhoto,
  MdVideoLibrary,
  MdAudiotrack,
  MdInsertDriveFile,
  MdFolder,
  MdArrowBack,
  MdCreateNewFolder,
  MdDelete,
} from "react-icons/md";

interface AssetFile {
  name: string;
  path: string;
  size: number;
  modified: number;
  type: string;
  thumbnail?: string;
}

interface AssetFolder {
  name: string;
  path: string;
}

interface AssetBrowserProps {
  onSelect: (path: string) => void;
  onClose: () => void;
}

export default function AssetBrowser({ onSelect, onClose }: AssetBrowserProps) {
  const [assets, setAssets] = useState<AssetFile[]>([]);
  const [folders, setFolders] = useState<AssetFolder[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const isLocalhost =
    typeof window !== "undefined" && window.location.hostname === "localhost";
  const apiBase = isLocalhost ? "http://localhost:8080" : "";

  useEffect(() => {
    loadAssets();
  }, [currentPath]);

  async function loadAssets() {
    setLoading(true);
    try {
      const url = `${apiBase}/php/list_assets.php${currentPath ? `?path=${encodeURIComponent(currentPath)}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      setFolders(data.folders || []);
      setAssets(data.files || []);
    } catch (err) {
      console.error("Chyba při načítání assets:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadMessage(null);
    setUploadProgress(0);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadMessage(`Nahrávám ${i + 1}/${files.length}: ${file.name}...`);

        const result = await uploadFileInChunks(
          file,
          currentPath,
          (progress) => {
            setUploadProgress(progress);
          }
        );

        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      if (successCount > 0) {
        setUploadMessage(
          `Nahráno ${successCount} ${successCount === 1 ? "soubor" : successCount < 5 ? "soubory" : "souborů"}.`
        );
        if (errorCount > 0) {
          setUploadMessage((prev) => prev + ` ${errorCount} selhalo.`);
        }
        loadAssets();
      } else {
        setUploadMessage("Chyba: Žádné soubory nebyly nahrány.");
      }
    } catch (err) {
      setUploadMessage("Chyba spojení.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = "";
      setTimeout(() => setUploadMessage(null), 4000);
    }
  }

  async function uploadFileInChunks(
    file: File,
    path: string,
    onProgress: (progress: number) => void
  ): Promise<{ success: boolean; error?: string }> {
    const chunkSize = 5 * 1024 * 1024; // 5MB chunky
    const totalChunks = Math.ceil(file.size / chunkSize);
    const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append("chunk", chunk);
      formData.append("chunkIndex", chunkIndex.toString());
      formData.append("totalChunks", totalChunks.toString());
      formData.append("fileName", file.name);
      formData.append("fileId", fileId);
      formData.append("path", path);

      try {
        const res = await fetch(`${apiBase}/php/upload_chunk.php`, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          return { success: false, error: data.error || "Chyba při nahrávání" };
        }

        // Aktualizovat progress
        const progress = ((chunkIndex + 1) / totalChunks) * 100;
        onProgress(progress);

        // Pokud je upload kompletní, vrátit úspěch
        if (data.complete) {
          return { success: true };
        }
      } catch (err) {
        return { success: false, error: "Chyba spojení" };
      }
    }

    return { success: true };
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

  function navigateToFolder(folderPath: string) {
    setCurrentPath(folderPath);
  }

  function navigateBack() {
    const pathParts = currentPath.split("/").filter(Boolean);
    pathParts.pop();
    setCurrentPath(pathParts.join("/"));
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) {
      setUploadMessage("Zadejte název složky.");
      setTimeout(() => setUploadMessage(null), 3000);
      return;
    }

    try {
      const res = await fetch(`${apiBase}/php/create_folder.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newFolderName,
          path: currentPath,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setUploadMessage("Složka byla vytvořena.");
        setTimeout(() => setUploadMessage(null), 3000);
        setNewFolderName("");
        setShowCreateFolder(false);
        loadAssets();
      } else {
        setUploadMessage("Chyba: " + (data.error || "Neznámá chyba"));
        setTimeout(() => setUploadMessage(null), 4000);
      }
    } catch (err) {
      setUploadMessage("Chyba spojení.");
      setTimeout(() => setUploadMessage(null), 4000);
    }
  }

  function getBreadcrumbs() {
    if (!currentPath) return [];
    const parts = currentPath.split("/").filter(Boolean);
    const breadcrumbs = [];
    let path = "";
    for (const part of parts) {
      path += (path ? "/" : "") + part;
      breadcrumbs.push({ name: part, path });
    }
    return breadcrumbs;
  }

  async function handleDeleteAsset(assetPath: string, assetName: string) {
    if (!confirm(`Opravdu chcete smazat soubor "${assetName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`${apiBase}/php/delete_asset.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: assetPath,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setUploadMessage("Soubor byl smazán.");
        setTimeout(() => setUploadMessage(null), 3000);
        loadAssets();
      } else {
        setUploadMessage("Chyba: " + (data.error || "Neznámá chyba"));
        setTimeout(() => setUploadMessage(null), 4000);
      }
    } catch (err) {
      setUploadMessage("Chyba spojení s PHP skriptem.");
      setTimeout(() => setUploadMessage(null), 4000);
    }
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
          {/* Breadcrumbs */}
          {currentPath && (
            <div className="mb-3 flex items-center gap-2 text-sm">
              <button
                onClick={() => setCurrentPath("")}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Kořenová složka
              </button>
              {getBreadcrumbs().map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <span className="text-gray-400">/</span>
                  <button
                    onClick={() => setCurrentPath(crumb.path)}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            {currentPath && (
              <button
                onClick={navigateBack}
                className="flex items-center gap-2 px-3 py-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 transition-all"
                title="Zpět"
              >
                <MdArrowBack size={20} />
              </button>
            )}
            <button
              onClick={() => setShowCreateFolder(!showCreateFolder)}
              className="flex items-center gap-2 px-3 py-2 bg-green-500 dark:bg-green-600 text-white rounded-md hover:bg-green-600 dark:hover:bg-green-700 transition-all"
              title="Vytvořit složku"
            >
              <MdCreateNewFolder size={20} />
            </button>
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-md hover:bg-blue-600 dark:hover:bg-blue-700 cursor-pointer transition-all">
              <MdUploadFile size={20} />
              <span className="text-sm font-semibold">
                {uploading ? "Nahrávám..." : "Nahrát soubor"}
              </span>
              <input
                type="file"
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
                multiple
              />
            </label>
          </div>
          {showCreateFolder && (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Název nové složky..."
                className="flex-1 px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                onKeyPress={(e) => e.key === "Enter" && handleCreateFolder()}
              />
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 text-sm bg-green-500 dark:bg-green-600 text-white rounded-md hover:bg-green-600 dark:hover:bg-green-700 transition-all"
              >
                Vytvořit
              </button>
              <button
                onClick={() => {
                  setShowCreateFolder(false);
                  setNewFolderName("");
                }}
                className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 transition-all"
              >
                Zrušit
              </button>
            </div>
          )}
          {uploadMessage && (
            <div className="mt-2 space-y-2">
              <div className="text-sm text-blue-600 dark:text-blue-400">
                {uploadMessage}
              </div>
              {uploading && uploadProgress > 0 && (
                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* File list */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          ) : folders.length === 0 && assets.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Žádné soubory ani složky.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {/* Složky */}
              {folders.map((folder) => (
                <button
                  key={folder.path}
                  onClick={() => navigateToFolder(folder.path)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left group"
                >
                  <div className="flex-shrink-0">
                    <MdFolder className="text-yellow-500" size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                      {folder.name}
                    </div>
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Otevřít
                  </div>
                </button>
              ))}
              {/* Soubory */}
              {assets.map((asset) => (
                <div
                  key={asset.path}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                >
                  <button
                    onClick={() => {
                      onSelect(asset.path);
                      onClose();
                    }}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <div className="flex-shrink-0">
                      {asset.thumbnail ? (
                        <img
                          src={asset.thumbnail}
                          alt={asset.name}
                          className="w-12 h-12 object-cover rounded border border-gray-200 dark:border-gray-700"
                        />
                      ) : (
                        getFileIcon(asset.type)
                      )}
                    </div>
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAsset(asset.path, asset.name);
                    }}
                    className="p-2 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-all"
                    title="Smazat soubor"
                  >
                    <MdDelete size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
