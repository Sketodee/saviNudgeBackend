import { Request, Response } from "express";
import { db } from "../config/firebase";

const testController = {
  getTest: async (req: Request, res: Response) => {
    try {
    // const { name, email, age } = req.body;
    
    const userRef = await db.collection('users').add({
      name: "James",
      email: "shobandeJames",
      age : 20,
      createdAt: new Date().toISOString()
    });
    
    res.status(201).json({
      message: 'User created successfully',
      id: userRef.id
    });
  } catch (error:any) {
    res.status(500).json({ error: error.message });
  }
  },
};

export default testController;