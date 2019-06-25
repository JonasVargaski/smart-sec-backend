const SQL = require("../database/index");
const { existsOrError } = require("../util/validate");
const getDate = require("../util/datetime");
const { saveLog } = require("./AcessControl");

const myDevices = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    existsOrError(id, "id inválido", res);

    const devices = await SQL(`
    select tech_equipamento.id,
           tech_equipamento.mac_adress numeroSerie, 
           tech_equipamento.senha_serie senha, 
           tech_equipamento.situacao,
           tech_equipamento.versao_soft versaoSoft,
           tech_equipamento.data_acesso dataAcesso,
           ss_usuarioequip.data_cadastro dataCadastro,
           ss_usuarioequip.data_modificacao dataModificacao,
           ss_usuarioequip.descricao, 
           tech_cadequipamento.modelo
      from tech_equipamento,
           ss_usuarioequip,
           tech_cadequipamento
     where ss_usuarioequip.equipamento_id = tech_equipamento.id
       and tech_equipamento.cadequipamento_id = tech_cadequipamento.id 
       and ss_usuarioequip.situacao = 'A'
       and ss_usuarioequip.usuario_id = ${id};`);

    return res.status(200).send(devices);
  } catch (msg) {
    saveLog("user-device.myDevices", msg, 2);
    return res.status(500).send({ info: "Erro Interno" });
  }
};

const save = async (req, res) => {
  try {
    const { numeroSerie, senha, descricao, id } = req.body;
    const idUsuario = parseInt(req.params.id);

    existsOrError(idUsuario, "id inválido", res);
    existsOrError(numeroSerie, "Numero de série ou senha não informado", res);
    existsOrError(senha, "Numero de série ou senha não informado", res);

    let [equipamento] = await SQL(`
    select id
      from tech_equipamento
     where mac_adress = '${numeroSerie}' 
       and senha_serie = '${senha}';`);

    if (!equipamento) return res.status(400).send({ info: "Numero de série ou senha inválidos!" });

    let [associado] = await SQL(`
    select id
      from ss_usuarioequip
     where usuario_id = ${idUsuario} 
       and equipamento_id = ${equipamento.id}`);

    if (associado) {
      let [{ affectedRows }] = await SQL(`
      update ss_usuarioequip
         set situacao = 'A',
   descricao = '${descricao}'
       where usuario_id = ${idUsuario} 
         and equipamento_id = ${equipamento.id}
         and id = ${associado.id}`);

      if (affectedRows) return res.status(200).send({ info: "Registro alterado com sucesso!" });
      return res.status(400).send({ info: "Erro ao efetuar procedimento" });
    } else {
      let [{ affectedRows }] = await SQL(`
      insert into ss_usuarioequip
             (usuario_id,
             descricao,
             equipamento_id,
             data_cadastro)
      values (${idUsuario},
             '${descricao}',
             ${equipamento.id},
             STR_TO_DATE('${getDate()}','%Y-%m-%d %H:%i:%s'))`);

      if (affectedRows) return res.status(200).send({ info: "Registro alterado com sucesso!" });
      return res.status(400).send({ info: "Erro ao efetuar procedimento" });
    }
  } catch (msg) {
    saveLog("user-device.save", msg, 2);
    res.status(500).send({ info: "Erro Interno" });
  }
};

const remove = async (req, res) => {
  try {
    const { idEquipamento } = req.body;
    const idUsuario = parseInt(req.params.id);

    existsOrError(idUsuario, "id inválido", res);
    existsOrError(idEquipamento, "id do equipamento não informado!", res);

    let [{ affectedRows }] = await SQL(`
    update ss_usuarioequip
       set situacao = 'E',
           data_modificacao = '${getDate()}'
     where usuario_id = ${idUsuario} 
       and equipamento_id = ${idEquipamento}`);

    if (affectedRows) return res.status(200).send({ info: "Registro alterado com sucesso!" });
    return res.status(400).send({ info: "Erro ao efetuar procedimento" });
  } catch (msg) {
    saveLog("user-device.remove", msg, 2);
    res.status(500).send({ info: "Erro Interno" });
  }
};

module.exports = { save, remove, myDevices };
