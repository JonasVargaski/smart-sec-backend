const SQL = require('../database/index')
const { existsOrError } = require('../util/validate')
const getDate = require('../util/datetime')

const canaryToken = async (req, res) => {
    res.json(getDate())
}

const teste = async (req, res) => {
    console.log(req.query);
    return res.status(200).json({ save: "SUCESS" })
}

module.exports = { canaryToken, teste }