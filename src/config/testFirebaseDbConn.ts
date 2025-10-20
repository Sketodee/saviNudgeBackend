import { db } from "./firebase";
import { config } from 'dotenv';
import admin from 'firebase-admin';

config();

async function testFirebaseDbConn(): Promise<void> {
    const projectId = process.env.FIREBASE_PROJECT_ID;
  try {
    console.log('🔄 Testing Firestore connection...');
    // console.log(`📊 Project ID: ${projectId}`);
    
    // Try to write a test document
    const testRef = db.collection('_healthcheck').doc('test');
    await testRef.set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'connected',
      message: 'Firestore is working!'
    });
    
    // console.log('✅ Write operation successful!');
    
    // Read it back
    const doc = await testRef.get();
    if (doc.exists) {
      // console.log('✅ Read operation successful!');
      // console.log('📄 Test document data:', doc.data());
    }
    
    // Clean up
    await testRef.delete();
    console.log('✅ Suuccessfully connected to Firestore!');
    
  } catch (error) {
    console.error('❌ Firestore connection test failed!');
    if (error instanceof Error) {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

export default testFirebaseDbConn;

