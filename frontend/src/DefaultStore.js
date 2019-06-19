const { NEW_FACTURA_PAGE } = require('../src/PageTypes.js');
const { CLIENTE_DIALOG } = require('../src/DialogTypes.js');

module.exports = {
  dialog: {
    value: CLIENTE_DIALOG,
    dialogParams: {
      editar: null,
      open: false
    }
  },
  snackbar: null,
  page: {
    type: NEW_FACTURA_PAGE,
    props: {}
  }
};
