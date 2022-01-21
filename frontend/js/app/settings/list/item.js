const Mn       = require('backbone.marionette');
const App      = require('../../main');
const template = require('./item.ejs');

module.exports = Mn.View.extend({
    template: template,
    tagName:  'tr',

    ui: {
        edit: 'a.edit',
        test_ldap : 'a.test-ldap'
    },

    events: {
        'click @ui.edit': function (e) {
            e.preventDefault();
            App.Controller.showSettingForm(this.model);
        },

        'click @ui.test_ldap': function(e){
            e.preventDefault();
            var testModel = Backbone.Model.extend({
                defaults: function () {
                    return {
                        username: '',
                        password: '',
                        
                    };
                }
            });
            App.Controller.showLDAPTestForm(new testModel())
        }
    },

    initialize: function () {
        this.listenTo(this.model, 'change', this.render);
    }
});
