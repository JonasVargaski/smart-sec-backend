const existsOrError = (value, msg, res) => {
  // if (!value) return res.status(400).send({ info: msg })
  // if (Array.isArray(value) && value.length === 0) return res.status(400).send({ info: msg })
  // if (typeof value === 'string' && !value.trim()) return res.status(400).send({ info: msg })

  if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === "string" && !value.trim())) {
    res.status(400).send({ info: msg });
    throw `validate.existsOrError: erro: "${msg}"    parametro: "${value}"`;
  }
};

const notExistsOrError = (value, msg, res) => {
  try {
    existsOrError(value, msg, res);
  } catch (msg) {
    throw msg;
  }
  res.status(400).send({ info: msg });
};

const equalsOrError = (valueA, valueB, msg, res) => {
  if (valueA !== valueB) {
    res.status(400).send({ info: msg });
    throw `validate.equalsOrError: >> ${valueA} , ${valueB}`;
  }
};

const validateEmail = (email, msg, res) => {
  let parseEmail = /^[a-z0-9.-_&]+@[a-z0-9]+\.[a-z]+(\.[a-z]+)?$/i;
  if (!parseEmail.test(email.trim())) {
    res.status(400).send({ info: msg });
    throw `validate.valiteEmail: >> ${email}`;
  }
};

module.exports = { existsOrError, notExistsOrError, equalsOrError, validateEmail };
