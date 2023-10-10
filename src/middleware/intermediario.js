const erroPropVazia = { mensagem: "Revise seus dados" };
const jwt = require('jsonwebtoken')
require('dotenv').config({ path: './.env' })

const validarCamposBody = (req, res, next) => {
    // caso algum campo do body esteja vazio, retorna erro.
    const corpoReq = req.body;
    for (chave in corpoReq) {
        if (!corpoReq[chave]) {
            return res.status(400).json(erroPropVazia);
        }
    };
    next();
};


const validarLogin = (req, res, next) => {
    try {
        const { authorization } = req.headers

        if (!authorization) {
            return res.status(400).json({ Mensagem: "Deve ser enviado um token!" })
        }

        const token = authorization.split(' ')[1]

        const tokenVerify = jwt.verify(token, process.env.SENHA_JWT)

        req.usuario = tokenVerify


        next()

    } catch (error) {
        if (error.message == "invalid signature") {
            return res.status(401).json({ Mensagem: 'Usuario Não Autorizado' })
        }

        if (error.message == 'jwt expired') {
            return res.status(401).json({ Mensagem: "Token expirado, Refaça o login!" })
        }

        return res.status(500).json(error)
    }
}


module.exports = {
    validarCamposBody,
    validarLogin
}