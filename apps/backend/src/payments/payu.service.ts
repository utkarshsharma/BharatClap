import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class PayuService {
  private readonly logger = new Logger(PayuService.name);
  private merchantKey: string;
  private salt: string;
  private baseUrl: string;
  private apiUrl: string;

  constructor(private configService: ConfigService) {
    this.merchantKey = this.configService.get<string>('app.payu.merchantKey') || '';
    this.salt = this.configService.get<string>('app.payu.salt') || '';

    const env = this.configService.get<string>('app.payu.env') || 'TEST';
    if (env === 'LIVE') {
      this.baseUrl = 'https://secure.payu.in/_payment';
      this.apiUrl = 'https://info.payu.in/merchant/postservice?form=2';
    } else {
      this.baseUrl = 'https://test.payu.in/_payment';
      this.apiUrl = 'https://test.payu.in/merchant/postservice?form=2';
    }
  }

  /**
   * Generate SHA-512 hash for payment initiation.
   * Formula: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt)
   */
  generatePaymentHash(params: {
    txnid: string;
    amount: string;
    productinfo: string;
    firstname: string;
    email: string;
    udf1?: string;
    udf2?: string;
    udf3?: string;
    udf4?: string;
    udf5?: string;
  }): string {
    const hashString = [
      this.merchantKey,
      params.txnid,
      params.amount,
      params.productinfo,
      params.firstname,
      params.email,
      params.udf1 || '',
      params.udf2 || '',
      params.udf3 || '',
      params.udf4 || '',
      params.udf5 || '',
      '', '', '', '', '',
      this.salt,
    ].join('|');

    return crypto.createHash('sha512').update(hashString).digest('hex');
  }

  /**
   * Verify PayU response using reverse hash.
   * Formula: sha512(salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
   */
  verifyPaymentResponse(params: {
    txnid: string;
    amount: string;
    productinfo: string;
    firstname: string;
    email: string;
    status: string;
    hash: string;
    udf1?: string;
    udf2?: string;
    udf3?: string;
    udf4?: string;
    udf5?: string;
    additionalCharges?: string;
  }): boolean {
    const parts = [
      this.salt,
      params.status,
      '', '', '', '', '',
      params.udf5 || '',
      params.udf4 || '',
      params.udf3 || '',
      params.udf2 || '',
      params.udf1 || '',
      params.email,
      params.firstname,
      params.productinfo,
      params.amount,
      params.txnid,
      this.merchantKey,
    ];

    // If additional charges exist, prepend them
    if (params.additionalCharges) {
      parts.unshift(params.additionalCharges);
    }

    const hashString = parts.join('|');
    const generatedHash = crypto.createHash('sha512').update(hashString).digest('hex');

    return generatedHash === params.hash;
  }

  /**
   * Generate auto-submit HTML form for PayU checkout.
   * This HTML is loaded in a WebView on mobile.
   */
  generateCheckoutHtml(params: {
    txnid: string;
    amount: string;
    productinfo: string;
    firstname: string;
    email: string;
    phone: string;
    surl: string;
    furl: string;
    udf1?: string;
  }): string {
    const hash = this.generatePaymentHash({
      txnid: params.txnid,
      amount: params.amount,
      productinfo: params.productinfo,
      firstname: params.firstname,
      email: params.email,
      udf1: params.udf1,
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0; padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f5f5f5;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh;
    }
    .loading { text-align: center; color: #666; font-size: 16px; }
    .spinner {
      width: 40px; height: 40px;
      border: 4px solid #eee; border-top-color: #FF6B00;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="loading">
    <div class="spinner"></div>
    <p>Opening payment gateway...</p>
  </div>
  <form id="payuForm" method="POST" action="${this.baseUrl}">
    <input type="hidden" name="key" value="${this.merchantKey}" />
    <input type="hidden" name="txnid" value="${params.txnid}" />
    <input type="hidden" name="amount" value="${params.amount}" />
    <input type="hidden" name="productinfo" value="${params.productinfo}" />
    <input type="hidden" name="firstname" value="${params.firstname}" />
    <input type="hidden" name="email" value="${params.email || 'customer@bharatclap.com'}" />
    <input type="hidden" name="phone" value="${params.phone}" />
    <input type="hidden" name="surl" value="${params.surl}" />
    <input type="hidden" name="furl" value="${params.furl}" />
    <input type="hidden" name="hash" value="${hash}" />
    <input type="hidden" name="udf1" value="${params.udf1 || ''}" />
    <input type="hidden" name="udf2" value="" />
    <input type="hidden" name="udf3" value="" />
    <input type="hidden" name="udf4" value="" />
    <input type="hidden" name="udf5" value="" />
  </form>
  <script>document.getElementById('payuForm').submit();</script>
</body>
</html>`;
  }

  /**
   * Server-side verify payment via PayU API.
   * Uses the verify_payment command.
   */
  async verifyPaymentAPI(txnid: string): Promise<any> {
    const hashString = `${this.merchantKey}|verify_payment|${txnid}|${this.salt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    const body = new URLSearchParams({
      key: this.merchantKey,
      command: 'verify_payment',
      var1: txnid,
      hash,
    });

    try {
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      const data = await res.json();
      this.logger.log(`PayU verify_payment response for ${txnid}: ${JSON.stringify(data)}`);
      return data;
    } catch (err: any) {
      this.logger.error(`PayU verify_payment failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * Initiate refund via PayU API.
   * Uses the cancel_refund_transaction command.
   */
  async initiateRefund(mihpayid: string, amount: number): Promise<any> {
    const tokenId = `refund_${Date.now()}`;
    const hashString = `${this.merchantKey}|cancel_refund_transaction|${mihpayid}|${this.salt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    // Amount in rupees for PayU
    const amountInRupees = (amount / 100).toFixed(2);

    const body = new URLSearchParams({
      key: this.merchantKey,
      command: 'cancel_refund_transaction',
      var1: mihpayid,
      var2: tokenId,
      var3: amountInRupees,
      hash,
    });

    try {
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      const data = await res.json();
      this.logger.log(`PayU refund response: ${JSON.stringify(data)}`);
      return { id: tokenId, ...data };
    } catch (err: any) {
      this.logger.error(`PayU refund failed: ${err.message}`);
      // In dev/test mode, return a mock refund
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn('Returning mock refund in development mode');
        return { id: tokenId, status: 1, msg: 'mock_refund' };
      }
      throw err;
    }
  }

  /**
   * Make a UPI Collect payment via S2S API (test mode only).
   * In test mode with VPA "anything@payu", this auto-succeeds without user approval.
   */
  async makeS2SPayment(params: {
    txnid: string;
    amount: string;
    productinfo: string;
    firstname: string;
    email: string;
    phone: string;
    surl: string;
    furl: string;
    udf1?: string;
  }): Promise<any> {
    const hash = this.generatePaymentHash({
      txnid: params.txnid,
      amount: params.amount,
      productinfo: params.productinfo,
      firstname: params.firstname,
      email: params.email,
      udf1: params.udf1,
    });

    const body = new URLSearchParams({
      key: this.merchantKey,
      txnid: params.txnid,
      amount: params.amount,
      productinfo: params.productinfo,
      firstname: params.firstname,
      email: params.email || 'customer@bharatclap.com',
      phone: params.phone || '9999999999',
      surl: params.surl,
      furl: params.furl,
      hash,
      pg: 'UPI',
      bankcode: 'UPI',
      vpa: 'anything@payu',
      txn_s2s_flow: '4',
      udf1: params.udf1 || '',
      udf2: '',
      udf3: '',
      udf4: '',
      udf5: '',
    });

    try {
      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      const data = await res.json();
      this.logger.log(`PayU S2S payment response for ${params.txnid}: ${JSON.stringify(data)}`);
      return data;
    } catch (err: any) {
      this.logger.error(`PayU S2S payment failed: ${err.message}`);
      throw err;
    }
  }

  /** Returns true if running in test mode */
  isTestMode(): boolean {
    return this.baseUrl.includes('test.payu.in');
  }

  /** Get the merchant key (safe to expose to client) */
  getMerchantKey(): string {
    return this.merchantKey;
  }
}
