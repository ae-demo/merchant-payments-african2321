import aep/payments_api.email_service;
import aep/payments_api.internal_payments;
import aep/payments_api.sms_service;

final internal_payments:Client internalPaymentsClient = check new (serviceUrl = joinUrl(paymentApiBaseUrl, "/v1"));
final sms_service:Client smsClient = check new (serviceUrl = joinUrl(smsServiceUrl, "/v1"));
final email_service:Client emailClient = check new (serviceUrl = joinUrl(emailServiceBaseUrl, "/v1"));
