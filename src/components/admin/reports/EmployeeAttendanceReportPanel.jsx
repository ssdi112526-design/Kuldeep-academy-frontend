import { useEffect, useState } from 'react';
import SearchBar from '../SearchBar';
import Pagination from '../Pagination';
import { reportsService } from '../../../services';
import { useToast } from '../../../context/ToastContext';
import { usePermissions } from '../../../context/PermissionContext';
import { getApiErrorMessage } from '../../../utils/apiError';
import useDebouncedValue from '../../../hooks/useDebouncedValue';
import {
  ReportExportBar,
  ReportTable,
  MONTHS,
  currentMonthYear,
  reportInputClass,
} from './reportUi';

export default function EmployeeAttendanceReportPanel() {
  const toast = useToast();
  const { can } = usePermissions();
  const canExport = can('reports.export');
  const canPrint = can('reports.print');
  const cy = currentMonthYear();

  const [month, setMonth] = useState(cy.month);
  const [year, setYear] = useState(cy.year);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [role, setRole] = useState('');
  const [category, setCategory] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  const filters = {
    month,
    year,
    search: debouncedSearch.trim() || undefined,
    role: role.trim() || undefined,
    category: category.trim() || undefined,
  };

  const load = async (page = pagination.page) => {
    setLoading(true);
    try {
      const res = await reportsService.employeeAttendance({
        ...filters,
        page,
        limit: pagination.limit,
      });
      const data = res.data.data;
      setRows(data.rows || []);
      const total = data.total || 0;
      const limit = data.limit || pagination.limit;
      setPagination((p) => ({
        ...p,
        page: data.page || page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      }));
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load employee attendance'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year, debouncedSearch, role, category, pagination.limit]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Employee attendance</h2>
          <p className="mt-1 text-sm text-muted">Coach / staff attendance for the month.</p>
        </div>
        <ReportExportBar
          reportKey="employee-attendance"
          filters={filters}
          canExport={canExport}
          canPrint={canPrint}
          toast={toast}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <select
          className={`${reportInputClass} w-40`}
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
        >
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          className={`${reportInputClass} w-28`}
          value={year}
          onChange={(e) => setYear(Number(e.target.value) || cy.year)}
        />
        <SearchBar value={search} onChange={setSearch} placeholder="Search employee…" />
        <input
          className={`${reportInputClass} max-w-[10rem]`}
          placeholder="Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
        <input
          className={`${reportInputClass} max-w-[10rem]`}
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>

      <ReportTable
        loading={loading}
        rows={rows}
        columns={[
          { key: 'employeeName', label: 'Employee' },
          { key: 'role', label: 'Role' },
          { key: 'category', label: 'Category' },
          { key: 'joiningDate', label: 'Joining' },
          { key: 'present', label: 'Present' },
          { key: 'absent', label: 'Absent' },
          { key: 'leave', label: 'Leave' },
          {
            key: 'pct',
            label: '%',
            render: (r) => `${Number(r.attendancePct ?? 0).toFixed(1)}%`,
          },
        ]}
      />
      <Pagination
        pagination={pagination}
        onPageChange={(page) => load(page)}
        onLimitChange={(limit) => setPagination((p) => ({ ...p, limit }))}
      />
    </div>
  );
}
