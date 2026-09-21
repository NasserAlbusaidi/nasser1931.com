export function readingAnchor(title: string, author: string | null, status: string) {
  const slug = `${status}-${title}-${author ?? ''}`.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `book-${slug}`;
}
