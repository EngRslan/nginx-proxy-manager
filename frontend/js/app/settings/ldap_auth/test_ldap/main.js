const Mn       = require('backbone.marionette');
const App      = require('../../../main');
const template = require('./main.ejs');

require('jquery-serializejson');
require('selectize');

module.exports = Mn.View.extend({
    template:  template,
    className: 'modal-dialog',

    ui: {
        form:     'form',
        buttons:  '.modal-footer button',
        cancel:   'button.cancel',
        save:     'button.save',
        alert:    '.alert'
    },

    events: {
        

        'click @ui.test': function (e) {
            e.preventDefault();


            if (!this.ui.form[0].checkValidity()) {
                $('<input type="submit">').hide().appendTo(this.ui.form).click().remove();
                return;
            }

            let view = this;
            let data = this.ui.form.serializeJSON();

            this.ui.buttons.prop('disabled', true).addClass('btn-disabled');
            App.Api.LDAP.test(data)
                .then(result => {
                    this.ui.alert.removeClass('alert-danger collapse').addClass('alert-success').html('LDAP Working Correctly');
                })
                .catch(err => {
                    this.ui.alert.removeClass('alert-success collapse').addClass('alert-danger').html(err.message);
                }).finally(()=>{
                    this.ui.buttons.prop('disabled', false).removeClass('btn-disabled');
                });
        }
    },

    onRender: function () {
        //this.ui.value.trigger('change');
    }
});
