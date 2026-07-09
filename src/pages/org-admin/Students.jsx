import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Ban, Check, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import usePagination from '../../hooks/usePagination';
import useDebounce from '../../hooks/useDebounce';
import * as studentsApi from '../../api/students';
import * as usersApi from '../../api/users';
import { extractErrorMessages } from '../../api/client';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import SearchBar from '../../components/ui/SearchBar';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';
import Modal from '../../components/ui/Modal';
import { Textarea, Field } from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import CreateStudentModal from './CreateStudentModal';

export default function Students() {
  const [tab, setTab] = useState('active');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const activeList = usePagination(studentsApi.list, { search: debouncedSearch }, 10);
  const pendingList = usePagination(studentsApi.listPending, { search: debouncedSearch }, 10);
  const list = tab === 'active' ? activeList : pendingList;

  useEffect(() => {
    if (tab === 'pending') {
      const interval = setInterval(() => {
        pendingList.refresh();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [tab, pendingList]);

  const approve = async (id) => {
    try {
      await studentsApi.approve(id);
      toast.success('Student approved');
      pendingList.refresh();
    } catch (err) {
      extractErrorMessages(err).forEach((m) => toast.error(m));
    }
  };

  const doReject = async () => {
    try {
      await studentsApi.reject(rejectTarget._id || rejectTarget.id, rejectReason);
      toast.success('Student rejected');
      setRejectTarget(null);
      setRejectReason('');
      pendingList.refresh();
    } catch (err) {
      extractErrorMessages(err).forEach((m) => toast.error(m));
    }
  };

  const doDeactivate = async () => {
    try {
      await usersApi.updateStatus(deactivateTarget._id || deactivateTarget.id, deactivateTarget.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
      toast.success('Status updated');
      setDeactivateTarget(null);
      activeList.refresh();
    } catch (err) {
      extractErrorMessages(err).forEach((m) => toast.error(m));
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="page-eyebrow">People</span>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">Manage active students and pending approvals.</p>
        </div>
        <Button icon={Plus} onClick={() => setModalOpen(true)}>Create Student</Button>
      </div>

      <Tabs
        tabs={[
          { key: 'active', label: 'Active' },
          { key: 'pending', label: 'Pending Approval', count: pendingList.meta.totalItems || undefined },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="row" style={{ marginBottom: 'var(--sp-4)' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search students…" />
      </div>

      {tab === 'active' ? (
        <DataTable
          loading={activeList.loading}
          emptyLabel="No active students found."
          columns={[
            { key: 'fullName', header: 'Full Name' },
            { key: 'email', header: 'Email' },
            { key: 'region', header: 'Region', render: (r) => r.regionId?.name || r.region?.name || '—' },
            { key: 'mobile', header: 'Mobile', render: (r) => r.mobile || '—' },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status || 'ACTIVE'} /> },
            { key: 'enrolledCourses', header: 'Enrolled Courses', render: (r) => r.enrolledCoursesCount ?? r.enrolledCourses ?? 0 },
            { key: 'createdAt', header: 'Joined', render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—') },
            {
              key: 'actions', header: 'Actions', render: (r) => (
                <div className="row" style={{ gap: 6 }}>
                  <Link to={`/admin/students/${r._id || r.id}`}><Button size="sm" variant="ghost" icon={Eye}>View</Button></Link>
                  <Button size="sm" variant="outline" onClick={() => setModalOpen(r)}>Edit</Button>
                  <Button size="sm" variant="outline" icon={Ban} onClick={() => setDeactivateTarget(r)}>
                    {r.status === 'INACTIVE' ? 'Activate' : 'Deactivate'}
                  </Button>
                </div>
              ),
            },
          ]}
          rows={activeList.items}
        />
      ) : (
        <DataTable
          loading={pendingList.loading}
          emptyLabel="No pending students. You're all caught up."
          columns={[
            { key: 'fullName', header: 'Full Name' },
            { key: 'email', header: 'Email' },
            { key: 'region', header: 'Region', render: (r) => r.regionId?.name || r.region?.name || '—' },
            { key: 'mobile', header: 'Mobile', render: (r) => r.mobile || '—' },
            { key: 'createdAt', header: 'Registered On', render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—') },
            {
              key: 'actions', header: 'Actions', render: (r) => (
                <div className="row" style={{ gap: 6 }}>
                  <Button size="sm" variant="secondary" icon={Check} onClick={() => approve(r._id || r.id)}>Approve</Button>
                  <Button size="sm" variant="danger" icon={X} onClick={() => setRejectTarget(r)}>Reject</Button>
                </div>
              ),
            },
          ]}
          rows={pendingList.items}
        />
      )}

      <Pagination currentPage={list.page} totalPages={list.meta.totalPages} totalItems={list.meta.totalItems} onChange={list.setPage} />

      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject Student" subtitle={rejectTarget?.fullName} width={420}>
        <div className="stack">
          <Field label="Reason for rejection" required>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder="Explain why this application is being rejected…" />
          </Field>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={doReject} disabled={!rejectReason.trim()}>Confirm Reject</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={doDeactivate}
        title={deactivateTarget?.status === 'INACTIVE' ? 'Activate this student?' : 'Deactivate this student?'}
        description={`${deactivateTarget?.fullName} will ${deactivateTarget?.status === 'INACTIVE' ? 'regain' : 'lose'} access to their account.`}
        confirmLabel={deactivateTarget?.status === 'INACTIVE' ? 'Activate' : 'Deactivate'}
        danger={deactivateTarget?.status !== 'INACTIVE'}
      />

      <CreateStudentModal
        open={!!modalOpen}
        onClose={() => setModalOpen(false)}
        student={typeof modalOpen === 'object' ? modalOpen : null}
        onCreated={() => {
          setModalOpen(false);
          list.refresh();
        }}
      />
    </div>
  );
}
