import React, {Component} from 'react';
import DatePicker from 'material-ui/DatePicker';
import TextField from 'material-ui/TextField';

import AddShoppingCart from 'material-ui/svg-icons/action/add-shopping-cart';
import Info from 'material-ui/svg-icons/action/info';
import Loyalty from 'material-ui/svg-icons/action/loyalty';
import Payment from 'material-ui/svg-icons/action/payment';
import Person from 'material-ui/svg-icons/social/person';
import Receipt from 'material-ui/svg-icons/action/receipt';
import Today from 'material-ui/svg-icons/action/today';

import ClienteAutoComplete from './AutoComplete/ClienteAutoComplete'
import ProductoAutoComplete from './AutoComplete/ProductoAutoComplete'
import SelectedClienteChip from './SelectedClienteChip'
import IconBox from '../lib/IconBox'

const autoCompleteWidth = '425px'
const txtMargin = '35px'

export default class FacturaForm extends Component {

  renderClienteInput = (props) => {
    const {
      cliente,
      errors,
      onNewCliente,
    } = props

    if (cliente)
      return (
        <SelectedClienteChip text={cliente.nombre}
          onRequestDelete={() => {onNewCliente(null)}} />
      )
    else
      return (
        <ClienteAutoComplete width={autoCompleteWidth}
          errorText={errors.get('cliente')} onNewItemSelected={onNewCliente}/>
      )
  }

  render() {
    const {
      data,
      errors,
      onDataChanged,
    } = this.props


    return (
      <div style={{height: '130px'}}>
        <br />
        <div style={{display: 'block', marginBottom: '8px'}}>
          <IconBox icon={Person}/>
          { this.renderClienteInput(this.props) }
          <IconBox icon={AddShoppingCart}/>
          <ProductoAutoComplete width={autoCompleteWidth}
            onNewItemSelected={this.props.onNewProduct}/>
        </div>

        <table>
          <tr>

            <td>
              <IconBox icon={Receipt}/>
            </td>
            <td>
              <TextField
                hintText="Código" value={data.get('codigo')} errorText={errors.get('codigo')}
                onChange={(event) => onDataChanged('codigo', event.target.value)}
                style={{width: '140px', verticalAlign: 'top', marginRight: txtMargin}} />
            </td>

            <td>
              <IconBox icon={Today}/>
            </td>
            <td>
              <DatePicker
                hintText="Fecha" style={{display: 'inline-block'}}
                value={data.get('fecha')} errorText={errors.get('fecha')}
                onChange={(n, date) => onDataChanged('fecha', date)}
                textFieldStyle={{width:'140px', marginRight: txtMargin}} />
            </td>

            <td>
              <IconBox icon={Loyalty}/>
            </td>
            <td>
              <TextField
                hintText="Desc. %" value={data.get('descuento')}
                errorText={errors.get('descuento')}
                onChange={(event) => onDataChanged('descuento', event.target.value)}
                style={{width:'80px', marginRight: txtMargin}} />
            </td>

            <td>
              <IconBox icon={Payment}/>
            </td>
            <td>
              <TextField
                hintText="Forma de pago" value={data.get('formaPago')}
                errorText={errors.get('formaPago')}
                onChange={(event) => onDataChanged('formaPago', event.target.value)}
                style={{width:'140px', marginRight: txtMargin}} />
            </td>

            <td>
              <IconBox icon={Info}/>
            </td>
            <td>
              <TextField
                hintText="Autorización" value={data.get('autorizacion')}
                errorText={errors.get('autorizacion')}
                onChange={(event) => onDataChanged('autorizacion', event.target.value)}
                style={{ verticalAlign: 'top', width:'144px'}} />
            </td>
          </tr>
        </table>
      </div>
    );
  }
}

FacturaForm.propTypes = {
  icon: React.PropTypes.element,
}
