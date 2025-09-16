# Wiki Page DocType Documentation

## Overview

The `WikiPage` class is the core component of the Frappe Wiki application, responsible for managing wiki content, access control, collaboration features, and web rendering. It extends Frappe's `WebsiteGenerator` to automatically create public web pages.

## 🚀 Recent Enhancements (Since Commit 97361de)

### Customized User Access Control System
A comprehensive **per-user documentation system** has been implemented, enabling each user to see only the pages they have explicit access to, with granular control over viewing and editing permissions.

#### Key Features Added:
- **Personalized Documentation**: Each user sees a customized documentation portal
- **Granular Permissions**: Separate control over `visible` (view) and `editable` (edit) access
- **Space-based Access**: Organize permissions by Wiki Spaces
- **Enhanced Security**: Multiple protection layers for unauthorized access
- **Debug System**: Advanced colored debugging with environment controls
- **Non-breaking**: Existing functionality preserved with intelligent fallbacks

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

### 2. Enhanced Access Control System

#### New DocType Structure (Since 97361de)
```python
Wiki User Access (Submittable)
├── user (Link to User)
└── wiki_access_list (Table: Wiki Access)
    ├── wiki_space_access (Link to Wiki Space Access)
    ├── enabled (Check)
    └── title (Data, Read-only)

Wiki Space Access (Submittable, Auto-increment)
├── title (Data)
├── wiki_space (Link to Wiki Space)
└── access_list (Table: Wiki Page Access)
    ├── page (Link to Wiki Page)
    ├── page_name (Data, Read-only)
    ├── visible (Check) - NEW: Controls view access
    └── editable (Check) - NEW: Controls edit access
```

#### Enhanced Permission Methods
```python
def verify_permission(self)                    # Enhanced with edit permission checks
def check_user_access(self, user)              # Custom user-based access checking
def check_user_edit_permission(self, user)     # NEW: Check edit permissions
def get_user_accessible_pages(self, user, return_permissions=False)  # NEW: Get user's accessible pages
```

#### Advanced Access Control Flow
1. Check if user is guest → Use `allow_guest` logic
2. Check global wiki settings (`disable_guest_access`)
3. **NEW**: Get user's `Wiki User Access` document (docstatus=1)
4. **NEW**: Retrieve enabled `Wiki Access` entries
5. **NEW**: Check `Wiki Space Access` for current page's space
6. **NEW**: Verify `visible=1` for view access
7. **NEW**: Verify `editable=1` for edit access (when `?editWiki=1`)
8. **NEW**: Filter sidebar based on user's accessible pages
9. Fallback to existing `allow_guest` logic if no custom access

#### Permission Matrix
| Visible | Editable | User Can |
|---------|----------|----------|
| ✅ | ✅ | View + Edit |
| ✅ | ❌ | View Only |
| ❌ | ✅ | Edit Only* |
| ❌ | ❌ | No Access |

*Note: Edit-only access is technically possible but rarely used.

#### Enhanced Security Features
- **URL Protection**: Blocks `?editWiki=1` for non-editable pages
- **API Protection**: Validates edit permissions on `update()` calls
- **Frontend Context**: Provides `user_can_edit` flag to templates
- **Sidebar Filtering**: Shows only accessible pages in navigation

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
get_sidebar_for_page(wiki_page)         # Get sidebar navigation (NEW: filtered by user access)
has_edit_permission(page_name=None)     # NEW: Enhanced with page-specific edit checks
```

### Authenticated APIs
```python
@frappe.whitelist()
update(name, content, title, ...)       # NEW: Enhanced with edit permission validation
approve(wiki_page_patch)                # Approve suggestions
delete_wiki_page(wiki_page_route)       # Delete pages
update_page_settings(name, settings)    # Update configuration
get_markdown_content(...)               # Get raw content
preview(original_code, new_code, name)  # Preview changes

# NEW ACCESS CONTROL APIs
get_user_accessible_pages(user=None, include_permissions=False)  # Get user's accessible pages
check_user_edit_permission(page_name, user=None)                # Check edit permission for specific page
```

### New API Usage Examples
```javascript
// Get accessible pages for current user
frappe.call({
    method: "wiki.wiki.doctype.wiki_page.wiki_page.get_user_accessible_pages"
})

// Get detailed permissions for all accessible pages
frappe.call({
    method: "wiki.wiki.doctype.wiki_page.wiki_page.get_user_accessible_pages",
    args: {include_permissions: true}
})
// Returns: {page1: {view: true, edit: false}, page2: {view: true, edit: true}}

// Check if user can edit specific page
frappe.call({
    method: "wiki.wiki.doctype.wiki_page.wiki_page.check_user_edit_permission",
    args: {page_name: "page_id"}
})

// Enhanced edit permission check with page context
frappe.call({
    method: "wiki.wiki.doctype.wiki_page.wiki_page.has_edit_permission",
    args: {page_name: "page_id"}  // Optional - checks specific page permissions
})
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

### Environment Variables (NEW)

#### `WIKI_DEBUG_ONLY=1`
**Purpose**: Suppress Flask/Werkzeug system debug messages, showing only custom wiki debug output.

**Usage:**
```bash
# Enable custom debug output only
export WIKI_DEBUG_ONLY=1

# Or run inline
WIKI_DEBUG_ONLY=1 python your_app.py
```

**Debug Output Examples:**
```
WIKI DEBUG: Getting accessible pages for user: user@example.com
WIKI DEBUG: Found 2 enabled Wiki Access entries
WIKI DEBUG: Processing Wiki Space Access: 1 for space: documentation
WIKI DEBUG: Found 5 visible pages in space access 1
WIKI DEBUG: Page guide-1 permissions: view=True, edit=False
WIKI DEBUG: Page guide-2 permissions: view=True, edit=True
WIKI DEBUG: Edit mode requested for page tq67am75a1
WIKI DEBUG: Edit permission granted: False
WIKI DEBUG: Edit access denied for page tq67am75a1
```

### Enhanced Debug System (NEW)
```python
# Custom logger with colored output
wiki_logger = logging.getLogger('wiki.debug')
wiki_logger.setLevel(logging.DEBUG)

# Color-coded debug messages
class DebugColors:
    RED = '\033[91m'      # Errors, denials
    GREEN = '\033[92m'    # Success, matches
    YELLOW = '\033[93m'   # Default debug messages
    BLUE = '\033[94m'     # User information
    MAGENTA = '\033[95m'  # Wiki spaces
    CYAN = '\033[96m'     # Permissions, counts
    END = '\033[0m'       # Reset color

def debug_print(message, color=DebugColors.YELLOW):
    """Print colored debug message using custom logger"""
    formatted_message = f"{color}{message}{DebugColors.END}"
    wiki_logger.debug(formatted_message)
```

### Access Control Setup Process (NEW)

1. **Create Wiki User Access** documents for users requiring custom access
2. **Submit documents** (docstatus=1 required for activation)
3. **Add Wiki Access entries** linking to Wiki Space Access documents
4. **Configure Wiki Space Access** with specific page permissions
5. **Set visible/editable flags** for each page as needed

**Example Setup:**
```python
# 1. Create Wiki User Access for user
user_access = frappe.new_doc("Wiki User Access")
user_access.user = "user@example.com"
user_access.insert()
user_access.submit()  # Important: Must be submitted

# 2. Create Wiki Space Access for a documentation space
space_access = frappe.new_doc("Wiki Space Access")
space_access.title = "Developer Documentation Access"
space_access.wiki_space = "developer-docs"
# Add pages to access_list with visible=1, editable=0 for read-only
space_access.insert()
space_access.submit()

# 3. Link them via Wiki Access
user_access.append("wiki_access_list", {
    "wiki_space_access": space_access.name,
    "enabled": 1
})
user_access.save()
```

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

---

## 📋 Changes Summary (Since Commit 97361de)

### Commits Applied
- `ee5219f` - Customized documentation for each user based on wiki space access
- `528f78d` - Minimizing system debug info with export WIKI_DEBUG_ONLY=1
- `5bdb0dd` - Colored debug
- `123f4c3` - Checking user access
- `64e57a2` - Optimize
- `461e6a1` - Updated func

### Files Modified
```
wiki/wiki/doctype/wiki_page/wiki_page.py              # Core access control logic (Major changes)
wiki/wiki/doctype/wiki_page_access/wiki_page_access.json  # Added 'editable' field
wiki/wiki/doctype/wiki_access/wiki_access.json        # Enhanced child table structure
wiki/wiki/doctype/wiki_space_access/wiki_space_access.json # Access list configuration
wiki/wiki/doctype/wiki_user_access/wiki_user_access.json   # User access container
wiki/wiki/doctype/wiki_page/README.md                 # Updated documentation (This file)
```

### Key Code Changes

#### 1. Enhanced Permission System
```python
# NEW METHODS ADDED
def get_user_accessible_pages(self, user, return_permissions=False)
def check_user_edit_permission(self, user)

# ENHANCED EXISTING METHODS  
def verify_permission(self)      # Added edit permission checks for ?editWiki=1
def check_user_access(self, user) # Enhanced with custom access control
def get_context(self, context)   # Added user_can_edit context
def get_sidebar_items(self)      # Added user-based filtering
```

#### 2. New API Endpoints
```python
@frappe.whitelist()
def get_user_accessible_pages(user=None, include_permissions=False)

@frappe.whitelist()  
def check_user_edit_permission(page_name, user=None)

# Enhanced existing endpoint
def has_edit_permission(page_name=None)  # Now supports page-specific checks
def update(...)  # Now validates edit permissions before processing
```

#### 3. Debug System Implementation
```python
# Custom logger setup
wiki_logger = logging.getLogger('wiki.debug')

# Environment-controlled debug filtering
if os.getenv('WIKI_DEBUG_ONLY', '0') == '1':
    logging.getLogger('werkzeug').setLevel(logging.WARNING)

# Colored debug output system
class DebugColors: ...
def debug_print(message, color=DebugColors.YELLOW): ...
```

### Breaking Changes
**None** - All changes are backward compatible. Existing users will continue to work with the original `allow_guest` logic until they set up custom access control.

### Migration Requirements
1. **No immediate action required** - System works with existing data
2. **Optional**: Create `Wiki User Access` documents for users needing custom access
3. **Optional**: Configure `Wiki Space Access` and `Wiki Page Access` for granular control
4. **Optional**: Set `WIKI_DEBUG_ONLY=1` environment variable for cleaner debug output

### Performance Impact
- **Minimal overhead** for users without custom access control
- **Additional queries** only for users with `Wiki User Access` documents
- **Sidebar caching** maintained with access control integration
- **Smart fallbacks** ensure fast performance for standard use cases

### Security Enhancements
- **Multi-layer protection** against unauthorized editing
- **Explicit permission model** requiring visible=1 for access
- **API-level validation** on all content modification endpoints
- **URL parameter protection** blocking edit mode for non-editable pages

### Future Roadmap
- **Group-based access control** for easier permission management
- **Inheritance patterns** for automatic permission propagation  
- **Time-based access** for temporary permissions
- **Access analytics** and audit trails
- **Bulk permission tools** for large-scale deployments

This comprehensive access control system transforms the Wiki from a simple shared platform into a sophisticated multi-tenant documentation system, enabling organizations to provide personalized, secure documentation experiences for different user groups while maintaining full backward compatibility.