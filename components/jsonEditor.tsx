"use client";
import React, { useState, useEffect } from "react";
import { MdOutlineTextFields } from "react-icons/md";

// Helper to deeply clone and update JSON
function updateJson(obj: any, path: (string | number)[], value: any) {
  if (path.length === 0) return value;
  const [key, ...rest] = path;
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  clone[key] = updateJson(obj[key], rest, value);
  return clone;
}

// Recursive JSON editor with collapsible tree
function JsonEditorForm({
  data,
  path = [],
  onChange,
  label,
  labelTitle,
}: {
  data: any;
  path?: (string | number)[];
  onChange: (path: (string | number)[], value: any) => void;
  label?: string;
  labelTitle?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper to get preview of data
  const getPreview = (value: any): string => {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "string")
      return `"${value.substring(0, 30)}${value.length > 30 ? "..." : ""}"`;
    if (typeof value === "number" || typeof value === "boolean")
      return String(value);
    if (Array.isArray(value)) return `[${value.length} položek]`;
    if (typeof value === "object")
      return `{${Object.keys(value).length} vlastností}`;
    return String(value);
  };

  // Helper to get descriptive label for array items
  const getArrayItemLabel = (
    item: any,
    idx: number
  ): { display: string; title: string } => {
    if (typeof item === "object" && item !== null) {
      if (Array.isArray(item)) {
        const display = `${idx + 1}. 📋 Seznam (${item.length})`;
        return { display, title: display };
      } else {
        // For objects, try to find a descriptive key
        const keys = Object.keys(item);
        const nameKeys = [
          "name",
          "title",
          "label",
          "id",
          "key",
          "nazev",
          "jmeno",
        ];
        const foundKey = nameKeys.find((k) => keys.includes(k));
        if (foundKey && item[foundKey]) {
          const fullValue = String(item[foundKey]);
          const value = fullValue.substring(0, 25);
          return {
            display: `${idx + 1}. ${value}${fullValue.length > 25 ? "..." : ""}`,
            title: `${idx + 1}. ${fullValue}`,
          };
        }
        // Otherwise show first key-value pair
        if (keys.length > 0) {
          const firstKey = keys[0];
          const fullValue = String(item[firstKey]);
          const firstValue = fullValue.substring(0, 20);
          return {
            display: `${idx + 1}. ${firstKey}: ${firstValue}${fullValue.length > 20 ? "..." : ""}`,
            title: `${idx + 1}. ${firstKey}: ${fullValue}`,
          };
        }
        const display = `${idx + 1}. 📦 Záznam`;
        return { display, title: display };
      }
    } else if (typeof item === "string") {
      const preview = item.substring(0, 30);
      return {
        display: `${idx + 1}. "${preview}${item.length > 30 ? "..." : ""}"`,
        title: `${idx + 1}. "${item}"`,
      };
    } else if (typeof item === "number" || typeof item === "boolean") {
      const display = `${idx + 1}. ${item}`;
      return { display, title: display };
    } else if (item === null) {
      const display = `${idx + 1}. null`;
      return { display, title: display };
    }
    const display = `${idx + 1}.`;
    return { display, title: display };
  };

  if (typeof data === "object" && data !== null) {
    if (Array.isArray(data)) {
      return (
        <div className="mb-1">
          <div className="flex items-center gap-2 group">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 flex-1 px-2 py-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-gray-800/50 transition-colors text-left"
            >
              <span className="inline-flex items-center justify-center w-4 text-blue-600 dark:text-blue-400 text-xs flex-shrink-0">
                {isExpanded ? "▼" : "▶"}
              </span>
              {label && (
                <span
                  className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[200px] flex-shrink-0"
                  title={label}
                >
                  {label}:
                </span>
              )}
              <span className="text-xs text-blue-600 dark:text-blue-400">
                Seznam ({data.length} položek)
              </span>
            </button>
            {path.length > 0 && (
              <button
                type="button"
                onClick={() => onChange(path, undefined)}
                className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs rounded-md bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all"
                title="Odstranit"
              >
                ✕
              </button>
            )}
          </div>
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1 border-l-2 border-blue-200 dark:border-blue-900/50 pl-2">
              {data.map((item, idx) => {
                const labelData = getArrayItemLabel(item, idx);
                return (
                  <JsonEditorForm
                    key={idx}
                    data={item}
                    path={[...path, idx]}
                    onChange={onChange}
                    label={labelData.display}
                    labelTitle={labelData.title}
                  />
                );
              })}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => onChange([...path, data.length], "")}
                  className="px-3 py-1 text-xs rounded-md bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700 transition-all"
                  title="Přidat textovou hodnotu"
                >
                  + Hodnota
                </button>
                <button
                  type="button"
                  onClick={() => onChange([...path, data.length], [])}
                  className="px-3 py-1 text-xs rounded-md bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700 transition-all"
                  title="Přidat seznam (pole)"
                >
                  + Seznam
                </button>
                <button
                  type="button"
                  onClick={() => onChange([...path, data.length], {})}
                  className="px-3 py-1 text-xs rounded-md bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700 transition-all"
                  title="Přidat záznam (objekt)"
                >
                  + Záznam
                </button>
              </div>
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="mb-1">
          <div className="flex items-center gap-2 group">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 flex-1 px-2 py-1.5 rounded-md hover:bg-purple-50 dark:hover:bg-gray-800/50 transition-colors text-left"
            >
              <span className="inline-flex items-center justify-center w-4 text-purple-600 dark:text-purple-400 text-xs flex-shrink-0">
                {isExpanded ? "▼" : "▶"}
              </span>
              {label && (
                <span
                  className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[200px] flex-shrink-0"
                  title={labelTitle || label}
                >
                  {label}:
                </span>
              )}
              <span className="text-xs text-purple-600 dark:text-purple-400">
                ({Object.keys(data).slice(0, 2).join(", ")}
                {Object.keys(data).length > 2 ? ", ..." : ""})
              </span>
            </button>
            {path.length > 0 && (
              <button
                type="button"
                onClick={() => onChange(path, undefined)}
                className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs rounded-md bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all"
                title="Odstranit"
              >
                ✕
              </button>
            )}
          </div>
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1 border-l-2 border-purple-200 dark:border-purple-900/50 pl-2">
              {Object.entries(data).map(([key, value]) => (
                <JsonEditorForm
                  key={key}
                  data={value}
                  path={[...path, key]}
                  onChange={onChange}
                  label={key}
                />
              ))}
              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  placeholder="Název nové vlastnosti..."
                  className="w-full px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-800/50 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                  id={`new-key-${path.join("-")}`}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById(
                        `new-key-${path.join("-")}`
                      ) as HTMLInputElement;
                      const newKey = input?.value.trim();
                      if (newKey) {
                        onChange([...path, newKey], "");
                        input.value = "";
                      } else {
                        alert("Zadejte název vlastnosti");
                      }
                    }}
                    className="px-3 py-1 text-xs rounded-md bg-purple-500 dark:bg-purple-600 text-white hover:bg-purple-600 dark:hover:bg-purple-700 transition-all"
                    title="Přidat textovou hodnotu"
                  >
                    + Hodnota
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById(
                        `new-key-${path.join("-")}`
                      ) as HTMLInputElement;
                      const newKey = input?.value.trim();
                      if (newKey) {
                        onChange([...path, newKey], []);
                        input.value = "";
                      } else {
                        alert("Zadejte název vlastnosti");
                      }
                    }}
                    className="px-3 py-1 text-xs rounded-md bg-purple-500 dark:bg-purple-600 text-white hover:bg-purple-600 dark:hover:bg-purple-700 transition-all"
                    title="Přidat seznam (pole)"
                  >
                    + Seznam
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById(
                        `new-key-${path.join("-")}`
                      ) as HTMLInputElement;
                      const newKey = input?.value.trim();
                      if (newKey) {
                        onChange([...path, newKey], {});
                        input.value = "";
                      } else {
                        alert("Zadejte název vlastnosti");
                      }
                    }}
                    className="px-3 py-1 text-xs rounded-md bg-purple-500 dark:bg-purple-600 text-white hover:bg-purple-600 dark:hover:bg-purple-700 transition-all"
                    title="Přidat záznam (objekt)"
                  >
                    + Záznam
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
  } else {
    // Primitive value - inline editing
    // WYSIWYG overlay state
    const [showWysiwyg, setShowWysiwyg] = useState(false);
    const WysiwygEditor = React.useMemo(
      () => require("./WysiwygEditor").default,
      []
    );

    return (
      <div className="flex items-center gap-2 group mb-1 relative">
        {/* Empty space for alignment with arrow */}
        <span className="inline-flex items-center justify-center w-4 flex-shrink-0"></span>
        <div className="flex items-center gap-2 flex-1">
          {label && (
            <span
              className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[200px] flex-shrink-0"
              title={labelTitle || label}
            >
              {label}:
            </span>
          )}
          <input
            value={data === null || data === undefined ? "" : data}
            onChange={(e) => onChange(path, e.target.value)}
            className="flex-1 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-800/50 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:focus:ring-violet-500 focus:border-transparent transition-all"
            placeholder="Zadejte hodnotu..."
          />
          <button
            type="button"
            className="px-2 py-1 text-xs rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-all"
            title="Otevřít WYSIWYG editor"
            onClick={() => setShowWysiwyg(true)}
          >
            <MdOutlineTextFields size={18} />
          </button>
        </div>
        {path.length > 0 && (
          <button
            type="button"
            onClick={() => onChange(path, undefined)}
            className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs rounded-md bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all"
            title="Odstranit"
          >
            ✕
          </button>
        )}
        {/* Overlay pro WYSIWYG editor */}
        {showWysiwyg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl p-6 w-full max-w-2xl relative">
              <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                HTML editor
              </h2>
              <WysiwygEditor
                value={data || ""}
                onChange={(val: string) => onChange(path, val)}
                theme="snow"
                className="mb-4"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  className="px-4 py-1.5 rounded-md bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all"
                  onClick={() => setShowWysiwyg(false)}
                >
                  Zavřít
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default function JsonEditor() {
  const [json, setJson] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/data.json")
      .then(async (res) => {
        const contentType = res.headers.get("content-type");
        if (!res.ok) {
          // If file doesn't exist, start with empty object
          setJson({});
          return null;
        }
        if (!contentType || !contentType.includes("application/json")) {
          const text = await res.text();
          throw new Error("Odpověď není JSON: " + text.slice(0, 100));
        }
        return res.json();
      })
      .then((data) => {
        if (data !== null) {
          setJson(data);
        }
      })
      .catch((err) => {
        // On error, start with empty object
        setJson({});
        setError(null); // Don't show error, just start fresh
      })
      .finally(() => setLoading(false));
  }, []);

  // Add handleSubmit function
  function handleSubmit() {
    // You can implement saving logic here, e.g., send json to server
    alert("Data byla uložena:\n" + JSON.stringify(json, null, 2));
  }

  // Add handleChange function
  function handleChange(path: (string | number)[], value: any) {
    setJson((prev: any) => updateJson(prev, path, value));
  }

  // Function to start new project
  function startNew(type: "object" | "array") {
    setJson(type === "array" ? [] : {});
    setError(null);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              Editor dat
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upravte data a uložte změny
            </p>
          </div>
          {json && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => startNew("object")}
                className="px-3 py-1.5 text-xs rounded-md bg-gray-500 dark:bg-gray-600 text-white hover:bg-gray-600 dark:hover:bg-gray-700 transition-all"
                title="Začít znovu s prázdným záznamem"
              >
                + Nový záznam
              </button>
              <button
                type="button"
                onClick={() => startNew("array")}
                className="px-3 py-1.5 text-xs rounded-md bg-gray-500 dark:bg-gray-600 text-white hover:bg-gray-600 dark:hover:bg-gray-700 transition-all"
                title="Začít znovu s prázdným seznamem"
              >
                + Nový seznam
              </button>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-violet-500 border-t-transparent mb-2"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Načítám data...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50">
            <div className="flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-300 text-sm mb-1">
                  Chyba při načítání
                </h3>
                <p className="text-red-600 dark:text-red-400 text-xs">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {json && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-4 border border-gray-100 dark:border-gray-800/50">
              <JsonEditorForm data={json} onChange={handleChange} />
            </div>

            <div className="sticky bottom-4 bg-white dark:bg-slate-900 rounded-lg shadow-xl p-3 border border-gray-100 dark:border-gray-800/50 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-green-500 dark:from-emerald-600 dark:to-green-600 text-white font-semibold text-sm rounded-lg hover:from-emerald-600 hover:to-green-600 dark:hover:from-emerald-700 dark:hover:to-green-700 transition-all shadow-md hover:shadow-lg"
              >
                Uložit změny
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
