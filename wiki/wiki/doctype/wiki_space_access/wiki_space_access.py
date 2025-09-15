import frappe
from frappe import _
from frappe.model.document import Document
import json


class WikiSpaceAccess(Document):
    pass

@frappe.whitelist()
def fetch_page_simple_link(doctype, txt, searchfield, start, page_len, filters):
    if isinstance(filters, str):
        filters = json.loads(filters)
    wiki_space_route = filters.get("wiki_space_route")
    if not wiki_space_route:
        frappe.throw(_("Please set Wiki Space route first"))

    wiki_pages = frappe.get_all(
        "Wiki Page",
        filters={
            "route": ["like", f"{wiki_space_route}/%"],
            "published": 1,
            "title": ["like", f"%{txt}%"] if txt else ["!=", ""]
        },
        fields=["name", "title"],
        order_by="title asc",
        limit_start=int(start),           # use limit_start for pagination
        limit_page_length=int(page_len), # and page length
    )

    # Return in the format [name, title] expected by Link queries
    return [[page.name, page.title] for page in wiki_pages]
