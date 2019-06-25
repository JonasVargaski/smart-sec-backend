module.exports = function getDateTime(datetime) {
  if (!datetime) {
    datetime = new Date();
    datetime.setTime(datetime.getTime() - 10800000); //3GMT
  }

  let hora = datetime.getHours();
  let minmuto = datetime.getMinutes();
  let segundo = datetime.getSeconds();
  let dia = datetime.getDate();
  let mes = datetime.getMonth() + 1;
  let ano = datetime.getFullYear();

  return `${ano}-${mes}-${dia} ${hora}:${minmuto}:${segundo}`;
};
