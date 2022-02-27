const express = require('express')
const WorkerPool = require('./worker-pool');
const os = require('os');
const { info, start, move, end } = require('./logic')

const pool = new WorkerPool(os.cpus().length);

const app = express()
app.use(express.json())
app.use(function(req, res, next) {
  res.set("Server", "BattlesnakeOfficial/starter-snake-javascript")
  next()
})

const port = process.env.PORT || 8080

app.get("/", (req, res) => {
  res.send(info())
});

app.post("/start", (req, res) => {
  res.send(start(req.body))
});

app.post("/move", (req, res) => {
  move(pool, req.body).then((response) => res.send(response));
});

app.post("/end", (req, res) => {
  res.send(end(req.body))
});

// Start the Express server
const server = app.listen(port, () => {
  console.log(`Starting Battlesnake Server at http://0.0.0.0:${port}...`)
})

process.on('SIGTERM', () => {
  debug('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    debug('HTTP server closed')
  })
  pool.close();
})