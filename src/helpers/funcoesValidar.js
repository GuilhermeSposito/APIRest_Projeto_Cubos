const pool = require('../conexao_db/conexao');

const validarCampoUnico = async (queryBusca, conteudoCampo) => {
    try {
        const resultadoBusca = await pool.query(queryBusca, [conteudoCampo]);
        if (resultadoBusca.rowCount < 1) {
            return true;
        } else {
            return false;
        }

    } catch (e) {
        console.log(e.message);
    }
};
module.exports = {
    validarCampoUnico
};