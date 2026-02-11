/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.table('users',(table)=>{
        table.string('email').unique().index();
        table.string('otp_code').nullable();
        table.string('otp_expires_at').nullable();
    })
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
    return knex.schema.table('users',(table)=>{
        table.dropColumn('email');
        table.dropColumn('otp_code');
        table.dropColumn('otp_expires_at');
    })
};
