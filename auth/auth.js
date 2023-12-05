const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const saltRound = process.env.SALTROUND;
const secretKey = "Qw3$er5*ty6&7Uio8*9P";

const hashPassword = async (password) => {
  let salt = await bcrypt.genSalt(saltRound);
  let hash = await bcrypt.hash(password, salt);
  return hash;
};

const hashCompare = (password, hash) => {
  return bcrypt.compare(password, hash);
};

const createToken = async ({ id, fullName, email, mobNo, dob }) => {
  let token = jwt.sign({ id, fullName, email, mobNo, dob }, secretKey, {
    expiresIn: "30d",
  });
  return token;
};

const createAdminToken = async ({ id, fullName, email, mobNo, dob, role }) => {
  let token = jwt.sign({ id, fullName, email, mobNo, dob, role }, secretKey, {
    expiresIn: "30d",
  });
  return token;
};

const decodeToken = (token) => {
  let data = jwt.decode(token);
  let id = data ? data.id : null;
  // let role = data ? data.role : null;
  return { id, ...data };
};

const tokenValidation = async (req, res, next) => {
  try {
    if (req.headers.authorization) {
      let token = req.headers.authorization.split(" ")[1];
      let { id, ...data } = decodeToken(token);
      if (Math.floor(Date.now() / 1000) <= data.exp) {
        req.userId = id;
        next();
      } else res.status(401).send({ message: "Token Expired" });
    } else {
      res.status(401).send({ message: "Token Not Found" });
    }
  } catch (error) {
    console.error("Internal Server Error Token Validation:", error);
    res
      .status(500)
      .send({ message: "Internal Server Error Token Validation", error });
  }
};

const adminTokenValidation = async (req, res, next) => {
  try {
    if (req.headers.authorization) {
      let token = req.headers.authorization.split(" ")[1];
      let { id, ...data } = decodeToken(token);
      if (data.role === "admin") {
        if (Math.floor(Date.now() / 1000) <= data.exp) {
          req.userId = id;
          next();
        } else res.status(401).send({ message: "Token Expired" });
      } else res.status(401).send({ message: "Only Admin can access" });
    } else res.status(401).send({ message: "Token Not Found" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
};

module.exports = {
  hashCompare,
  hashPassword,
  createToken,
  decodeToken,
  tokenValidation,
  createAdminToken,
  adminTokenValidation,
};
