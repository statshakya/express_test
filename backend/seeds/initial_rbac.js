/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // 1. Clear existing data safely
  await knex('role_permissions').del();
  await knex('users').update({ role_id: null }); 
  await knex('permissions').del();
  await knex('roles').del();

  // 2. Insert Roles and get the actual IDs from the DB
  const roles = await knex('roles').insert([
    { name: 'super_admin' },
    { name: 'editor' },
    { name: 'viewer' }
  ]).returning('*');

  // Find the super_admin object from the array we just got back
  const superAdminRole = roles.find(r => r.name === 'super_admin');

  // 3. Insert Base Permissions
  const perms = await knex('permissions').insert([
    { name: 'task:edit' },
    { name: 'task:delete' },
    { name: 'user:manage' }
  ]).returning('*');

  // 4. Link Super Admin to ALL permissions using the dynamic IDs
  const rolePermLinks = perms.map(p => ({
    role_id: superAdminRole.id,
    permission_id: p.id
  }));
  await knex('role_permissions').insert(rolePermLinks);

  // 5. ASSIGN USER ID 2 AS SUPER ADMIN
  // Use the variable superAdminRole.id so it's always correct
  await knex('users')
    .where('id', 2) 
    .update({ role_id: superAdminRole.id });

  console.log(`Success! User 2 is now a Super Admin with Role ID: ${superAdminRole.id}`);
};