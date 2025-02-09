import dotenv from 'dotenv';

dotenv.config();

export const apiConfig = {
    url: process.env.API_URL || 'https://api.example.com/data',
    key: process.env.API_KEY || '',
    interval: 60000,
    watchedAccount: process.env.CONTRACT_ID,
};