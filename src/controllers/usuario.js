const pool = require("../conexao_db/conexao.js")
const bcrypt = require('bcrypt');
const { validarCampoUnico } = require('../helpers/funcoesValidar.js');
const jwt = require('jsonwebtoken')



const mensagemEmailExiste = {
    mensagem: "Email já cadastrado."
};

// POST /usuario
const cadastrarUsuario = async (req, res) => {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
        return res.status(400).json({ mensagem: "Informe todos os campos." })
    }
    const queryValidarEmail = `
    SELECT email 
    FROM usuarios
    WHERE email = $1;
    `;
    const queryInserirDados = `
    INSERT INTO usuarios (nome, email, senha)
    VALUES ($1, $2, $3) 
    RETURNING id, nome, email;
    `;

    try {
        if (!(await validarCampoUnico(queryValidarEmail, email))) {
            return res.status(400).json(mensagemEmailExiste)
        }

        const senhaCript = await bcrypt.hash(senha, 10);

        const retornoInserir = await pool.query(queryInserirDados, [nome, email, senhaCript]);
        return res.status(201).json(retornoInserir.rows);

    } catch (e) {
        if (e.code == '23505') {
            return res.status(400).json(mensagemEmailExiste)
        }
        return res.status(500).json({ Mensagem: "internal Error" })
    };
};

//POST /login 
const login = async (req, res) => {
    try {
        const { email, senha } = req.body

        if (!email || !senha) {
            return res.status(400).json({ Mensagem: "Insira propriedades obrigatórias!" })
        }

        const campoQuery = `SELECT * FROM USUARIOS WHERE EMAIL = $1`
        const queryDeConta = await pool.query(campoQuery, [email])

        if (queryDeConta.rowCount < 1) {
            return res.status(400).json({ Mensagem: "Email ou Senha Incorretos!" })
        }

        const verifSenha = await bcrypt.compare(senha, queryDeConta.rows[0].senha)

        if (!verifSenha) {
            return res.status(400).json({ Mensagem: "Email ou Senha Incorretos!" })
        }

        const token = jwt.sign({ id: queryDeConta.rows[0].id, nome: queryDeConta.rows[0].nome, email: queryDeConta.rows[0].email }, process.env.SENHA_JWT, { expiresIn: '8h' })


        return res.status(200).json({
            id: queryDeConta.rows[0].id,
            nome: queryDeConta.rows[0].nome,
            email: queryDeConta.rows[0].email,
            token
        })
    } catch (error) {
        return res.status(500).json({ mensagem: "internal error" })
    }
}

// GET /usuario
const infosUsuario = async (req, res) => {
    const queryUsr = `
    SELECT id, nome, email
    FROM usuarios
    WHERE id = $1;
    `;
    const { id } = req.usuario;

    try {
        const resultadoUsr = await pool.query(queryUsr, [id]);
        return res.status(200).json(resultadoUsr.rows[0])

    } catch (e) {
        // colocar a msg de internal error em uma variavel, DRY.
        return res.status(401).json({ mensagem: "internal error" })
    }

};

// PUT /usuario
const editarUsuario = async (req, res) => {
    const { id } = req.usuario;
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
        return res.status(400).json({ mensagem: "Informe todos os campos." })
    }


    const queryEditarUsr = `
    UPDATE usuarios
    SET nome = $1, email = $2, senha = $3
    WHERE id = $4;
    `;

    try {

        const senhaCript = await bcrypt.hash(senha, 10);
        const inserir = await pool.query(queryEditarUsr, [nome, email, senhaCript, id]);
        return res.status(204).json();

    } catch (e) {
        if (e.code == '23505') {
            return res.status(400).json(mensagemEmailExiste)
        }
        return res.status(400).json({ mensagem: e.message })
    }
};

// GET /categoria
const listarCategorias = async (req, res) => {
    const queryCategorias = `
    SELECT * FROM categorias;
    `;
    try {
        const listaCategorias = (await pool.query(queryCategorias)).rows;
        res.status(200).json(listaCategorias);

    } catch (e) {
        return res.status(500).json({ mensagem: e.message })
    }

};


module.exports = {
    login,
    cadastrarUsuario,
    infosUsuario,
    editarUsuario,
    listarCategorias
}