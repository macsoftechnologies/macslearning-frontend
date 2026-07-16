import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2 } from 'lucide-react';
import AuthShell from './AuthShell';
import Input, { Field } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import * as authApi from '../../api/auth';
import * as regionsApi from '../../api/regions';
import { extractErrorMessages } from '../../api/client';
import { useEffect } from 'react';
import { Select } from '../../components/ui/Input';

export default function Register() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', mobile: '', organizationCode: slug || '', regionId: '',
  });
  const [regions, setRegions] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    regionsApi.list({ slug }).then(res => setRegions(res.data?.data || [])).catch(() => {});
  }, []);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    try {
      await authApi.register(form);
      setDone(true);
      toast.success('Registration submitted');
    } catch (err) {
      setErrors(extractErrorMessages(err));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthShell eyebrow="Registration" title="You're all set">
        <div className="stack" style={{ alignItems: 'center', textAlign: 'center' }}>
          <CheckCircle2 size={44} color="var(--success)" />
          <p className="text-muted">
            Your account has been created and is pending approval from your organization's admin. You'll be able to sign in
            once approved.
          </p>
          <Button full onClick={() => navigate('/login')}>
            Go to Sign In
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Student registration"
      title="Create your account"
      subtitle="Join your organization's learning portal."
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <form className="stack" onSubmit={onSubmit}>
        {errors.length > 0 && (
          <div className="auth-error-box">
            <ul>
              {errors.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        )}
        <Field label="Full Name" required>
          <Input value={form.fullName} onChange={update('fullName')} required />
        </Field>
        <Field label="Organization Code" required>
          <Input value={form.organizationCode} onChange={update('organizationCode')} placeholder="e.g. ACME" required />
        </Field>
        <Field label="Email" required>
          <Input type="email" value={form.email} onChange={update('email')} required />
        </Field>
        <Field label="Mobile">
          <Input value={form.mobile} onChange={update('mobile')} />
        </Field>
        <Field label="Location (Region)" required>
          <Select value={form.regionId} onChange={update('regionId')} required>
            <option value="">Select your location</option>
            {regions.map((r) => (
              <option key={r.id || r._id} value={r.id || r._id}>
                {r.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Password" required hint="At least 8 characters">
          <Input type="password" value={form.password} onChange={update('password')} required />
        </Field>
        <Button type="submit" full size="lg" loading={loading}>
          Create Account
        </Button>
      </form>
    </AuthShell>
  );
}
