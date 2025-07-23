
require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde el directorio 'public'
app.use(express.static(path.join(__dirname, 'public')));

const uri = process.env.MONGODB_URI || 'mongodb+srv://calorieAdmin2:ABCDE1234@cluster0.mongodb.net/calorieTracker?retryWrites=true&w=majority';
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

async function connectDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    // Verificar existencia de colecciones
    const db = client.db('calorieTracker');
    const collections = await db.listCollections().toArray();
    console.log('Collections in calorieTracker:', collections.map(c => c.name));
  } catch (error) {
    console.error('MongoDB connection error:', error.message, error.stack);
    process.exit(1);
  }
}

// Middleware para manejar errores
app.use((err, req, res, next) => {
  console.error('Server error:', err.message, err.stack);
  res.status(500).json({ error: `Error interno del servidor: ${err.message}` });
});

// Routines (colección: calorieTracker>gymRoutine>routines)
app.get('/api/routines', async (req, res, next) => {
  try {
    const db = client.db('calorieTracker');
    const routines = await db.collection('routines').find().toArray();
    console.log(`Fetched ${routines.length} routines`);
    res.json(routines);
  } catch (error) {
    console.error('Error fetching routines:', error.message, error.stack);
    next(error);
  }
});

app.post('/api/routines', async (req, res, next) => {
  try {
    const db = client.db('calorieTracker');
    const routine = req.body;
    console.log('Saving routine:', routine);
    routine.date = normalizeDate(routine.date);
    await db.collection('routines').updateOne(
      { date: routine.date },
      { $set: routine },
      { upsert: true }
    );
    console.log(`Routine saved for date: ${routine.date}`);
    res.status(200).json({ message: 'Rutina guardada' });
  } catch (error) {
    console.error('Error saving routine:', error.message, error.stack);
    next(error);
  }
});

app.delete('/api/routines/:date', async (req, res, next) => {
  try {
    const db = client.db('calorieTracker');
    const date = normalizeDate(decodeURIComponent(req.params.date));
    console.log('Deleting routine for date:', date);
    const result = await db.collection('routines').deleteOne({ date });
    if (result.deletedCount === 0) {
      console.log(`No routine found for date: ${date}`);
      return res.status(404).json({ error: 'Rutina no encontrada' });
    }
    console.log(`Routine deleted for date: ${date}`);
    res.status(200).json({ message: 'Rutina eliminada' });
  } catch (error) {
    console.error('Error deleting routine:', error.message, error.stack);
    next(error);
  }
});

// Meals (colección: calorieTracker>calorieTracker>calories)
app.get('/api/meals', async (req, res, next) => {
  try {
    const db = client.db('calorieTracker');
    const meals = await db.collection('calories').find().toArray();
    console.log(`Fetched ${meals.length} meals from calories collection`);
    res.json(meals);
  } catch (error) {
    console.error('Error fetching meals:', error.message, error.stack);
    next(error);
  }
});

app.post('/api/meals', async (req, res, next) => {
  try {
    const db = client.db('calorieTracker');
    const meal = req.body;
    console.log('Saving meal:', meal);
    meal.date = normalizeDate(meal.date);
    await db.collection('calories').insertOne(meal);
    console.log(`Meal saved for date: ${meal.date}, meal: ${meal.meal}`);
    res.status(200).json({ message: 'Comida guardada' });
  } catch (error) {
    console.error('Error saving meal:', error.message, error.stack);
    next(error);
  }
});

app.delete('/api/meals/:date/:meal', async (req, res, next) => {
  try {
    const db = client.db('calorieTracker');
    const date = normalizeDate(decodeURIComponent(req.params.date));
    const meal = decodeURIComponent(req.params.meal);
    console.log('Deleting meal:', { date, meal });
    const result = await db.collection('calories').deleteOne({ date, meal });
    if (result.deletedCount === 0) {
      console.log(`No meal found for date: ${date}, meal: ${meal}`);
      return res.status(404).json({ error: 'Comida no encontrada' });
    }
    console.log(`Meal deleted for date: ${date}, meal: ${meal}`);
    res.status(200).json({ message: 'Comida eliminada' });
  } catch (error) {
    console.error('Error deleting meal:', error.message, error.stack);
    next(error);
  }
});

function normalizeDate(dateStr) {
  try {
    const [day, month, year] = dateStr.split('/');
    return `${parseInt(day).toString().padStart(2, '0')}/${parseInt(month).toString().padStart(2, '0')}/${year}`;
  } catch (error) {
    console.error('Error normalizing date:', dateStr, error.message);
    throw new Error('Formato de fecha inválido');
  }
}

connectDB().then(() => {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server running on port ${port}`));
});
