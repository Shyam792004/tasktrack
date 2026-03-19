import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_KEY = process.env.VITE_GEMINI_KEY;

if (!API_KEY) {
    console.error('VITE_GEMINI_KEY not found in .env');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

async function test() {
    try {
        console.log('Testing Gemini API with key:', API_KEY.substring(0, 10) + '...');
        const result = await model.generateContent('Return exactly "OK"');
        console.log('Response:', result.response.text());
    } catch (error) {
        console.error('Gemini API Error:', error);
    }
}

test();
