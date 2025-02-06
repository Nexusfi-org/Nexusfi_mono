import axios from 'axios';
import { apiConfig } from '../config/api';
import { logger } from '../utils/logger';

export class ApiService {
    async fetchData(): Promise<any> {
        try {
            const response = await axios.get(apiConfig.url, {
                headers: {
                    'Authorization': `Bearer ${apiConfig.key}`
                }
            });
            return response.data;
        } catch (error) {
            logger.error('Failed to fetch API data', error);
            throw error;
        }
    }
}