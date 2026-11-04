import React, { useCallback, useEffect, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import EmployeeCards from "../components/EmployeeCards";
import EmployeeForm from "../components/EmployeeForm";
import { listEmployees, deleteEmployee, listDepartments } from "../services/api";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [editEmployee, setEditEmployee] = useState(null);
  const [showCreateModel, setShowCreateModel] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listEmployees({
        search: search || undefined,
        department: selectedDept || undefined,
      });
      setEmployees(data.results || []);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to load employees");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [search, selectedDept]);

  const fetchDepartments = useCallback(async () => {
    try {
      const data = await listDepartments();
      setDepartments(data);
    } catch (err) {
      toast.error("Failed to load departments");
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    const t = setTimeout(() => fetchEmployees(), 300); // debounce search
    return () => clearTimeout(t);
  }, [fetchEmployees]);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    try {
      await deleteEmployee(id);
      toast.success("Employee deleted");
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete employee");
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">Manage your team members</p>
        </div>
        <button
          onClick={() => setShowCreateModel(true)}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus size={16} /> Add Employee
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            placeholder="Search Employees..."
            className="w-full pl-10!"
            onChange={(e) => setSearch(e.target.value)}
            value={search}
          />
        </div>
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="max-w-40"
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.name}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {employees.length === 0 ? (
            <p className="col-span-full text-center py-16 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
              No employees found
            </p>
          ) : (
            employees.map((emp) => (
              <EmployeeCards
                key={emp.id}
                employee={emp}
                onDelete={handleDelete}
                onEdit={(e) => setEditEmployee(e)}
              />
            ))
          )}
        </div>
      )}

      {/* Create modal */}
      {showCreateModel && (
        <div
          className="fixed bg-black/40 backdrop-blur-sm inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
          onClick={() => setShowCreateModel(false)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 pb-0">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Add new Employee</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Create user account and employee profile
                </p>
              </div>
              <button
                onClick={() => setShowCreateModel(false)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <EmployeeForm
                departments={departments}
                onSuccess={() => {
                  setShowCreateModel(false);
                  fetchEmployees();
                }}
                onCancel={() => setShowCreateModel(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editEmployee && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/40 backdrop-blur-sm"
          onClick={() => setEditEmployee(null)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 pb-0">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Edit Employee</h2>
                <p className="text-sm text-slate-500 mt-0.5">Update employee details</p>
              </div>
              <button
                onClick={() => setEditEmployee(null)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <EmployeeForm
                initialData={editEmployee}
                departments={departments}
                onSuccess={() => {
                  setEditEmployee(null);
                  fetchEmployees();
                }}
                onCancel={() => setEditEmployee(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;