
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { CreateUserDTO, User } from '../types/appScopeTypes';

const db = getFirestore();
const usersCollection = db.collection('users');


export const createUser = async (userData: CreateUserDTO): Promise<User> => {
  try {
    const docRef = await usersCollection.add({
      ...userData,
      date_registered: FieldValue.serverTimestamp(),
      last_login: null,
      is_active: true,
      balance_visibility_default: true
    });

    const createdDoc = await docRef.get();
    const data = createdDoc.data();
    
    return {
      user_id: createdDoc.id,
      ...data
    } as User;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};


export const findUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const snapshot = await usersCollection
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }

    const doc : any = snapshot.docs[0];
    const data = doc.data();
    
    return {
      user_id: doc.id,
      ...data
    } as User;
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
};


export const findUserByPhoneNumber = async (phoneNumber: string): Promise<User | null> => {
  try {
    const snapshot = await usersCollection
      .where('phone_number', '==', phoneNumber)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }

    const doc : any = snapshot.docs[0];
    const data = doc.data();
    
    return {
      user_id: doc.id,
      ...data
    } as User;
  } catch (error) {
    console.error('Error finding user by phone number:', error);
    throw error;
  }
};


export const findUserById = async (userId: string): Promise<User | null> => {
  try {
    const doc = await usersCollection.doc(userId).get();
    
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    
    return {
      user_id: doc.id,
      ...data
    } as User;
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw error;
  }
};


export const updateUserLastLogin = async (userId: string): Promise<boolean> => {
  try {
    await usersCollection.doc(userId).update({
      last_login: FieldValue.serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating last login:', error);
    return false;
  }
};


export const updateUser = async (userId: string, updateData: Partial<User>): Promise<User | null> => {
  try {
    await usersCollection.doc(userId).update(updateData);
    return await findUserById(userId);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};


export const softDeleteUser = async (userId: string): Promise<boolean> => {
  try {
    await usersCollection.doc(userId).update({
      is_active: false
    });
    return true;
  } catch (error) {
    console.error('Error soft deleting user:', error);
    return false;
  }
};