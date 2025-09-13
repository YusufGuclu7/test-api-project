// backend/src/index.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const https = require('https');
const { PrismaClient } = require('@prisma/client');
const cron = require('node-cron');
const crypto = require('crypto');

const prisma = new PrismaClient();
const app = express();

const corsOptions = {
    origin: [
        'https://test-api-project-one.vercel.app',
        'https://test-api-project-git-main-yusufguclu7s-projects.vercel.app',
        'http://localhost:3000'
    ],
    methods: ['GET', 'POST', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

const TOKEN_URL = process.env.TOKEN_URL;
const DATA_URL = process.env.DATA_URL;
const API_USER = process.env.API_USER;
const API_PASS = process.env.API_PASS;

const agent = new https.Agent({ rejectUnauthorized: false });
let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  try {
    const res = await axios.post(TOKEN_URL, {}, {
      auth: { username: API_USER, password: API_PASS },
      headers: { 'Content-Type': 'application/json' },
      httpsAgent: agent
    });
    const token = res.data?.response?.token;
    if (!token) throw new Error('Token yok dönen cevapta');
    cachedToken = token;
    tokenExpiry = Date.now() + 10 * 60 * 1000;
    console.log('Token alındı ve cachelendi.');
    return token;
  } catch (error) {
    console.error('Token alma hatası:', error?.response?.data || error.message);
    throw error;
  }
}

async function syncFromApi() {
  try {
    const token = await getToken();
    const res = await axios.patch(DATA_URL, { fieldData: {}, script: 'getData' }, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      httpsAgent: agent
    });

    const scriptResult = res.data?.response?.scriptResult;
    if (!scriptResult) {
      console.log('API’den veri gelmedi.');
      return;
    }

    const arr = JSON.parse(scriptResult);
    if (!Array.isArray(arr)) {
      console.log('Dönen veri array formatında değil.');
      return;
    }

    for (const item of arr) {
      const unique = item.id ?? item.externalId ?? item.code ?? crypto.createHash('md5').update(JSON.stringify(item)).digest('hex');
      const code = (item.code ?? String(unique)).toString();

      await prisma.record.upsert({
        where: { externalId: String(unique) },
        update: {
          code,
          debt: parseFloat(item.debt ?? 0),
          credit: parseFloat(item.credit ?? 0),
          rawData: item
        },
        create: {
          externalId: String(unique),
          code,
          debt: parseFloat(item.debt ?? 0),
          credit: parseFloat(item.credit ?? 0),
          rawData: item
        }
      });
    }

    console.log(`Sync tamamlandı, ${arr.length} kayıt işlendi.`);
  } catch (err) {
    console.error('syncFromApi hata:', err?.response?.data || err.message || err);
  }
}

cron.schedule('*/5 * * * *', () => {
  console.log('Cron tetiklendi, API’den veri senkronize ediliyor:', new Date().toISOString());
  syncFromApi();
});

app.get('/api/reports', async (req, res) => {
  try {
    const records = await prisma.record.findMany();

    function formatKey(code) {
      const s = code ?? '';
      const a = s.slice(0, 3);
      const b = s.slice(3, 5);
      const c = s.slice(5, 8);
      return [a, b, c].filter(Boolean).join('.');
    }

    const map = {};
    for (const r of records) {
      const key = formatKey(r.code ?? r.externalId);
      if (!map[key]) {
        map[key] = { key, debt: 0, credit: 0, count: 0, items: [] };
      }
      map[key].debt += Number(r.debt ?? 0);
      map[key].credit += Number(r.credit ?? 0);
      map[key].count += 1;
      map[key].items.push(r);
    }
    const out = Object.values(map).sort((a, b) => a.key.localeCompare(b.key));
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server hata' });
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.get('/', (req, res) => res.send('Backend çalışıyor!'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend çalışıyor port: ${PORT}`));