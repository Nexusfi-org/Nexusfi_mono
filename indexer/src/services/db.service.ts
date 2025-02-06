import { ApiData, IApiData } from '../models/ApiData';
import { logger } from '../utils/logger';

export class DbService {
    async saveData(data: any): Promise<IApiData> {
        try {
            const apiData = new ApiData({ data });
            await apiData.save();
            logger.info('Data saved successfully');
            return apiData;
        } catch (error) {
            logger.error('Failed to save data', error);
            throw error;
        }
    }
}