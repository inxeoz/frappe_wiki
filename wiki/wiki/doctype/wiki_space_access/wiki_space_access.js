frappe.ui.form.on('Wiki Space Access', {
    refresh: function (frm) {
        // Show the current wiki_space link while refreshing
        if (frm.doc.wiki_space) {
            frappe.msgprint(`Current Wiki Space: ${frm.doc.wiki_space}`);
        }

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

        if (frm.doc.access_list) {

            frappe.confirm('access list will be cleared , Are you sure you want to proceed?',
                () => {
                    // action to perform if Yes is selected
                         frm.doc.access_list = []
                }, () => {
                    // action to perform if No is selected

                    return
                    
                })
       
        }

        frappe.db.get_doc('Wiki Space', frm.doc.wiki_space).then(doc => {
            console.log('Wiki Space Route:', doc.route);
            frappe.msgprint('Wiki Space Route: ' + doc.route);

            // save it on the form (not global variable)
            frm.route_value = doc.route;

            // re-run queries so child table gets updated with latest filter
            frm.refresh_field('access_list');
        });
    }
});
