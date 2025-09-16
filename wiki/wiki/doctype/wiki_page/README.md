# Wiki Page DocType Documentation

## Overview

The `WikiPage` class is the core component of the Frappe Wiki application, responsible for managing wiki content, access control, collaboration features, and web rendering. It extends Frappe's `WebsiteGenerator` to automatically create public web pages.

## Architecture

```
WikiPage (WebsiteGenerator)
├── Content Management
├── Access Control System  
├── Website Generation
├── Collaboration Features
├── Performance & Caching
└── Navigation & UI
```

## Core Components

### 1. Content Management

#### Document Lifecycle Methods
```python
def before_save(self)           # Clear sidebar cache if title changed
def after_insert(self)          # Create initial revision, clear cache
def on_update(self)             # Rebuild search index, clear HTML cache
def on_trash(self)              # Clean up revisions, patches, sidebar items
```

#### Content Processing
```python
def sanitize_html(self)         # Security: Clean HTML, allow only safe tags
def update_page(self, title, content, edit_message, raised_by=None)
                               # Update content and create revision
def extract_images_from_html(content)  # Convert base64 images to files
def convert_markdown(markdown)  # Convert markdown to HTML
```

**Related Database Tables:**
- `tabWiki Page` - Main content storage
- `tabWiki Page Revision` - Version history
- `tabWiki Page Revision Item` - Revision details

---

### 2. Access Control System

#### Permission Verification
```python
def verify_permission(self)     # Main access control entry point
def check_user_access(self, user)  # Custom user-based access checking
```

**Access Control Flow:**
1. Check if user is guest
2. Check global wiki settings (disable_guest_access)
3. Check page-level guest access (allow_guest)
4. For logged-in users: Check custom access control system
5. Redirect to login if access denied

#### Custom Access Control Integration
The system integrates with existing access control DocTypes:
- **Wiki User Access** - User-level access assignments
- **Wiki Access** - Collections of space access for users
- **Wiki Space Access** - Space-level access control
- **Wiki Page Access** - Individual page visibility settings

**Access Logic:**
```
User → Wiki User Access → Wiki Access → Wiki Space Access → Wiki Page Access
```

---

### 3. Website Generation & Context

#### Web Context Preparation
```python
def get_context(self, context)  # Prepare all data for web rendering
def set_breadcrumbs(self, context)  # Generate navigation breadcrumbs
def get_space_route(self)       # Get parent wiki space route
```

#### Context Data Provided:
- **Page content** - Markdown converted to HTML
- **Navigation** - Breadcrumbs, sidebar, next/prev pages
- **User interface** - Admin banners, dropdowns, search
- **Branding** - Logos, favicons, custom CSS/JS
- **SEO metadata** - Title, description, keywords, images
- **Collaboration** - Edit links, revision counts, patch info

---

### 4. Navigation & Sidebar

#### Sidebar Generation
```python
def get_sidebar_items(self)     # Build sidebar navigation
def get_items(self, sidebar_items)  # Render sidebar HTML with caching
```

**Sidebar Process:**
1. Get wiki space and its sidebar configuration
2. Filter items based on `hide_on_sidebar` setting
3. Check user permissions for each page
4. Group items by parent labels
5. Cache rendered HTML for performance

#### Table of Contents
```python
def calculate_toc_html(self, html)  # Generate TOC from headings
```

---

### 5. Collaboration Features

#### Patch System (Suggested Edits)
```python
def update(name, content, title, ...)  # Create/update page patches
def approve(wiki_page_patch)    # Approve pending patches
def preview(original_code, new_code, name)  # Show diff preview
```

#### User Contributions
```python
def get_open_contributions()    # Count user's pending patches
def get_open_drafts()          # Count user's draft patches
```

**Collaboration Workflow:**
1. User creates edit suggestion (Wiki Page Patch)
2. Patch can be saved as draft or submitted for review
3. Moderators can preview changes and approve
4. Approved patches update the main page and create revision

---

### 6. Performance & Caching

#### Cache Management
```python
def clear_page_html_cache(self)     # Clear page-specific cache
def clear_sidebar_cache()           # Clear sidebar cache globally
```

#### Cached Data:
- **Page HTML** - Rendered markdown content
- **Sidebar HTML** - Navigation structure
- **TOC HTML** - Table of contents
- **Next/Previous pages** - Navigation links

#### Cache Keys:
- `wiki_page_html:{page_name}` - Page content cache
- `wiki_sidebar` - Sidebar cache by space

---

### 7. Advanced Features

#### Page Operations
```python
def clone(self, original_space, new_space)  # Copy page to another space
def delete_wiki_page(wiki_page_route)       # Delete page and cleanup
def update_page_settings(name, settings)    # Update page configuration
```

#### Content Retrieval
```python
def get_page_content(wiki_page_name)        # API endpoint for page content
def get_markdown_content(wikiPageName, wikiPagePatch)  # Get raw markdown
def get_sidebar_for_page(wiki_page)         # API endpoint for sidebar
```

#### Permission Helpers
```python
def has_edit_permission()           # Check if user can edit
```

---

## Database Schema

### Primary Tables
```sql
-- Main content
tabWiki Page (name, title, content, route, published, allow_guest, meta_*)

-- Version control
tabWiki Page Revision (name, content, message, raised_by, creation)
tabWiki Page Revision Item (parent, wiki_page)

-- Collaboration
tabWiki Page Patch (wiki_page, status, new_code, new_title, raised_by)

-- Organization
tabWiki Group Item (parent, wiki_page, parent_label, hide_on_sidebar)
tabWiki Space (name, route, space_name)

-- Access Control
tabWiki User Access (user, wiki_access_list)
tabWiki Access (wiki_space_access, enabled)
tabWiki Space Access (wiki_space, access_list)
tabWiki Page Access (page, visible)
```

---

## API Endpoints

### Public APIs
```python
@frappe.whitelist(allow_guest=True)
get_page_content(wiki_page_name)        # Get rendered page content
get_sidebar_for_page(wiki_page)         # Get sidebar navigation
has_edit_permission()                   # Check edit permissions
```

### Authenticated APIs
```python
@frappe.whitelist()
update(name, content, title, ...)       # Create/update content
approve(wiki_page_patch)                # Approve suggestions
delete_wiki_page(wiki_page_route)       # Delete pages
update_page_settings(name, settings)    # Update configuration
get_markdown_content(...)               # Get raw content
preview(original_code, new_code, name)  # Preview changes
```

---

## Security Features

### XSS Protection
- HTML sanitization with whitelist-based filtering
- Only safe HTML tags and attributes allowed
- Special handling for YouTube iframe embeds
- CSS sanitization to prevent malicious styles

### Access Control
- Multi-level permission system
- Guest access controls
- User-specific page visibility
- Space-level access restrictions

### Input Validation
- Required field validation
- Route uniqueness enforcement
- File upload security
- Content sanitization

---

## Performance Optimizations

### Caching Strategy
- **Multi-level caching** - Page, sidebar, and component caching
- **Cache invalidation** - Smart cache clearing on content changes
- **Conditional rendering** - Skip cache in development mode

### Database Optimization
- **Efficient queries** - Indexed fields and optimized lookups
- **Bulk operations** - Batch processing for large operations
- **Lazy loading** - Load related data only when needed

### Frontend Optimization
- **HTML pre-rendering** - Server-side markdown processing
- **Static asset optimization** - CSS/JS minification support
- **SEO optimization** - Proper meta tags and structured data

---

## Configuration

### Wiki Settings Integration
The system integrates with `Wiki Settings` DocType for:
- Global access controls
- Search functionality
- Branding and theming
- Navigation configuration
- Table of contents settings

### Hooks Integration
Uses `hooks.py` configuration for:
- Website route rules
- Scheduled tasks (search indexing)
- Page rendering settings
- Custom CSS/JS inclusion

---

## Development Guidelines

### Adding New Features
1. Follow Frappe DocType patterns
2. Implement proper caching for performance
3. Add security validation for user inputs
4. Update documentation and API endpoints
5. Consider mobile/responsive design

### Testing Approach
1. Test permission scenarios with different user roles
2. Verify caching behavior in development/production
3. Test collaboration workflow (patches, approvals)
4. Validate security measures (XSS, access control)
5. Performance test with large content volumes

---

## Common Use Cases

### Content Management
- Create and edit wiki pages
- Organize content in spaces
- Version control and history
- SEO optimization

### Access Control
- Restrict page visibility by user
- Space-level access management
- Guest access configuration
- Role-based permissions

### Collaboration
- Suggest edits via patches
- Review and approve changes
- Track user contributions
- Draft system for work-in-progress

### Website Generation
- Automatic public page creation
- Custom branding and themes
- Search functionality
- Mobile-responsive design