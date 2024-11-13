/**
 * Custom error that holds the status code, which will be useful for the API
 * error handling mechanism (a `try catch` wrapper function, in this case).
 * It's intended to be only thrown by the `assert` function in this module.
 */
class AssertionError extends Error {
  constructor(message: string, public status: number | undefined) {
    super(message);

    this.name = "AssertionError";
  }
}

/**
 * Just thrown an `AssertionError` if the assertion condition is `true`. The
 * return type is all weird to allow this `assert().message().status()` design.
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
