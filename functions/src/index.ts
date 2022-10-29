import * as functions from "firebase-functions";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { lookup } from "mime-types";
import * as path from "path";
import { v4 } from "uuid";

initializeApp({
  credential: cert(path.join(__dirname, "./serviceAccountKey.json")),
  // storageBucket: "*.appspot.com",
});

const db = getFirestore();
const storage = getStorage();

export const newUserSetup = functions.auth.user().onCreate((user) => {
  const { uid, email, displayName, photoURL } = user;
  return db.collection("users").doc(uid).set({
    email,
    displayName,
    photoURL,
    storageUsed: 0,
    storageLimit: 1000000000,
    fileCount: 0,
  });
});

export const getUploadSignedUrls = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to call this function"
      );
    }
    const { files } = data as { files: IncomingFile[] };
    const { uid } = context.auth;

    const bucket = storage.bucket();

    const totalUploadSize = files.reduce((acc, file) => acc + file.size, 0);
    await hasEnoughStorage(uid, totalUploadSize);

    const urlPromises = files.map((file) => {
      const { name, size } = file;
      const fileType = lookup(name) || "application/octet-stream";
      const fileId = v4() + path.extname(name);
      const fileRef = bucket.file(`users/${uid}/${fileId}`);

      return fileRef.getSignedUrl({
        version: "v4",
        action: "write",
        expires: Date.now() + 10 * 60 * 1000,
        contentType: fileType,
        extensionHeaders: {
          "Content-Length": size,
        },
      });
    });

    const responses = await Promise.all(urlPromises);

    const signedUrls = responses.reduce((acc, [url], i) => {
      acc[files[i].name] = url;
      return acc;
    }, {} as Record<string, string>);

    await updateStorageUsed(uid, files.length, totalUploadSize);

    return { result: signedUrls };
  }
);

const hasEnoughStorage = async (uid: string, size: number) => {
  const user = await db.collection("users").doc(uid).get();
  const { storageUsed, storageLimit } = user.data()!;

  if (storageUsed + size > storageLimit) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Not enough storage available"
    );
  }

  return true;
};

const updateStorageUsed = async (uid: string, count: number, size: number) => {
  return await db
    .collection("users")
    .doc(uid)
    .update({
      storageUsed: FieldValue.increment(size),
      fileCount: FieldValue.increment(count),
    });
};
