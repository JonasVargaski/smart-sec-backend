const bcrypt = require("bcrypt");
const SQL = require("../database/index");
const authConfig = require("../config/auth.json");
const jwt = require("jsonwebtoken");
const { existsOrError, validateEmail } = require("../util/validate");
const getDate = require("../util/datetime");
const { getAcessViews, saveLog } = require("./AcessControl");

function generateToken(params = {}) {
  return jwt.sign(params, authConfig.secret, {
    expiresIn: 86400 /// expira em 1 dia, tempo em segundos
  });
}

const findById = async (req, res) => {
  //Buscar usuário por id
  try {
    const id = parseInt(req.params.id);

    existsOrError(id, "id inválido!", res);

    const user = await SQL(`SELECT id,
                                       nome,
                                       email,
                                       telefone,
                                       data_cadastro dataCadastro,
                                       data_modificacao dataModificacao
                                  FROM tech_usuario
                                 WHERE ID = ${id}`);
    if (user) return res.status(200).send(user);

    return res.status(204).end();
  } catch (msg) {
    saveLog("user.findById", msg, 2);
    return res.status(500).send({ info: "Erro Interno" });
  }
};

const auth = async (req, res) => {
  //Autenticar Usuário
  try {
    const user = req.body;

    existsOrError(user.email, "E-mail não Informado", res);
    existsOrError(user.senha, "Senha não Informada", res);
    validateEmail(user.email, "E-mail em formato inválido!", res);

    const result = await SQL(`
    select id,
           nome,
           email,
           senha,
           endereco,
           telefone,
           data_cadastro dataCadastro,
           data_modificacao dataModificacao
      from tech_usuario
     where email = '${user.email}';`);

    const userFromDB = result[0];

    if (!userFromDB) return res.status(400).send({ info: "E-mail ou senha inválidos!" });

    if (bcrypt.compareSync(user.senha, userFromDB.senha)) {
      userFromDB.acesso = await getAcessViews(userFromDB.id);

      saveLog(userFromDB.nome, "", 1);
      SQL(`update tech_usuario 
                    set data_acesso = STR_TO_DATE('${getDate()}','%Y-%m-%d %H:%i:%s') 
                  where id = ${userFromDB.id};`);

      userFromDB.senha = undefined;
      return res.status(200).send({ ...userFromDB, token: generateToken({ id: userFromDB.id }) });
    }

    return res.status(400).send({ info: "E-mail ou senha inválidos!" });
  } catch (msg) {
    saveLog("user.auth", msg, 2);
    return res.status(500).send({ info: "Erro Interno" });
  }
};

const findAll = async (req, res) => {
  //Buscar todos os usuarios
  try {
    users = await SQL(`
    select id,
           nome,
           email,
           cep,
           cidade,
           estado,
           telefone,
           endereco,
           data_acesso dataAcesso,
           data_cadastro dataCadastro,
           data_modificacao dataModificacao
      from tech_usuario;`);

    return res.status(200).send(users);
  } catch (msg) {
    saveLog("user.findAll", msg, 2);
    return res.status(500).json({ info: "Erro Interno" });
  }
};

const update = async (req, res) => {
  //Atualizar usuario
  try {
    const id = parseInt(req.params.id);
    const user = req.body;

    existsOrError(id, "id não informado ou inválido", res);
    existsOrError(user.nome, "Nome não informado", res);
    existsOrError(user.email, "E-mail não informado", res);
    validateEmail(user.email, "E-mail em formato inválido!", res);
    existsOrError(user.telefone, "Telefone não informado", res);
    existsOrError(user.endereco, "Endereço não informado", res);

    if (user.senha.length > 1) {
      let senha = bcrypt.hashSync(user.senha, bcrypt.genSaltSync(10));
      user.senha = senha;
    }

    data = await SQL(`UPDATE tech_usuario
                             SET nome ='${user.nome}',
                                 email = '${user.email}',
                                 telefone = '${user.telefone}',
                                 endereco = '${user.endereco}',
                                 data_modificacao = STR_TO_DATE('${getDate()}','%Y-%m-%d %H:%i:%s')
   ${user.senha.length > 10 ? `, senha = '${user.senha}'` : ""}                
                           WHERE id = ${id}`);

    if (data[0].affectedRows) return res.status(200).end();

    return res.status(400).send({ info: "Não foi possivel atualizar" });
  } catch (msg) {
    saveLog("user.update", msg, 2);
    return res.status(500).json({ info: "Erro Interno" });
  }
};

const save = async (req, res) => {
  try {
    let user = req.body;

    existsOrError(user.nome, "Nome não informado", res);
    existsOrError(user.email, "E-mail não informado", res);
    validateEmail(user.email, "E-mail em formato inválido!", res);
    existsOrError(user.telefone, "Telefone não informado", res);
    existsOrError(user.endereco, "Endereço não informado", res);
    existsOrError(user.senha, "Senha não informada", res);

    user.senha = bcrypt.hashSync(user.senha, bcrypt.genSaltSync(10));

    userFromDB = await SQL(`
    insert ignore into tech_usuario(
                       nome,
                       email,
                       senha,
                       telefone,
                       endereco,
                       data_cadastro)
                values (
                       '${user.nome}',
                       '${user.email}',
                       '${user.senha}',
                       '${user.telefone}',
                       '${user.endereco}',
                       STR_TO_DATE('${getDate()}','%Y-%m-%d %H:%i:%s'));

        insert ignore into tech_acesso(
                           usuario_id,
                           grupoacesso_id,
                           data_cadastro)
                   values (
                            (select id 
                             from tech_usuario
                             where email = '${user.email}'),
                          2,
                          STR_TO_DATE('${getDate()}','%Y-%m-%d %H:%i:%s'));`);

    if (userFromDB[0].insertId) return res.status(200).end();

    return res.status(400).send({ info: "Email ja cadastrado na base de dados!" });
  } catch (msg) {
    saveLog("user.save", msg, 2);
    return res.status(500).send({ info: "Erro Interno " });
  }
};

const remove = async (req, res) => {
  //deletar um usuario
  try {
    const id = parseInt(req.params.id);
    existsOrError(id, "id inválido", res);

    const data = await SQL(`set@id = ${id};
                                delete 
                                  from tech_acesso
                                 where usuario_id = @id;

                                delete 
                                  from ss_usuarioequip
                                 where usuario_id = @id;

                                 delete 
                                 from tech_usuario
                                 where id = @id;`);

    if (data[3].affectedRows) return res.status(200).end();

    return res.status(400).send({ info: "Não foi possivel remover o usuário" });
  } catch (msg) {
    saveLog("user.remove", msg, 2);
    res.status(500).send({ info: "Erro Interno" });
  }
};

module.exports = { findAll, findById, update, save, remove, auth };
