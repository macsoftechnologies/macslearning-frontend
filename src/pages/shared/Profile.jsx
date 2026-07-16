import { useState } from 'react';
import toast from 'react-hot-toast';
import { KeyRound, UserCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import * as usersApi from '../../api/users';
import * as authApi from '../../api/auth';
import { extractErrorMessages } from '../../api/client';
import Input, { Field } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import Tabs from '../../components/ui/Tabs';
import FileUploader from '../../components/ui/FileUploader';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ fullName: user?.fullName || '', mobile: user?.mobile || '', avatarUrl: user?.avatarUrl || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const [confirmProfileOpen, setConfirmProfileOpen] = useState(false);
  const [confirmPasswordOpen, setConfirmPasswordOpen] = useState(false);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target?.value ?? e }));
  const updatePw = (k) => (e) => setPwForm((f) => ({ ...f, [k]: e.target.value }));

  const saveProfile = async () => {
    setErrors([]);
    setSaving(true);
    setConfirmProfileOpen(false);
    try {
      await usersApi.updateMe(form);
      updateUser(form);
      toast.success('Profile updated');
    } catch (err) {
      setErrors(extractErrorMessages(err));
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    setErrors([]);
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setErrors(['New password and confirmation do not match.']);
      setConfirmPasswordOpen(false);
      return;
    }
    setSaving(true);
    setConfirmPasswordOpen(false);
    try {
      await authApi.changePassword({
        old_password: pwForm.currentPassword,
        new_password: pwForm.newPassword
      });
      toast.success('Password changed');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setErrors(extractErrorMessages(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 600 }}>
      <div className="page-head">
        <div>
          <span className="page-eyebrow">Account</span>
          <h1 className="page-title">My Profile</h1>
        </div>
      </div>

      <Tabs
        tabs={[
          { key: 'profile', label: 'Profile', icon: UserCircle },
          { key: 'security', label: 'Security', icon: KeyRound },
        ]}
        active={tab}
        onChange={setTab}
      />

      {errors.length > 0 && <div className="auth-error-box" style={{ marginBottom: 'var(--sp-4)' }}><ul>{errors.map((m, i) => <li key={i}>{m}</li>)}</ul></div>}

      {tab === 'profile' ? (
        <Card style={{ padding: 'var(--sp-6)' }}>
          <form className="stack" onSubmit={(e) => { e.preventDefault(); setConfirmProfileOpen(true); }}>
            <Field label="Profile Photo">
              <FileUploader accept={{ 'image/*': [] }} preview={form.avatarUrl} onUploaded={(url) => update('avatarUrl')(url)} label="Upload a profile photo" />
            </Field>
            <Field label="Full Name" required><Input value={form.fullName} onChange={update('fullName')} required /></Field>
            <Field label="Email"><Input value={user?.email || ''} disabled /></Field>
            <Field label="Mobile"><Input value={form.mobile} onChange={update('mobile')} /></Field>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <Button type="submit" loading={saving}>Save Changes</Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card style={{ padding: 'var(--sp-6)' }}>
          <form className="stack" onSubmit={(e) => { e.preventDefault(); setConfirmPasswordOpen(true); }}>
            <Field label="Current Password" required><Input type="password" value={pwForm.currentPassword} onChange={updatePw('currentPassword')} required /></Field>
            <Field label="New Password" required hint="At least 8 characters"><Input type="password" value={pwForm.newPassword} onChange={updatePw('newPassword')} required /></Field>
            <Field label="Confirm New Password" required><Input type="password" value={pwForm.confirmPassword} onChange={updatePw('confirmPassword')} required /></Field>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <Button type="submit" loading={saving}>Update Password</Button>
            </div>
          </form>
        </Card>
      )}

      <ConfirmDialog
        open={confirmProfileOpen}
        onClose={() => setConfirmProfileOpen(false)}
        onConfirm={saveProfile}
        title="Update Profile?"
        description="Are you sure you want to save these changes to your profile?"
        confirmLabel="Save Changes"
      />

      <ConfirmDialog
        open={confirmPasswordOpen}
        onClose={() => setConfirmPasswordOpen(false)}
        onConfirm={savePassword}
        title="Change Password?"
        description="Are you sure you want to change your password? You will need to use the new password on your next login."
        confirmLabel="Update Password"
      />
    </div>
  );
}
