const SQL = require("../database/index");
const getDate = require("../util/datetime");

const getAcessViews = async idUsuario => {
  try {
    let acessos = await SQL(`
        set @id_usuario = ${idUsuario};

     select tech_cadtela.codigo
       from tech_cadtela,
            tech_grupoacesso,
            tech_acesso,
            tech_usuario
      where tech_cadtela.id = tech_grupoacesso.cadtela_id
        and tech_grupoacesso.cadgrupoacesso_id = tech_acesso.grupoacesso_id
        and tech_acesso.usuario_id = tech_usuario.id
        and usuario_id = @id_usuario
      UNION 
     select tech_cadtela.codigo
       from tech_cadtela,
            tech_acesso,
       	    tech_usuario
      where tech_cadtela.id = tech_acesso.tela_id
        and tech_usuario.id = tech_acesso.usuario_id
        and tech_usuario.id = @id_usuario;`);

    return acessos[1].map(acess => acess.codigo);
  } catch (error) {
    saveLog("acessControl.getAcessViews", error, 1);
    return res.status(500).send({ info: "Erro Interno " });
  }
};

const saveLog = async (desc = null, erro = null, type = 1) => {
  let err = "";
  if (erro.sql) {
    err = err.concat(" >> SQL >>  ").concat(
      erro.sql
        .toString()
        .replace(/\s{2,}/g, " ")
        .replace(/\'/g, '"')
    );
  }
  erro = erro
    .toString()
    .replace(/\s{2,}/g, " ")
    .replace(/\'/g, '"')
    .concat(err);
  try {
    await SQL(`
    insert into tech_log
           (descricao,
           desc_erro,
           cadlog_id,
           data_cadastro)
    values ('${desc}',
           '${erro}',
           ${type},
           STR_TO_DATE('${getDate()}','%Y-%m-%d %H:%i:%s'));`);
  } catch (error) {
    return null;
  }
};

const getLogs = async (req, res) => {
  try {
    const { id } = req.query;

    const logs = await SQL(`
             select tech_log.id,
                    tech_log.descricao, 
                    tech_log.desc_erro erro,
                    tech_cadlog.descricao tipo,
                    tech_log.data_cadastro data
               from tech_log,
                    tech_cadlog
              where tech_cadlog.id = tech_log.cadlog_id
        ${id ? `and tech_log.id < ${id}` : ""}        
              order by tech_log.id desc
              limit 30;
               
        select count(tech_log.id) registros
          from tech_log;`);

    let result = {
      logs: logs[0],
      qtdRegistros: logs[1][0].registros
    };

    res.status(200).send(result);
  } catch (error) {
    saveLog("acessContrtol.getLogs", error, 2);
  }
};

module.exports = { getAcessViews, saveLog, getLogs };
