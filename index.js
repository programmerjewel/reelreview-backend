require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

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
    const favouriteCollection = client.db('moviedb').collection('favourites');

    app.get('/movies', async (req, res) => {

      const {searchParams} = req.query;
      // console.log(searchParams)
      let option = {};
      if(searchParams){
        option = {movieTitle: {$regex: searchParams, $options: "i"}};
      }
      
      const cursor = await movieCollection.find(option).toArray();
      res.send(cursor);
    });

    app.get('/movies/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const movie = await movieCollection.findOne(query);
        res.send(movie);
    });
    app.delete('/movies/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await movieCollection.deleteOne(query);
      res.send(result);
    })

    app.post('/movies', async(req, res)=>{
       const newMovie = req.body;
       const result = await movieCollection.insertOne(newMovie);
       res.send(result);
    })

    // Featured movies endpoint (top 6 by rating)
    app.get('/featuredmovies', async (req, res) => {
      const cursor = await movieCollection.find()
        .sort({ rating: -1 })
        .limit(6)
        .toArray();
      res.send(cursor);
    });


    app.post('/favourites', async (req, res) => {
      const { movieId, userEmail, movieTitle, moviePoster, genre, duration, releaseYear, rating } = req.body;
    
      // Check if a favorite with the same movieId and userEmail already exists
      const existingFavourite = await favouriteCollection.findOne(
        { movieId: movieId,
          userEmail: userEmail
        });
  
      //message sent to frontend
      if (existingFavourite) {
        return res.status(200).json({ message: 'Movie is already in your favorites' });
      }
    
      const newFavourite = {
        movieId,
        userEmail,
        movieTitle,
        moviePoster,
        genre,
        duration,
        releaseYear,
        rating,
      };
    
      const result = await favouriteCollection.insertOne(newFavourite);
      res.send(result);
    });

   
    app.get('/favourites', async (req, res) => {
      const userEmail = req.query.userEmail;
      let query = {};

      if (userEmail) {
        query = { userEmail: userEmail };
      }

      const cursor = favouriteCollection.find(query);
      const favourites = await cursor.toArray();
      res.send(favourites);
    });

    // Get favourite movies for a specific user (using path parameter)
    app.get('/favourites/:email', async (req, res) => {
      const userEmail = req.params.email;
      const query = { userEmail: userEmail };
      const cursor = favouriteCollection.find(query);
      const favourites = await cursor.toArray();
      res.send(favourites);
    });

    // DELETE a favourite movie by its MongoDB _id
    app.delete('/favourites/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await favouriteCollection.deleteOne(query);
      res.send(result);
    });

    //update movie info by id
    app.put('/movies/:id', async(req, res)=>{
      const id = req.params.id;
      const movieData = req.body;
      const filter = {_id: new ObjectId(id)};
      const options = { upsert: true };
      const updatedMovieData = {
        $set:{
          movieTitle: movieData.movieTitle,
          moviePoster: movieData.moviePoster,
          genre: movieData.genre,
          duration: movieData.duration,
          releaseYear: movieData.releaseYear,
          rating: movieData.rating,
          summaryTxt: movieData.summaryTxt,
        }
      }
      const result = await movieCollection.updateOne(filter, updatedMovieData, options);
      res.send(result);
    })
    
    // await client.db('admin').command({ ping: 1 });
    // console.log('Pinged your deployment. You successfully connected to MongoDB!');

  } catch (err) {
    console.error(err);
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello from reelreview Server....');
});

app.listen(
  port, () => console.log(`Server running on port ${port}`)
);