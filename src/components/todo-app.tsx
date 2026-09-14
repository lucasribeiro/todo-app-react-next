"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "todos";

function validateTodo(text: string): string | null {
  if (text.length < 3) {
    return "A tarefa deve ter pelo menos 3 caracteres.";
  }
  if (!/^[A-ZÀ-Ý]/.test(text)) {
    return "A tarefa deve começar com letra maiúscula.";
  }
  return null;
}

function loadTodos(): string[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export default function TodoApp() {
  const [todos, setTodos] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // load persisted todos once the component mounts on the client
  useEffect(() => {
    setTodos(loadTodos());
    setHydrated(true);
  }, []);

  // skip the first render so we don't overwrite storage with the initial empty state
  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos, hydrated]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = input.trim();
    const validationError = validateTodo(value);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setTodos((prev) => [...prev, value]);
    setInput("");
  }

  function removeTodo(index: number) {
    setTodos((prev) => prev.filter((_, i) => i !== index));
  }

  function moveTodo(index: number, direction: -1 | 1) {
    setTodos((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-2 flex gap-2" noValidate>
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Digite uma tarefa (Ex: Estudar JavaScript)"
          autoComplete="off"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Adicionar
        </button>
      </form>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <ul className="divide-y divide-gray-200 rounded-md border border-gray-200 bg-white">
        {todos.map((text, index) => (
          <li
            key={`${index}-${text}`}
            className="flex items-center justify-between gap-2 px-4 py-2 text-gray-900"
          >
            <span>{text}</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => moveTodo(index, -1)}
                disabled={index === 0}
                className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveTodo(index, 1)}
                disabled={index === todos.length - 1}
                className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeTodo(index)}
                className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
              >
                Remover
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
