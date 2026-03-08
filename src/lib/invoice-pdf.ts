interface InvoiceData {
  invoiceNumber: string;
  date: string;
  periodStart: string;
  periodEnd: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  businessName: string;
  packageName: string;
  billingPeriod: string;
  amount: string;
  paymentMethod: string;
  transactionId: string;
  status: string;
}

export function generateInvoicePDF(data: InvoiceData) {
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a2e; background: #fff; }
  .invoice { max-width: 800px; margin: 0 auto; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #0ea5e9; }
  .brand { font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #0ea5e9, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.5px; }
  .brand-sub { font-size: 11px; color: #64748b; margin-top: 4px; }
  .invoice-title { text-align: right; }
  .invoice-title h2 { font-size: 32px; font-weight: 800; color: #0f172a; letter-spacing: -1px; }
  .invoice-title .number { font-size: 13px; color: #64748b; margin-top: 4px; font-family: monospace; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 35px; }
  .meta-box { padding: 20px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0; }
  .meta-box h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 10px; font-weight: 600; }
  .meta-box p { font-size: 13px; color: #334155; line-height: 1.8; }
  .meta-box .name { font-size: 15px; font-weight: 700; color: #0f172a; }
  .table-wrap { margin-bottom: 30px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
  table { width: 100%; border-collapse: collapse; }
  thead { background: #0f172a; }
  th { padding: 14px 20px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #fff; font-weight: 600; }
  th:last-child { text-align: right; }
  td { padding: 16px 20px; font-size: 13px; color: #334155; border-bottom: 1px solid #f1f5f9; }
  td:last-child { text-align: right; font-weight: 600; }
  .desc { font-weight: 600; color: #0f172a; }
  .desc-sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }
  .total-section { display: flex; justify-content: flex-end; margin-bottom: 30px; }
  .total-box { width: 280px; }
  .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #64748b; }
  .total-row.grand { padding: 14px 16px; background: linear-gradient(135deg, #0ea5e9, #06b6d4); border-radius: 10px; color: #fff; font-size: 16px; font-weight: 800; margin-top: 8px; }
  .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .status-paid { background: #dcfce7; color: #16a34a; }
  .status-pending { background: #fef9c3; color: #ca8a04; }
  .payment-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 35px; }
  .pay-item { padding: 12px 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
  .pay-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 600; }
  .pay-value { font-size: 13px; color: #0f172a; font-weight: 600; margin-top: 4px; }
  .footer { text-align: center; padding-top: 25px; border-top: 1px solid #e2e8f0; }
  .footer p { font-size: 11px; color: #94a3b8; line-height: 1.8; }
  .footer .thanks { font-size: 14px; color: #0ea5e9; font-weight: 700; margin-bottom: 8px; }
  @media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
</style>
</head>
<body>
<div class="invoice">
  <div class="header">
    <div>
      <div class="brand">Arodx</div>
      <div class="brand-sub">Digital Growth Agency</div>
    </div>
    <div class="invoice-title">
      <h2>INVOICE</h2>
      <div class="number">${data.invoiceNumber}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-box">
      <h4>Bill To</h4>
      <p class="name">${data.customerName}</p>
      <p>${data.customerEmail || ""}</p>
      <p>${data.customerPhone}</p>
      <p>${data.businessName}</p>
    </div>
    <div class="meta-box">
      <h4>Invoice Details</h4>
      <p><strong>Date:</strong> ${formatDate(data.date)}</p>
      <p><strong>Period:</strong> ${formatDate(data.periodStart)} — ${formatDate(data.periodEnd)}</p>
      <p><strong>Status:</strong> <span class="status-badge ${data.status === "paid" ? "status-paid" : "status-pending"}">${data.status === "paid" ? "PAID" : "PENDING"}</span></p>
    </div>
  </div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Period</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="desc">${data.packageName} Package</div>
            <div class="desc-sub">${data.billingPeriod === "monthly" ? "Monthly" : "Yearly"} Subscription</div>
          </td>
          <td>${data.billingPeriod === "monthly" ? "1 Month" : "1 Year"}</td>
          <td>${data.amount}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="total-section">
    <div class="total-box">
      <div class="total-row">
        <span>Subtotal</span>
        <span>${data.amount}</span>
      </div>
      <div class="total-row">
        <span>Discount</span>
        <span>৳0</span>
      </div>
      <div class="total-row grand">
        <span>Total</span>
        <span>${data.amount}</span>
      </div>
    </div>
  </div>

  <div class="payment-info">
    <div class="pay-item">
      <div class="pay-label">Payment Method</div>
      <div class="pay-value">${data.paymentMethod}</div>
    </div>
    <div class="pay-item">
      <div class="pay-label">Transaction ID</div>
      <div class="pay-value">${data.transactionId}</div>
    </div>
  </div>

  <div class="footer">
    <p class="thanks">Thank you for your business! 🙏</p>
    <p>Arodx — Digital Growth Agency</p>
    <p>For any queries, contact us at support@arodx.com</p>
  </div>
</div>
</body>
</html>`;

  // Open in new window and trigger print
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}
