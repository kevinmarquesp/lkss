import { useState } from "react";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

function useShortner<T>() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<T | null>(null);

  return { shorten, loading, result };

  async function shorten(url: string) {
    setLoading(true);

    await delay(3_000);

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

    setResult(await response.json());
    setLoading(false);
  }
}

export {
  useShortner,
};
