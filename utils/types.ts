function isType<T>(object: any, keys: (keyof T)[]): object is T {
  return typeof object === "object" && object !== null && keys.every(key => key in object);
}

export { isType };
