frappe.ui.form.on('Wiki Space Access', {
    onload: function (frm) {
        // store the initial wiki_space value when form loads
        frm.old_wiki_space = frm.doc.wiki_space;
    },

    refresh: function (frm) {
    
        // Set query on 'page' field inside child table 'access_list'
        frm.set_query('page', 'access_list', function (doc, cdt, cdn) {
            return {
                query: 'wiki.wiki.doctype.wiki_space_access.wiki_space_access.fetch_page_simple_link',
                filters: {
                    wiki_space_route: frm.route_value || ""   // use stored value
                }
            };
        });
    },

    wiki_space: function (frm) {
        let new_value = frm.doc.wiki_space;
        let old_value = frm.old_wiki_space || null;

        // If value didn't change, just return
        if (new_value === old_value) {
            return;
        }

        // If access_list has rows, confirm before clearing
        if (frm.doc.access_list && frm.doc.access_list.length > 0) {
            frappe.confirm(
                'The access list will be cleared. Are you sure you want to proceed?',
                () => {
                    // ✅ User clicked Yes → clear access_list and continue
                    frm.clear_table("access_list");
                    frm.refresh_field("access_list");

                    fetch_wiki_space(frm);
                    frm.old_wiki_space = new_value; // update old value after confirm
                },
                () => {
                    // ❌ User clicked No → revert wiki_space to old value
                    frm.set_value("wiki_space", old_value);
                }
            );
        } else {
            // No access_list → just continue
            fetch_wiki_space(frm);
            frm.old_wiki_space = new_value; // update old value
        }
    }
});

// Helper function to fetch Wiki Space route
function fetch_wiki_space(frm) {
    frappe.db.get_doc('Wiki Space', frm.doc.wiki_space).then(doc => {
        console.log('Wiki Space Route:', doc.route);
    
        // Save route on the form
        frm.route_value = doc.route;

        // Re-run queries so child table gets updated with latest filter
        frm.refresh_field('access_list');
    });
}
