import ballerina/os;

// payments-db (postgres-cnpg), via workload.yaml's envBindings.
configurable string dbHost = os:getEnv("PAYMENTS_DB_HOST");
configurable string dbPort = os:getEnv("PAYMENTS_DB_PORT");
configurable string dbName = os:getEnv("PAYMENTS_DB_DBNAME");
configurable string dbUser = os:getEnv("PAYMENTS_DB_USER");
configurable string dbPassword = os:getEnv("PAYMENTS_DB_PASSWORD");

// external: internal-payments-api, sms-service, email-service.
configurable string paymentApiBaseUrl = os:getEnv("PAYMENT_API_BASE_URL");
configurable string smsServiceUrl = os:getEnv("SMS_SERVICE_URL");
configurable string emailServiceBaseUrl = os:getEnv("EMAIL_SERVICE_BASE_URL");
