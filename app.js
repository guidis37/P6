const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config()
const helmet = require('helmet');


const path = require('path');
const userRoutes = require('./routes/user');
  const saucesRoutes = require('./routes/sauce');
  
const app = express();
mongoose.connect(process.env.MONGO_CONNECT,
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
  });

  app.use(express.json())
  app.use('/images', express.static(path.join(__dirname, 'images')));
  app.use("/api/sauces", saucesRoutes);
  app.use("/api/auth", userRoutes);




app.use(helmet()); 
  
app.get('/', (req, res) => { 
    res.send("This is the Demo page for"
        + " setting up express server !") 
}); 
  

module.exports = app;