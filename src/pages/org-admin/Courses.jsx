import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import usePagination from '../../hooks/usePagination';
import useDebounce from '../../hooks/useDebounce';
import * as coursesApi from '../../api/courses';
import * as categoriesApi from '../../api/categories';
import * as usersApi from '../../api/users';
import * as regionsApi from '../../api/regions';
import { extractErrorMessages } from '../../api/client';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import SearchBar from '../../components/ui/SearchBar';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';

export default function Courses() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const debouncedSearch = useDebounce(search);
  const { items, page, setPage, meta, loading, refresh } = usePagination(coursesApi.list, { search: debouncedSearch, status: status || undefined });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewPricingCourse, setViewPricingCourse] = useState(null);
  const [catMap, setCatMap] = useState({});
  const [facultyMap, setFacultyMap] = useState({});
  const [regionMap, setRegionMap] = useState({});

  useEffect(() => {
    categoriesApi.list({ limit: 200 }).then((res) => {
      const map = {};
      (res.data?.data || res.data || []).forEach((c) => { map[c._id || c.id] = c.name; });
      setCatMap(map);
    }).catch(() => {});

    usersApi.list({ userType: 'FACULTY', limit: 500 }).then((res) => {
      const map = {};
      const users = res.data?.data || res.data || [];
      users.forEach((u) => { map[u._id || u.id] = u.fullName || u.email; });
      setFacultyMap(map);
    }).catch(() => {});

    regionsApi.list({ localOnly: true }).then((res) => {
      setRegions(res.data?.data || []);
      const map = {};
      (res.data?.data || res.data || []).forEach((r) => { map[r._id || r.id] = r.name; });
      setRegionMap(map);
    }).catch(() => {});
  }, []);

  const doDelete = async () => {
    try {
      await coursesApi.remove(deleteTarget._id || deleteTarget.id);
      toast.success('Course deleted');
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      extractErrorMessages(err).forEach((m) => toast.error(m));
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="page-eyebrow">Catalog</span>
          <h1 className="page-title">Courses</h1>
          <p className="page-subtitle">Every course offered in your organization.</p>
        </div>
        <Link to="/admin/courses/create"><Button icon={Plus}>Create Course</Button></Link>
      </div>

      <div className="row" style={{ marginBottom: 'var(--sp-4)' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search courses…" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
      </div>

      <DataTable
        loading={loading}
        emptyLabel="No courses yet. Create your first course to get started."
        columns={[
          { key: 'title', header: 'Title' },
          { key: 'category', header: 'Category', render: (r) => r.category?.name || catMap[r.categoryId] || '—' },
          { key: 'faculty', header: 'Faculty', render: (r) => r.faculty?.fullName || r.instructor?.fullName || (r.instructorIds?.length > 0 ? r.instructorIds.map(i => (i && typeof i === 'object') ? (i.fullName || i.email || 'Unknown') : (facultyMap[i] || i)).filter(Boolean).join(', ') : '—') },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'enrolledCount', header: 'Enrolled', render: (r) => r.enrolledCount ?? 0 },
          { key: 'price', header: 'Price', render: (r) => (
            <div>
              <div>{r.pricing?.isPaid ? `${r.pricing.currency || 'USD'} ${r.pricing.amount}` : r.price ? `$${r.price}` : 'Free'}</div>
              {r.regionalPrices?.length > 0 && (
                <div 
                  style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-primary-600)', marginTop: '4px', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={(e) => { e.stopPropagation(); setViewPricingCourse(r); }}
                >
                  +{r.regionalPrices.length} Regional
                </div>
              )}
            </div>
          ) },
          {
            key: 'actions', header: 'Actions', render: (r) => (
              <div className="row" style={{ gap: 6 }}>
                <Link to={`/admin/courses/${r._id || r.id}`}><Button size="sm" variant="ghost" icon={Eye}>View</Button></Link>
                <Link to={`/admin/courses/${r._id || r.id}/edit`}><Button size="sm" variant="outline" icon={Pencil}>Edit</Button></Link>
                <Button size="sm" variant="danger" icon={Trash2} onClick={() => setDeleteTarget(r)}>Delete</Button>
              </div>
            ),
          },
        ]}
        rows={items}
      />

      <Pagination currentPage={page} totalPages={meta.totalPages} totalItems={meta.totalItems} onChange={setPage} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={doDelete}
        title="Delete this course?"
        description={`"${deleteTarget?.title}" and all of its content will be permanently removed.`}
        confirmLabel="Delete Course"
      />

      <Modal open={!!viewPricingCourse} onClose={() => setViewPricingCourse(null)} title="Regional Pricing" width={400}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>{viewPricingCourse?.title}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>
            Base Price: {viewPricingCourse?.pricing?.isPaid ? `${viewPricingCourse.pricing.currency || 'USD'} ${viewPricingCourse.pricing.amount}` : viewPricingCourse?.price ? `$${viewPricingCourse.price}` : 'Free'}
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
              <th style={{ padding: '8px 4px', fontSize: 'var(--fs-sm)' }}>Region</th>
              <th style={{ padding: '8px 4px', fontSize: 'var(--fs-sm)', textAlign: 'right' }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {(viewPricingCourse?.regionalPrices || []).map((rp, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '8px 4px', fontSize: 'var(--fs-sm)' }}>{rp.regionId?.name || regionMap[rp.regionId] || 'Unknown'}</td>
                <td style={{ padding: '8px 4px', fontSize: 'var(--fs-sm)', textAlign: 'right' }}>{viewPricingCourse?.pricing?.currency || 'USD'} {rp.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="modal-panel__foot" style={{ margin: '24px -24px -24px', padding: '16px 24px', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={() => setViewPricingCourse(null)}>Close</Button>
        </div>
      </Modal>
    </div>
  );
}
