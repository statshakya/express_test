/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
     return knex.schema.table('users',(table)=>{
        table.boolean('status').notNullable().defaultTo(false);
     })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('users',(table)=>{
    table.dropColumn('status');
  })
};
