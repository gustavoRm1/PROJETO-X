module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'AXTRON_SUPREME_SECRET',
  jwtExpiresIn: '7d'
};
