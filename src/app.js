import express from 'express';
import { config } from 'dotenv';
import { MongoClient } from 'mongodb';

config();
const app = express();

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

const client = new MongoClient(process.env.DATABASE_URL);
