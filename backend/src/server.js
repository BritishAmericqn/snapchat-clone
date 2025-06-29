import dotenv from 'dotenv';
// Load environment variables FIRST, before any other imports
dotenv.config();

import express from 'express';
import cors from 'cors';
import ragRoutes from './routes/ragRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ... existing code ... 