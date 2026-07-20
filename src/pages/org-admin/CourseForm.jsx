import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import * as coursesApi from '../../api/courses';
import * as categoriesApi from '../../api/categories';
import * as usersApi from '../../api/users';
import * as organizationsApi from '../../api/organizations';
import * as certificatesApi from '../../api/certificates';
import * as regionsApi from '../../api/regions';
import { extractErrorMessages } from '../../api/client';
import Input, { Field, Textarea, Select } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import FileUploader from '../../components/ui/FileUploader';
import PageLoader from '../../components/ui/PageLoader';

const initial = {
  title: '', description: '', categoryId: '', instructorIds: [], isPaid: false, price: '',
  regionalPrices: [],
  thumbnailUrl: '', coursePlanId: '', certificateTemplateId: '', certificateIssueMode: 'AUTO'
};

export default function CourseForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isFaculty = location.pathname.startsWith('/faculty');
  const base = isFaculty ? '/faculty' : '/admin';
  const [form, setForm] = useState(initial);
  const [categories, setCategories] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [coursePlans, setCoursePlans] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    categoriesApi.list().then((res) => setCategories(res.data?.data || [])).catch(() => {});
    usersApi.list({ userType: 'FACULTY', limit: 100 }).then((res) => {
      const all = res.data?.data || [];
      setFaculty(all.filter((u) => u.userType === 'FACULTY'));
    }).catch(() => {});
    if (isFaculty) {
      const myId = user?._id || user?.id;
      if (myId) setForm((f) => ({ ...f, instructorIds: [myId] }));
    }
    organizationsApi.getCoursePlans().then(res => setCoursePlans(res.data?.data || [])).catch(() => {});
    certificatesApi.listTemplates().then(res => setTemplates(res.data?.data || [])).catch(() => {});
    regionsApi.list({ localOnly: true }).then(res => setRegions(res.data?.data || [])).catch(() => {});
    if (isEdit) {
      coursesApi.getById(id).then((res) => {
        const data = res.data?.data || {};
        const instructorEntities = data.instructorIds?.length
          ? data.instructorIds
          : data.instructor
            ? [data.instructor]
            : data.faculty
              ? [data.faculty]
              : [];
        setForm({ 
          ...initial, 
          ...data,
          instructorIds: instructorEntities.map((i) => i?._id || i?.id || i),
          isPaid: data.pricing?.isPaid || false,
          price: data.pricing?.amount || '',
          regionalPrices: data.regionalPrices?.map(rp => ({
            regionId: rp.regionId?._id || rp.regionId,
            price: rp.price
          })) || [],
          coursePlanId: data.coursePlanId || '',
          certificateTemplateId: data.certificateTemplateId || '',
          certificateIssueMode: data.certificateIssueMode || 'AUTO'
        });
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id, isEdit, isFaculty, user]);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target?.value ?? e }));

  const submit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setSaving(true);
    const payload = { 
      title: form.title,
      description: form.description,
      categoryId: form.categoryId,
      instructorIds: form.instructorIds,
      thumbnailUrl: form.thumbnailUrl,
      coursePlanId: form.coursePlanId,
      certificateTemplateId: form.certificateTemplateId || null,
      certificateIssueMode: form.certificateIssueMode,
      regionalPrices: form.regionalPrices.map(rp => ({ ...rp, price: Number(rp.price) })),
      pricing: {
        isPaid: form.isPaid,
        amount: form.isPaid ? Number(form.price) : 0,
        currency: 'USD'
      }
    };
    try {
      if (isEdit) {
        await coursesApi.update(id, payload);
        toast.success('Course updated');
      } else {
        const { data } = await coursesApi.create(payload);
        toast.success('Course created');
        navigate(`${base}/courses/${data?.data?._id || data?.data?.id || ''}`);
        return;
      }
      navigate(`${base}/courses/${id}`);
    } catch (err) {
      setErrors(extractErrorMessages(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <Link to={`${base}/courses`} className="row text-muted" style={{ marginBottom: 'var(--sp-4)', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
        <ArrowLeft size={14} /> Back to courses
      </Link>
      <div className="page-head">
        <div>
          <span className="page-eyebrow">Catalog</span>
          <h1 className="page-title">{isEdit ? 'Edit Course' : 'Create Course'}</h1>
        </div>
      </div>

      <Card style={{ padding: 'var(--sp-6)' }}>
        <form className="stack" onSubmit={submit}>
          {errors.length > 0 && <div className="auth-error-box"><ul>{errors.map((m, i) => <li key={i}>{m}</li>)}</ul></div>}

          <Field label="Course Title" required><Input value={form.title} onChange={update('title')} required /></Field>
          <Field label="Description"><Textarea rows={4} value={form.description} onChange={update('description')} /></Field>

          <div className="form-grid">
            <Field label="Category">
              <Select value={form.categoryId} onChange={update('categoryId')}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
              </Select>
            </Field>
            {/* Co-instructors available for both org admin and faculty */}
            {true && (
              <Field label="Course Instructors">
                <Select
                  multiple
                  value={form.instructorIds}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                    setForm(f => ({ ...f, instructorIds: selected }));
                  }}
                  style={{ minHeight: '100px' }}
                >
                  {faculty.map((f) => <option key={f._id || f.id} value={f._id || f.id}>{f.fullName}</option>)}
                </Select>
              </Field>
            )}
          </div>

          <div className="form-grid">
            <Field label="Course Type">
              <Select value={form.isPaid ? 'paid' : 'free'} onChange={(e) => setForm(f => ({ ...f, isPaid: e.target.value === 'paid' }))}>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </Select>
            </Field>
            {form.isPaid && (
              <Field label="Default Price (USD)"><Input type="number" min={0} value={form.price} onChange={update('price')} required /></Field>
            )}
          </div>

          {form.isPaid && (
            <div className="form-grid" style={{ padding: '16px', background: 'var(--color-paper-50)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Regional Pricing</h3>
                  <p className="text-muted" style={{ fontSize: '12px' }}>Override the default price for specific regions.</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  type="button" 
                  onClick={() => setForm(f => ({ ...f, regionalPrices: [...f.regionalPrices, { regionId: '', price: '' }] }))}
                >
                  Add Regional Price
                </Button>
              </div>
              
              {form.regionalPrices.map((rp, index) => (
                <div key={index} style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'flex-end' }}>
                  <Field label="Region">
                    <Select 
                      value={rp.regionId} 
                      onChange={e => {
                        const newArr = [...form.regionalPrices];
                        newArr[index].regionId = e.target.value;
                        setForm(f => ({ ...f, regionalPrices: newArr }));
                      }}
                      required
                    >
                      <option value="">Select region</option>
                      {regions.map(r => <option key={r.id || r._id} value={r.id || r._id}>{r.name}</option>)}
                    </Select>
                  </Field>
                  <Field label="Price (USD)">
                    <Input 
                      type="number" 
                      min={0} 
                      value={rp.price} 
                      onChange={e => {
                        const newArr = [...form.regionalPrices];
                        newArr[index].price = e.target.value;
                        setForm(f => ({ ...f, regionalPrices: newArr }));
                      }}
                      required 
                    />
                  </Field>
                  <Button 
                    type="button" 
                    variant="danger" 
                    onClick={() => {
                      const newArr = form.regionalPrices.filter((_, i) => i !== index);
                      setForm(f => ({ ...f, regionalPrices: newArr }));
                    }}
                    style={{ marginBottom: '8px' }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Field label="Course Plan (Duration)" required>
            <Select value={form.coursePlanId} onChange={update('coursePlanId')} required>
              <option value="">Select a plan</option>
              {coursePlans.map(p => (
                <option key={p.id || p._id} value={p.id || p._id}>{p.name} ({p.validityDays} Days)</option>
              ))}
            </Select>
          </Field>

          <div className="form-grid" style={{ padding: '16px', background: 'var(--color-paper-50)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Certificate Settings</h3>
              <p className="text-muted" style={{ fontSize: '12px' }}>Configure if and how certificates are issued for this course.</p>
            </div>
            
            <Field label="Certificate Template">
              <Select value={form.certificateTemplateId || ''} onChange={update('certificateTemplateId')}>
                <option value="">No Certificate</option>
                {templates.map(t => (
                  <option key={t.id || t._id} value={t.id || t._id}>{t.name}</option>
                ))}
              </Select>
            </Field>

            {form.certificateTemplateId && (
              <Field label="Issuance Workflow">
                <Select value={form.certificateIssueMode} onChange={update('certificateIssueMode')}>
                  <option value="AUTO">Auto-Issue on 100% Completion</option>
                  <option value="MANUAL_APPROVAL">Manual Approval by Faculty</option>
                </Select>
              </Field>
            )}
          </div>

          <Field label="Thumbnail">
            <FileUploader accept={{ 'image/*': [] }} preview={form.thumbnailUrl} onUploaded={(url) => update('thumbnailUrl')(url)} label="Upload a course thumbnail" />
          </Field>

          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 'var(--sp-2)' }}>
            <Link to={`${base}/courses`}><Button variant="outline" type="button">Cancel</Button></Link>
            <Button type="submit" loading={saving}>{isEdit ? 'Save Changes' : 'Create Course'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
