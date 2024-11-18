function capitalizeFirstLetter(str: string) {
  return String(str).charAt(0).toUpperCase() + String(str).slice(1);
}

export { capitalizeFirstLetter };
