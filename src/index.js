
import express from 'express';
import {matchRouter} from "./routes/matches.js"


const app = express();
const PORT = 8080;

// Middleware for JSON
app.use(express.json());

// Root GET route
app.get('/', (req, res) => {
  res.send({ message: 'Welcome to the Sportz Server!' });
});

app.use('/matches', matchRouter)


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
