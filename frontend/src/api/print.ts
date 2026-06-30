import { api } from "./client";

export interface ReceiptData {
  docType: "ticket" | "factura";
  docNumber: string;
  stationName?: string;
  stationRuc?: string;
  shiftId?: string;
  pumpName: string;
  fuelType: string;
  volumeGal: number;
  unitPrice: number;
  totalAmount: number;
  paymentType: string;
  cashierName?: string;
  clientName?: string;
  clientRuc?: string;
  dateTime?: string;
}

const FUEL_LABELS: Record<string, string> = {
  "Regular Unleaded": "Gasolina Regular 87",
  "Premium Unleaded": "Gasolina Super Premium 93",
  Diesel: "Diesel B5",
  Kerosene: "Queroseno",
};

export function printReceiptWindow(r: ReceiptData): void {
  const now = r.dateTime ||
    new Date().toLocaleString("es-GT", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  const fuelLabel = FUEL_LABELS[r.fuelType] || r.fuelType;
  const docLabel = r.docType === "factura"
    ? "FACTURA ELECTRÓNICA"
    : "BOLETA DE VENTA";
  const stName = r.stationName || "GASNOVA OUTLET";
  const stRuc = r.stationRuc || "20459871402";

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${docLabel} ${r.docNumber}</title>
  <style>
    @page { size: 80mm auto; margin: 2mm 3mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 10pt;
      width: 76mm;
      color: #000;
    }
    .center  { text-align: center; }
    .right   { text-align: right; }
    .bold    { font-weight: bold; }
    .xl      { font-size: 13pt; font-weight: 900; }
    .divider { border-top: 1px dashed #000; margin: 3px 0; }
    .divider-solid { border-top: 1px solid #000; margin: 3px 0; }
    .row     { display: flex; justify-content: space-between; }
    .mt      { margin-top: 4px; }
    .mb      { margin-bottom: 4px; }
    .block   { display: block; }
    .total-row { font-size: 12pt; font-weight: 900; }
  </style>
</head>
<body>
  <div class="center bold mt mb">⛽ ${stName}</div>
  <div class="center" style="font-size:8pt">R.U.C. ${stRuc} · ESTACIÓN DE SERVICIO</div>
  <div class="divider-solid mt"></div>
  <div class="center bold mb">${docLabel}</div>
  <div class="center mb">N° ${r.docNumber}</div>
  <div class="divider"></div>
  <div class="row"><span>FECHA:</span><span>${now}</span></div>
  <div class="row"><span>SURTIDOR:</span><span>${r.pumpName}</span></div>
  ${r.shiftId ? `<div class="row"><span>TURNO:</span><span>${r.shiftId}</span></div>` : ""}
  ${r.cashierName ? `<div class="row"><span>CAJERO:</span><span>${r.cashierName}</span></div>` : ""}
  <div class="divider"></div>
  ${r.docType === "factura" && r.clientName ? `
  <div class="block bold">CLIENTE:</div>
  <div class="block">${r.clientName}</div>
  ${r.clientRuc ? `<div class="row"><span>RUC:</span><span>${r.clientRuc}</span></div>` : ""}
  <div class="divider"></div>
  ` : ""}
  <div class="block bold mb">PRODUCTO:</div>
  <div class="block mb">${fuelLabel}</div>
  <div class="divider"></div>
  <div class="row"><span>GALONES:</span><span>${r.volumeGal.toFixed(3)} Gal</span></div>
  <div class="row"><span>PRECIO/GAL:</span><span>$${r.unitPrice.toFixed(3)}</span></div>
  <div class="divider"></div>
  <div class="row total-row mt mb"><span>TOTAL:</span><span>$${r.totalAmount.toFixed(2)}</span></div>
  <div class="row"><span>FORMA PAGO:</span><span>${r.paymentType}</span></div>
  <div class="divider-solid mt mb"></div>
  <div class="center mb">¡Gracias por su preferencia!</div>
  <div class="center" style="font-size:8pt">Conserve este comprobante</div>
  <div class="center" style="font-size:7pt; margin-top:3px; color:#555">Representación impresa de comprobante electrónico</div>
  <br><br>
</body>
</html>`;

  const w = window.open(
    "",
    "_blank",
    "width=320,height=600,scrollbars=no,toolbar=no,menubar=no",
  );
  if (!w) {
    alert("Permita las ventanas emergentes para imprimir el comprobante.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.onload = () => {
    w.focus();
    w.print();
  };
}

export async function printReceiptWithFallback(
  r: ReceiptData,
): Promise<void> {
  const backendRes = await api.printReceipt({
    doc_type: r.docType,
    doc_number: r.docNumber,
    shift_id: r.shiftId,
    pump_name: r.pumpName,
    fuel_type: r.fuelType,
    volume_gal: r.volumeGal,
    unit_price: r.unitPrice,
    total_amount: r.totalAmount,
    payment_type: r.paymentType,
    cashier_name: r.cashierName,
    client_name: r.clientName,
    client_ruc: r.clientRuc,
  });
  if (!backendRes.ok) {
    printReceiptWindow(r);
  }
}
