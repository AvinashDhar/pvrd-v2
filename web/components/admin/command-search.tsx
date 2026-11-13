"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { adminNav } from "@/lib/nav";
import type { AdminSearchIndex } from "@/lib/records";

export function CommandSearch({ search }: { search: AdminSearchIndex }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid size-10 place-items-center rounded-full border border-black/6 bg-white text-foreground shadow-[0_1px_2px_rgba(0,44,84,0.04)] transition-all hover:border-lime hover:shadow-[0_8px_24px_rgba(163,203,70,0.16)] md:hidden"
        aria-label="Search"
      >
        <Search className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-10 w-full max-w-xl items-center gap-3 rounded-full border border-black/6 bg-white px-4 text-sm text-muted-foreground shadow-[0_1px_2px_rgba(0,44,84,0.04)] transition-all hover:border-lime hover:shadow-[0_8px_24px_rgba(163,203,70,0.16)] md:flex"
      >
        <Search className="size-4" />
        <span className="flex-1 truncate text-left">Search products, categories, brands, users...</span>
        <kbd className="hidden rounded-md border border-black/8 bg-muted px-1.5 py-0.5 text-[10px] font-medium lg:inline">
          ⌘K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search">
        <Command>
        <CommandInput placeholder="Jump to a page, product, brand or user..." />
        <CommandList>
          <CommandEmpty>No matches found.</CommandEmpty>
          <CommandGroup heading="Modules">
            {adminNav.map((item) => (
              <CommandItem key={item.href} onSelect={() => go(item.href)}>
                <item.icon />
                {item.title}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Products">
            {search.products.map((product) => (
              <CommandItem
                key={product.id}
                onSelect={() => go(`/admin/products/${product.id}`)}
              >
                {product.name}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Categories">
            {search.categories.map((category) => (
              <CommandItem
                key={category.id}
                onSelect={() => go(`/admin/categories/${category.id}`)}
              >
                {category.name}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Brands">
            {search.brands.map((brand) => (
              <CommandItem key={brand.id} onSelect={() => go(`/admin/brands/${brand.id}`)}>
                {brand.name}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Users">
            {search.users.map((user) => (
              <CommandItem key={user.id} onSelect={() => go("/admin/users")}>
                {user.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
