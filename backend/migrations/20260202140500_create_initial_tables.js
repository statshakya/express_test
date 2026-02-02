/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('users', (table) => {
      table.increments('id').primary();
      table.string('username').unique().notNullable();
      table.string('password_hash').notNullable(); // Hashed password
      table.timestamps(true, true);
    })
    .createTable('categories', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      // FORMAL LINK TO USERS
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.timestamps(true, true);
    })
    .createTable('tasks', (table) => {
      table.increments('id').primary();
      table.text('content').notNullable();
      // FORMAL LINK TO USERS
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.integer('category_id').unsigned().references('id').inTable('categories').onDelete('SET NULL');
      table.boolean('is_completed').defaultTo(false);
      table.integer('position').defaultTo(0);
      table.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // Drop in reverse order to avoid foreign key violations
  return knex.schema
    .dropTableIfExists('tasks')
    .dropTableIfExists('categories')
    .dropTableIfExists('users');
};