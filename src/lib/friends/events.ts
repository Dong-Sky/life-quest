export const FRIENDSHIP_STATE_EVENT = "questline:friendships-updated";

export function notifyFriendshipStateChanged() {
  window.dispatchEvent(new Event(FRIENDSHIP_STATE_EVENT));
}
