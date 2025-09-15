frappe.ui.form.on('Wiki Space Access', {
    onload(frm) {
        frm.old_wiki_space = frm.doc.wiki_space;
        update_wiki_space_route(frm);
    },

    refresh(frm) {
        frm.set_query('page', 'access_list', () => ({
            query: 'wiki.wiki.doctype.wiki_space_access.wiki_space_access.fetch_page_simple_link',
            filters: {
                wiki_space_route: frm.route_value || ""
            }
        }));
    },

    wiki_space(frm) {
        const new_value = frm.doc.wiki_space;
        const old_value = frm.old_wiki_space || null;

        if (new_value === old_value) return;

        const proceed = () => {
            frm.clear_table("access_list");
            frm.refresh_field("access_list");
            update_wiki_space_route(frm);
            frm.old_wiki_space = new_value;
        };

        if (frm.doc.access_list?.length > 0) {
            frappe.confirm(
                'The access list will be cleared. Are you sure you want to proceed?',
                proceed,
                () => frm.set_value("wiki_space", old_value)
            );
        } else {
            proceed();
        }
    }
});

// Helper to fetch and store Wiki Space route
function update_wiki_space_route(frm) {
    if (!frm.doc.wiki_space) return;

    frappe.db.get_doc('Wiki Space', frm.doc.wiki_space).then(doc => {
        frm.route_value = doc.route || "";
        if (frm.route_value) {
            frm.refresh_field('access_list');
        }
    });
}
