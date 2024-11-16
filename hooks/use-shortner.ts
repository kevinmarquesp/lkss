import { useState } from "react";

function useShortner() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown | null>(null);
  const [error, setError] = useState<unknown | null>(null);
  const [status, setStatus] = useState<number | null>(null);

  return { shorten, loading, status, result, error };

  async function shorten(url: string) {
    setLoading(true);

    try {
      const response = await fetch("/api/v1/create", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url,
        }),
      });

      setStatus(response.status);
      setResult(await response.json());

    } catch (err) {
      console.warn(err);
      setError(err);
    }

    setLoading(false);
  }
}

export {
  useShortner,
};
