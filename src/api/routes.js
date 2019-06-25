const authMiddleware = require('../middleware/auth'); // validaçoes do tokem

const user = require('./user')
const device = require('./device')
const userDevices = require('./user-devices')
const acessControl = require('./AcessControl')
const { canaryToken, teste } = require('./testes')


module.exports = app => {

    // app.route('/api/controlador/save/:temp/:temp_ajt/:umid/:umid_ajt/:sts_ventoinha/:sts_alarme/:modo_trabalho/:sts_trava/:fase/:clima/:tp_sensor/:wifi_mac/:wifi_senha/:versao_soft/:falta_energia*')
    //     .get(device.saveData)

    app.route('/api/controller')
        .get(device.saveData)

    app.route('/auth')
        .post(user.auth)

    app.route('/usuario')
        .post(user.save)
        .all(authMiddleware)
        .get(user.findAll)

    app.route('/usuario/:id')
        .all(authMiddleware)
        .get(user.findById)
        .put(user.update)
        .delete(user.remove)

    app.route('/controlador')
        .all(authMiddleware)
        .get(device.findAll)

    app.route('/controlador/:id')
        .all(authMiddleware)
        .get(device.lastedData)
        .put(device.setSituation)

    app.route('/controlador/grafico/:id')
        .all(authMiddleware)
        .get(device.graph)

    app.route('/usuario/controlador/:id')
        .all(authMiddleware)
        .get(userDevices.myDevices)
        .post(userDevices.save)
        .delete(userDevices.remove)

    app.route('/log')
        // .all(authMiddleware)
        .get(acessControl.getLogs)

    app.route('/teste')
        .get(teste)
        .post(canaryToken)

    app.all('/*', (req, res) => {
        return res.send(req.sessoes)
        return res.status(401).send('Unauthorized');
    });
};