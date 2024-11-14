"use client";

import { z } from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useShortner } from "@/hooks/use-shortner";
import ShortUrlResult from "./short-url-result";

const fieldsSchema = z.object({
  url: z.string().url("Invalid URL string"),
});

type FieldsSchema = z.infer<typeof fieldsSchema>;

export default function ShortenForm() {
  const { shorten, loading, result } = useShortner<{
    id: string;
    url: string;
    updatedAt: string;
  }>();

  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<FieldsSchema>({
    resolver: zodResolver(fieldsSchema),
  });

  return (
    <>
      <form onSubmit={handleSubmit((fields) => shorten(fields.url))}>
        <div className="flex gap-2">
          <Input placeholder="Paste a long URL here" {...register("url")} />
          <Button type="submit" disabled={!isValid}>
            <Sparkles />
            Create
          </Button>
        </div>
      </form>
      <div className="mt-2">
        {loading && (
          <>
            <div role="status" className="size-4 block mx-auto mt-4 animate-spin rounded-full border-2 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                Loading...
              </span>
            </div>
          </>
        )}
        {(result && !loading) && (
          <>
            <ShortUrlResult id={result.id} url={result.url} />
          </>
        )}
      </div>
    </>
  );
}
