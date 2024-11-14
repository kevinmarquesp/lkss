"use client";

import RedirectErrorBadge from "@/components/redirect-error-badge";
import RedirectNotFoundBadge from "@/components/redirect-notfound-badge";
import RedirectSuccessBadge from "@/components/redirect-success-badge";
import Spinner from "@/components/spinner";
import { useRetrieveUrl } from "@/hooks/use-retrieve-url";

export default function Redirect({ params }: { params: Promise<{ linkId: string }> }) {
  const { result, status, loading } = useRetrieveUrl<{
    id: string;
    url: string;
    updatedAt: string;
  }>(params);

  if (!loading && result && status === 200) {
    window.location.href = result.url;
  }

  return (
    <>
      <main className="h-screen grid place-items-center">
        <section className="flex flex-col items-center gap-4">
          {loading && (
            <>
              <Spinner className="size-16" />
              <p className="text-zinc-400">Querying database...</p>
            </>
          )}
          {(!loading && result && status === 200) && (
            <>
              <RedirectSuccessBadge />
              <p className="text-green-300">Success! Redirecting...</p>
            </>
          )}
          {(!loading && result && status === 404) && (
            <>
              <RedirectNotFoundBadge />
              <p className="text-yellow-300">Short URL not found</p>
            </>
          )}
          {(!loading && result && status === 400) && (
            <>
              <RedirectErrorBadge />
              <p className="text-red-300">Invalid short URL ID</p>
            </>
          )}
        </section>
      </main>
    </>
  );
}
