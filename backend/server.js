const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');
const app = express();
const port = 8080;
require('dotenv').config();
const client = new MongoClient(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const Charts_API_KEY = 'n2w9H7t7RmcCGa0g1Kyp7Yq4dvIIoEgW';

app.use(cors());
app.use(express.json());

const FINNHUB_API_KEY = 'cn40h9pr01qtsta4c4l0cn40h9pr01qtsta4c4lg';
// Autocomplete API
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).send('Query parameter "q" is required');
  }

  try {
    const finnhubResponse = await axios.get(`https://finnhub.io/api/v1/search?q=${query}&token=${FINNHUB_API_KEY}`);
    const filteredResults = finnhubResponse.data.result.filter(item => item.type === 'Common Stock' && !item.symbol.includes('.'));
    res.json(filteredResults);
  } catch (error) {
    console.error('Error calling Finnhub API:', error);
    res.status(500).send('Error fetching stock data');
  }
});
app.get('/api/historical/:ticker/:quotetime', async (req, res) => {
  const ticker = req.params.ticker;
  const quotetime = req.params.quotetime;
  console.log(ticker, quotetime);


  let date = new Date(parseInt(quotetime) * 1000);
  if (date.getMonth() < 10) {
    var month = '0' + (date.getMonth() + 1);
} else {
    var month = date.getMonth() + 1;
}
if (date.getDate() < 10) {
    var day = '0' + date.getDate();
} else {
    var day = date.getDate();
}
const todayd = date.getFullYear() + '-' + month + '-' + day;

const yesterdayd = date.getFullYear() + '-' + month + '-'+(day-1);

  
  const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/hour/${todayd}/${todayd}?adjusted=true&sort=asc&apiKey=${Charts_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching data from Polygon:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});


app.get('/api/stock-profile', async (req, res) => {
    const ticker = req.query.ticker;
    if (!ticker) {
      return res.status(400).json({ error: 'Ticker query parameter is required' });
    }
  
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${FINNHUB_API_KEY}`);
      res.json(response.data);
    } catch (error) {
      console.error('Failed to fetch stock profile from Finnhub:', error);
      res.status(500).json({ error: 'Failed to fetch stock profile' });
    }
  });
  app.get('/api/stock-quote', async (req, res) => {
    const symbol = req.query.symbol;
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol query parameter is required' });
    }
  
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
      res.json(response.data);
    } catch (error) {
      console.error('Failed to fetch stock quote from Finnhub:', error);
      res.status(500).json({ error: 'Failed to fetch stock quote' });
    }
  });
  app.get('/api/stock-peers', async (req, res) => {
    const ticker = req.query.ticker;
    if (!ticker) {
      return res.status(400).json({ error: 'Symbol query parameter is required' });
    }
  
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/stock/peers?symbol=${ticker}&token=${FINNHUB_API_KEY}`);
      res.json(response.data);
    } catch (error) {
      console.error('Failed to fetch stock quote from Finnhub:', error);
      res.status(500).json({ error: 'Failed to fetch stock quote' });
    }
  });

  app.get('/api/filtered-company-news/:ticker', async (req, res) => {
    const { ticker } = req.params;
    const toDate = new Date().toISOString().split('T')[0];
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);
    const fromDateString = fromDate.toISOString().split('T')[0];
  
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${fromDateString}&to=${toDate}&token=${FINNHUB_API_KEY}`);
      const filteredNews = response.data.filter(news =>
        news.source && news.datetime && news.headline && news.summary && news.url && news.image
      ).slice(0, 20); 
      res.json(filteredNews);
    } catch (error) {
      res.status(500).send('Error fetching filtered company news');
    }
  });
  app.get('/api/stock/insider-sentiment', async (req, res) => {
    const ticker = req.query.ticker;
    // const from = 2022-01-01;
    if (!ticker) {
      return res.status(400).json({ error: 'Ticker query parameter is required' });
    }
  
    try {
      const sentimentUrl = `https://finnhub.io/api/v1/stock/insider-sentiment?symbol=${ticker}&from=2022-01-01&token=${FINNHUB_API_KEY}`;
      const sentimentResponse = await axios.get(sentimentUrl);
      res.json(sentimentResponse.data);
    } catch (error) {
      console.error('Failed to fetch insider sentiment from Finnhub:', error);
      res.status(500).json({ error: 'Failed to fetch insider sentiment' });
    }
  });
  app.get('/api/stock/recommendation/:ticker', async (req, res) => {
    const { ticker } = req.params;
    // const from = 2022-01-01;
    if (!ticker) {
      return res.status(400).json({ error: 'Ticker query parameter is required' });
    }
  
    try {
      const recommendationUrl = `https://finnhub.io/api/v1/stock/recommendation?symbol=${ticker}&token=${FINNHUB_API_KEY}`;
      const recommendationResponse = await axios.get(recommendationUrl);
      res.json(recommendationResponse.data);
    } catch (error) {
      console.error('Failed to fetch recommendation from Finnhub:', error);
      res.status(500).json({ error: 'Failed to fetch recommendation' });
    }
  });
  app.get('/api/stock/earnings/:ticker', async (req, res) => {
    const { ticker } = req.params;
    // const from = 2022-01-01;
    if (!ticker) {
      return res.status(400).json({ error: 'Ticker query parameter is required' });
    }
  
    try {
      const earningsUrl = `https://finnhub.io/api/v1/stock/earnings?symbol=${ticker}&token=${FINNHUB_API_KEY}`;
      const earningsResponse = await axios.get(earningsUrl);
      res.json(earningsResponse.data);
    } catch (error) {
      console.error('Failed to fetch earnings from Finnhub:', error);
      res.status(500).json({ error: 'Failed to fetch earnings' });
    }
  });

  const runServer = async () => {
    try {
      await client.connect();
      console.log('Connected to MongoDB');
      const db = client.db('HW3-Mongo'); 
      const watchlistCollection = db.collection('watchlist');
      const walletCollection = db.collection('wallets');
      const portfolioCollection = db.collection('portfolios');

      await initializeDefaultWallet('rushabh75');
  
      
      app.get('/api/watchlist/:userId', async (req, res) => {
        const { userId } = req.params;
        try {
          const watchlist = await watchlistCollection.find({ userId }).toArray();
          res.json(watchlist);
        } catch (error) {
          res.status(500).send(error.message);
        }
      });
  
      
      app.post('/api/watchlist', async (req, res) => {
        try {
          const { userId, symbol, name, currentPrice, change, changePercent } = req.body;
          const result = await watchlistCollection.insertOne({
            userId,
            symbol,
            name,
            currentPrice,
            change,
            changePercent,
          });
          res.status(201).send(result);
        } catch (error) {
          res.status(500).send(error.message);
        }
      });
  
      
      app.delete('/api/watchlist/:userId/:symbol', async (req, res) => {
        const { userId, symbol } = req.params;
        try {
          const result = await watchlistCollection.deleteOne({ userId, symbol });
          if (result.deletedCount === 0) {
            return res.status(404).send({ message: 'Item not found in watchlist.' });
          }
          res.send({ message: 'Item removed from watchlist.' });
        } catch (error) {
          res.status(500).send(error.message);
        }
      });

      app.post('/api/wallet/:userId', async (req, res) => {
        const { userId } = req.params;
        try {
          const result = await walletCollection.updateOne(
            { userId },
            { $set: { balance: 25000 } },
            { upsert: true }
          );
          if (result.upsertedCount > 0) {
            console.log('Wallet initialized for userId:', userId);
          } else if (result.modifiedCount > 0) {
            console.log('Wallet updated for userId:', userId);
          }
          res.status(201).json({ message: 'Wallet initialized or updated', userId: userId, balance: 25000 });
        } catch (error) {
          console.error('Error initializing or updating wallet:', error);
          res.status(500).send({ message: 'Error initializing or updating wallet', error: error.message });
        }
      });
  
     
      app.get('/api/wallet/:userId', async (req, res) => {
        const { userId } = req.params;
        try {
          const wallet = await walletCollection.findOne({ userId });
          if (!wallet) {
            return res.status(404).send('Wallet not found');
          }
          res.json(wallet);
        } catch (error) {
          res.status(500).send('Error fetching wallet');
        }
      });
      app.get('/api/portfolio/:userId', async (req, res) => {
        const { userId } = req.params;
        try {
          const portfolioItems = await portfolioCollection.find({ userId }).toArray();
          res.json(portfolioItems);
        } catch (error) {
          res.status(500).send(error.message);
        }
      });
  
     
      app.post('/api/portfolio/buy', async (req, res) => {
        const { userId, symbol, quantity, purchasePrice } = req.body;
        const totalCost = quantity * purchasePrice;
        const avg = totalCost/quantity;
  
        
        if (!userId || !symbol || !quantity || !purchasePrice) {
          return res.status(400).send('Missing required fields');
        }
  
       
        const walletUpdate = await walletCollection.findOneAndUpdate(
          { userId },
          { $inc: { balance: -totalCost } },
          { returnDocument: 'after' }
        );
  
        if (!walletUpdate.value || walletUpdate.value.balance < 0) {
          return res.status(400).send('Insufficient funds');
        }
  
        
        await portfolioCollection.updateOne(
          { userId, symbol },
          { $inc: { quantity: quantity, totalCost: totalCost, avg: avg }, $set: { symbol: symbol } },
          { upsert: true }
        );
  
        res.status(201).send('Stock purchased successfully');
      });
  
      
      app.post('/api/portfolio/sell', async (req, res) => {
        const { userId, symbol, quantity, sellPrice } = req.body;
        const totalGain = quantity * sellPrice;
  
        if (!userId || !symbol || !quantity || !sellPrice) {
          return res.status(400).send('Missing required fields');
        }
  
        const portfolioItem = await portfolioCollection.findOne({ userId, symbol });
  
        if (!portfolioItem || portfolioItem.quantity < quantity) {
          return res.status(400).send('Not enough stock to sell');
        }
  
        
        if (portfolioItem.quantity === quantity) {
          await portfolioCollection.deleteOne({ userId, symbol });
        } else {
          await portfolioCollection.updateOne(
            { userId, symbol },
            { $inc: { quantity: -quantity, totalCost: -totalGain, avg: sellPrice } }
          );
        }
  
        
        await walletCollection.findOneAndUpdate(
          { userId },
          { $inc: { balance: totalGain } }
        );
  
        res.status(200).send('Stock sold successfully');
      });
      async function initializeDefaultWallet(userId) {
        const defaultBalance = 25000; // Define the default balance
        try {
            const result = await walletCollection.findOneAndUpdate(
                { userId },
                { $setOnInsert: { balance: defaultBalance } },
                { upsert: true, returnDocument: 'after' }
            );
            console.log(`Wallet for ${userId} initialized or already exists.`);
        } catch (error) {
            console.error(`Error initializing wallet for ${userId}:`, error);
        }
      }

    // app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  
    } catch (e) {
      console.error(e);
    }
  };
  
  runServer().catch(console.dir);
  
  app.get('/api/mainchart/:ticker', async (req, res) => {
    const {ticker} = req.params;
    const currentDate = new Date();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const pastDate = new Date(currentDate.setFullYear(currentDate.getFullYear() - 2));
    const twoYearsAgo = pastDate.toISOString().split('T')[0];
    
    const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${twoYearsAgo}/${today}?adjusted=true&sort=asc&apiKey=${Charts_API_KEY}`;

    try {
        const response = await fetch(url);
        if (response.ok) { 
            const data = await response.json();
           
            if(data && data.results && data.results.length > 0) {
                const formattedData = data.results.map(dataPoint => ({
                    date: new Date(dataPoint.t).toISOString().split('T')[0],
                    v: dataPoint.v,
                    vw: dataPoint.vw,
                    o: dataPoint.o,
                    h: dataPoint.h,
                    l: dataPoint.l,
                    c: dataPoint.c,
                    t: dataPoint.t,
                    n: dataPoint.n,
                    
                }));

                res.json(formattedData);
            } else {
              
                res.status(404).json({error: 'No data found'});
            }
        } else {
            
            const errorMsg = await response.text(); 
            res.status(response.status).json({error: errorMsg || 'Failed to fetch data from Polygon.io API'});
        }
    } catch (error) {
        console.error('Error fetching data from Polygon:', error);
        res.status(500).json({error: 'Server error occurred while fetching historical data'});
    }
});



  

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
