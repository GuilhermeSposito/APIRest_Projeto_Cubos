const transport = require('../utils/conexaoemail')


const envioDeEmail = async (req, res) => {
    try {
        const { usuario } = req
        const { to, titulo, mensagem } = req.body

        if (!to || !titulo || !mensagem) {
            return res.status.json({ mensagem: "Deve ser informado campos obrigatórios!" })
        }

        const info = await transport.sendMail({
            from: `"${usuario.nome}" <${usuario.email}>`, // sender address
            to: `${to}`, // list of receivers
            subject: `${titulo}`, // Subject line
            text: `${mensagem}` // html body
        });


        res.status(200).json({ mensagem: `Email de ${usuario.nome} enviado com sucesso para o email: ${to}` })
    } catch (error) {
        res.status(500).json({ mensagem: "Erro NO SERVIDOR" })
    }
}

module.exports = envioDeEmail