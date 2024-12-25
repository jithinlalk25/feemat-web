import * as React from "react";
import { ChevronRightIcon } from "@radix-ui/react-icons";
import { Link } from "react-router-dom";

export interface BreadcrumbItem {
  href: string;
  label: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center text-sm font-medium text-muted-foreground mb-4">
      {items.map((item, index) => (
        <React.Fragment key={item.href}>
          {index > 0 && (
            <ChevronRightIcon className="mx-2 h-4 w-4 text-muted-foreground/40" />
          )}
          <Link
            to={item.href}
            className={`hover:text-foreground ${
              index === items.length - 1 ? "text-foreground font-semibold" : ""
            }`}
          >
            {item.label}
          </Link>
        </React.Fragment>
      ))}
    </nav>
  );
}
