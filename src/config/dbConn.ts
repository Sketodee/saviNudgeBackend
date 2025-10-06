import { db } from "./firebase";
import { config } from 'dotenv';
import admin from 'firebase-admin';

config();

async function dbConn(): Promise<void> {
    const projectId = process.env.FIREBASE_PROJECT_ID;
  try {
    console.log('🔄 Testing Firestore connection...');
    console.log(`📊 Project ID: ${projectId}`);
    
    // Try to write a test document
    const testRef = db.collection('_healthcheck').doc('test');
    await testRef.set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'connected',
      message: 'Firestore is working!'
    });
    
    console.log('✅ Write operation successful!');
    
    // Read it back
    const doc = await testRef.get();
    if (doc.exists) {
      console.log('✅ Read operation successful!');
      console.log('📄 Test document data:', doc.data());
    }
    
    // Clean up
    await testRef.delete();
    console.log('🎉 Firestore connection test passed!');
    
  } catch (error) {
    console.error('❌ Firestore connection test failed!');
    if (error instanceof Error) {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

export default dbConn;

// import { db } from "./firebase";

// async function dbConn(): Promise<void> {
//   try {
//     // Try to access Firestore by listing collections or performing a simple operation
//     const collections = await db.listCollections();
//     const projectId = process.env.FIREBASE_PROJECT_ID;
//     console.log('✅ Successfully connected to Firestore!');
//     console.log(`📊 Database: ${projectId}`);
//     console.log(`📁 Found ${collections.length} collection(s)`);
//   } catch (error) {
//     console.error('❌ Failed to connect to Firestore');
//     if (error instanceof Error) {
//       console.error('Error message:', error.message);
//     }
//     throw error;
//   }
// }

// export default dbConn;