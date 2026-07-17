import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Power, Copy, Edit2, Plus, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import * as organizationsApi from '../../api/organizations';
import * as usersApi from '../../api/users';
import { extractErrorMessages } from '../../api/client';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import PageLoader from '../../components/ui/PageLoader';
import Modal from '../../components/ui/Modal';
import Input, { Field, Select, Textarea } from '../../components/ui/Input';
import FileUploader from '../../components/ui/FileUploader';

export default function OrganizationDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [org, setOrg] = useState(location.state?.org || null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(!location.state?.org);
  
  // Modals state
  const [editOrgOpen, setEditOrgOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  // adminModalOpen can be false, true (for 'add'), or a user object (for 'edit')

  const fetchUsers = () => {
    usersApi.list({ limit: 200 }).then((res) => {
      const allUsers = res.data?.data || [];
      setUsers(allUsers.filter((u) => u.organizationId === id));
    }).catch(() => {});
  };

  useEffect(() => {
    if (!org) {
      organizationsApi.list({ page: 1, limit: 100 }).then((res) => {
        const found = (res.data?.data || []).find((o) => (o._id || o.id) === id);
        setOrg(found || null);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
    fetchUsers();
  }, [id, org]);

  const toggleStatus = async () => {
    const next = org.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await organizationsApi.updateStatus(org._id || org.id, next);
      setOrg((o) => ({ ...o, status: next }));
      toast.success(`Organization ${next.toLowerCase()}`);
    } catch (err) {
      extractErrorMessages(err).forEach((m) => toast.error(m));
    }
  };

  if (loading) return <PageLoader />;
  if (!org) return <div className="page"><p>Organization not found.</p></div>;

  const baseUrl = window.location.origin + '/macslearnfrontend';
  const loginUrl = org.slug ? `${baseUrl}/${org.slug}/login` : '—';
  const registerUrl = org.slug ? `${baseUrl}/${org.slug}/register` : '—';

  const copyToClipboard = (text, label) => {
    if (text === '—') return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} URL copied to clipboard!`);
  };

  return (
    <div className="page">
      <Link to="/super-admin/organizations" className="row text-muted" style={{ marginBottom: 'var(--sp-4)', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
        <ArrowLeft size={14} /> Back to organizations
      </Link>

      <div className="page-head">
        <div>
          <span className="page-eyebrow">Organization</span>
          <div className="row">
            <h1 className="page-title">{org.name}</h1>
            <StatusBadge status={org.status} />
          </div>
        </div>
        <div className="row" style={{ gap: '12px' }}>
          <Button variant="outline" icon={Settings} onClick={() => setEditOrgOpen(true)}>
            Edit Organization
          </Button>
          <Button variant="outline" icon={Power} onClick={toggleStatus}>
            {org.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 'var(--sp-8)', padding: '20px' }}>
        <h3 style={{ margin: '0 0 var(--sp-4) 0', fontSize: 'var(--fs-sm)', color: 'var(--c-text-muted)' }}>Quick Share Links</h3>
        <div className="stack" style={{ gap: 'var(--sp-4)' }}>
          <div className="row" style={{ alignItems: 'center', gap: 'var(--sp-4)' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--c-text-muted)' }}>Student Registration URL</label>
              <div style={{ padding: '8px 12px', background: 'var(--c-bg-subtle)', borderRadius: 'var(--r-md)', fontSize: '13px', fontFamily: 'monospace', color: 'var(--c-text)', wordBreak: 'break-all' }}>
                {registerUrl}
              </div>
            </div>
            <Button variant="outline" size="sm" icon={Copy} onClick={() => copyToClipboard(registerUrl, 'Registration')}>Copy</Button>
          </div>
          <div className="row" style={{ alignItems: 'center', gap: 'var(--sp-4)' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--c-text-muted)' }}>Organization Login URL</label>
              <div style={{ padding: '8px 12px', background: 'var(--c-bg-subtle)', borderRadius: 'var(--r-md)', fontSize: '13px', fontFamily: 'monospace', color: 'var(--c-text)', wordBreak: 'break-all' }}>
                {loginUrl}
              </div>
            </div>
            <Button variant="outline" size="sm" icon={Copy} onClick={() => copyToClipboard(loginUrl, 'Login')}>Copy</Button>
          </div>
        </div>
      </div>

      <div className="form-grid" style={{ marginBottom: 'var(--sp-8)' }}>
        <Card style={{ padding: 'var(--sp-5)' }}>
          <p className="section-title">Organization Info</p>
          <div className="stack" style={{ gap: 8 }}>
            <Row label="Code" value={org.code} />
            <Row label="Slug" value={org.slug || '—'} />
            <Row label="Contact Email" value={org.contactInfo?.email || '—'} />
            <Row label="Contact Phone" value={org.contactInfo?.phone || '—'} />
            <Row label="Address" value={org.contactInfo?.address || '—'} />
          </div>
        </Card>
        <Card style={{ padding: 'var(--sp-5)' }}>
          <p className="section-title">Subscription</p>
          <div className="stack" style={{ gap: 8 }}>
            <Row label="Plan Type" value={org.subscriptionConfig?.planType || '—'} />
            <Row label="Billing Cycle" value={org.subscriptionConfig?.billingCycle || '—'} />
            <Row label="Max Students" value={org.subscriptionConfig?.maxStudents ?? '—'} />
            <Row label="Max Storage" value={org.subscriptionConfig?.maxStorageGB ? `${org.subscriptionConfig.maxStorageGB} GB` : '—'} />
            <Row label="Expires At" value={org.subscriptionConfig?.expiresAt ? new Date(org.subscriptionConfig.expiresAt).toLocaleDateString() : '—'} />
          </div>
        </Card>
      </div>

      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
        <p className="section-title" style={{ margin: 0 }}>Admin Users</p>
        <Button size="sm" icon={Plus} onClick={() => setAdminModalOpen(true)}>Add Admin</Button>
      </div>
      <DataTable
        columns={[
          { key: 'fullName', header: 'Name' },
          { key: 'email', header: 'Email' },
          { key: 'userType', header: 'Role' },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status || 'ACTIVE'} /> },
          {
            key: 'actions', header: 'Actions', render: (r) => (
              <Button size="sm" variant="outline" icon={Edit2} onClick={() => setAdminModalOpen(r)}>
                Edit
              </Button>
            ),
          },
        ]}
        rows={users}
        emptyLabel="No users found for this organization."
      />

      <EditOrganizationModal
        open={editOrgOpen}
        onClose={() => setEditOrgOpen(false)}
        org={org}
        onSaved={(updatedOrg) => setOrg(updatedOrg)}
      />

      <AdminUserModal
        open={!!adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        user={typeof adminModalOpen === 'object' ? adminModalOpen : null}
        orgId={org._id || org.id}
        onSaved={() => {
          setAdminModalOpen(false);
          fetchUsers();
        }}
      />
    </div>
  );
}

function EditOrganizationModal({ open, onClose, org, onSaved }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && org) {
      setForm({
        name: org.name || '',
        contactInfo: {
          email: org.contactInfo?.email || '',
          phone: org.contactInfo?.phone || '',
          address: org.contactInfo?.address || '',
        },
        subscriptionConfig: {
          planType: org.subscriptionConfig?.planType || '',
          maxStudents: org.subscriptionConfig?.maxStudents ?? 0,
          maxStorageGB: org.subscriptionConfig?.maxStorageGB ?? 0,
        },
      });
    }
  }, [open, org]);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target?.value ?? e }));
  const updateContact = (k) => (e) => setForm((f) => ({ ...f, contactInfo: { ...f.contactInfo, [k]: e.target?.value ?? e } }));
  const updateSub = (k) => (e) => setForm((f) => ({ ...f, subscriptionConfig: { ...f.subscriptionConfig, [k]: e.target?.value ?? e } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        contactInfo: form.contactInfo,
        subscriptionConfig: {
          ...org.subscriptionConfig,
          planType: form.subscriptionConfig.planType,
          maxStudents: Number(form.subscriptionConfig.maxStudents),
          maxStorageGB: Number(form.subscriptionConfig.maxStorageGB),
        },
      };
      const res = await organizationsApi.update(org._id || org.id, payload);
      toast.success('Organization updated successfully');
      onSaved(res.data?.data || res.data);
      onClose();
    } catch (err) {
      extractErrorMessages(err).forEach((m) => toast.error(m));
    } finally {
      setSaving(false);
    }
  };

  if (!form) return null;

  return (
    <Modal open={open} onClose={onClose} title="Edit Organization" width={600}>
      <form className="stack" onSubmit={handleSubmit}>
        <div className="form-grid">
          <Field label="Organization Name" required>
            <Input value={form.name} onChange={update('name')} required />
          </Field>
          <Field label="Code"><Input value={org?.code || ''} disabled /></Field>
        </div>
        <Field label="Slug / Domain"><Input value={org?.slug || ''} disabled /></Field>
        
        <div className="form-grid" style={{ marginTop: 'var(--sp-4)' }}>
          <Field label="Contact Email"><Input type="email" value={form.contactInfo.email} onChange={updateContact('email')} /></Field>
          <Field label="Contact Phone"><Input value={form.contactInfo.phone} onChange={updateContact('phone')} /></Field>
        </div>
        <Field label="Address"><Textarea rows={2} value={form.contactInfo.address} onChange={updateContact('address')} /></Field>

        <h4 style={{ margin: 'var(--sp-4) 0 var(--sp-2) 0', fontSize: 'var(--fs-sm)' }}>Subscription Configuration</h4>
        <div className="form-grid">
          <Field label="Plan Type"><Input value={form.subscriptionConfig.planType} onChange={updateSub('planType')} /></Field>
          <Field label="Max Students (0 for unlimited)">
            <Input type="number" min="0" value={form.subscriptionConfig.maxStudents} onChange={updateSub('maxStudents')} />
          </Field>
          <Field label="Max Storage (GB)">
            <Input type="number" min="0" value={form.subscriptionConfig.maxStorageGB} onChange={updateSub('maxStorageGB')} />
          </Field>
        </div>

        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 'var(--sp-6)' }}>
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
}

function AdminUserModal({ open, onClose, user, orgId, onSaved }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (user) {
        setForm({
          fullName: user.fullName || '',
          email: user.email || '',
          mobile: user.mobile || '',
          password: '',
        });
      } else {
        setForm({ fullName: '', email: '', mobile: '', password: '' });
      }
    }
  }, [open, user]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (user) {
        const updateData = { fullName: form.fullName, mobile: form.mobile, email: form.email };
        await usersApi.update(user._id || user.id, updateData);
        toast.success('User updated successfully');
      } else {
        if (!form.password) return toast.error('Password is required for new admins');
        await usersApi.create({ ...form, organizationId: orgId, userType: 'ORG_USER' });
        toast.success('Admin user created successfully');
      }
      onSaved();
    } catch (err) {
      extractErrorMessages(err).forEach((m) => toast.error(m));
    } finally {
      setSaving(false);
    }
  };

  if (!form) return null;

  return (
    <Modal open={open} onClose={onClose} title={user ? "Edit Admin User" : "Add Admin User"} width={480}>
      <form onSubmit={handleSubmit} className="stack">
        <Field label="Full Name" required>
          <Input name="fullName" value={form.fullName} onChange={handleChange} required placeholder="e.g. Jane Doe" />
        </Field>
        <Field label="Email Address" required>
          <Input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="jane@example.com" />
        </Field>
        <Field label="Mobile Number">
          <Input type="tel" name="mobile" value={form.mobile} onChange={handleChange} placeholder="+1234567890" />
        </Field>
        {!user && (
          <Field label="Temporary Password" required>
            <Input type="text" name="password" value={form.password} onChange={handleChange} required placeholder="Min. 8 characters" />
          </Field>
        )}
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 'var(--sp-6)' }}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>{user ? 'Save Changes' : 'Create Admin'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function Row({ label, value }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
      <span className="text-muted">{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}
