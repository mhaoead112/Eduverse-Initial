# Lesson Upload Feature - Deployment Checklist

## Pre-Deployment Review

### Code Quality
- [ ] All ESLint warnings resolved
- [ ] TypeScript compilation succeeds
- [ ] No console errors in dev tools
- [ ] No console warnings in dev tools
- [ ] Code formatted consistently

### Testing
- [ ] Upload with valid file passes
- [ ] Upload with no file shows error
- [ ] Upload with oversized file (>50MB) shows error
- [ ] Upload with invalid file type shows error
- [ ] Upload with no title shows error
- [ ] Upload with no course selected shows error
- [ ] Successfully uploaded lesson appears in list
- [ ] File type icons display correctly
- [ ] File size displays correctly
- [ ] Upload date displays correctly
- [ ] Delete button shows confirmation dialog
- [ ] Delete removes lesson from list
- [ ] Download button is present and functional
- [ ] Form resets after successful upload
- [ ] Progress bar shows upload progress
- [ ] Non-teacher users cannot access /lessons
- [ ] Multiple file uploads work sequentially
- [ ] Can upload to different courses

### Security
- [ ] JWT token required for upload
- [ ] Invalid token rejected
- [ ] Expired token rejected
- [ ] Non-teacher role rejected
- [ ] Course validation in place
- [ ] File type whitelist enforced
- [ ] File size limit enforced
- [ ] Malicious filenames sanitized

---

## Database Migration

### Before Running Migration
- [ ] Backup current database
- [ ] Stop running application
- [ ] Verify PostgreSQL is running
- [ ] Verify DATABASE_URL is set correctly

### Running Migration
- [ ] Verify migration file exists: `migrations/0004_add_lessons_table.sql`
- [ ] Run: `npm run db:push`
- [ ] Verify no errors in console
- [ ] Check migration applied: `SELECT * FROM "lessons";`

### After Migration
- [ ] Lessons table exists
- [ ] All columns present with correct types
- [ ] Foreign key constraint on course_id
- [ ] Cascade delete configured
- [ ] Timestamps working correctly

---

## File System Setup

### Uploads Directory
- [ ] Create `uploads/` directory: `mkdir uploads`
- [ ] Set proper permissions: `chmod 755 uploads`
- [ ] Verify writable by app user
- [ ] Test file creation in directory

### Cleanup Jobs
- [ ] Schedule cleanup for orphaned files (TODO)
- [ ] Set retention policy for old uploads (TODO)
- [ ] Configure disk space alerts

---

## Environment Configuration

### Production Variables
- [ ] Set `NODE_ENV=production`
- [ ] Set `DATABASE_URL` to production database
- [ ] Set `JWT_SECRET` to secure value
- [ ] Verify `UPLOAD_DIR` is writable
- [ ] Set `MAX_FILE_SIZE` to desired limit

### Development Variables (if testing locally)
- [ ] `DATABASE_URL` points to dev database
- [ ] `JWT_SECRET` is set (can be test value)
- [ ] Uploads directory writable
- [ ] Port 3001 available for server

---

## Dependency Verification

### Required Packages
- [ ] `express` - Backend framework
- [ ] `multer` - File upload handling
- [ ] `bcryptjs` - Password hashing
- [ ] `jsonwebtoken` - JWT generation
- [ ] `zod` - Schema validation
- [ ] `drizzle-orm` - Database ORM
- [ ] `pg` - PostgreSQL driver
- [ ] `react` - Frontend framework
- [ ] `react-hook-form` - Form handling (if using)
- [ ] `@radix-ui/` - UI components

### Installation
- [ ] Run `npm install` in root
- [ ] Run `npm install` in client/
- [ ] Run `npm install` in server/ (if separate)
- [ ] Verify no dependency conflicts

---

## Build & Compilation

### Frontend Build
- [ ] Run `npm run build` in client/
- [ ] Verify no build errors
- [ ] Check build output size
- [ ] Verify dist/ folder created

### Backend Build  
- [ ] Run `npm run build` (if needed)
- [ ] Verify no compilation errors
- [ ] Check for any TypeScript errors

### Production Build
- [ ] Build frontend for production
- [ ] Minification enabled
- [ ] Source maps generated (optional)
- [ ] Bundle size acceptable

---

## Server Setup

### Application Server
- [ ] Node.js version compatible (>=14)
- [ ] Port 3001 accessible
- [ ] Memory sufficient for uploads
- [ ] CPU resources adequate
- [ ] Network bandwidth sufficient

### Database Server
- [ ] PostgreSQL running
- [ ] Connection string valid
- [ ] Credentials correct
- [ ] Database exists
- [ ] Tables created
- [ ] Indexes created

### File Server
- [ ] Upload directory exists
- [ ] Write permissions set
- [ ] Disk space sufficient (>100GB recommended)
- [ ] Backup configured
- [ ] Monitoring configured

---

## SSL/TLS Configuration

### HTTPS Setup
- [ ] SSL certificate obtained
- [ ] Certificate valid
- [ ] Key file secure
- [ ] HTTPS redirect configured
- [ ] Mixed content warnings resolved

### API Communication
- [ ] Client uses HTTPS
- [ ] Server uses HTTPS
- [ ] Self-signed certs OK for dev
- [ ] Production uses trusted CA cert

---

## API Endpoint Verification

### Upload Endpoint
```bash
# Test basic upload
curl -X POST http://localhost:3001/api/lessons/upload \
  -H "Authorization: Bearer <TOKEN>" \
  -F "courseId=course_1" \
  -F "lessonTitle=Test" \
  -F "file=@test.pdf"
```
- [ ] Returns 201 Created
- [ ] Response has lesson object
- [ ] File is saved

### Get Lessons Endpoint
```bash
curl http://localhost:3001/api/courses/course_1/lessons
```
- [ ] Returns 200 OK
- [ ] Returns lessons array
- [ ] Lessons have all fields

### Delete Endpoint
```bash
curl -X DELETE http://localhost:3001/api/lessons/lesson_1 \
  -H "Authorization: Bearer <TOKEN>"
```
- [ ] Returns 200 OK
- [ ] Lesson removed from database
- [ ] File deleted from disk

---

## Frontend Verification

### Route Access
- [ ] `/lessons` loads without errors
- [ ] Non-authenticated redirected to login
- [ ] Non-teacher shows access denied
- [ ] Teacher sees full interface

### Component Rendering
- [ ] Course dropdown populates
- [ ] Upload form displays
- [ ] File input clickable
- [ ] All buttons functional
- [ ] Validation messages display
- [ ] Success messages display

### File Upload
- [ ] Can select file
- [ ] Can drag-drop file
- [ ] Progress bar shows
- [ ] Upload completes successfully
- [ ] Success toast appears
- [ ] Form resets

### Lessons List
- [ ] Shows uploaded lessons
- [ ] File icons correct
- [ ] Download button works
- [ ] Delete button works

---

## Performance Testing

### Load Testing
- [ ] Single file upload: <5s
- [ ] Multiple sequential uploads: OK
- [ ] Large file (45MB): <30s
- [ ] List of 100 lessons: <1s
- [ ] Delete lesson: <1s

### Memory Usage
- [ ] Upload doesn't leak memory
- [ ] Large files handled efficiently
- [ ] No memory growth over time

### Network
- [ ] Upload progress tracking smooth
- [ ] No timeout issues
- [ ] Connection resilient
- [ ] Bandwidth usage acceptable

---

## Security Testing

### Authentication
- [ ] Anonymous requests rejected
- [ ] Invalid token rejected
- [ ] Expired token rejected
- [ ] Token validation passes for valid token

### Authorization
- [ ] Student cannot upload
- [ ] Parent cannot upload
- [ ] Teacher can upload
- [ ] Admin can upload

### File Upload
- [ ] Executable files rejected
- [ ] Script files rejected
- [ ] Oversized files rejected
- [ ] Whitelist enforced

### Data Protection
- [ ] HTTPS enforced
- [ ] Tokens in secure headers
- [ ] No sensitive data in logs
- [ ] CORS headers correct

---

## Logging & Monitoring

### Application Logs
- [ ] Errors logged to file
- [ ] Success uploads logged
- [ ] Failed uploads logged
- [ ] Warnings logged
- [ ] Info level logs

### Monitoring Setup
- [ ] Disk space monitored
- [ ] Upload errors tracked
- [ ] Performance metrics collected
- [ ] Health checks configured
- [ ] Alerts configured

### Log Rotation
- [ ] Logs rotate daily
- [ ] Old logs archived
- [ ] Log retention policy set
- [ ] Disk usage managed

---

## Documentation

### Code Documentation
- [ ] Components documented
- [ ] API endpoints documented
- [ ] Database schema documented
- [ ] Error codes documented
- [ ] Usage examples provided

### User Documentation
- [ ] Quick reference guide
- [ ] Feature documentation
- [ ] Code examples
- [ ] Troubleshooting guide
- [ ] FAQ created

### Deployment Documentation
- [ ] Setup instructions
- [ ] Configuration guide
- [ ] Troubleshooting steps
- [ ] Rollback procedures
- [ ] Emergency contacts

---

## Backup & Recovery

### Database Backup
- [ ] Backup schedule configured
- [ ] Backup location secured
- [ ] Backup tested
- [ ] Recovery procedure documented
- [ ] Encryption enabled

### File Backup
- [ ] Upload directory backed up
- [ ] Backup frequency adequate
- [ ] Off-site backup configured
- [ ] Recovery time acceptable

---

## Post-Deployment Verification

### Immediate After Deploy
- [ ] Application starts without errors
- [ ] Database connection successful
- [ ] File upload works
- [ ] All endpoints respond
- [ ] No critical errors in logs

### First 24 Hours
- [ ] Monitor error logs
- [ ] Monitor performance metrics
- [ ] Monitor disk usage
- [ ] Monitor user feedback
- [ ] Check for any issues

### First Week
- [ ] All features tested in production
- [ ] No regression issues
- [ ] Performance acceptable
- [ ] User adoption good
- [ ] No security issues

---

## Rollback Plan

### If Issues Occur
1. [ ] Stop application
2. [ ] Restore database backup
3. [ ] Restore file backup
4. [ ] Revert to previous version
5. [ ] Run previous migrations
6. [ ] Restart application
7. [ ] Verify functionality
8. [ ] Notify users

### Communication
- [ ] Prepare rollback message
- [ ] Notify team
- [ ] Update status page
- [ ] Document issue for review

---

## Post-Launch Checklist

### 1 Week Post-Launch
- [ ] All critical issues resolved
- [ ] Performance baseline established
- [ ] User feedback collected
- [ ] Documentation complete
- [ ] Team trained

### 1 Month Post-Launch
- [ ] Feature adoption metrics tracked
- [ ] Bug reports processed
- [ ] Performance stable
- [ ] Security audit passed
- [ ] User satisfaction measured

### 3 Months Post-Launch
- [ ] Optimization opportunities identified
- [ ] Scaling requirements assessed
- [ ] Next features planned
- [ ] Technical debt addressed
- [ ] Lessons learned documented

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | _______ | _______ | _______ |
| QA Lead | _______ | _______ | _______ |
| DevOps | _______ | _______ | _______ |
| Product | _______ | _______ | _______ |

---

## Notes

```
Add any additional notes, concerns, or special considerations here:

_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

---

## Emergency Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Lead Developer | _______ | _______ | _______ |
| DevOps Lead | _______ | _______ | _______ |
| Database Admin | _______ | _______ | _______ |
| Product Manager | _______ | _______ | _______ |

---

## References

- Feature Documentation: `LESSON_UPLOAD_FEATURE.md`
- Quick Reference: `LESSON_UPLOAD_QUICK_REFERENCE.md`
- Code Examples: `LESSON_UPLOAD_CODE_EXAMPLES.md`
- Implementation Summary: `LESSON_UPLOAD_IMPLEMENTATION_SUMMARY.md`

---

**Deployment Approved:** _______ / _______ / _______

**Go-Live Date:** _______ / _______ / _______
