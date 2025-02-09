import mongoose from 'mongoose';

import { dbConfig } from './config/database';
import { apiConfig } from './config/api';
import { ApiService } from './services/api.service';
import { DbService } from './services/db.service';
import { logger } from './utils/logger';


class Indexer {
    private apiService: ApiService;
    private dbService: DbService;

    constructor() {
        this.apiService = new ApiService();
        this.dbService = new DbService();
    }

    async start(): Promise<void> {
        try {
            await mongoose.connect(dbConfig.uri);
            logger.info('Connected to MongoDB');

            // Initial fetch
            await this.fetchAndStore();

            // Schedule subsequent fetches
            setInterval(() => this.fetchAndStore(), apiConfig.interval);
        } catch (error) {
            logger.error('Failed to start indexer', error);
            process.exit(1);
        }
    }

    private async fetchAndStore(): Promise<void> {
        try {
            const data = await this.apiService.fetchData();
            console.log(data);
            
            // await this.dbService.saveData(data);
        } catch (error) {
            logger.error('Error in fetch and store cycle', error);
        }
    }
}

const indexer = new Indexer();
indexer.start();