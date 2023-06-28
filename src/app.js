import express, { json } from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';
import Joi from 'joi';
import dayjs from 'dayjs';

const server = express();
const PORT = process.env.PORT || 3000;

// Middleware
server.use(cors());
server.use(json());
dotenv.config();

// MongoDB Connection
const databaseUrl = process.env.DATABASE_URL;
const mongoClient = new MongoClient(databaseUrl, { useNewUrlParser: true, useUnifiedTopology: true });

mongoClient.connect()
  .then(() => {
    const db = mongoClient.db();

    // Start the server after successful database connection
    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1); // Exit the process with failure
  });
