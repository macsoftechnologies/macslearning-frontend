import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import * as plansApi from '../../api/subscriptionPlans';
import * as regionsApi from '../../api/regions';
import { extractErrorMessages } from '../../api/client';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input, { Field, Select } from '../../components/ui/Input';
import Toggle from '../../components/ui/Toggle';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PageLoader from '../../components/ui/PageLoader';

const emptyForm = { name: '', code: '', price: '', currency: 'USD', durationInDays: 30, maxUsers: '', storageGB: '', regionId: '', isActive: true };

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      plansApi.list(),
      regionsApi.list({ globalOnly: true })
    ]).then(([resPlans, resRegions]) => {
      setPlans(resPlans.data?.data || []);
      setRegions(resRegions.data?.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...emptyForm, ...p }); setModalOpen(true); };
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target?.value ?? e }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, price: Number(form.price), durationInDays: Number(form.durationInDays) || 30, maxUsers: Number(form.maxUsers) || undefined, storageGB: Number(form.storageGB) || undefined, regionId: form.regionId || null };
    try {
      if (editing) {
        await plansApi.update(editing._id || editing.id, payload);
        toast.success('Plan updated');
      } else {
        await plansApi.create(payload);
        toast.success('Plan created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      extractErrorMessages(err).forEach((m) => toast.error(m));
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    try {
      await plansApi.remove(deleteTarget._id || deleteTarget.id);
      toast.success('Plan deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      extractErrorMessages(err).forEach((m) => toast.error(m));
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="page-eyebrow">Super admin</span>
          <h1 className="page-title">Subscription Plans</h1>
          <p className="page-subtitle">Pricing tiers available to organizations.</p>
        </div>
        <Button icon={Plus} onClick={openCreate}>New Plan</Button>
      </div>

      {plans.length === 0 ? (
        <EmptyState icon={CreditCard} title="No plans yet" description="Create your first subscription plan to offer organizations." />
      ) : (
        <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {plans.map((p) => (
            <div key={p._id || p.id} className="card" style={{ padding: 'var(--sp-5)' }}>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                <strong style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-lg)' }}>{p.name}</strong>
                <StatusBadge status={p.isActive ? 'ACTIVE' : 'INACTIVE'} />
              </div>
              <p className="text-muted" style={{ fontSize: 'var(--fs-xs)', fontFamily: 'var(--font-mono)' }}>{p.code}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-xl)', margin: '10px 0' }}>
                {p.currency || 'USD'} {p.price}
                <span className="text-muted" style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-xs)' }}> / {p.durationInDays} days</span>
              </p>
              <div className="text-muted" style={{ fontSize: 'var(--fs-xs)', marginBottom: 'var(--sp-4)' }}>
                {p.maxUsers ? `${p.maxUsers} users` : 'Unlimited users'} · {p.storageGB ? `${p.storageGB}GB storage` : '—'}
                {p.regionId && <div style={{ marginTop: 4 }}>Region: {regions.find(r => r.id === p.regionId || r._id === p.regionId)?.name || 'Unknown'}</div>}
              </div>
              <div className="row">
                <Button size="sm" variant="outline" icon={Pencil} onClick={() => openEdit(p)}>Edit</Button>
                <Button size="sm" variant="danger" icon={Trash2} onClick={() => setDeleteTarget(p)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Plan' : 'New Plan'} width={480}>
        <form className="stack" id="plan-form" onSubmit={submit}>
          <div className="form-grid">
            <Field label="Plan Name" required><Input value={form.name} onChange={update('name')} required /></Field>
            <Field label="Code" required><Input value={form.code} onChange={update('code')} required /></Field>
          </div>
          <Field label="Global Region">
            <Select value={form.regionId || ''} onChange={update('regionId')}>
              <option value="">No specific region (Global)</option>
              {regions.map(r => (
                <option key={r.id || r._id} value={r.id || r._id}>{r.name}</option>
              ))}
            </Select>
          </Field>
          <div className="form-grid">
            <Field label="Price" required><Input type="number" value={form.price} onChange={update('price')} required /></Field>
            <Field label="Currency"><Input value={form.currency} onChange={update('currency')} /></Field>
          </div>
          <Field label="Duration (Days)" required>
            <Input type="number" min={1} value={form.durationInDays} onChange={update('durationInDays')} required />
          </Field>
          <div className="form-grid">
            <Field label="Max Users"><Input type="number" value={form.maxUsers} onChange={update('maxUsers')} /></Field>
            <Field label="Storage (GB)"><Input type="number" value={form.storageGB} onChange={update('storageGB')} /></Field>
          </div>
          <Toggle checked={form.isActive} onChange={(v) => update('isActive')(v)} label="Active" />
        </form>
        <div className="modal-panel__foot" style={{ margin: '16px -24px -24px', padding: '16px 24px' }}>
          <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button type="submit" form="plan-form" loading={saving}>{editing ? 'Save Changes' : 'Create Plan'}</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={doDelete}
        title="Delete this plan?"
        description={`"${deleteTarget?.name}" will be permanently removed.`}
        confirmLabel="Delete Plan"
      />
    </div>
  );
}
