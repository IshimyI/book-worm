const jwtConfig = {
  access: {
    expiresIn: `${60 * 5 * 1000}`,
  },
  refresh: {
    expiresIn: `${12 * 60 * 60 * 1000}`,
  },
};

module.exports = jwtConfig;
