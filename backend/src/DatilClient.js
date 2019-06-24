const { postRequest } = require('./HTTPClient.js');
const { validarDatilConfig } = require('facturacion_common/src/Validacion.js');
const config = require('../../datil.config.js');
const { calcularValoresTotales } = require('facturacion_common/src/Math.js');
const Money = require('facturacion_common/src/Money.js');

const host = 'https://link.datil.co';
const codigosId = {
  ruc: '04',
  cedula: '05',
  consumidor_final: '07'
};
const IVA = 2;
const IVA_0p = 0;
const IVA_12p = 2;

const IVA_ACTUAL = IVA_12p;

const calcularIVA = (valor, codigo) => {
  if (codigo === IVA_ACTUAL) return Math.floor((valor * 12) / 100);

  // 0 IVA
  return 0;
};

const r = validarDatilConfig(config);
if (r.errors) {
  const [primerError] = Object.values(r.errors);
  console.error(
    'Error de configuración Datil. %s.\n\nPor favor revisa el archivo ',
    primerError,
    require.resolve('../../datil.config.js')
  );
  process.exit(1);
}

const crearImpuestos = params => {
  const { isExamen, impuestos, rebaja, subtotal, flete } = params;
  if (isExamen)
    return [
      {
        codigo: IVA,
        codigo_porcentaje: IVA_0p,
        base_imponible: Money.printFloat(subtotal - rebaja + flete),
        valor: 0
      }
    ];

  const impuestoPorIVA = {
    codigo: IVA,
    codigo_porcentaje: IVA_ACTUAL,
    base_imponible: Money.printFloat(subtotal - rebaja),
    valor: Money.printFloat(impuestos)
  };

  if (flete)
    return [
      impuestoPorIVA,
      {
        codigo: IVA,
        codigo_porcentaje: IVA_0p,
        base_imponible: Money.printFloat(flete),
        valor: 0
      }
    ];

  return [impuestoPorIVA];
};

const crearTotales = (ventaRow, isExamen) => {
  const { subtotal, flete } = ventaRow;
  const { rebaja, impuestos, total } = calcularValoresTotales(
    subtotal,
    flete,
    ventaRow.iva,
    ventaRow.descuento
  );

  return {
    totales_sin_impuestos: Money.printFloat(subtotal + flete),
    descuento_adicional: Money.printFloat(rebaja),
    descuento: Money.printFloat(rebaja),
    propina: 0,
    importe_total: Money.printFloat(total),
    impuestos: crearImpuestos({ subtotal, flete, rebaja, impuestos, isExamen })
  };
};

const crearComprador = clienteRow => {
  return {
    razon_social: clienteRow.nombre,
    identificacion: clienteRow.id,
    tipo_identificacion: codigosId[clienteRow.tipo],
    email: clienteRow.email,
    telefono: clienteRow.telefono1,
    direccion: clienteRow.direccion
  };
};

const crearImpuestosParaItem = (item, importe) => {
  if (item.pagaIva)
    return [
      {
        codigo: IVA,
        codigo_porcentaje: IVA_ACTUAL,
        base_imponible: Money.printFloat(importe),
        valor: Money.printFloat(calcularIVA(importe, IVA_ACTUAL))
      }
    ];

  return [
    {
      codigo: IVA,
      codigo_porcentaje: IVA_0p,
      base_imponible: Money.printFloat(importe),
      valor: 0
    }
  ];
};

const crearNombreDetallado = item => {
  if (item.lote)
    return `${item.nombre} MARCA: ${item.marca} LOTE: ${item.lote} REG. SAN: ${
      item.codigo
    } FECHA: ${item.fechaExp}`;

  return `${item.nombre} MARCA: ${item.marca} REG. SAN: ${item.codigo} FECHA: ${
    item.fechaExp
  }`;
};

const crearItemFlete = valor => ({
  nombre: 'Manejo de carga',
  marca: '',
  codigo: '',
  fecha: '',
  pagaIva: false,
  count: 1,
  precioVenta: valor
});

const crearItems = ({ unidades, detallado, flete }) => {
  const src = flete ? [...unidades, crearItemFlete(flete)] : unidades;
  return src.map(item => {
    const importe = item.count * item.precioVenta;
    const descripcion = detallado ? crearNombreDetallado(item) : item.nombre;
    return {
      descripcion,
      cantidad: item.count,
      precio_unitario: Money.printFloat(item.precioVenta),
      precio_total_sin_impuestos: Money.printFloat(importe),
      impuestos: crearImpuestosParaItem(item, importe)
    };
  });
};

const crearPagos = pagos =>
  pagos.map(p => ({
    medio: p.formaPago,
    total: Money.printFloat(p.valor)
  }));

const ventaToReqBody = venta => {
  const EMISION_NORMAL = 1;
  const {
    comprobanteRow,
    clienteRow,
    unidades,
    ventaRow,
    pagos,
    paciente
  } = venta;
  const items = crearItems({
    unidades,
    flete: ventaRow.flete,
    detallado: ventaRow.detallado
  });

  return {
    secuencial: comprobanteRow.secuencial,
    emisor: config.emision.emisor,
    moneda: config.emision.moneda,
    ambiente: config.emision.ambiente,
    totales: crearTotales(ventaRow, !!paciente),
    comprador: crearComprador(clienteRow),
    tipo_emision: EMISION_NORMAL,
    items,
    pagos: crearPagos(pagos)
  };
};

const emitirFactura = venta => {
  const body = ventaToReqBody(venta);
  return postRequest({
    host,
    path: '/invoices/issue',
    headers: [
      { key: 'X-Key', value: config.apiKey },
      { key: 'X-Password', value: config.password }
    ],
    body
  });
};

module.exports = {
  emitirFactura
};