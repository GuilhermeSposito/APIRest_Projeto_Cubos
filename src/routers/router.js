const express = require('express');
const routers = express();
const { validarCamposBody, validarLogin } = require('../middleware/intermediario')
const {
    login,
    cadastrarUsuario,
    infosUsuario,
    editarUsuario,
    listarCategorias
} = require('../controllers/usuario');
const {
    cadastrarTransacoes,
    listarTransacoesUsuarioLogado,
    detalharTransacao,
    editarTransacao,
    deletarTransacao,
    extratoTransacao
} = require('../controllers/transacoes')


routers.post('/usuario', validarCamposBody, cadastrarUsuario)
routers.post('/login', login)

routers.use(validarLogin)
routers.get('/categoria', listarCategorias)
routers.get('/usuario', infosUsuario)
routers.put('/usuario', validarCamposBody, editarUsuario)
//transaçoes
routers.post('/transacao', cadastrarTransacoes)
routers.get('/transacao/extrato', extratoTransacao)
routers.get('/transacao', listarTransacoesUsuarioLogado)
routers.get('/transacao/:id', detalharTransacao)
routers.put('/transacao/:id', editarTransacao)
routers.delete('/transacao/:id', deletarTransacao)

module.exports = routers