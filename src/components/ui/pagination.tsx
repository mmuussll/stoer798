import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return <nav role="navigation" aria-label="pagination" className={cn("mx-auto flex w-full justify-center", className)} {...props} />;
}

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul className={cn("flex flex-row items-center gap-1", className)} {...props} />;
}

function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("", className)} {...props} />;
}

function PaginationPrevious({ className, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button aria-label="Go to previous page" size="default" className={cn("gap-1 pl-2.5", className)} variant="outline" {...props}>
      <ChevronLeft className="h-4 w-4" />
      <span>Previous</span>
    </Button>
  );
}

function PaginationNext({ className, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button aria-label="Go to next page" size="default" className={cn("gap-1 pr-2.5", className)} variant="outline" {...props}>
      <span>Next</span>
      <ChevronRight className="h-4 w-4" />
    </Button>
  );
}

function PaginationLink({ className, isActive, ...props }: React.ComponentProps<typeof Button> & { isActive?: boolean }) {
  return (
    <Button
      aria-current={isActive ? "page" : undefined}
      variant={isActive ? "default" : "outline"}
      size="icon"
      className={cn("h-10 w-10", className)}
      {...props}
    />
  );
}

export { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink };
