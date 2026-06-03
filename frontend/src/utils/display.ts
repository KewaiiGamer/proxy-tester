// Strip .json extension for display purposes
export function displayName(filename: string): string {
  return filename.replace(/\.json$/i, '');
}
