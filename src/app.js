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
  .then(() => db = mongoClient.db())
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1); 
  });

// Create a Or Add to MongoDB Connection
server.post("/participants", async (req, res) => {
    try {
      const { name } = req.body;
  
      console.log(name);
  
      const nameSchema = joi.object({
        name: joi.string().required(),
      });
  
      const { error } = nameSchema.validate({ name });
  
      if (error) return res.sendStatus(422);
    
      const existingUser = await db.collection("participants").findOne({ name });
  
      if (existingUser) return res.sendStatus(409);
  
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

// Get Participants from MongoDB
server.get('/participants', async (req, res) => {
    try {
        let participants = [];
        participants = await db.collection('participants').find().toArray();
        res.send(participants);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
});

server.post('/messages', async (req, res) => {
  try {
      const { to, text, type } = req.body;
      const { user } = req.headers;
      console.log(user);
      console.log(to);
      console.log(text);
      console.log(type);
      const messageSchema = joi.object({
          to: joi.string().required(),
          text: joi.string().required(),
          type: joi.string().required().valid("message").valid("private_message"),
      })
      const validate = messageSchema.validate(req.body);
      console.log(validate.error)
      if (validate.error) return res.sendStatus(422);
      const validateUser = await db.collection("participants").findOne({ name: user });
      console.log(validateUser);
      if (!validateUser) {
          return res.sendStatus(422);
      }

      const now = dayjs().format("HH:mm:ss");

      const newMessage = {
          from: user,
          to: to,
          text: text,
          type: type,
          time: now
      };

      await db.collection("messages").insertOne(newMessage);

      return res.sendStatus(201);
  } catch (error) {
      console.error(error);
      res.sendStatus(500);
  }

});

server.get('/messages', async (req, res) => {
  try {
      const { user } = req.headers;
      const limit = req.query.limit;
      if ((Number(limit) <= 0 || isNaN(limit)) && limit !== undefined) {
          return res.sendStatus(422);
      }
      let messages = [];
      messages = await db.collection('messages').find({ $or: [{ $or: [{ to: user }, { from: user }] }, { $or: [{ to: "Todos" }, { from: "Todos" }] }] }).toArray();

      if (Number(limit)) {
          const tamanho = messages.length;
          if (Number(limit) < tamanho) {
              return res.send(messages.slice(tamanho - Number(limit)));
          }
      }
      res.send(messages);
  } catch (error) {
      console.error(error);
      res.sendStatus(500);
  }
});

server.post('/status', async (req, res) => {
  try{
      const { user } = req.headers;
      if(!user){
          return res.sendStatus(404);
      }
      const validate = await db.collection("participants").findOne({ name: user });
      if(!validate){
          return res.sendStatus(404);
      }
      await db.collection("participants").updateOne({ name: user }, 
      {
          $set: {
              lastStatus: Date.now()                
          }
      })
      return res.sendStatus(200);
  } catch (error) {
      console.error(error);
      res.sendStatus(500);
  }
})

async function validateStatus(){
  const participants = await db.collection('participants').find().toArray();
  const nowTime = Date.now();

  for(let i = 0; i < participants.length; i++){
      if((nowTime - participants[i].lastStatus) > 10000 ){
          const now = dayjs().format("HH:mm:ss");
          const newMessage = { 
              from: participants[i].name,
              to: 'Todos',
              text: 'sai da sala...',
              type: 'status',
              time: now
          }

          await db.collection("participants").deleteOne({ name: participants[i].name });
          await db.collection("messages").insertOne(newMessage);
      }
  }
}

const myInterval = setInterval(validateStatus, 15000);

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});