const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Conectar a MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Conectado a MongoDB Atlas')).catch(err => console.error('Error MongoDB:', err));

// Esquema y modelo
const routineSchema = new mongoose.Schema({
  date: String,
  routine: String,
  completed: Boolean,
});
const Routine = mongoose.model('Routine', routineSchema);

// Rutas API
app.post('/api/routines', async (req, res) => {
  try {
    const { date, routine, completed } = req.body;
    if (!date || !routine) {
      return res.status(400).json({ error: 'Faltan datos' });
    }
    await Routine.findOneAndUpdate(
      { date },
      { date, routine, completed },
      { upsert: true, new: true }
    );
    res.status(201).json({ message: 'Rutina guardada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar' });
  }
});

app.get('/api/routines', async (req, res) => {
  try {
    const routines = await Routine.find();
    res.json(routines);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));