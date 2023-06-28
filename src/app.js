import express, { json } from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';
import joi from 'joi';
import dayjs from 'dayjs';

// Middleware
const server = express();
server.use(cors());
server.use(express.json());
dotenv.config();

// MongoDB Connection
let db;
const mongoClient = new MongoClient(process.env.DATABASE_URL);
const PORT = process.env.PORT;

mongoClient.connect()
  .then(() => {
    db = mongoClient.db();
    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1); 
  });

server.post("/participants", async (req, res) => {
    try {
      const { name } = req.body;
  
      console.log(name);
  
      const nameSchema = joi.object({
        name: joi.string().required(),
      });
  
      const { error } = nameSchema.validate({ name });
  
      if (error) {
        return res.sendStatus(422);
      }
  
      const existingUser = await db.collection("participants").findOne({ name });
  
      if (existingUser) {
        return res.sendStatus(409);
      }
  
      const newUser = {
        name,
        lastStatus: Date.now(),
      };
  
      await db.collection("participants").insertOne(newUser);
  
      const now = dayjs().format("HH:mm:ss");
      const newMessage = {
        from: name,
        to: "Todos",
        text: "entra na sala...",
        type: "status",
        time: now,
      };
  
      await db.collection("messages").insertOne(newMessage);
  
      return res.sendStatus(201);
    } catch (err) {
      console.error(err);
      return res.sendStatus(500);
    }
  });
  