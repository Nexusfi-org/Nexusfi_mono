import axios from 'axios';
import { apiConfig } from '../config/api';
import { logger } from '../utils/logger';

export class ApiService {
    async fetchData(): Promise<any> {
        try {
            console.log(`${apiConfig.url}/v1/account/${apiConfig.watchedAccount}/ft`);
            
            const response = await axios.get(`${apiConfig.url}/v0/public_key/${apiConfig.watchedAccount}`);
            return response.data;
        } catch (error) {
            logger.error('Failed to fetch API data', error);
            throw error;
        }
    }
}