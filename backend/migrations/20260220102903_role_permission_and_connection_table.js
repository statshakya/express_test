/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('roles',(table)=>{
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.timestamps(true,true);
  })
  .createTable('permissions',(table)=>{
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.timestamps(true,true);
  })
  .createTable('role_permissions',(table)=>{
    table.integer('role_id').unsigned().references('id').inTable('roles').onDelete('CASCADE');
    table.integer('permission_id').unsigned().references('id').inTable('permissions').onDelete('CASCADE');
    table.primary(['role_id','permission_id']);
  })

  .table('users',(table)=>{
    table.integer('role_id').unsigned().references('id').inTable('roles').nullable()
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('users',(table)=>{
    table.dropColumn('role_id');
  })
  .dropTableIfExists('role_permissions')
  .dropTableIfExists('permissions')
  .dropTableIfExists('roles')
  
};
