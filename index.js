const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const port = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mujla7p.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const movieCollection = client.db('moviedb').collection('movies');

    // All movies endpoint
    app.get('/movies', async (req, res) => {
      const cursor = await movieCollection.find().toArray();
      res.send(cursor);
    });


    //single movie
    app.get('/movies/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const movie = await movieCollection.findOne(query);
        
        if (!movie) {
          return res.status(404).json({ message: 'Movie not found' });
        }
        
        res.json(movie);
        
      } catch (error) {
        console.error('Error fetching movie:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });


    // Featured movies endpoint (top 6 by rating)
    app.get('/featuredmovies', async (req, res) => {
      const cursor = await movieCollection.find()
        .sort({ rating: -1 })
        .limit(6)
        .toArray();
      res.send(cursor);
    });

    
    await client.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');


  } catch (err) {
    console.error(err);
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello from reelreview Server....');
});

app.listen(port, () => console.log(`Server running on port ${port}`));