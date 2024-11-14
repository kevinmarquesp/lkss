import { useEffect, useState } from "react";

function useRetrieveUrl<T>(params: Promise<{ linkId: string; }>) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<T | null>(null);
  const [status, setStatus] = useState<number | null>(null);

  useEffect(() => {
    fetchRedirectionUrl();

    async function fetchRedirectionUrl() {
      const id = (await params).linkId;

      const response = await fetch(`/api/v1/${id}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
      });

      setStatus(response.status);
      setResult(await response.json());
      setLoading(false);
    }
  }, []);

  return { result, status, loading };
}

export {
  useRetrieveUrl,
};
