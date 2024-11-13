import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AssertionError } from "./assert";

/**
 *
 */
async function serviceWrapper(location: string, runner: () => Promise<any>) {
  try {
    const response = await runner();

    if (response instanceof NextResponse) {
      return response;
    }

    return NextResponse.json(response);

  } catch (error) {
    if (error instanceof AssertionError) {
      const status = error.status;
      delete error.status;

      return NextResponse.json({
        location,
        error: {
          message: error.message,
          name: error.name,
        },
      }, { status });
    }

    console.log(`\n*** ${location} ***\n`);
    console.error(error);

    if (error instanceof SyntaxError) {
      return NextResponse.json({
        location,
        error: {
          message: error.message,
          name: error.name,
        },
      }, { status: 400 });
    }

    if (error instanceof ZodError) {
      return NextResponse.json({ location, error }, { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({
        location,
        error: {
          message: error.message ?? "Unexpected error",
          cause: error.cause ?? { code: "UNKNOWN" },
        },
      }, { status: 500 });
    }

    return NextResponse.json({ location, error }, { status: 500 });
  }
}

export { serviceWrapper };
