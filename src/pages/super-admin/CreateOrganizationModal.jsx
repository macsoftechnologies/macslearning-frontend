import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Input, { Field, Textarea, Select } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import * as organizationsApi from '../../api/organizations';
import * as plansApi from '../../api/subscriptionPlans';
import { extractErrorMessages } from '../../api/client';

const initial = {
  name: '', code: '', contactEmail: '', contactPhone: '', address: '',
  subscriptionPlanId: '',
  adminFullName: '', adminEmail: '', adminPassword: '', adminMobile: '',
};

export default function CreateOrganizationModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(initial);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      plansApi.list().then((res) => setPlans(res.data?.data || [])).catch(() => {});
      setForm(initial);
    }
  }, [open]);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await organizationsApi.create({
        ...form,
      });
      toast.success('Organization created');
      onCreated();
    } catch (err) {
      extractErrorMessages(err).forEach((m) => toast.error(m));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Organization" subtitle="Set up a new institution and its first admin." width={640}>
      <form className="stack" onSubmit={submit} id="create-org-form">

        <div className="form-grid">
          <Field label="Organization Name" required>
            <Input value={form.name} onChange={update('name')} required />
          </Field>
          <Field label="Organization Code" required hint="Unique identifier, e.g. ACME">
            <Input value={form.code} onChange={update('code')} required />
          </Field>
        </div>

        <p className="section-title" style={{ fontSize: 'var(--fs-sm)', marginBottom: 0, marginTop: 4 }}>Contact Info</p>
        <div className="form-grid">
          <Field label="Contact Email">
            <Input type="email" value={form.contactEmail} onChange={update('contactEmail')} />
          </Field>
          <Field label="Contact Phone">
            <Input value={form.contactPhone} onChange={update('contactPhone')} />
          </Field>
        </div>
        <Field label="Address">
          <Textarea value={form.address} onChange={update('address')} rows={2} />
        </Field>

        <p className="section-title" style={{ fontSize: 'var(--fs-sm)', marginBottom: 0, marginTop: 4 }}>Subscription</p>
        <div className="form-grid">
          <Field label="Plan">
            <Select value={form.subscriptionPlanId} onChange={update('subscriptionPlanId')}>
              <option value="">Select a plan</option>
              {plans.map((p) => <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>)}
            </Select>
          </Field>
        </div>

        <p className="section-title" style={{ fontSize: 'var(--fs-sm)', marginBottom: 0, marginTop: 4 }}>Admin User</p>
        <div className="form-grid">
          <Field label="Admin Full Name" required>
            <Input value={form.adminFullName} onChange={update('adminFullName')} required />
          </Field>
          <Field label="Admin Email" required>
            <Input type="email" value={form.adminEmail} onChange={update('adminEmail')} required />
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Admin Password" required>
            <Input type="password" value={form.adminPassword} onChange={update('adminPassword')} required />
          </Field>
          <Field label="Admin Mobile">
            <Input value={form.adminMobile} onChange={update('adminMobile')} />
          </Field>
        </div>
      </form>

      <div className="modal-panel__foot" style={{ margin: '0 -24px -24px', padding: '16px 24px' }}>
        <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
        <Button type="submit" form="create-org-form" loading={loading}>Create Organization</Button>
      </div>
    </Modal>
  );
}
