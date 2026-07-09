import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, FolderTree } from 'lucide-react';
import toast from 'react-hot-toast';
import * as categoriesApi from '../../api/categories';
import { extractErrorMessages } from '../../api/client';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input, { Field, Textarea } from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PageLoader from '../../components/ui/PageLoader';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    setLoading(true);
    categoriesApi.list().then((res) => setCategories(res.data?.data || res.data || [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '' }); setModalOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, description: c.description || '' }); setModalOpen(true); };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await categoriesApi.update(editing._id || editing.id, form);
        toast.success('Category updated');
      } else {
        await categoriesApi.create(form);
        toast.success('Category created');
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
      await categoriesApi.remove(deleteTarget._id || deleteTarget.id);
      toast.success('Category deleted');
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
          <span className="page-eyebrow">Catalog</span>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Organize your courses into subjects.</p>
        </div>
        <Button icon={Plus} onClick={openCreate}>New Category</Button>
      </div>

      <DataTable
        emptyLabel="No categories yet."
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'description', header: 'Description', render: (r) => r.description || '—' },
          { key: 'courseCount', header: 'Courses', render: (r) => r.courseCount ?? 0 },
          {
            key: 'actions', header: 'Actions', render: (r) => (
              <div className="row" style={{ gap: 6 }}>
                <Button size="sm" variant="outline" icon={Pencil} onClick={() => openEdit(r)}>Edit</Button>
                <Button size="sm" variant="danger" icon={Trash2} onClick={() => setDeleteTarget(r)}>Delete</Button>
              </div>
            ),
          },
        ]}
        rows={categories}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'New Category'} width={420}>
        <form className="stack" id="cat-form" onSubmit={submit}>
          <Field label="Name" required><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></Field>
          <Field label="Description"><Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
        </form>
        <div className="modal-panel__foot" style={{ margin: '16px -24px -24px', padding: '16px 24px' }}>
          <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button type="submit" form="cat-form" loading={saving}>{editing ? 'Save Changes' : 'Create Category'}</Button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={doDelete} title="Delete this category?" description={`"${deleteTarget?.name}" will be removed.`} confirmLabel="Delete Category" />
    </div>
  );
}
