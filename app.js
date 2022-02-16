const express = require('express');
const app = express();
app.use(express.json());
const {
  models: { User, Note },
} = require('./db');
const path = require('path');

const requireToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    const user = await User.byToken(token);
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

app.get('/home', requireToken, (req, res, next) => {
  res.send('Home page!');
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/auth', async (req, res, next) => {
  try {
    res.send({ token: await User.authenticate(req.body) });
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/auth', requireToken, async (req, res, next) => {
  try {
    res.send(req.user);
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/users/:id/notes', requireToken, async (req, res, next) => {
  try {
    // const user = await User.byToken(req.headers.authorization);
    const urlId = Number(req.params.id);
    if (req.user.id === urlId) {
      const user = await User.findByPk(urlId, { include: { model: Note } });
      const notes = await user.getNotes();
      res.send(notes);
    } else {
      res.status(404).send('Failed to find the user notes');
    }
  } catch (ex) {
    next(ex);
  }
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
