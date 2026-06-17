import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowLeft,
  Globe, 
  Search, 
  Plus, 
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Building2,
  Loader2,
  Mail,
  UserPlus,
  Users,
  History,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import BackToAdminButton from '@/components/admin/BackToAdminButton';
import BlockedListsSection from '@/components/admin/BlockedListsSection';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

// Domain format: labels separated by dots, each 1-63 alphanumeric/hyphen chars,
// TLD at least 2 letters. Total length <= 253.
const DOMAIN_REGEX = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

const domainSchema = z.object({
  domain: z.string()
    .trim()
    .toLowerCase()
    .min(3, 'Domain must be at least 3 characters')
    .max(253, 'Domain must be less than 253 characters')
    .regex(DOMAIN_REGEX, 'Enter a valid domain (e.g., example.com — no http://, no @, no paths)'),
  organization: z.string().trim().min(1, 'Organization is required').max(100, 'Organization must be less than 100 characters'),
  is_active: z.boolean(),
});

type DomainFormPayload = { domain: string; organization: string; is_active: boolean };

interface Domain {
  id: string;
  domain: string;
  organization: string;
  is_active: boolean;
  created_at: string;
}

interface DomainAuditEntry {
  id: string;
  domain_id: string | null;
  domain: string;
  organization: string | null;
  action: 'created' | 'updated' | 'activated' | 'deactivated' | 'deleted';
  changes: any;
  actor_id: string | null;
  actor_email: string | null;
  created_at: string;
}

interface EmailException {
  id: string;
  email: string;
  organization: string | null;
  is_active: boolean;
  created_at: string;
}

const AdminDomainsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [emailSearchTerm, setEmailSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [formData, setFormData] = useState({ domain: '', organization: '', is_active: true });

  // Email exceptions state
  const [showAddEmailModal, setShowAddEmailModal] = useState(false);
  const [showEditEmailModal, setShowEditEmailModal] = useState(false);
  const [showDeleteEmailModal, setShowDeleteEmailModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailException | null>(null);
  const [emailFormData, setEmailFormData] = useState({ email: '', organization: '', is_active: true });

  // Audit log state
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Helper: write an audit log entry. Failures are logged but never block the action.
  const logDomainAudit = async (entry: {
    domain_id: string | null;
    domain: string;
    organization: string | null;
    action: DomainAuditEntry['action'];
    changes?: Record<string, unknown> | null;
  }) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const actor = userData.user;
      const { error } = await supabase.from('authorized_domain_audit_log').insert([{
        domain_id: entry.domain_id ?? undefined,
        domain: entry.domain,
        organization: entry.organization ?? undefined,
        action: entry.action,
        changes: (entry.changes ?? null) as any,
        actor_id: actor?.id,
        actor_email: actor?.email,
      }]);
      if (error) console.error('Audit log write failed:', error);
    } catch (err) {
      console.error('Audit log exception:', err);
    }
  };

  // Fetch audit log
  const { data: auditLog = [], isLoading: isLoadingAudit } = useQuery({
    queryKey: ['domain-audit-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authorized_domain_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as DomainAuditEntry[];
    },
    enabled: showAuditModal,
  });

  // Fetch domains
  const { data: domains = [], isLoading: isLoadingDomains } = useQuery({
    queryKey: ['authorized-domains'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authorized_email_domains')
        .select('*')
        .order('domain', { ascending: true });
      
      if (error) throw error;
      return data as Domain[];
    },
  });

  // Fetch email exceptions
  const { data: emailExceptions = [], isLoading: isLoadingEmails } = useQuery({
    queryKey: ['authorized-emails'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authorized_emails')
        .select('*')
        .order('email', { ascending: true });
      
      if (error) throw error;
      return data as EmailException[];
    },
  });

  // Add domain mutation
  const addDomainMutation = useMutation({
    mutationFn: async (newDomain: { domain: string; organization: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('authorized_email_domains')
        .insert([{
          domain: newDomain.domain.toLowerCase().trim(),
          organization: newDomain.organization.trim(),
          is_active: newDomain.is_active,
        }])
        .select()
        .single();
      
      if (error) throw error;
      await logDomainAudit({
        domain_id: data.id,
        domain: data.domain,
        organization: data.organization,
        action: 'created',
        changes: { after: { domain: data.domain, organization: data.organization, is_active: data.is_active } },
      });

      // Verification step: re-fetch the row by id to confirm it persisted
      const { data: verify, error: verifyError } = await supabase
        .from('authorized_email_domains')
        .select('id, domain, is_active')
        .eq('id', data.id)
        .maybeSingle();

      return {
        row: data,
        verified: !verifyError && !!verify && verify.domain === data.domain,
        verifiedActive: !!verify?.is_active,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['authorized-domains'] });
      queryClient.invalidateQueries({ queryKey: ['domain-audit-log'] });
      if (!result.verified) {
        toast.warning(`Domain "${result.row.domain}" saved but could not be verified — refresh to confirm.`);
      } else if (result.verifiedActive) {
        toast.success(`Verified: "${result.row.domain}" added and active.`);
      } else {
        toast.warning(`"${result.row.domain}" added but is currently inactive. Toggle it on to allow signups.`);
      }
      setShowAddModal(false);
      setFormData({ domain: '', organization: '', is_active: true });
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('This domain already exists');
      } else {
        toast.error('Failed to add domain');
      }
    },
  });

  // Update domain mutation
  const updateDomainMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; domain: string; organization: string; is_active: boolean }) => {
      const before = selectedDomain;
      const { data, error } = await supabase
        .from('authorized_email_domains')
        .update({
          ...updates,
          domain: updates.domain.toLowerCase().trim(),
          organization: updates.organization.trim(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      await logDomainAudit({
        domain_id: data.id,
        domain: data.domain,
        organization: data.organization,
        action: 'updated',
        changes: {
          before: before ? { domain: before.domain, organization: before.organization, is_active: before.is_active } : null,
          after: { domain: data.domain, organization: data.organization, is_active: data.is_active },
        },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authorized-domains'] });
      queryClient.invalidateQueries({ queryKey: ['domain-audit-log'] });
      toast.success('Domain updated successfully');
      setShowEditModal(false);
      setSelectedDomain(null);
    },
    onError: () => {
      toast.error('Failed to update domain');
    },
  });

  // Delete domain mutation
  const deleteDomainMutation = useMutation({
    mutationFn: async (id: string) => {
      const before = selectedDomain;
      const { error } = await supabase
        .from('authorized_email_domains')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      if (before) {
        await logDomainAudit({
          domain_id: before.id,
          domain: before.domain,
          organization: before.organization,
          action: 'deleted',
          changes: { before: { domain: before.domain, organization: before.organization, is_active: before.is_active } },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authorized-domains'] });
      queryClient.invalidateQueries({ queryKey: ['domain-audit-log'] });
      toast.success('Domain deleted successfully');
      setShowDeleteModal(false);
      setSelectedDomain(null);
    },
    onError: () => {
      toast.error('Failed to delete domain');
    },
  });

  // Toggle domain active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const before = domains.find(d => d.id === id);
      const { error } = await supabase
        .from('authorized_email_domains')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
      if (before) {
        await logDomainAudit({
          domain_id: before.id,
          domain: before.domain,
          organization: before.organization,
          action: is_active ? 'activated' : 'deactivated',
          changes: { before: { is_active: before.is_active }, after: { is_active } },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authorized-domains'] });
      queryClient.invalidateQueries({ queryKey: ['domain-audit-log'] });
    },
    onError: () => {
      toast.error('Failed to update domain status');
    },
  });

  // ===== EMAIL EXCEPTIONS MUTATIONS =====

  // Add email exception mutation
  const addEmailMutation = useMutation({
    mutationFn: async (newEmail: { email: string; organization: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('authorized_emails')
        .insert([{
          email: newEmail.email.toLowerCase().trim(),
          organization: newEmail.organization.trim() || null,
          is_active: newEmail.is_active,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authorized-emails'] });
      toast.success('Email exception added successfully');
      setShowAddEmailModal(false);
      setEmailFormData({ email: '', organization: '', is_active: true });
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate') || error.code === '23505') {
        toast.error('This email already exists');
      } else {
        toast.error('Failed to add email exception');
      }
    },
  });

  // Update email exception mutation
  const updateEmailMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; email?: string; organization?: string; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('authorized_emails')
        .update({
          email: updates.email?.toLowerCase().trim(),
          organization: updates.organization?.trim() || null,
          is_active: updates.is_active,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authorized-emails'] });
      toast.success('Email exception updated successfully');
      setShowEditEmailModal(false);
      setSelectedEmail(null);
    },
    onError: () => {
      toast.error('Failed to update email exception');
    },
  });

  // Delete email exception mutation
  const deleteEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('authorized_emails')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authorized-emails'] });
      toast.success('Email exception deleted successfully');
      setShowDeleteEmailModal(false);
      setSelectedEmail(null);
    },
    onError: () => {
      toast.error('Failed to delete email exception');
    },
  });

  // Toggle email active status
  const toggleEmailActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('authorized_emails')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authorized-emails'] });
    },
    onError: () => {
      toast.error('Failed to update email status');
    },
  });

  // ===== FILTERING =====
  const filteredDomains = domains.filter((domain) =>
    domain.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    domain.organization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEmails = emailExceptions.filter((email) =>
    email.email.toLowerCase().includes(emailSearchTerm.toLowerCase()) ||
    (email.organization?.toLowerCase().includes(emailSearchTerm.toLowerCase()) ?? false)
  );

  // ===== HANDLERS =====
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = domainSchema.safeParse(formData);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }
    const payload: DomainFormPayload = {
      domain: parsed.data.domain!,
      organization: parsed.data.organization!,
      is_active: parsed.data.is_active!,
    };
    addDomainMutation.mutate(payload);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomain) return;
    const parsed = domainSchema.safeParse(formData);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }
    updateDomainMutation.mutate({
      id: selectedDomain.id,
      domain: parsed.data.domain!,
      organization: parsed.data.organization!,
      is_active: parsed.data.is_active!,
    });
  };

  const openEditModal = (domain: Domain) => {
    setSelectedDomain(domain);
    setFormData({
      domain: domain.domain,
      organization: domain.organization,
      is_active: domain.is_active,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (domain: Domain) => {
    setSelectedDomain(domain);
    setShowDeleteModal(true);
  };

  // Email handlers
  const handleAddEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailFormData.email) {
      toast.error('Email is required');
      return;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailFormData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    addEmailMutation.mutate(emailFormData);
  };

  const handleEditEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmail) return;
    updateEmailMutation.mutate({
      id: selectedEmail.id,
      email: emailFormData.email,
      organization: emailFormData.organization,
      is_active: emailFormData.is_active,
    });
  };

  const openEditEmailModal = (email: EmailException) => {
    setSelectedEmail(email);
    setEmailFormData({
      email: email.email,
      organization: email.organization || '',
      is_active: email.is_active,
    });
    setShowEditEmailModal(true);
  };

  const openDeleteEmailModal = (email: EmailException) => {
    setSelectedEmail(email);
    setShowDeleteEmailModal(true);
  };

  const isLoading = isLoadingDomains || isLoadingEmails;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p>Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <BackToAdminButton />
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/admin" className="hover:text-brand-blue dark:text-foreground">Admin Dashboard</Link>
            <span>/</span>
            <span className="text-brand-blue dark:text-foreground font-medium">Access Control</span>
          </div>

          {/* Header */}
          <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-heading text-brand-blue dark:text-foreground">Access Control</h1>
              <p className="text-muted-foreground mt-2">Manage which email domains and individual emails can sign up for the platform</p>
            </div>
            <Button variant="outline" className="flex items-center gap-2" asChild>
              <Link to="/admin/users">
                <Users className="w-4 h-4" />
                User Management
              </Link>
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="domains" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="domains" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Authorized Domains
              </TabsTrigger>
              <TabsTrigger value="emails" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Exceptions
              </TabsTrigger>
              <TabsTrigger value="blocked-domains" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Blocked Domains
              </TabsTrigger>
              <TabsTrigger value="blocked-emails" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Blocked Emails
              </TabsTrigger>
            </TabsList>

            {/* DOMAINS TAB */}
            <TabsContent value="domains">
              {/* Header with Add Button */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Authorized Domains</h2>
                  <p className="text-sm text-muted-foreground">All users with these email domains can sign up</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="flex items-center gap-2" onClick={() => setShowAuditModal(true)}>
                    <History className="w-4 h-4" />
                    View History
                  </Button>
                  <Button className="flex items-center gap-2" onClick={() => setShowAddModal(true)}>
                    <Plus className="w-4 h-4" />
                    Add Domain
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Domains</p>
                        <p className="text-2xl font-bold text-brand-blue dark:text-foreground">{domains.length}</p>
                      </div>
                      <Globe className="w-8 h-8 text-brand-blue dark:text-foreground" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Domains</p>
                        <p className="text-2xl font-bold text-green-600">
                          {domains.filter(d => d.is_active).length}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Inactive Domains</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {domains.filter(d => !d.is_active).length}
                        </p>
                      </div>
                      <XCircle className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Search */}
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search domains or organizations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Domains Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Domains ({filteredDomains.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Domain</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDomains.map((domain) => (
                        <TableRow key={domain.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              {domain.domain}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {domain.organization}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={domain.is_active}
                                onCheckedChange={(checked) => 
                                  toggleActiveMutation.mutate({ id: domain.id, is_active: checked })
                                }
                              />
                              <Badge variant={domain.is_active ? 'default' : 'secondary'}>
                                {domain.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(domain.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(domain)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
                                onClick={() => openDeleteModal(domain)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredDomains.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No domains found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* EMAIL EXCEPTIONS TAB */}
            <TabsContent value="emails">
              {/* Header with Add Button */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Email Exceptions</h2>
                  <p className="text-sm text-muted-foreground">Individual emails that can sign up (for personal email providers like Gmail, Hotmail, etc.)</p>
                </div>
                <Button className="flex items-center gap-2" onClick={() => setShowAddEmailModal(true)}>
                  <UserPlus className="w-4 h-4" />
                  Add Email
                </Button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Exceptions</p>
                        <p className="text-2xl font-bold text-brand-blue dark:text-foreground">{emailExceptions.length}</p>
                      </div>
                      <Mail className="w-8 h-8 text-brand-blue dark:text-foreground" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Exceptions</p>
                        <p className="text-2xl font-bold text-green-600">
                          {emailExceptions.filter(e => e.is_active).length}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Inactive Exceptions</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {emailExceptions.filter(e => !e.is_active).length}
                        </p>
                      </div>
                      <XCircle className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Search */}
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search emails or organizations..."
                      value={emailSearchTerm}
                      onChange={(e) => setEmailSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Emails Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Email Exceptions ({filteredEmails.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmails.map((email) => (
                        <TableRow key={email.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              {email.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {email.organization || <span className="text-muted-foreground italic">—</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={email.is_active}
                                onCheckedChange={(checked) => 
                                  toggleEmailActiveMutation.mutate({ id: email.id, is_active: checked })
                                }
                              />
                              <Badge variant={email.is_active ? 'default' : 'secondary'}>
                                {email.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(email.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditEmailModal(email)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
                                onClick={() => openDeleteEmailModal(email)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredEmails.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No email exceptions found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="blocked-domains">
              <BlockedListsSection mode="domain" />
            </TabsContent>
            <TabsContent value="blocked-emails">
              <BlockedListsSection mode="email" />
            </TabsContent>
          </Tabs>
        </div>

      {/* ===== DOMAIN MODALS ===== */}

      {/* Add Domain Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Domain</DialogTitle>
            <DialogDescription>
              Add a new authorized email domain that can sign up for the platform.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain *</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the domain without @ symbol (e.g., "company.com")
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization">Organization *</Label>
                <Input
                  id="organization"
                  placeholder="Company Name"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addDomainMutation.isPending}>
                {addDomainMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Domain'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Domain Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Domain</DialogTitle>
            <DialogDescription>
              Update the domain information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-domain">Domain *</Label>
                <Input
                  id="edit-domain"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-organization">Organization *</Label>
                <Input
                  id="edit-organization"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-is_active">Active</Label>
                <Switch
                  id="edit-is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateDomainMutation.isPending}>
                {updateDomainMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Domain Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Domain</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedDomain?.domain}</strong>? 
              Users with this email domain will no longer be able to sign up.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedDomain && deleteDomainMutation.mutate(selectedDomain.id)}
              disabled={deleteDomainMutation.isPending}
            >
              {deleteDomainMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Domain'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== EMAIL EXCEPTION MODALS ===== */}

      {/* Add Email Modal */}
      <Dialog open={showAddEmailModal} onOpenChange={setShowAddEmailModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Email Exception</DialogTitle>
            <DialogDescription>
              Add a specific email address that can sign up (for personal email providers like Gmail, Hotmail, Yahoo, Outlook, etc.)
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEmailSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@gmail.com"
                  value={emailFormData.email}
                  onChange={(e) => setEmailFormData({ ...emailFormData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-organization">Organization / Reason (Optional)</Label>
                <Input
                  id="email-organization"
                  placeholder="e.g., Family Member, External Consultant"
                  value={emailFormData.organization}
                  onChange={(e) => setEmailFormData({ ...emailFormData, organization: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="email-is_active">Active</Label>
                <Switch
                  id="email-is_active"
                  checked={emailFormData.is_active}
                  onCheckedChange={(checked) => setEmailFormData({ ...emailFormData, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddEmailModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addEmailMutation.isPending}>
                {addEmailMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Email'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Email Modal */}
      <Dialog open={showEditEmailModal} onOpenChange={setShowEditEmailModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Email Exception</DialogTitle>
            <DialogDescription>
              Update the email exception information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditEmailSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={emailFormData.email}
                  onChange={(e) => setEmailFormData({ ...emailFormData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email-organization">Organization / Reason (Optional)</Label>
                <Input
                  id="edit-email-organization"
                  value={emailFormData.organization}
                  onChange={(e) => setEmailFormData({ ...emailFormData, organization: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-email-is_active">Active</Label>
                <Switch
                  id="edit-email-is_active"
                  checked={emailFormData.is_active}
                  onCheckedChange={(checked) => setEmailFormData({ ...emailFormData, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditEmailModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateEmailMutation.isPending}>
                {updateEmailMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Email Confirmation Modal */}
      <Dialog open={showDeleteEmailModal} onOpenChange={setShowDeleteEmailModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Email Exception</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedEmail?.email}</strong>? 
              This user will no longer be able to sign up with this email.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteEmailModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedEmail && deleteEmailMutation.mutate(selectedEmail.id)}
              disabled={deleteEmailMutation.isPending}
            >
              {deleteEmailMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Email'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit History Modal */}
      <Dialog open={showAuditModal} onOpenChange={setShowAuditModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Domain Audit History</DialogTitle>
            <DialogDescription>
              Recent changes to authorized domains (latest 200 entries).
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto flex-1">
            {isLoadingAudit ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : auditLog.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No audit entries yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLog.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs">{entry.actor_email ?? '—'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            entry.action === 'deleted' || entry.action === 'deactivated'
                              ? 'destructive'
                              : entry.action === 'created' || entry.action === 'activated'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {entry.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium">{entry.domain}</div>
                        {entry.organization && (
                          <div className="text-muted-foreground">{entry.organization}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {entry.changes ? (
                          <pre className="text-[10px] bg-muted p-1 rounded max-w-xs overflow-auto">
                            {JSON.stringify(entry.changes, null, 2)}
                          </pre>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAuditModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminDomainsPage;
