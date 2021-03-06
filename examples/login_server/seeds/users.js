const bcrypt = require('bcryptjs');
const Promise = require('bluebird');


const workFactor = Number(process.env.WORK_FACTOR) || 2;


exports.seed = (knex) =>
  Promise.all([
    knex('users').insert([
      {
        name: 'Don Draper',
        email: 'don@scdp.com',
        password_hash: bcrypt.hashSync('rachelMenk3n', bcrypt.genSaltSync(workFactor, 10)),
      },
      {
        name: 'Stan Rizzo',
        email: 'stan@scdp.com',
        password_hash: bcrypt.hashSync('P399yOlsen', bcrypt.genSaltSync(workFactor, 10)),
      },
      {
        name: 'Peggy Olson',
        email: 'peggy@scdp.com',
        boss_id: 1,
        password_hash: bcrypt.hashSync('stanRizz0', bcrypt.genSaltSync(workFactor, 10)),
      },
    ]),
  ])
  .then(() => knex('users').update({ boss_id: 3 }).where({ email: 'stan@scdp.com' }));
