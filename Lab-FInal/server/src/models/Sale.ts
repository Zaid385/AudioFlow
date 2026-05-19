import mongoose, { Schema, Document } from 'mongoose';

export interface ISale extends Document {
  product: mongoose.Types.ObjectId | string;
  quantity: number;
  price: number;
  totalAmount: number;
  createdAt: Date;
}

const saleSchema: Schema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Song', required: true },
  quantity: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.model<ISale>('Sale', saleSchema);
