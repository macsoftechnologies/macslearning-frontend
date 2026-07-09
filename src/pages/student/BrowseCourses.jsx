import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Library } from 'lucide-react';
import usePagination from '../../hooks/usePagination';
import useDebounce from '../../hooks/useDebounce';
import * as coursesApi from '../../api/courses';
import * as categoriesApi from '../../api/categories';
import * as studentsApi from '../../api/students';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from 'react';
import SearchBar from '../../components/ui/SearchBar';
import Button from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import PageLoader from '../../components/ui/PageLoader';
import { buildStaticUrl } from '../../api/client';
import './CourseGrid.css';

export default function BrowseCourses() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const { user } = useAuth();
  const debouncedSearch = useDebounce(search);
  const [enrolledIds, setEnrolledIds] = useState([]);

  useEffect(() => {
    categoriesApi.list().then((res) => setCategories(res.data?.data || [])).catch(() => {});
    const userId = user?.id || user?._id;
    if (userId) {
      studentsApi.getEnrollments(userId).then(res => {
        const list = res.data?.data || [];
        setEnrolledIds(list.map(e => e.courseId?._id || e.courseId?.id || e.courseId));
      }).catch(() => {});
    }
  }, [user]);

  const { items, page, setPage, meta, loading } = usePagination(
    coursesApi.list,
    { search: debouncedSearch, categoryId: categoryId || undefined, status: 'PUBLISHED' },
    12
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="page-eyebrow">Catalog</span>
          <h1 className="page-title">Browse Courses</h1>
          <p className="page-subtitle">Find your next course.</p>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 'var(--sp-6)' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search courses…" />
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
        </Select>
      </div>

      {loading ? (
        <PageLoader />
      ) : items.length === 0 ? (
        <EmptyState icon={Library} title="No courses found" description="Try a different search or category." />
      ) : (
        <div className="course-grid">
          {items.map((c) => (
            <div key={c._id || c.id} className="course-card" onClick={() => navigate(`/student/courses/${c._id || c.id}`)} style={{ cursor: 'pointer' }}>
              <div className="course-card__thumb" style={{ backgroundImage: c.thumbnailUrl ? `url(${buildStaticUrl(c.thumbnailUrl)})` : undefined }}>
                {!c.thumbnailUrl && <Library size={28} />}
              </div>
              <div className="course-card__body">
                <h3>{c.title}</h3>
                <p className="text-muted" style={{ fontSize: 'var(--fs-xs)' }}>{c.category?.name || 'General'}</p>
                <div className="course-card__meta">
                  <span>{c.faculty?.fullName || 'Ledger LMS'}</span>
                  <span className="course-card__price">
                    {(() => {
                      if (!c.pricing?.isPaid) return 'Free';
                      let displayPrice = c.pricing.amount;
                      if (user?.regionId && c.regionalPrices?.length > 0) {
                        const rp = c.regionalPrices.find(
                          (p) => p.regionId?._id === user.regionId || p.regionId === user.regionId
                        );
                        if (rp) displayPrice = rp.price;
                      }
                      return `$${displayPrice}`;
                    })()}
                  </span>
                </div>
                <div style={{ marginTop: 'var(--sp-3)' }}>
                  {enrolledIds.includes(c._id || c.id) ? (
                    <Button 
                      full 
                      size="sm" 
                      onClick={(e) => { e.stopPropagation(); navigate(`/student/my-courses/${c._id || c.id}/learn`); }}
                    >
                      Go to Course
                    </Button>
                  ) : (
                    <Button 
                      full 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); navigate(`/student/courses/${c._id || c.id}`); }}
                    >
                      Preview Course
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination currentPage={page} totalPages={meta.totalPages} totalItems={meta.totalItems} onChange={setPage} />
    </div>
  );
}
