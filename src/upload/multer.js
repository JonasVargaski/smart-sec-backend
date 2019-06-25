const multer = require('multer')

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, '.') // destino de salvar arquivos
    },
    filename: function (req, file, callback) {
        callback(null, `${Date.now()}_${file.originalname}`)
    }
})

const upload = multer({ storage }).single('arquivo') // single("NOME DO CAMPO ONDE ESTA O ARQUIVO")

module.exports = upload