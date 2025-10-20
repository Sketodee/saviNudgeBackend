import admin from 'firebase-admin';
import { config } from 'dotenv';

config();

// Validate and assert environment variables exist
const projectId = process.env.FIREBASE_PROJECT_ID;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

if (!projectId || !privateKey || !clientEmail) {
  throw new Error(
    'Missing required Firebase environment variables. Please check your .env file.'
  );
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    privateKey: privateKey.replace(/\\n/g, '\n'),
    clientEmail
  })
});

const db = admin.firestore();

export { admin, db };

// import * as admin from 'firebase-admin'
// import { Auth } from 'firebase-admin/auth'
// import { Firestore } from 'firebase-admin/firestore'
// import * as dotenv from 'dotenv'

// dotenv.config()

// admin.initializeApp({
//   credential: admin.credential.cert('./serviceAccountKey.json'),
//   databaseURL: process.env.FIREBASE_DATABASE_URL as string
// })

// export const db: Firestore = admin.firestore()
// export const auth: Auth = admin.auth()