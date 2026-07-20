import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input, { Field, Select } from '../../components/ui/Input';
import * as usersApi from '../../api/users';
import * as studentsApi from '../../api/students';
import * as regionsApi from '../../api/regions';
import { extractErrorMessages } from '../../api/client';

export default function CreateStudentModal({ open, onClose, onCreated, student = null }) {
  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState([]);
  const [form, setForm] = useState({ fullName: '', email: '', mobile: '', password: '', regionId: '' });

  useEffect(() => {
    if (open) {
      regionsApi.list({ localOnly: true }).then(res => setRegions(res.data?.data || [])).catch(() => {});
      if (student) {
        setForm({
          fullName: student.fullName || '',
          email: student.email || '',
          mobile: student.mobile || '',
          password: '', // Leave blank on edit
          regionId: student.regionId?._id || student.regionId || ''
        });
      } else {
        setForm({ fullName: '', email: '', mobile: '', password: '', regionId: '' });
      }
    }
  }, [open, student]);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.regionId) return toast.error('Region is required');
    setLoading(true);
    try {
      if (student) {
        const updateData = {
          fullName: form.fullName,
          mobile: form.mobile,
          regionId: form.regionId
        };
        // We generally don't update email or password from here, unless the API supports it
        await studentsApi.update(student._id || student.id, updateData);
        toast.success('Student updated successfully');
      } else {
        if (!form.password) return toast.error('Password is required for new students');
        await usersApi.createStudent(form);
        toast.success('Student created successfully');
      }
      onCreated();
    } catch (err) {
      extractErrorMessages(err).forEach(m => toast.error(m));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={student ? "Edit Student" : "Add New Student"} width={480}>
      <form onSubmit={handleSubmit} className="stack">
        <Field label="Full Name" required>
          <Input name="fullName" value={form.fullName} onChange={handleChange} required placeholder="e.g. John Doe" />
        </Field>
        
        <Field label="Email Address" required>
          <Input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="john@example.com" disabled={!!student} />
        </Field>
        
        <Field label="Mobile Number">
          <Input type="tel" name="mobile" value={form.mobile} onChange={handleChange} placeholder="+1234567890" />
        </Field>

        <Field label="Region" required>
          <Select name="regionId" value={form.regionId} onChange={handleChange} required>
            <option value="">-- Select a Region --</option>
            {regions.map(r => (
              <option key={r._id || r.id} value={r._id || r.id}>{r.name}</option>
            ))}
          </Select>
        </Field>

        {!student && (
          <Field label="Temporary Password" required>
            <Input type="text" name="password" value={form.password} onChange={handleChange} required placeholder="Min. 8 characters" />
          </Field>
        )}
        
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 'var(--sp-2)' }}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{student ? 'Save Changes' : 'Create Student'}</Button>
        </div>
      </form>
    </Modal>
  );
}
