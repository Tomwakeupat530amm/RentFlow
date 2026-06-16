/**
 * Script mock (giả lập) webhook POST request từ PayOS
 * Chạy lệnh: node scripts/mock_payos_webhook.js [orderCode] [amount] [status]
 */

const http = require('http');

const PORT = 3000;
const WEBHOOK_URL = `http://localhost:${PORT}/api/webhooks/payos`;

const args = process.argv.slice(2);
const orderCode = args[0] ? parseInt(args[0]) : Math.floor(Math.random() * 1000000);
const amount = args[1] ? parseInt(args[1]) : 5000000;
const status = args[2] || 'success';

console.log(`🚀 Bắt đầu gửi mock webhook đến: ${WEBHOOK_URL}`);
console.log(`📦 Order Code: ${orderCode} | Amount: ${amount} | Status: ${status}`);

const payload = {
    code: status === 'success' ? '00' : '01',
    desc: status === 'success' ? 'success' : 'failed',
    success: status === 'success',
    data: {
        orderCode: orderCode,
        amount: amount,
        description: `Thanh toan hoa don ${orderCode}`,
        accountNumber: "1122334455",
        reference: `REF${Date.now()}`,
        transactionDateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
        currency: "VND",
        paymentLinkId: `link_${orderCode}`,
        code: status === 'success' ? '00' : '01',
        desc: status === 'success' ? 'success' : 'failed',
        counterAccountBankId: "970436",
        counterAccountBankName: "Vietcombank",
        counterAccountName: "NGUYEN VAN A",
        counterAccountNumber: "0123456789",
        virtualAccountName: "RENTFLOW VN",
        virtualAccountNumber: "987654321"
    },
    signature: "mock_signature_for_dev_env"
};

const payloadString = JSON.stringify(payload);

const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadString)
    }
};

const req = http.request(WEBHOOK_URL, options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(`✅ Webhook phản hồi với status code: ${res.statusCode}`);
        try {
            const jsonResponse = JSON.parse(data);
            console.log('📄 Body phản hồi:', jsonResponse);
        } catch (e) {
            console.log('📄 Body phản hồi (text):', data);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Lỗi kết nối: ${e.message}`);
    console.error(`Gợi ý: Đảm bảo server Next.js đang chạy ở cổng ${PORT}.`);
});

req.write(payloadString);
req.end();
