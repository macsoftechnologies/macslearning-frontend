import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2 } from 'lucide-react';
import AuthShell from './AuthShell';
import Input, { Field, Select } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import * as regionsApi from '../../api/regions';
import client, { extractErrorMessages } from '../../api/client';

export default function RegisterOrganization() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', mobile: '',
    orgName: '', orgCode: '', regionId: '', planId: ''
  });
  
  const [regions, setRegions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    regionsApi.list({ globalOnly: true }).then(res => setRegions(res.data?.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.regionId) {
      // Fetch public plans for the selected region
      client.get('/subscription-plans/public', { params: { regionId: form.regionId } })
        .then(res => setPlans(res.data || []))
        .catch(() => {});
    } else {
      setPlans([]);
    }
    // Reset plan selection if region changes
    setForm(f => ({ ...f, planId: '' }));
  }, [form.regionId]);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const nextStep = (e) => {
    e.preventDefault();
    if (step === 2 && !form.regionId) {
      toast.error('Please select a region');
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.planId) {
      toast.error('Please select a subscription plan');
      return;
    }
    
    setErrors([]);
    setLoading(true);
    try {
      await client.post('/organizations/register', form);
      setDone(true);
      toast.success('Organization registered successfully');
    } catch (err) {
      setErrors(extractErrorMessages(err));
      // If error, jump back to step 1 to show the error box properly
      setStep(1); 
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthShell eyebrow="B2B Registration" title="Registration Submitted">
        <div className="stack" style={{ alignItems: 'center', textAlign: 'center' }}>
          <CheckCircle2 size={44} color="var(--success)" />
          <p className="text-muted">
            Thank you for registering <strong>{form.orgName}</strong>. Our team will review your registration and get back to you shortly.
            <br /><br />
            If you need immediate assistance with payment, please contact our Support Team.
          </p>
          <Button full variant="outline" onClick={() => navigate(`/`)}>
            Back to Home
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow={`Step ${step} of 3`}
      title={step === 1 ? "Admin Details" : step === 2 ? "Organization Setup" : "Select a Plan"}
      subtitle={step === 1 ? "Create your master admin account." : step === 2 ? "Set up your workspace." : "Choose the right tier for your needs."}
      footer={
        <>
          Already have an organization? <Link to="/super-admin/login">Sign in here</Link>
        </>
      }
    >
      <form className="stack" onSubmit={step === 3 ? onSubmit : nextStep}>
        {errors.length > 0 && (
          <div className="auth-error-box">
            <ul>
              {errors.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        {step === 1 && (
          <>
            <Field label="Full Name" required>
              <Input value={form.fullName} onChange={update('fullName')} required />
            </Field>
            <Field label="Work Email" required>
              <Input type="email" value={form.email} onChange={update('email')} required />
            </Field>
            <Field label="Mobile Number">
              <Input value={form.mobile} onChange={update('mobile')} />
            </Field>
            <Field label="Password" required hint="At least 8 characters">
              <Input type="password" value={form.password} onChange={update('password')} required />
            </Field>
            <Button type="submit" full size="lg">Continue</Button>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="Organization Name" required>
              <Input value={form.orgName} onChange={update('orgName')} placeholder="e.g. Acme Corp" required />
            </Field>
            <Field label="Organization Code (Slug)" required hint="Used for your login URL, e.g. acme">
              <Input value={form.orgCode} onChange={update('orgCode')} required />
            </Field>
            <Field label="Global Region" required hint="This determines your pricing and data residency.">
              <Select value={form.regionId} onChange={update('regionId')} required>
                <option value="">Select your region</option>
                {regions.map((r) => (
                  <option key={r.id || r._id} value={r.id || r._id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="row" style={{ gap: '12px' }}>
              <Button type="button" variant="outline" onClick={prevStep} full size="lg">Back</Button>
              <Button type="submit" full size="lg">Continue to Plans</Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="stack" style={{ gap: '16px' }}>
              {plans.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', background: 'var(--c-bg-subtle)', borderRadius: '8px' }}>
                  <p className="text-muted">No active plans found for this region.</p>
                </div>
              ) : (
                plans.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => setForm(f => ({ ...f, planId: p.id }))}
                    style={{ 
                      padding: '16px', 
                      border: `2px solid ${form.planId === p.id ? 'var(--brand)' : 'var(--c-border)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: form.planId === p.id ? 'var(--brand-subtle)' : 'var(--c-bg)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {p.name.toLowerCase().includes('pro') || p.name.toLowerCase().includes('enterprise') ? (
                       <div style={{ position: 'absolute', top: 12, right: 12, background: 'var(--brand)', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                         RECOMMENDED
                       </div>
                    ) : null}
                    <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                      <strong style={{ fontSize: '16px' }}>{p.name}</strong>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: 8 }}>
                      {p.currency || 'USD'} {p.price}
                    </div>
                    <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', background: 'var(--c-bg-subtle)', padding: '2px 8px', borderRadius: '4px' }}>
                        {p.maxUsers ? `Up to ${p.maxUsers} Users` : 'Unlimited Users'}
                      </span>
                      <span style={{ fontSize: '12px', background: 'var(--c-bg-subtle)', padding: '2px 8px', borderRadius: '4px' }}>
                        {p.storageGB ? `${p.storageGB} GB Storage` : 'Unlimited Storage'}
                      </span>
                      <span style={{ fontSize: '12px', background: 'var(--c-bg-subtle)', padding: '2px 8px', borderRadius: '4px' }}>
                        {p.durationInDays} Days
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="row" style={{ gap: '12px', marginTop: '8px' }}>
              <Button type="button" variant="outline" onClick={prevStep} full size="lg">Back</Button>
              <Button type="submit" full size="lg" loading={loading} disabled={!form.planId}>Complete Registration</Button>
            </div>
          </>
        )}
      </form>
    </AuthShell>
  );
}
