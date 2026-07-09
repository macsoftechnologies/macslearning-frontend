import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import * as organizationsApi from '../../api/organizations';
import { extractErrorMessages } from '../../api/client';
import Input, { Field, Textarea } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import FileUploader from '../../components/ui/FileUploader';
import StatusBadge from '../../components/ui/StatusBadge';
import PageLoader from '../../components/ui/PageLoader';

export default function OrganizationSettings() {
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    organizationsApi.getMe().then((res) => setOrg(res.data?.data || {})).finally(() => setLoading(false));
  }, []);

  const update = (k) => (e) => setOrg((o) => ({ ...o, [k]: e.target?.value ?? e }));
  const updateContact = (k) => (e) => setOrg((o) => ({ ...o, contactInfo: { ...o.contactInfo, [k]: e.target?.value ?? e } }));

  const submit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setSaving(true);
    try {
      await organizationsApi.updateMe(org);
      toast.success('Organization settings saved');
    } catch (err) {
      setErrors(extractErrorMessages(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="page" style={{ maxWidth: 800 }}>
      <div className="page-head">
        <div>
          <span className="page-eyebrow">Settings</span>
          <h1 className="page-title">Organization Settings</h1>
          <p className="page-subtitle">Manage your institution's profile and course plans.</p>
        </div>
        {org?.status && <StatusBadge status={org.status} />}
      </div>

      <Card style={{ padding: 'var(--sp-6)' }}>
          <form className="stack" onSubmit={submit}>
            {errors.length > 0 && <div className="auth-error-box"><ul>{errors.map((m, i) => <li key={i}>{m}</li>)}</ul></div>}
            
            <Field label="Logo">
              <FileUploader accept={{ 'image/*': [] }} preview={org?.logoUrl} onUploaded={(url) => update('logoUrl')(url)} label="Upload organization logo" />
            </Field>

            <div className="form-grid">
              <Field label="Organization Name" required><Input value={org?.name || ''} onChange={update('name')} required /></Field>
              <Field label="Code"><Input value={org?.code || ''} disabled /></Field>
            </div>

            <Field label="Slug / Domain"><Input value={org?.slug || ''} disabled /></Field>

            <div className="form-grid">
              <Field label="Contact Email"><Input type="email" value={org?.contactInfo?.email || ''} onChange={updateContact('email')} /></Field>
              <Field label="Contact Phone"><Input value={org?.contactInfo?.phone || ''} onChange={updateContact('phone')} /></Field>
            </div>

            <Field label="Address"><Textarea rows={3} value={org?.contactInfo?.address || ''} onChange={updateContact('address')} /></Field>

            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <Button type="submit" loading={saving}>Save Changes</Button>
            </div>
          </form>
      </Card>
    </div>
  );
}
