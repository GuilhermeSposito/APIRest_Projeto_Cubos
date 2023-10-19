const transport = require('../utils/conexaoemail')


const envioDeEmail = async (req, res) => {
    try {


        const info = await transport.sendMail({
            from: '"Guilherme Sposito" <gulhermesposito14@gmail.com>', // sender address
            to: "gui-calandrin@hotmail.com", // list of receivers
            subject: "Teste De Envio De Emails", // Subject line
            html: "<h1>Teste de Envio de emails bem sucedido</h1>", // html body
        });


        res.status(200).json({ mensagem: "Email enviado com sucesso!" })
    } catch (error) {
        res.status(500).json({ mensagem: "Erro NO SERVIDOR" })
    }
}

module.exports = envioDeEmail