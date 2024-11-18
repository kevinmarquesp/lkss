"use client";

import { z } from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { useShortner } from "@/hooks/use-shortner";
import ShortUrlResult from "./short-url-result";
import Spinner from "./spinner";
import { isType } from "@/utils/types";
import { PublicLinksSchema } from "@/db/schema";
import { toast } from "sonner";
import { ApiErrorResponse } from "@/utils/api";
import { capitalizeFirstLetter } from "@/utils/strings";

const fieldsSchema = z.object({
  url: z.string().url("Invalid URL string"),
});

type FieldsSchema = z.infer<typeof fieldsSchema>;

export default function ShortenForm() {
  const { shorten, loading, result, error } = useShortner();
  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<FieldsSchema>({
    resolver: zodResolver(fieldsSchema),
  });

  useEffect(() => {
    if (isType<ApiErrorResponse>(result, ["error"])) {
      toast("Short URL creation failed!", {
        description: capitalizeFirstLetter(result.error.message),
      });

    } else if (error) {
      toast("Something went wrong.");
    }
  }, [error, result]);

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
            <Spinner className="size-4 mt-6 mx-auto" />
          </>
        )}
        {(isType<PublicLinksSchema>(result, ["id", "url"]) && !loading) && (
          <>
            <ShortUrlResult id={result.id} url={result.url} />
          </>
        )}
      </div >
    </>
  );
}
