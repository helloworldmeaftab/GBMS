import { useState, useEffect } from 'react';
import { 
  Lock,
  Plus,
  Edit,
  Trash2,
  Check,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface Permission {
  id: string;
  role_id: string;
  module: string;
  create_permission: boolean;
  read_permission: boolean;
  update_permission: boolean;
  delete_permission: boolean;
}

const MODULES = [
  'dashboard',
  'employees',
  'clients',
  'products',
  'inventory',
  'invoices',
  'branches',
  'finance',
  'reports',
  'settings'
];

const PermissionsPage = () => {
  const { user } = useAuth();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [showNewRoleForm, setShowNewRoleForm] = useState(false);

  useEffect(() => {
    const fetchBusinessId = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching business ID:', error);
        return;
      }

      if (data) {
        setBusinessId(data.id);
      }
    };

    fetchBusinessId();
  }, [user]);

  useEffect(() => {
    const fetchRolesAndPermissions = async () => {
      if (!businessId) return;

      setIsLoading(true);
      try {
        // Fetch roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('roles')
          .select('*')
          .eq('business_id', businessId)
          .order('name');

        if (rolesError) throw rolesError;

        setRoles(rolesData || []);

        // Fetch permissions
        const { data: permissionsData, error: permissionsError } = await supabase
          .from('permissions')
          .select('*')
          .in('role_id', rolesData?.map(role => role.id) || []);

        if (permissionsError) throw permissionsError;

        setPermissions(permissionsData || []);
      } catch (error) {
        console.error('Error fetching roles and permissions:', error);
        toast.error('Failed to load roles and permissions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRolesAndPermissions();
  }, [businessId]);

  const handleCreateRole = async () => {
    if (!businessId) return;

    try {
      // Create role
      const { data: role, error: roleError } = await supabase
        .from('roles')
        .insert({
          business_id: businessId,
          name: newRole.name,
          description: newRole.description || null,
        })
        .select()
        .single();

      if (roleError) throw roleError;

      // Create default permissions for all modules
      const defaultPermissions = MODULES.map(module => ({
        role_id: role.id,
        module,
        create_permission: false,
        read_permission: true,
        update_permission: false,
        delete_permission: false,
      }));

      const { data: perms, error: permsError } = await supabase
        .from('permissions')
        .insert(defaultPermissions)
        .select();

      if (permsError) throw permsError;

      setRoles([...roles, role]);
      setPermissions([...permissions, ...perms]);
      setNewRole({ name: '', description: '' });
      setShowNewRoleForm(false);
      toast.success('Role created successfully');
    } catch (error) {
      console.error('Error creating role:', error);
      toast.error('Failed to create role');
    }
  };

  const handleUpdateRole = async (roleId: string, updates: Partial<Role>) => {
    try {
      const { error } = await supabase
        .from('roles')
        .update(updates)
        .eq('id', roleId);

      if (error) throw error;

      setRoles(roles.map(role => 
        role.id === roleId ? { ...role, ...updates } : role
      ));
      setEditingRole(null);
      toast.success('Role updated successfully');
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      // Delete permissions first (due to foreign key constraint)
      const { error: permsError } = await supabase
        .from('permissions')
        .delete()
        .eq('role_id', roleId);

      if (permsError) throw permsError;

      // Then delete the role
      const { error: roleError } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);

      if (roleError) throw roleError;

      setRoles(roles.filter(role => role.id !== roleId));
      setPermissions(permissions.filter(perm => perm.role_id !== roleId));
      toast.success('Role deleted successfully');
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Failed to delete role');
    }
  };

  const handleUpdatePermission = async (
    roleId: string,
    module: string,
    field: keyof Permission,
    value: boolean
  ) => {
    try {
      const permission = permissions.find(p => 
        p.role_id === roleId && p.module === module
      );

      if (permission) {
        // Update existing permission
        const { error } = await supabase
          .from('permissions')
          .update({ [field]: value })
          .eq('id', permission.id);

        if (error) throw error;

        setPermissions(permissions.map(p =>
          p.id === permission.id ? { ...p, [field]: value } : p
        ));
      } else {
        // Create new permission
        const { data, error } = await supabase
          .from('permissions')
          .insert({
            role_id: roleId,
            module,
            create_permission: field === 'create_permission' ? value : false,
            read_permission: field === 'read_permission' ? value : false,
            update_permission: field === 'update_permission' ? value : false,
            delete_permission: field === 'delete_permission' ? value : false,
          })
          .select()
          .single();

        if (error) throw error;

        setPermissions([...permissions, data]);
      }

      toast.success('Permission updated successfully');
    } catch (error) {
      console.error('Error updating permission:', error);
      toast.error('Failed to update permission');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
        <button
          onClick={() => setShowNewRoleForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Role
        </button>
      </div>

      {showNewRoleForm && (
        <div className="bg-white shadow sm:rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Create New Role</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Role Name
              </label>
              <input
                type="text"
                id="name"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <input
                type="text"
                id="description"
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowNewRoleForm(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRole}
                disabled={!newRole.name}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  {MODULES.map((module) => (
                    <th key={module} scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {module}
                    </th>
                  ))}
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {roles.map((role) => (
                  <tr key={role.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingRole === role.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={role.name}
                            onChange={(e) => handleUpdateRole(role.id, { name: e.target.value })}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                          />
                          <input
                            type="text"
                            value={role.description || ''}
                            onChange={(e) => handleUpdateRole(role.id, { description: e.target.value })}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                            placeholder="Description"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{role.name}</div>
                          {role.description && (
                            <div className="text-sm text-gray-500">{role.description}</div>
                          )}
                        </div>
                      )}
                    </td>
                    {MODULES.map((module) => {
                      const permission = permissions.find(p => 
                        p.role_id === role.id && p.module === module
                      );
                      return (
                        <td key={module} className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleUpdatePermission(
                                role.id,
                                module,
                                'create_permission',
                                !(permission?.create_permission)
                              )}
                              className={`p-1 rounded ${
                                permission?.create_permission
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-gray-100 text-gray-400'
                              }`}
                              title="Create"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleUpdatePermission(
                                role.id,
                                module,
                                'read_permission',
                                !(permission?.read_permission)
                              )}
                              className={`p-1 rounded ${
                                permission?.read_permission
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-gray-100 text-gray-400'
                              }`}
                              title="Read"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleUpdatePermission(
                                role.id,
                                module,
                                'update_permission',
                                !(permission?.update_permission)
                              )}
                              className={`p-1 rounded ${
                                permission?.update_permission
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-gray-100 text-gray-400'
                              }`}
                              title="Update"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleUpdatePermission(
                                role.id,
                                module,
                                'delete_permission',
                                !(permission?.delete_permission)
                              )}
                              className={`p-1 rounded ${
                                permission?.delete_permission
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-gray-100 text-gray-400'
                              }`}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {editingRole === role.id ? (
                          <button
                            onClick={() => setEditingRole(null)}
                            className="text-teal-600 hover:text-teal-900"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditingRole(role.id)}
                            className="text-teal-600 hover:text-teal-900"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            toast.custom((t) => (
                              <div className={`${
                                t.visible ? 'animate-enter' : 'animate-leave'
                              } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                                <div className="flex-1 w-0 p-4">
                                  <div className="flex items-start">
                                    <div className="ml-3 flex-1">
                                      <p className="text-sm font-medium text-gray-900">
                                        Delete Role
                                      </p>
                                      <p className="mt-1 text-sm text-gray-500">
                                        Are you sure you want to delete this role?
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex border-l border-gray-200">
                                  <button
                                    onClick={() => {
                                      handleDeleteRole(role.id);
                                      toast.dismiss(t.id);
                                    }}
                                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ), {
                              duration: Infinity,
                            });
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionsPage;