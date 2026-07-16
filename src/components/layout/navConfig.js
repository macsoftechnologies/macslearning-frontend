import {
  LayoutDashboard, Building2, CreditCard, ScrollText, Users, GraduationCap,
  BookOpen, FolderTree, ClipboardList, Wallet, BarChart3, Settings,
  FileCheck2, PenSquare, MessagesSquare, Compass, Library, Award, Receipt, UserCircle,
} from 'lucide-react';

export const NAV = {
  SUPER_ADMIN: [
    { to: '/super-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }, // Always visible?
    { to: '/super-admin/organizations', label: 'Organizations', icon: Building2, requiredPermissions: ['TRACK_ORGANIZATIONS'] },
    { to: '/super-admin/subscription-plans', label: 'Subscription Plans', icon: CreditCard, requiredPermissions: ['TRACK_ORGANIZATIONS'] },
    { to: '/super-admin/audit-logs', label: 'Audit Logs', icon: ScrollText }, // Maybe always visible or add a permission later
    { to: '/super-admin/team', label: 'Team', icon: Users, requiredPermissions: ['MANAGE_ROLES'] },
  ],
  ORG_USER: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/regions', label: 'Regions', icon: Compass },
    { to: '/admin/students', label: 'Students', icon: GraduationCap },
    { to: '/admin/faculty', label: 'Faculty', icon: Users },
    { to: '/admin/finance-team', label: 'Finance Team', icon: Users },
    { to: '/admin/categories', label: 'Categories', icon: FolderTree },
    { to: '/admin/certificate-templates', label: 'Certificates', icon: Award },
    { to: '/admin/course-plans', label: 'Course Plan', icon: FileCheck2 },
    { to: '/admin/courses', label: 'Courses', icon: BookOpen },
    { to: '/admin/enrollments', label: 'Enrollments', icon: ClipboardList },
    { to: '/admin/payments', label: 'Payments', icon: Wallet },
    { to: '/admin/reports/overview', label: 'Reports', icon: BarChart3 },
    { to: '/admin/settings/organization', label: 'Settings', icon: Settings },
  ],
  FACULTY: [
    { to: '/faculty/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/faculty/courses', label: 'My Courses', icon: BookOpen },
    { to: '/faculty/profile', label: 'Profile', icon: UserCircle },
  ],
  STUDENT: [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/courses', label: 'Browse Courses', icon: Compass },
    { to: '/student/my-courses', label: 'My Courses', icon: Library },
    { to: '/student/results', label: 'Results', icon: FileCheck2 },
    { to: '/student/certificates', label: 'Certificates', icon: Award },
    { to: '/student/payments', label: 'Payments', icon: Receipt },
    { to: '/student/profile', label: 'Profile', icon: UserCircle },
  ],
  FINANCE: [
    { to: '/finance/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/finance/payments', label: 'Payments', icon: Wallet },
    { to: '/finance/reports/overview', label: 'Reports', icon: BarChart3 },
    { to: '/finance/profile', label: 'Profile', icon: UserCircle },
  ],
};

export const ROLE_LABEL = {
  SUPER_ADMIN: 'Super Admin',
  ORG_USER: 'Org Admin',
  FACULTY: 'Faculty',
  STUDENT: 'Student',
  FINANCE: 'Finance',
};
