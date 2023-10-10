const pool = require("../conexao_db/conexao.js")
const bcrypt = require('bcrypt');
const { validarCampoUnico } = require('../helpers/funcoesValidar.js');
const jwt = require('jsonwebtoken')


const cadastrarTransacoes = async (req, res) => {
    try {
        const { descricao, valor, data, categoria_id, tipo } = req.body
        const { id: usuario_id } = req.usuario

        if (!descricao || !valor || !data || !categoria_id || !tipo) {
            return res.status(400).json({ Mensagem: "Campos obrigatórios vazio!" })
        }

        const testeTipo = tipo === "entrada" || tipo === "saida" ? true : false

        if (!testeTipo) {
            return res.status(400).json({ Mensagem: "Insira um tipo válido!" })
        }

        const queryDeInsercao = `insert into transacoes (descricao,valor,data,categoria_id,usuario_id,tipo) values
                                                        ($1,$2,$3,$4,$5,$6) returning *`

        const arrayDeItensParaInserir = [descricao, valor, data, categoria_id, usuario_id, tipo]


        const insereNoBanco = await pool.query(queryDeInsercao, arrayDeItensParaInserir)


        const retornoDeInsercao = await pool.query(`select t.id, t.descricao, t.valor, t.tipo, t.data, t.categoria_id, t.usuario_id,  c.descricao as categoria_nome from transacoes t inner join  categorias c on c.id = t.categoria_id where t.id = $1`, [insereNoBanco.rows[0].id])


        return res.status(201).json(retornoDeInsercao.rows[0])
    } catch (error) {
        return res.status(500).json({ Mensagem: "Servidor Internal Error" })
    }
}


const listarTransacoesUsuarioLogado = async (req, res) => {
    try {
        const { id } = req.usuario



        const queryDeTransacoes = `select t.id, t.descricao, t.valor, t.tipo, t.data, t.categoria_id, t.usuario_id,  c.descricao as categoria_nome from transacoes t inner join  categorias c on c.id = t.categoria_id where t.usuario_id = $1`

        const queryDeRes = await pool.query(queryDeTransacoes, [id])

        if (queryDeRes.rowCount == 0) {
            return res.status(204).json()
        }

        const { filtro } = req.query

        if (filtro) {
            filtrarPorCategoria(filtro, queryDeRes.rows, res)
        } else {
            return res.status(200).json(queryDeRes.rows)
        }
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ Mensagem: "Servidor Internal Error" })
    }
}

const filtrarPorCategoria = async (filtro, transacoes, res) => {
    try {
        const filtroCorrigido = Array();
        const transacoesFiltradas = Array();

        for (cat of filtro) {
            filtroCorrigido.push(cat.slice(0, 1).toUpperCase().concat(cat.slice(1)))
        }

        if (filtroCorrigido.length == 1) {

            const transacoesFiltrada = transacoes.filter(p => {
                return p.categoria_nome == filtroCorrigido[0]
            })

            if (transacoesFiltrada.length === 0) {
                return res.status(204).json()
            }

            return res.status(200).json(transacoesFiltrada)
        }

        for (transacao of transacoes) {
            for (indiceFiltro in filtroCorrigido) {
                if (transacao.categoria_nome == filtroCorrigido[indiceFiltro]) {
                    transacoesFiltradas.push(transacao)
                }
            }
        }

        if (transacoesFiltradas.length === 0) {
            return res.status(204).json()
        }

        return res.status(200).json(transacoesFiltradas)
    } catch (error) {
        return res.status(500).json({ Mensagem: "Servidor Internal Error" });
    }
}


const detalharTransacao = async (req, res) => {
    const { id: idQuery } = req.params;
    const queryDetalharTransacao = `
    SELECT t.*, c.descricao FROM transacoes t
    JOIN categorias c
    on c.id = $1;
    `;
    try {
        const detalhesTransacao = await pool.query(queryDetalharTransacao, [idQuery]);
        const { id, descricao, valor, data, categoria_id, usuario_id, tipo } = detalhesTransacao.rows[0];

        const objResposta = {
            id: id,
            tipo: tipo,
            descricao: descricao,
            valor: valor,
            data: data,
            usuario_id: usuario_id,
            categoria_id: categoria_id,
            categoria_nome: descricao,
        }

        return res.status(200).json(objResposta)
    } catch (e) {
        return res.status(500).json({ Mensagem: "Servidor Internal Error" });
    }
}

const editarTransacao = async (req, res) => {
    try {
        const { descricao, valor, data, categoria_id, tipo } = req.body
        const { id: idTransacao } = req.params
        const { id: idUsuario } = req.usuario

        if (isNaN(idTransacao)) {
            return res.status(400).json({ Mensagem: "Insira um id númerico" })
        }

        if (!descricao || !valor || !data || !categoria_id || !tipo) {
            return res.status(400).json({ Mensagem: "Campos obrigatórios vazio!" })
        }

        const queryConfereIdTransacao = await pool.query('select * from transacoes where usuario_id = $1', [idUsuario])

        if (queryConfereIdTransacao.rowCount == 0) {
            return res.status(404).json({ Mensagem: "Nenhuma transação encontrada para esse usuario" })
        }

        const verificaTransacaoExistente = queryConfereIdTransacao.rows.some(p => {
            return p.id == idTransacao
        })

        if (!verificaTransacaoExistente) {
            return res.status(404).json({ Mensagem: `Transação de id: ${idTransacao}, inexistente` })
        }

        const queryUpdate = `update transacoes SET descricao = $1, valor = $2, data = $3, categoria_id = $4, tipo = $5 WHERE id = $6 and usuario_id = $7;`;
        const arrayDeInserção = [descricao, valor, data, categoria_id, tipo, idTransacao, idUsuario]
        const query = await pool.query(queryUpdate, arrayDeInserção)

        return res.status(201).json(query.rows[0])
    } catch (error) {
        return res.status(500).json({ Mensagem: "Servidor Internal Error" });
    }
}

const deletarTransacao = async (req, res) => {
    try {
        const { id: idUsuario } = req.usuario
        const { id: idTransacao } = req.params

        const queryDeVerif = await pool.query('select * from transacoes where id = $1 and usuario_id = $2', [idTransacao, idUsuario])

        if (queryDeVerif.rowCount == 0) {
            return res.status(404).json({ Mensagem: "Transação não encontrada." })
        }

        const verificaSeExisteId = queryDeVerif.rows.some(p => {
            return p.id == idTransacao
        })

        if (!verificaSeExisteId) {
            return res.status(404).json({ Mensagem: "Transação não encontrada." })
        }

        const queryCampo = `delete from transacoes where id = $1 and usuario_id = $2`
        const queryDelete = await pool.query(queryCampo, [idTransacao, idUsuario])

        return res.status(200).json()
    } catch (error) {
        if (error.code == '22P02') {
            return res.status(400).json({ mensagem: "Insira um número de id válido" })
        }
        return res.status(500).json({ Mensagem: "Servidor Internal Error" });
    }
}

const extratoTransacao = async (req, res) => {
    const { id: idUsuario } = req.usuario;
    const queryTransacoes = `
    SELECT valor, tipo
    FROM transacoes
    WHERE usuario_id = $1;
    `;
    let totalEntrada = 0, totalSaida = 0;

    try {
        const transacoes = (await pool.query(queryTransacoes, [idUsuario])).rows;

        for (transacao of transacoes) {
            if (transacao.tipo == 'saida') {
                totalSaida += transacao.valor;
            }
            else if (transacao.tipo == 'entrada') {
                totalEntrada += transacao.valor
            }
        }
        res.status(200).json({ entrada: totalEntrada, saida: totalSaida })

    } catch (e) {
        return res.status(500).json({ Mensagem: "Servidor Internal Error" });
    }
}

module.exports = {
    cadastrarTransacoes,
    listarTransacoesUsuarioLogado,
    detalharTransacao,
    editarTransacao,
    deletarTransacao,
    extratoTransacao
}