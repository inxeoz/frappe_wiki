# article.py
import frappe
from frappe.website.website_generator import WebsiteGenerator

class Article(WebsiteGenerator):
    pass

def get_context(context):
    """
    Called by Frappe when rendering web view for Article.
    - If a name/route is provided, show single doc.
    - Otherwise produce a list/index of published articles.
    """
    # get route or name from request
    route = frappe.form_dict.get("route") or frappe.form_dict.get("name") or frappe.form_dict.get("article")
    if route:
        # try fetch by route first (if you use a 'route' field), else by name
        try:
            if frappe.db.exists("Article", {"route": route}):
                doc = frappe.get_doc("Article", {"route": route})
            else:
                doc = frappe.get_doc("Article", route)
        except frappe.DoesNotExistError:
            frappe.local.response["http_status_code"] = 404
            context.status_code = 404
            context.title = "Not found"
            context.doc = None
            return

        context.doc = doc
        context.meta = frappe.get_meta("Article")
        # simple related: other published articles
        context.related = frappe.get_all("Article",
                                        filters=[["Article","published","=",1],["Article","name","!=",doc.name]],
                                        fields=["name","title","route"],
                                        limit_page_length=5)
        # SEO: title, description
        context.title = doc.title
        context.description = (doc.content or "")[:160]
        return

    # Index / list view
    context.title = "Articles"
    context.articles = frappe.get_all("Article",
                                     filters={"published": 1},
                                     fields=["name", "title", "route"],
                                     order_by="creation desc",
                                     limit_page_length=50)
