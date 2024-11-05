import { NextResponse } from "next/server";
import { ZodError } from "zod";

async function routeHandler(location: string, runner: () => Promise<any>) {
  try {
    const response = await runner();

    if (response instanceof NextResponse) {
      return response;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.log(`\n*** ${location} ***\n`);
    console.error(error);

    if (error instanceof ZodError) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ error }, { status: 500 });
  }
}

export {
  routeHandler,
};
