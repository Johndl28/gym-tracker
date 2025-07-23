
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

'mongodb+srv://calorieAdmin2:ABCDE1234@calorietracker.qhiq6tw.mongodb.net/?retryWrites=true&w=majority&appName=calorieTracker'; // Reemplaza con tu URI
const client = new MongoClient(uri);

async function connectDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Routines (colección: calorieTracker>gymRoutine>routines)
app.get('/api/routines', async (req, res) => {
  try {
    const db = client.db('calorieTracker');
    const routines = await db.collection('routines').find().toArray();
    res.json(routines);
  } catch (error) {
    console.error('Error fetching routines:', error);
    res.status(500).json({ error: 'Error al obtener rutinas' });
  }
});

app.post('/api/routines', async (req, res) => {
  try {
    const db = client.db('calorieTracker');
    const routine = req.body;
    routine.date = normalizeDate(routine.date);
    await db.collection('routines').updateOne(
      { date: routine.date },
      { $set: routine },
      { upsert: true }
    );
    res.status(200).json({ message: 'Rutina guardada' });
  } catch (error) {
    console.error('Error saving routine:', error);
    res.status(500).json({ error: 'Error al guardar rutina' });
  }
});

app.delete('/api/routines/:date', async (req, res) => {
  try {
    const db = client.db('calorieTracker');
    const date = normalizeDate(decodeURIComponent(req.params.date));
    const result = await db.collection('routines').deleteOne({ date });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Rutina no encontrada' });
    }
    res.status(200).json({ message: 'Rutina eliminada' });
  } catch (error) {
    console.error('Error deleting routine:', error);
    res.status(500).json({ error: 'Error al eliminar rutina' });
  }
});

// Meals (colección: calorieTracker>calorieTracker>calories)
app.get('/api/meals', async (req, res) => {
  try {
    const db = client.db('calorieTracker');
    const meals = await db.collection('calories').find().toArray();
    res.json(meals);
  } catch (error) {
    console.error('Error fetching meals:', error);
    res.status(500).json({ error: 'Error al obtener comidas' });
  }
});

app.post('/api/meals', async (req, res) => {
  try {
    const db = client.db('calorieTracker');
    const meal = req.body;
    meal.date = normalizeDate(meal.date);
    await db.collection('calories').insertOne(meal);
    res.status(200).json({ message: 'Comida guardada' });
  } catch (error) {
    console.error('Error saving meal:', error);
    res.status(500).json({ error: 'Error al guardar comida' });
  }
});

app.delete('/api/meals/:date/:meal', async (req, res) => {
  try {
    const db = client.db('calorieTracker');
    const date = normalizeDate(decodeURIComponent(req.params.date));
    const meal = decodeURIComponent(req.params.meal);
    const result = await db.collection('calories').deleteOne({ date, meal });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Comida no encontrada' });
    }
    res.status(200).json({ message: 'Comida eliminada' });
  } catch (error) {
    console.error('Error deleting meal:', error);
    res.status(500).json({ error: 'Error al eliminar comida' });
  }
});

function normalizeDate(dateStr) {
  const [day, month, year] = dateStr.split('/');
  return `${parseInt(day).toString().padStart(2, '0')}/${parseInt(month).toString().padStart(2, '0')}/${year}`;
}

connectDB().then(() => {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server running on port ${port}`));
});
