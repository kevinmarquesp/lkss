/**
 *
 */
class AssertionError extends Error {
  constructor(message: string, public status: number | undefined) {
    super(message);

    this.name = "AssertionError";
  }
}

/**
 *
 */
function assert(condition: boolean) {
  if (!condition) {
    return {
      message: (_message: string) => ({
        status: (_status: number) => undefined,
      }),
      status: (_status: number) => undefined,
    };
  }

  return {
    message: (message: string) => ({
      status: (status: number) => {
        throw new AssertionError(message, status);
      },
    }),
    status: (status: number) => {
      throw new AssertionError("Undefined assertion error", status);
    },
  };
}

export {
  AssertionError,
  assert,
};
