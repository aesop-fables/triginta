export function createServiceNamespacer(prefix: string) {
  return (key: string) => {
    return `@aesop-fables/triginta/${prefix}/${key}`;
  };
}
