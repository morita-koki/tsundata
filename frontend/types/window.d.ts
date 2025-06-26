export {};

declare global {
  interface WindowEventMap {
    bookshelfUpdated: Event;
  }
}