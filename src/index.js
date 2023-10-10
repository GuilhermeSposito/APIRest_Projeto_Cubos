const express = require('express');
const app = express();
const routers = require('./routers/router')

app.use(express.json())
app.use(routers)

app.listen(3000, () => {
    console.log("Servidor iniciado")
})