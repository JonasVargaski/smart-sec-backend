const SQL = require("../database/index");
const { existsOrError } = require("../util/validate");
const getDate = require("../util/datetime");
const { saveLog } = require("./AcessControl");

const findAll = async (req, res) => {
  //Traz todos os tech_equipamento cadastrados
  try {
    const devices = await SQL(`select tech_equipamento.id,
                                          tech_equipamento.mac_adress numeroSerie,
                                          tech_equipamento.senha_serie senha,
                                          tech_equipamento.situacao situacao,
                                          tech_equipamento.versao_soft versaoSoft,
                                          tech_cadequipamento.modelo modelo,
                                          tech_cadequipamento.descricao descricao,
                                          tech_cadequipamento.aplicacao aplicacao,
                                          tech_equipamento.data_acesso dataAcesso,
                                          tech_equipamento.data_cadastro dataCadastro,
                                          tech_equipamento.data_modificacao dataModificacao
                                     from tech_equipamento,
                                          tech_cadequipamento
                                    where tech_equipamento.cadequipamento_id = tech_cadequipamento.id`);

    return res.status(200).send(devices);
  } catch (msg) {
    saveLog("device.findAll", msg, 2);
    return res.status(500).json({ info: "Erro Interno" });
  }
};

const lastedData = async (req, res) => {
  //Ultimo dado recebido
  try {
    const nsDevice = req.params.id;
    existsOrError(nsDevice, "id inválido!", res);

    const data = await SQL(`select data,
                                   temperatura temp,
                                   temperatura_ajuste tempAjst,
                                   umidade umid,
                                   umidade_ajuste umidAjst,
                                   sts_ventoinha ventoinha,
                                   sts_alarme alarme,
                                   modo_trabalho modoTrabalho,
                                   sts_trava trava,
                                   fase,
                                   clima,
                                   tipo_sensor tipoSensor,
                                   sts_falta_energia energia
                              from ss_${nsDevice} 
                          order by data
                             limit 1`);

    return res.status(200).send(data);
  } catch (msg) {
    saveLog("device.lastedData", msg, 2);
    return res.status(500).json({ info: "Erro Interno" });
  }
};

const graph = async (req, res) => {
  try {
    const nsDevice = req.params.id;
    existsOrError(nsDevice, "id inválido!", res);

    const data = await SQL(`
               select temperatura temp,
                                  temperatura_ajuste tempAjst,
                                  umidade umid,
                                  umidade_ajuste umidAjst,
                                  data
                             from ss_${nsDevice} 
                            order by data desc 
                            limit 200`);

    return res.status(200).send(data);
  } catch (msg) {
    saveLog("device.graph", msg, 2);
    res.status(500).json({ info: "Erro Interno" });
  }
};

const setSituation = async (req, res) => {
  try {
    const data = req.body;

    existsOrError(data.ns, "Numero de série não informado!", res);
    existsOrError(data.senha, "Senha não informada!", res);
    existsOrError(data.situacao, "Situação não informada!", res);

    const device = await SQL(`update tech_equipamento
                                 set situacao = '${data.situacao}',
                                     data_modificacao = STR_TO_DATE('${getDate()}','%Y-%m-%d %H:%i:%s')  
                               where mac_adress = ${data.ns} 
                                 and senha_serie = ${data.senha}`);

    if (device[0].affectedRows) return res.status(200).end();

    return res.status(400).send({ info: "Não foi possivél atualizar !" });
  } catch (msg) {
    saveLog("device.setSituation", msg, 2);
    return res.status(500).send({ info: "Erro Interno" });
  }
};

const saveData = (req, res) => {
  const info = req.query.i.split("/");
  const params = req.query.p.split("/");

  let controlador;
  let parametros;

  if (info.length == 15 && params.length == 15) {
    controlador = {
      temp: info[0],
      temp_ajt: info[1],
      umid: info[2],
      umid_ajt: info[3],
      sts_ventoinha: info[4],
      sts_alarme: info[5],
      modo_trabalho: info[6],
      sts_trava: info[7],
      fase: info[8],
      clima: info[9],
      tp_sensor: info[10],
      wifi_mac: info[11],
      wifi_senha: info[12],
      versao_soft: info[13],
      falta_energia: info[14],
      data: new Date(getDate())
    };
    parametros = {
      p1: params[0],
      p2: params[1],
      p3: params[2],
      p4: params[3],
      p5: params[4],
      p6: params[5],
      p7: params[6],
      p8: params[7],
      p9: params[8],
      p10: params[9],
      p11: params[10],
      p12: params[11],
      p13: params[12],
      p14: params[13],
      p15: params[14]
    };

    req.io.emit(controlador.wifi_mac, controlador);
  } else {
    return res.status(400).json({ save: "ERRO" });
  }
  try {
    SQL(`select max(data) as data
           from ss_${controlador.wifi_mac}
       `)
      .then(dado => {
        let data = new Date(dado[0].data);
        let dataAtual = new Date(getDate());

        // salva novo dado a cada 7  minutos
        if (data.getTime() + 420000 - dataAtual.getTime() <= 0) {
          SQL(`
     insert into ss_${controlador.wifi_mac}
          values ('',
                 STR_TO_DATE('${getDate()}','%Y-%m-%d %H:%i:%s'), 
                 ${controlador.temp}, 
                 ${controlador.temp_ajt}, 
                 ${controlador.umid}, 
                 ${controlador.umid_ajt}, 
                 ${controlador.sts_ventoinha},
                 ${controlador.sts_alarme},
                 ${controlador.modo_trabalho},
                 ${controlador.sts_trava},
                 ${controlador.fase},
                 ${controlador.clima},
                 ${controlador.tp_sensor},
                 ${controlador.falta_energia});

         select @id:= id as id 
           from tech_equipamento 
          where mac_adress = '${controlador.wifi_mac}';

         update tech_equipamento
            set data_acesso = STR_TO_DATE('${getDate()}','%Y-%m-%d %H:%i:%s'),
                versao_soft = '${controlador.versao_soft}'
          where id = @id;
                  
        update tech_paramsequip
           set p1=${parametros.p1},
               p2=${parametros.p2},
               p3=${parametros.p3},
               p4=${parametros.p4},
               p5=${parametros.p5},
               p6=${parametros.p6},
               p7=${parametros.p7},
               p8=${parametros.p8},
               p9=${parametros.p9},
               p10=${parametros.p10},
               p11=${parametros.p11},
               p12=${parametros.p12},
               p13=${parametros.p13},
               p14=${parametros.p14},
               p15=${parametros.p15},
               data_modificacao = STR_TO_DATE('${getDate()}','%Y-%m-%d %H:%i:%s')
         where equipamento_id = @id;  `)
            .then(() => {
              return res.status(200).send({ save: "SUCESS" });
            })
            .catch(() => {
              return res.status(400).send({ save: "ERROR" });
            });
        } else {
          return res.status(200).send({ save: "SUCESS", timeout: false });
        }
      }) // se nao existir a tabela cria nova
      .catch(async err => {
        try {
          await SQL(`
          create table 
         if not exists ss_${controlador.wifi_mac}(
                       id int(11) NOT NULL AUTO_INCREMENT,
                       data datetime,
                       temperatura int(6),
                       temperatura_ajuste int(6),
                       umidade int(6),
                       umidade_ajuste int(6),
                       sts_ventoinha int(3),
                       sts_alarme int(3),
                       modo_trabalho int(3),
                       sts_trava int(3),
                       fase int(3),
                       clima int(3),
                       tipo_sensor int(3),
                       sts_falta_energia int(3),
                       primary key (id));

           insert into tech_equipamento(
                       mac_adress,
                       senha_serie,
                       versao_soft,
                       situacao,
                       cadequipamento_id,
                       data_cadastro)
                values ('${controlador.wifi_mac}',
                       ${controlador.wifi_senha},
                       '${controlador.versao_soft}',
                       'L',
                       1,
                       STR_TO_DATE('${getDate()}','%Y-%m-%d %H:%i:%s'));

                select @id:= id as id 
                  from tech_equipamento 
                 where mac_adress = '${controlador.wifi_mac}';

           insert into tech_paramsequip 
                       (equipamento_id,
                       data_cadastro)
                values (@id,
                       STR_TO_DATE('${getDate()}','%Y-%m-%d %H:%i:%s')); `);

          res.status(200).json({ save: "SUCESS", create: `ss_${controlador.wifi_mac}` });
        } catch (error) {
          res.status(400).json({ save: "ERRO" });
        }
      });
  } catch (err) {
    res.send({ save: "ERRO INTERNO" });
  }
};

module.exports = { findAll, lastedData, saveData, setSituation, graph };
