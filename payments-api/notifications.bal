import aep/payments_api.email_service;
import aep/payments_api.sms_service;

import ballerina/log;

// Notifications are best-effort: a delivery failure never fails the payment,
// payout or payment-request operation it rides on -- it is only logged.

function notifyPaymentLinkShared(Merchant merchant, PaymentRequestRow request) {
    string? phone = merchant?.phone;
    if phone is string && phone.trim() != "" {
        sendSms(phone, string `Payment link for ${request.amount} ${request.currency} (${request.description}): ` +
            string `/payment-links/${request.linkToken}`);
    }
    sendEmail(merchant.email, "Your payment link is ready",
        string `Share this link with your customer to collect ${request.amount} ${request.currency}: ` +
            string `/payment-links/${request.linkToken}`);
}

function notifyPaymentSucceeded(Merchant merchant, PaymentRequestRow request, PaymentSubmission submission) {
    if submission.method == "mobile-money" {
        string? phone = submission?.phoneNumber;
        if phone is string && phone.trim() != "" {
            sendSms(phone, string `Payment of ${request.amount} ${request.currency} to ${merchant.businessName} succeeded.`);
        }
    }
    sendEmail(merchant.email, "Payment received",
        string `You received ${request.amount} ${request.currency} for "${request.description}".`);
}

function notifyPayoutRequested(Merchant merchant, Payout payout) {
    sendEmail(merchant.email, "Payout requested",
        string `Your payout of ${payout.amount} ${payout.currency} has been requested.`);
}

function sendSms(string to, string body) {
    sms_service:SendSmsRequest req = { to, body };
    sms_service:SmsMessage|error result = smsClient->/sms.post(req);
    if result is error {
        log:printWarn("sms-service delivery failed", 'error = result, to = to);
    }
}

function sendEmail(string to, string subject, string body) {
    email_service:SendEmailRequest req = { to, subject, body };
    email_service:EmailMessage|error result = emailClient->/emails.post(req);
    if result is error {
        log:printWarn("email-service delivery failed", 'error = result, to = to);
    }
}
