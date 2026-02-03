// Update with your config settings.
require('dotenv').config();
/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

   development: {
    client: 'pg',
    connection: {
      host: '127.0.0.1',
      user:'sahas',
      password:'s1234',
      database:'node_test',
      port:'5432'
    },
    migrations: {
      directory: './migrations'
    }
  },
  // development: {
  //   client: 'pg',
  //   connection: process.env.DATABASE_URL, // Use the string from .env
  //   migrations: {
  //     directory: './migrations',
  //   },
  // },
  // staging: {
  //   client: 'postgresql',
  //   connection: {
  //     database: 'my_db',
  //     user:     'username',
  //     password: 'password'
  //   },
  //   pool: {
  //     min: 2,
  //     max: 10
  //   },
  //   migrations: {
  //     tableName: 'knex_migrations'
  //   }
  // },

  // production: {
  //   client: 'postgresql',
  //   connection: {
  //     database: 'my_db',
  //     user:     'username',
  //     password: 'password'
  //   },
  //   pool: {
  //     min: 2,
  //     max: 10
  //   },
  //   migrations: {
  //     tableName: 'knex_migrations'
  //   }
  // }
  production: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Required for Neon/Render
    },
    migrations: {
      directory: './migrations',
    },
  },
};
