import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const dbConfig = {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/indexer',
    options: {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
};