import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/api';
import { 
  Users, 
  Search, 
  ShieldAlert, 
  UserX, 
  CheckCircle2, 
  Loader2,
  Building2,
  Briefcase
} from 'lucide-react';

const UserManagement = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<any>(null);

  const { data: users, isLoading } = useQuery({ 
    queryKey: ['all-users'], 
    queryFn: api.getAllUsers 
  });

  const { data: settings } = useQuery({ 
    queryKey: ['settings'], 
    queryFn: api.getSettings 
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string, isActive: boolean }) => api.updateUserStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role, department }: { userId: string, role: string, department: string }) => api.updateUserRoleAndDept(userId, role, department),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      setEditingUser(null);
    }
  });

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    updateRoleMutation.mutate({
      userId: editingUser.id,
      role: editingUser.role,
      department: editingUser.department
    });
  };

  const filteredUsers = users?.filter((u: any) => 
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-300" size={32} /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">User Management</h2>
          <p className="text-slate-500 font-medium text-sm">Control roles, departments, and access for all company personnel.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 text-sm font-bold text-slate-600">
          <Users size={18} className="text-indigo-600" />
          {users?.filter((u: any) => u.is_active !== false).length} Active Users
        </div>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="p-4 pl-6">Employee</th>
                <th className="p-4">Role</th>
                <th className="p-4">Department</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers?.map((user: any) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-black flex items-center justify-center">
                        {user.fullName?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{user.fullName}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      user.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'Accountant' ? 'bg-emerald-100 text-emerald-700' :
                      user.role === 'Manager' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-bold text-slate-600">
                    {user.department || 'N/A'}
                  </td>
                  <td className="p-4">
                    {user.is_active === false ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-rose-500">
                        <UserX size={14} /> Deactivated
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-500">
                        <CheckCircle2 size={14} /> Active
                      </span>
                    )}
                  </td>
                  <td className="p-4 pr-6 text-right space-x-2">
                    <button 
                      onClick={() => setEditingUser(user)}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:border-indigo-200 hover:text-indigo-600 transition-all"
                    >
                      Edit Role
                    </button>
                    {user.is_active === false ? (
                      <button 
                        onClick={() => updateStatusMutation.mutate({ userId: user.id, isActive: true })}
                        className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all"
                      >
                        Reactivate
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to deactivate ${user.fullName}? They will immediately lose access.`)) {
                            updateStatusMutation.mutate({ userId: user.id, isActive: false });
                          }
                        }}
                        className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all"
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers?.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 font-bold">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <form onSubmit={handleSaveUser}>
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-xl font-black text-slate-800">Edit User Permissions</h3>
                <p className="text-sm text-slate-500 font-medium">Modifying access for {editingUser.fullName}</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Role</label>
                  <select 
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Department</label>
                  <select 
                    value={editingUser.department}
                    onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">No Department</option>
                    {settings?.departments?.map((d: string) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                
                {editingUser.role === 'Admin' && (
                  <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold">
                    <ShieldAlert size={16} className="shrink-0" />
                    Warning: Granting Admin role gives full system control.
                  </div>
                )}
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={updateRoleMutation.isPending}
                  className="flex-1 py-3 bg-indigo-600 rounded-xl font-bold text-white hover:bg-indigo-700 transition-all flex justify-center items-center"
                >
                  {updateRoleMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
