"use client";
import React, { useState, useEffect } from "react";

// Helper to deeply clone and update JSON
function updateJson(obj: any, path: (string | number)[], value: any) {
  if (path.length === 0) return value;
  const [key, ...rest] = path;
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  clone[key] = updateJson(obj[key], rest, value);
  return clone;
}

// Recursive JSON editor
function JsonEditorForm({
  data,
  path = [],
  onChange,
}: {
  data: any;
  path?: (string | number)[];
  onChange: (path: (string | number)[], value: any) => void;
}) {
  if (typeof data === "object" && data !== null) {
    if (Array.isArray(data)) {
      return (
        <div className="ml-0 mb-3 p-3 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-950 dark:to-slate-900 border border-blue-100/50 dark:border-gray-800/50 shadow-sm">
          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-blue-100/30 dark:border-gray-800/30 text-sm">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              Seznam položek
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({data.length})
            </span>
          </div>
          <div className="space-y-3">
            {data.map((item, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-950 rounded-md p-2 border border-gray-100 dark:border-gray-800/40"
              >
                <div className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs font-semibold">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <JsonEditorForm
                      data={item}
                      path={[...path, idx]}
                      onChange={onChange}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onChange([...path, idx], undefined)}
                    className="px-2 py-1 text-xs rounded-md bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all border border-red-200 dark:border-red-800"
                    title="Odebrat položku"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onChange([...path, data.length], null)}
            className="mt-2 w-full px-3 py-1.5 text-xs font-medium rounded-md bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700 transition-all shadow-sm"
          >
            + Přidat novou položku
          </button>
        </div>
      );
    } else {
      return (
        <div className="ml-0 mb-3 p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-950 dark:to-slate-900 border border-dashed border-purple-100/50 dark:border-gray-800/50">
          <div className="space-y-3">
            {Object.entries(data).map(([key, value]) => (
              <div
                key={key}
                className="bg-white dark:bg-slate-950 rounded-md p-2 border border-gray-100 dark:border-gray-800/40"
              >
                <div className="flex items-start gap-3">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 w-32 flex-shrink-0 text-right pt-1.5">
                    {key}
                  </label>
                  <div className="flex-1">
                    <JsonEditorForm
                      data={value}
                      path={[...path, key]}
                      onChange={onChange}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onChange([...path, key], undefined)}
                    className="px-2 py-1 text-xs rounded-md bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all border border-red-200 dark:border-red-800"
                    title="Odebrat pole"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              const newKey = prompt("Zadejte název nového pole:");
              if (newKey) onChange([...path, newKey], null);
            }}
            className="mt-2 w-full px-3 py-1.5 text-xs font-medium rounded-md bg-purple-500 dark:bg-purple-600 text-white hover:bg-purple-600 dark:hover:bg-purple-700 transition-all shadow-sm"
          >
            + Přidat nové pole
          </button>
        </div>
      );
    }
  } else {
    return (
      <input
        value={data === null || data === undefined ? "" : data}
        onChange={(e) => onChange(path, e.target.value)}
        className="w-full px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-800/50 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:focus:ring-violet-500 focus:border-transparent transition-all"
        placeholder="Zadejte hodnotu..."
      />
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
          throw new Error(`Chyba načítání: ${res.status} ${res.statusText}`);
        }
        if (!contentType || !contentType.includes("application/json")) {
          const text = await res.text();
          throw new Error("Odpověď není JSON: " + text.slice(0, 100));
        }
        return res.json();
      })
      .then((data) => setJson(data))
      .catch((err) => setError(err.message))
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            Editor dat
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upravte data a uložte změny
          </p>
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

            <div className="sticky bottom-4 bg-white dark:bg-slate-900 rounded-lg shadow-xl p-3 border border-gray-100 dark:border-gray-800/50">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 dark:from-emerald-600 dark:to-green-600 text-white font-semibold text-sm rounded-lg hover:from-emerald-600 hover:to-green-600 dark:hover:from-emerald-700 dark:hover:to-green-700 transition-all shadow-md hover:shadow-lg"
              >
                💾 Uložit změny
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
