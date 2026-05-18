import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  mongoUri: process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster.mongodb.net/cyberaudit?retryWrites=true&w=majority',
};

export default config;
