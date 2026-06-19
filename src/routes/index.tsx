import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TRENDZN" },
      { name: "description", content: "TRENDZN" },
      { property: "og:title", content: "TRENDZN" },
      { property: "og:description", content: "TRENDZN" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-7xl">
        TRENDZN
      </h1>
    </div>
  );
}

