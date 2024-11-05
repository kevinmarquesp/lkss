import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * This function is meant to wrap the main logic of the Next.js API routes (the
 * `route.ts` files). It will parse the returned result of the logic as JSON
 * before responding to the user, or just foward a `NextResponse` if the logic
 * already returns this type. But, most importantly, it will **handle the any
 * errors** that the API can throw, formating into JSON and giving a sumary of
 * what went wrong with the request.
 */
async function routeHandler(location: string, runner: () => Promise<any>) {
  try {
    const response = await runner();

    if (response instanceof NextResponse) {
      return response;
    }

    return NextResponse.json(response);

  } catch (error) {
    // Each error handling part should be a simple if statement with some logic.

    console.log(`\n*** ${location} ***\n`);
    console.error(error);

    if (error instanceof SyntaxError) {
      return NextResponse.json({
        error: {
          message: error.message,
          name: error.name,
        },
      }, { status: 400 });
    }

    if (error instanceof ApiError) {
      const status = error.status;
      delete error.status;

      return NextResponse.json({ error }, { status });
    }

    if (error instanceof ZodError) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ error }, { status: 500 });
  }
}

/**
 * Custom error object for this application, it just let you specify a custom
 * HTTP status code, which the `routeHandler()` function should use on the
 * response calls.
 */
class ApiError extends Error {
  constructor(public message: string, public status: number | undefined) {
    super(message);
  }
}

/**
 * This function is just an assertion mechanism designed to be similar to the
 * `expect()` function form the `jest` (or similars) modules. It was meant to
 * be used in the business logic of the API controllers and only allow to
 * specify a message to throw, if the condition was false, and a status code.
 * If the condition is `true`, then it will do nothing.
 */
function when(condition: boolean) {
  if (!condition) {
    return { throw: (_: string) => ({ status: (_: number) => undefined }) };
  }

  return {
    throw(message: string) {
      return {
        status(status: number) {
          throw new ApiError(message, status);
        },
      };
    },
  };
}

export {
  routeHandler,
  when,
};
