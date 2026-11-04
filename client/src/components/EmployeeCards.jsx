import { PencilIcon, Trash2Icon } from "lucide-react";
import React from "react";

const EmployeeCards = ({ employee, onDelete, onEdit }) => {
  return (
    <div className="group relative card card-hover overflow-hidden">
      <div className="relative aspect-4/3 w-full overflow-hidden bg-linear-to-br from-slate-100 to-slate-50">
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-linear-to-br from-indigo-100 to-slate-100 flex items-center justify-center">
            <span className="text-2xl font-medium text-indigo-400">
              {(employee.firstName?.[0] || "?").toUpperCase()}{" "}
              {(employee.lastName?.[0] || "").toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="absolute top-3 left-3 flex gap-2">
        <span className="bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-slate-600 rounded-lg shadow-sm">
          {employee.department || "No Department"}
        </span>
      </div>

      {!employee.isDeleted && (
        <div className="absolute inset-0 bg-linear-to-t from-indigo-700/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 flex items-end justify-center pb-6 gap-3">
          <button
            onClick={() => onEdit(employee)}
            className="p-2.5 bg-white/90 backdrop-blur-sm text-slate-700 hover:text-indigo-600 rounded-xl shadow-lg transition-all hover:scale-105"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(employee.id)}
            className="p-2.5 bg-white/90 backdrop-blur-sm text-slate-700 hover:text-rose-600 rounded-xl shadow-lg transition-all hover:scale-105"
          >
            <Trash2Icon className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="p-5">
        <h3 className="text-slate-900">
          {employee.firstName} {employee.lastName}
        </h3>
        <p className="text-xs text-slate-500">{employee.position}</p>
        {employee.employeeId && (
          <p className="text-xs text-slate-400 mt-1">{employee.employeeId}</p>
        )}
      </div>
    </div>
  );
};

export default EmployeeCards;