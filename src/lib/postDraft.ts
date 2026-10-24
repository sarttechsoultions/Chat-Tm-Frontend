import type { FriendUser } from "./auth";

export type PostDraft = {
  heading: string;
  caption: string;
  privacy: "PUBLIC" | "FRIENDS" | "PRIVATE";
  location: string;
  feeling: string;
  tagged: FriendUser[];
  files: File[];
};

type StoredDraft = PostDraft & { userId: string; savedAt: number };
const DATABASE = "chattm-post-drafts";
const STORE = "drafts";

async function openDraftDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "userId" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Draft storage is unavailable"));
    request.onblocked = () => reject(new Error("Close other ChatTm tabs to enable draft storage"));
  });
}

// IndexedDB stores File objects without converting large media to text.
async function draftTransaction<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  const database = await openDraftDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(STORE, mode);
      const request = run(transaction.objectStore(STORE));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = () => reject(transaction.error || new Error("Unable to save draft"));
      transaction.onerror = () => reject(transaction.error || new Error("Unable to save draft"));
    });
  } finally {
    database.close();
  }
}

export async function readPostDraft(userId: string): Promise<PostDraft | null> {
  const draft = await draftTransaction<StoredDraft | undefined>("readonly", store => store.get(userId));
  if (!draft || draft.userId !== userId) return null;
  return {
    heading: draft.heading, caption: draft.caption, privacy: draft.privacy,
    location: draft.location, feeling: draft.feeling, tagged: draft.tagged,
    files: draft.files.map(file => new File([file], file.name, { type: file.type, lastModified: file.lastModified })),
  };
}

export async function writePostDraft(userId: string, draft: PostDraft) {
  await draftTransaction("readwrite", store => store.put({ ...draft, userId, savedAt: Date.now() } satisfies StoredDraft));
}

export async function removePostDraft(userId: string) {
  await draftTransaction("readwrite", store => store.delete(userId));
}

export function postDraftFingerprint(draft: PostDraft, mediaIds: string[] = []) {
  return JSON.stringify({
    ...draft, tagged: draft.tagged.map(person => person.id), mediaIds,
    files: draft.files.map(file => [file.name, file.type, file.size, file.lastModified]),
  });
}
