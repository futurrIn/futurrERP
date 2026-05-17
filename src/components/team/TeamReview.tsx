import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/api';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Search,
  ChevronRight,
  MapPin,
  Coffee,
  Hotel,
  ShoppingBag,
  ArrowRight,
  Car,
  User,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';

const TeamReview = () => {
  const queryClient = useQueryClient();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Pending');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');

  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: api.getProfile });
  const { data: allExpenses = [], isLoading } = useQuery({ 
    queryKey: ['team-expenses'], 
    queryFn: api.getTeamExpenses 
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => api.updateExpenseStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-expenses'] });
    }
  });

  const availableDepartments = useMemo(() => {
    const depts = new Set<string>();
    allExpenses.forEach((exp: any) => {
      const dept = exp.employeeDepartment || exp.employee?.department;
      if (dept && dept.toLowerCase() !== 'management') depts.add(dept);
    });
    return ['All', ...Array.from(depts)];
  }, [allExpenses]);

  // Filter expenses by manager's department
  const departmentExpenses = useMemo(() => {
    return allExpenses.filter((exp: any) => {
      const isManager = profile?.role === 'Manager';
      const empDept = exp.employeeDepartment || exp.employee?.department || 'General';
      
      if (isManager) {
        // Managers can only approve standard employee claims in their department (no self-approval or manager-approval)
        const isEmpManager = exp.employeeRole === 'Manager' || exp.employee?.role === 'Manager';
        return empDept === profile?.department && !isEmpManager && exp.createdBy !== profile?.id;
      }
      
      return selectedDepartment === 'All' || empDept === selectedDepartment;
    });
  }, [allExpenses, profile, selectedDepartment]);

  // Group expenses by unique employee
  const employeesList = useMemo(() => {
    const employeesMap: { [key: string]: any } = {};

    departmentExpenses.forEach((exp: any) => {
      const empId = exp.createdBy;
      if (!empId) return;

      if (!employeesMap[empId]) {
        employeesMap[empId] = {
          id: empId,
          name: exp.employeeName || exp.employee?.fullName || 'Unknown Employee',
          department: exp.employeeDepartment || exp.employee?.department || 'General',
          role: exp.employee?.role || 'Employee',
          pendingCount: 0,
          approvedCount: 0,
          totalAmount: 0,
          expenses: []
        };
      }

      employeesMap[empId].expenses.push(exp);
      employeesMap[empId].totalAmount += exp.totalAmount || 0;
      if (exp.status === 'Pending') {
        employeesMap[empId].pendingCount += 1;
      } else if (exp.status === 'Approved') {
        employeesMap[empId].approvedCount += 1;
      }
    });

    return Object.values(employeesMap).filter((emp: any) => 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [departmentExpenses, searchTerm]);

  // Get active selected employee details
  const selectedEmployee = useMemo(() => {
    if (!selectedEmployeeId) return null;
    const emp = employeesList.find(e => e.id === selectedEmployeeId);
    if (!emp) return null;

    // Filter their expenses based on selected status filter
    const filtered = emp.expenses.filter((exp: any) => 
      filterStatus === 'All' || exp.status === filterStatus
    );

    return { ...emp, filteredExpenses: filtered };
  }, [selectedEmployeeId, employeesList, filterStatus]);

  const renderEmployeeCard = (emp: any) => (
    <div 
      key={emp.id}
      onClick={() => setSelectedEmployeeId(emp.id)}
      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer group flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg">
          {emp.name.charAt(0)}
        </div>
        <div>
          <h4 className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{emp.name}</h4>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{emp.department} • {emp.role}</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-xs font-bold text-slate-400 uppercase">Pending</p>
          <p className={`text-base font-black ${emp.pendingCount > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
            {emp.pendingCount} Claims
          </p>
        </div>
        <ChevronRight className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" size={20} />
      </div>
    </div>
  );

  if (isLoading) {
    return <div className="flex justify-center p-12"><Clock className="animate-spin text-slate-300" size={32} /></div>;
  }

  const managers = employeesList.filter((e: any) => e.role === 'Manager');
  const teamMembers = employeesList.filter((e: any) => e.role !== 'Manager');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 px-4 md:px-0">
      
      {/* Dynamic Drill Down Interface */}
      {!selectedEmployee ? (
        // VIEW 1: Employee Directory (List of Team Members)
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Team Oversight</h2>
              <p className="text-slate-500 font-medium text-sm">Review expenses by department team members</p>
            </div>
            {profile?.role === 'Manager' ? (
              <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100 self-start text-xs font-bold uppercase tracking-wider">
                Dept: {profile?.department || 'All'}
              </div>
            ) : (
              <select 
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100 self-start text-xs font-bold uppercase tracking-wider outline-none cursor-pointer"
              >
                {availableDepartments.map(d => (
                  <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
                ))}
              </select>
            )}
          </div>

          {/* Search bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
            <input 
              type="text"
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-sm"
            />
          </div>

          {/* Employees List Grid */}
          <div className="space-y-8">
            {employeesList.length === 0 ? (
              <div className="bg-white p-20 rounded-[2rem] border border-slate-200 text-center">
                <Users className="mx-auto text-slate-200 mb-4" size={48} />
                <p className="text-slate-400 font-bold">No team members found in your department.</p>
              </div>
            ) : (
              <>
                {managers.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Department Managers</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {managers.map(renderEmployeeCard)}
                    </div>
                  </div>
                )}
                
                {teamMembers.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Team Members</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {teamMembers.map(renderEmployeeCard)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        // VIEW 2: Complete Expense List for Selected Employee
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          {/* Back Header */}
          <button 
            onClick={() => setSelectedEmployeeId(null)}
            className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Team
          </button>

          {/* Profile Card */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-2xl">
                {selectedEmployee.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">{selectedEmployee.name}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedEmployee.department} Department</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-slate-50 px-4 py-3 rounded-2xl text-center min-w-[100px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Claims</p>
                <p className="text-lg font-black text-slate-800">₹{selectedEmployee.totalAmount.toLocaleString()}</p>
              </div>
              <div className="bg-amber-50/50 px-4 py-3 rounded-2xl text-center min-w-[100px]">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-0.5">Pending</p>
                <p className="text-lg font-black text-amber-600">{selectedEmployee.pendingCount}</p>
              </div>
            </div>
          </div>

          {/* Filter Status Selector */}
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 self-start w-fit">
            {['Pending', 'Approved', 'Rejected', 'All'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  filterStatus === status 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Selected Employee's Expenses List */}
          <div className="space-y-4">
            {selectedEmployee.filteredExpenses.length === 0 ? (
              <div className="bg-white p-16 rounded-[2rem] border border-slate-200 text-center">
                <Clock className="mx-auto text-slate-200 mb-4" size={40} />
                <p className="text-slate-400 font-bold">No {filterStatus} expenses for this employee.</p>
              </div>
            ) : (
              selectedEmployee.filteredExpenses.map((exp: any) => (
                <div 
                  key={exp.id} 
                  className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden hover:border-indigo-200 transition-all p-6 md:p-8"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Category & Date */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
                        {exp.trips?.length > 0 ? <Car size={20} /> : <ShoppingBag size={20} />}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800">
                          {exp.trips?.length > 0 ? `${exp.trips.length} Trip(s)` : exp.purchaseItem || 'General'}
                        </h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Submitted on {format(new Date(exp.date), 'dd MMM, yyyy • hh:mm a')}
                        </p>
                      </div>
                    </div>

                    {/* Cost Summary */}
                    <div className="flex-1 lg:px-8">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Amount</p>
                          <p className="text-base font-black text-slate-800">₹{exp.totalAmount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Status</p>
                          <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                            exp.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                            exp.status === 'Rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {exp.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {exp.status === 'Pending' ? (
                        <>
                          <button 
                            onClick={() => statusMutation.mutate({ id: exp.id, status: 'Approved' })}
                            className="flex-1 lg:flex-none px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                          >
                            <CheckCircle size={18} />
                            Approve
                          </button>
                          <button 
                            onClick={() => statusMutation.mutate({ id: exp.id, status: 'Rejected' })}
                            className="flex-1 lg:flex-none px-4 py-2.5 bg-white text-red-500 border border-red-100 rounded-xl font-bold text-sm hover:bg-red-50 transition-all active:scale-95"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <button 
                          disabled
                          className="px-6 py-2.5 bg-slate-100 text-slate-400 rounded-xl font-bold text-sm cursor-not-allowed"
                        >
                          Processed
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Trip/Food details */}
                  <div className="mt-6 pt-6 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {exp.trips?.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Travel Routes</h5>
                        {exp.trips.map((trip: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-3">
                              <MapPin size={14} className="text-slate-400" />
                              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                {trip.from} <ArrowRight size={10} className="text-slate-300" /> {trip.to}
                              </div>
                            </div>
                            <span className="text-xs font-black text-slate-800">₹{Number(trip.amount).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-4">
                      <h5 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Other Breakdowns</h5>
                      
                      {/* Food */}
                      {(exp.foodAmount > 0 || exp.foodType?.length > 0) && (
                        <div className="flex items-center justify-between p-3 bg-orange-50/50 rounded-xl border border-orange-100 text-xs">
                          <span className="font-bold text-slate-700">Meals ({exp.foodType?.join(', ') || 'General'})</span>
                          <span className="font-black text-slate-800">₹{exp.foodAmount.toLocaleString()}</span>
                        </div>
                      )}

                      {/* Accommodation */}
                      {exp.accommodationAmount > 0 && (
                        <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs">
                          <span className="font-bold text-slate-700">Accommodation ({exp.accommodationDays} Days)</span>
                          <span className="font-black text-slate-800">₹{exp.accommodationAmount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Attachment Proof */}
                  {exp.billUrl && (
                    <div className="mt-6 pt-4 border-t border-slate-50">
                      <a 
                        href={exp.billUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors"
                      >
                        <Eye size={14} />
                        View Attached Bill
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamReview;
