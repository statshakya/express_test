/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('permissions').insert([
    {name: 'task:create'},
    {name: 'task:view'},

    {name: 'subtask:create'},
    {name: 'subtask:edit'},
    {name: 'subtask:delete'},

    {name:'column:manage'},

    {name: 'role:config'}
   ]).onConflict('name').ignore();

   console.log("permissions added");
};
