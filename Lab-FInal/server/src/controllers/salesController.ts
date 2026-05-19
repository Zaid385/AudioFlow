import { Request, Response } from 'express';
import Sale from '../models/Sale';
import Song from '../models/Song';
import asyncHandler from '../utils/asyncHandler';

/**
 * Helper to get sales statistics
 */
const getSalesStats = async () => {
  const stats = await Sale.aggregate([
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        totalOrders: { $sum: 1 },
      },
    },
  ]);

  const topSelling = await Sale.aggregate([
    {
      $group: {
        _id: '$product',
        count: { $sum: '$quantity' },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 1 },
    {
      $lookup: {
        from: 'songs',
        localField: '_id',
        foreignField: '_id',
        as: 'productInfo',
      },
    },
    { $unwind: '$productInfo' },
  ]);

  return {
    totalRevenue: stats[0]?.totalRevenue || 0,
    totalOrders: stats[0]?.totalOrders || 0,
    topSellingProduct: topSelling[0]?.productInfo?.title || 'N/A',
    lastUpdated: new Date().toLocaleTimeString(),
  };
};

/**
 * Seeds mock sales data if none exists
 */
const seedMockData = async () => {
  const count = await Sale.countDocuments();
  if (count === 0) {
    const songs = await Song.find().limit(5);
    if (songs.length > 0) {
      const mockSales = songs.map((song) => ({
        product: song._id,
        quantity: Math.floor(Math.random() * 10) + 1,
        price: 9.99,
        totalAmount: (Math.floor(Math.random() * 10) + 1) * 9.99,
      }));
      await Sale.insertMany(mockSales);
    }
  }
};

export const getSalesDashboard = asyncHandler(async (req: Request, res: Response) => {
  await seedMockData();
  const stats = await getSalesStats();
  res.render('sales', {
    title: 'Sales Dashboard',
    stats,
    layout: 'layout' // Use express-ejs-layouts
  });
});

export const getSalesData = asyncHandler(async (req: Request, res: Response) => {
  const stats = await getSalesStats();
  res.json(stats);
});
