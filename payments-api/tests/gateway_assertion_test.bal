// Tests for the gateway's signed assertion (gateway_assertion.bal), per the
// `ballerina` skill: a valid assertion is accepted, one signed by a different
// key is rejected, a tampered one is rejected, and a public resource needs no
// assertion at all. All four run against a throwaway RSA keypair -- nothing
// here talks to a real gateway or IdP.
import ballerina/crypto;
import ballerina/http;
import ballerina/jwt;
import ballerina/test;

final http:Client testClient = check new ("http://localhost:9090");

final crypto:PrivateKey trustedPrivateKey = check crypto:decodeRsaPrivateKeyFromKeyFile("tests/resources/trusted_key.pem");
final crypto:PrivateKey otherPrivateKey = check crypto:decodeRsaPrivateKeyFromKeyFile("tests/resources/other_key.pem");

const string TEST_ISSUER = "aep-gateway-test";

function mintAssertion(crypto:PrivateKey signingKey, string subject) returns string|error {
    jwt:IssuerConfig issuerConfig = {
        issuer: TEST_ISSUER,
        username: subject,
        expTime: 300,
        customClaims: {
            "scope": "merchants:read merchants:update openid",
            "username": subject,
            "ouHandle": "test-org"
        },
        signatureConfig: {
            algorithm: jwt:RS256,
            config: signingKey
        }
    };
    return jwt:issue(issuerConfig);
}

// A tampered token: flip a character in the payload segment so the signature
// no longer matches, without breaking the three-segment JWT shape.
function tamper(string token) returns string {
    string[] segments = re `\.`.split(token);
    string payload = segments[1];
    string flipped = (payload[0] == "e") ? "f" + payload.substring(1) : "e" + payload.substring(1);
    return segments[0] + "." + flipped + "." + segments[2];
}

@test:Config {}
function testValidAssertionIsAccepted() returns error? {
    string token = check mintAssertion(trustedPrivateKey, "merchant-1");
    http:Response response = check testClient->get("/me/merchant", {"x-jwt-assertion": token});
    // A verified caller reaches the handler -- never a 401. Whatever the
    // handler answers next (404 with no profile, or a 500 with no database in
    // this environment) is a downstream concern, not the assertion's.
    test:assertNotEquals(response.statusCode, 401, "a valid assertion must not be rejected");
}

@test:Config {}
function testWrongKeyAssertionIsUnauthorized() returns error? {
    string token = check mintAssertion(otherPrivateKey, "merchant-1");
    http:Response response = check testClient->get("/me/merchant", {"x-jwt-assertion": token});
    test:assertEquals(response.statusCode, 401, "an assertion signed by an untrusted key must be a 401");
}

@test:Config {}
function testTamperedAssertionIsUnauthorized() returns error? {
    string token = check mintAssertion(trustedPrivateKey, "merchant-1");
    http:Response response = check testClient->get("/me/merchant", {"x-jwt-assertion": tamper(token)});
    test:assertEquals(response.statusCode, 401, "a tampered assertion must be a 401, never an anonymous caller");
}

@test:Config {}
function testPublicResourceNeedsNoAssertion() returns error? {
    http:Response response = check testClient->get("/health");
    test:assertEquals(response.statusCode, 200, "a security:[] resource must serve a request with no assertion");
}
