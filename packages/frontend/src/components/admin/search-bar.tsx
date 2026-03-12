"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Building2, User, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import apiClient from "@/lib/api-client";

interface SearchResult {
  organizations: {
    id: string;
    name: string;
    slug: string;
    billingEmail: string;
  }[];
  users: {
    id: string;
    email: string;
    name: string | null;
  }[];
}

export function AdminSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.get(
        `/admin/dashboard/search?q=${encodeURIComponent(searchQuery)}`
      );
      setResults(response.data);
      setIsOpen(true);
    } catch {
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, search]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut (Cmd+K)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = (type: "organization" | "user", id: string) => {
    setIsOpen(false);
    setQuery("");
    if (type === "organization") {
      router.push(`/admin/creators/${id}`);
    }
    // For users, we could navigate to a user detail page if it exists
  };

  const hasResults =
    results &&
    (results.organizations.length > 0 || results.users.length > 0);

  return (
    <div ref={containerRef} className="relative w-72">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Rechercher... (Cmd+K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="pl-9 pr-8"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
        )}
        {!isLoading && query && (
          <button
            onClick={() => {
              setQuery("");
              setResults(null);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-80 overflow-auto rounded-lg border bg-white shadow-lg">
          {!hasResults && query.length >= 2 && !isLoading && (
            <div className="p-4 text-center text-sm text-gray-500">
              Aucun resultat pour &quot;{query}&quot;
            </div>
          )}

          {hasResults && (
            <>
              {results.organizations.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                    Organisations
                  </div>
                  {results.organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => handleSelect("organization", org.id)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-gray-100"
                    >
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">
                          {org.name}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {org.billingEmail}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.users.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                    Utilisateurs
                  </div>
                  {results.users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelect("user", user.id)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-gray-100"
                    >
                      <User className="h-4 w-4 text-gray-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">
                          {user.name || user.email}
                        </p>
                        {user.name && (
                          <p className="truncate text-xs text-gray-500">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
