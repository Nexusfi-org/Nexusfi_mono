import mongoose, { Document, Schema } from 'mongoose';

export interface IApiData extends Document {
    timestamp: Date;
    data: any;
}

const apiDataSchema = new Schema({
    timestamp: { type: Date, default: Date.now },
    data: Schema.Types.Mixed
});

export const ApiData = mongoose.model<IApiData>('ApiData', apiDataSchema);