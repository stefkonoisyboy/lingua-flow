# Collaborators Feature Implementation Plan

## Overview

This document outlines the implementation plan for the collaborators feature in Lingua Flow, which allows project owners to invite team members with different roles and manage permissions within projects.

## Table of Contents

1. [Database Schema Changes](#database-schema-changes)
2. [Permission System Design](#permission-system-design)
3. [Invitation Flow](#invitation-flow)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Security Considerations](#security-considerations)
7. [Testing Strategy](#testing-strategy)

## Database Schema Changes

### New Tables

#### 1. `project_invitations` table
```sql
CREATE TABLE project_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES profiles(id),
  invitee_email VARCHAR(255) NOT NULL,
  invitee_id UUID REFERENCES profiles(id), -- NULL for non-existing users
  role user_role NOT NULL DEFAULT 'viewer',
  token VARCHAR(255) UNIQUE NOT NULL, -- Secure invitation token
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, expired
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Database Permissions
- Grant appropriate permissions to authenticated users
- Create indexes on frequently queried columns (project_id, invitee_email, token, status)

## Permission System Design

### Role-Based Access Control (RBAC)

#### Owner Permissions
- **Projects**: Create, Read, Update, Delete
- **Translations**: Create, Read, Update, Delete, Import, Export
- **Comments**: Create, Read, Update, Delete
- **Languages**: Add, Remove
- **Integrations**: Create, Connect, Disconnect, Pull, Manage Conflicts
- **Members**: Invite, Change Roles, Remove
- **Settings**: All project settings

#### Translator Permissions
- **Projects**: Read
- **Translations**: Create, Read, Update, Delete
- **Comments**: Create, Read
- **Languages**: Read
- **Integrations**: Read
- **Members**: Read
- **Settings**: None

#### Viewer Permissions
- **Projects**: Read
- **Translations**: Read
- **Comments**: Create, Read
- **Languages**: Read
- **Integrations**: Read
- **Members**: Read
- **Settings**: None

### Permission Checking Strategy

1. **Backend Middleware**: Create a permission middleware that checks user role for each project-specific endpoint
2. **Frontend Guards**: Implement permission guards to hide/disable UI elements based on user role
3. **Context-Based Permissions**: Store current user's role in the project context for easy access

## Invitation Flow

### Inviting New Collaborators

1. **Invitation Creation**
   - Owner clicks "Invite Collaborator" button
   - Enters email address and selects role
   - System generates unique invitation token
   - Creates invitation record with 7-day expiration

2. **Email Notification**
   - For existing users: Send notification with direct link to accept
   - For new users: Send invitation to register and join project

3. **Invitation Acceptance**
   - User clicks invitation link
   - System validates token and expiration
   - For new users: Redirect to registration with pre-filled email
   - For existing users: Show invitation details
   - User accepts/rejects invitation
   - On acceptance: Add to project_members table

### Managing Existing Members

1. **Role Changes**
   - Owner can change member roles from collaborators page
   - System updates project_members table
   - Real-time UI updates reflect permission changes

2. **Member Removal**
   - Owner can remove members
   - System soft-deletes or removes from project_members
   - Logs activity for audit trail

## Backend Implementation

### New Services

#### 1. `ProjectMembersService`
```typescript
interface IProjectMembersService {
  // Member management
  getProjectMembers(projectId: string): Promise<ProjectMember[]>
  addProjectMember(projectId: string, userId: string, role: UserRole): Promise<void>
  updateMemberRole(projectId: string, userId: string, newRole: UserRole): Promise<void>
  removeMember(projectId: string, userId: string): Promise<void>
  
  // Invitation management
  createInvitation(projectId: string, inviterEmail: string, inviteeEmail: string, role: UserRole): Promise<string>
  getProjectInvitations(projectId: string): Promise<ProjectInvitation[]>
  acceptInvitation(token: string, userId: string): Promise<void>
  rejectInvitation(token: string): Promise<void>
  resendInvitation(invitationId: string): Promise<void>
  cancelInvitation(invitationId: string): Promise<void>
  
  // Permission checks
  getUserProjectRole(projectId: string, userId: string): Promise<UserRole | null>
  hasPermission(projectId: string, userId: string, permission: string): Promise<boolean>
}
```

### New DAL Methods

#### 1. `ProjectMembersDAL`
- CRUD operations for project_members table
- CRUD operations for project_invitations table
- Complex queries for member listings with user details

### tRPC Router Updates

#### 1. New `project-members` router
```typescript
// Endpoints:
- getMembers: Get all project members with details
- inviteMember: Create new invitation
- updateMemberRole: Change member role
- removeMember: Remove member from project
- getInvitations: Get pending invitations
- acceptInvitation: Accept invitation
- rejectInvitation: Reject invitation
- resendInvitation: Resend invitation email
- cancelInvitation: Cancel pending invitation
```

#### 2. Permission Middleware
```typescript
// Add to existing routers to check permissions
const requireProjectPermission = (permission: string) => {
  return async (opts: { ctx: Context; input: any; next: () => Promise<any> }) => {
    const role = await getUserProjectRole(opts.input.projectId, opts.ctx.userId);
    if (!hasPermission(role, permission)) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }
    return opts.next();
  };
};
```

### Email Service Integration

1. Create email templates for:
   - Invitation to existing users
   - Invitation to new users
   - Role change notifications
   - Removal notifications

2. Integrate with email service (e.g., SendGrid, AWS SES)

## Frontend Implementation

### New Components

#### 1. `collaborators-page.tsx`
- Main page for managing collaborators
- Tabs for active members and pending invitations
- Search and filter functionality

#### 2. `invite-collaborator-dialog.tsx`
- Modal for inviting new collaborators
- Email input with validation
- Role selector
- Batch invitation support

#### 3. `member-list-item.tsx`
- Display member details
- Role selector (for owners)
- Remove button (for owners)
- Last activity indicator

#### 4. `pending-invitations-list.tsx`
- List of pending invitations
- Resend/Cancel actions
- Expiration countdown

#### 5. `accept-invitation-page.tsx`
- Standalone page for accepting invitations
- Project preview
- Accept/Reject actions

### UI Permission Guards

#### 1. `PermissionGuard` Component
```typescript
interface PermissionGuardProps {
  permissions: string[];
  fallback?: ReactNode;
  children: ReactNode;
}
```

#### 2. `useProjectPermissions` Hook
```typescript
// Returns current user's permissions in the project
const permissions = useProjectPermissions(projectId);
```

### Redux State Updates

1. Add `projectMembers` slice:
   - Store current project members
   - Store pending invitations
   - Cache user permissions

2. Update existing slices:
   - Add permission checks to actions
   - Filter UI elements based on permissions

## Security Considerations

1. **Token Security**
   - Use cryptographically secure random tokens
   - Implement rate limiting on invitation endpoints
   - Validate token expiration server-side

2. **Permission Validation**
   - Always validate permissions server-side
   - Never trust client-side permission checks
   - Log all permission-related actions

3. **Email Verification**
   - Verify email ownership before granting access
   - Implement email change notifications

4. **Audit Trail**
   - Log all member management actions
   - Track invitation lifecycle
   - Monitor for suspicious patterns

## Implementation Phases

### Phase 1: Database and Backend Foundation (Week 1)
- Create database tables and migrations
- Implement DAL and Service layers
- Create basic tRPC endpoints

### Phase 2: Permission System (Week 1-2)
- Implement permission middleware
- Add permission checks to existing endpoints
- Create permission utilities

### Phase 3: Invitation Flow (Week 2)
- Implement invitation creation and management
- Set up email service integration
- Create invitation acceptance flow

### Phase 4: Frontend Implementation (Week 3)
- Create collaborators management UI
- Implement permission-based UI guards
- Add invitation acceptance pages

## Future Enhancements

1. **Team Management**
   - Create reusable teams across projects
   - Bulk member management

2. **Advanced Permissions**
   - Language-specific translator permissions
   - Custom role creation

3. **Activity Notifications**
   - Real-time notifications for member changes
   - Daily/weekly activity digests

4. **SSO Integration**
   - Support for enterprise SSO
   - Automatic user provisioning 