const express = require('express')
const bodyParser = require('body-parser')
let cors = require('cors')

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.disable('x-powered-by');


const server = require('http').createServer(app);
const io = require('socket.io')(server);

let sessoes = [];

app.use((req, res, next) => {
    req.io = io;
    req.sessoes = sessoes;
    next();
});

require('./api/routes')(app)

io.on("connection", socket => {
    socket.on("new-user", (sessao) => sessoes.push(sessao))
    socket.on("disconnect", () => {
        sessoes = sessoes.filter(sess => sess.sessao !== socket.id)
    })
    socket.on("exit-user", () => {
        sessoes = sessoes.filter(sess => sess.sessao !== socket.id)
    })
});


server.listen(process.env.PORT || 3001);