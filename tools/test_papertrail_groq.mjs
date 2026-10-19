import assert from "node:assert/strict";
import { z } from "zod";

import {
  createGroqClient,
  DEFAULT_GROQ_MODEL,
  verifyModelAvailability,
} from "../server/papertrail/groq.mjs";

function response(data, status = 200) {
  return {
    ok: status >= 200 && status < 400,
    status,
    async text() {
      return typeof data === "string" ? data : JSON.stringify(data);
    },
  };
}

const OUTPUT_SCHEMA = z.object({ answer: z.string().min(1) });

async function testMissingKey() {
  let calls = 0;
  const result = await verifyModelAvailability({
    apiKey: "",
    model: DEFAULT_GROQ_MODEL,
    fetchImpl: async () => { calls += 1; return response({ data: [] }); },
  });
  assert.equal(result.status, "missing_key");
  assert.equal(calls, 0, "missing credentials must not make a provider request");
}

async function testModelVerificationAndStrictFallback() {
  const requests = [];
  let completionCalls = 0;
  const secret = "groq-test-secret-not-returned";
  const fetchImpl = async (url, init) => {
    const body = init?.body ? JSON.parse(init.body) : null;
    requests.push({ url: String(url), body, authorization: init?.headers?.Authorization });
    if (String(url).endsWith("/models")) {
      return response({ data: [{ id: DEFAULT_GROQ_MODEL, supported_parameters: ["response_format"] }] });
    }
    completionCalls += 1;
    if (body.response_format?.type === "json_schema") {
      return response({ error: { message: "response_format json_schema is unavailable" } }, 400);
    }
    return response({ choices: [{ message: { content: JSON.stringify({ answer: "bounded output" }) } }] });
  };

  const client = createGroqClient({ apiKey: secret, fetchImpl, retryLimit: 0, timeoutMs: 1_000 });
  const availability = await client.verifyModelAvailability({ force: true });
  assert.equal(availability.status, "available");
  assert.equal(availability.model, DEFAULT_GROQ_MODEL);
  const output = await client.generateStructured({
    schema: OUTPUT_SCHEMA,
    schemaName: "test_output",
    messages: [{ role: "user", content: "Return one answer." }],
  });
  assert.deepEqual(output, { answer: "bounded output" });
  assert.equal(completionCalls, 2, "one strict attempt plus one bounded JSON fallback");
  assert.ok(requests.some((request) => request.authorization === `Bearer ${secret}`));
  assert.equal(JSON.stringify(output).includes(secret), false);
}

async function testRateLimitAndMalformedCatalogue() {
  const limited = await verifyModelAvailability({
    apiKey: "test-key",
    fetchImpl: async () => response({ error: { message: "slow down" } }, 429),
    retryLimit: 0,
  });
  assert.equal(limited.status, "rate_limited");

  const malformed = await verifyModelAvailability({
    apiKey: "test-key",
    fetchImpl: async () => response({ nope: true }),
    retryLimit: 0,
  });
  assert.equal(malformed.status, "provider_http_error");
  assert.match(malformed.message, /no model list/i);
}

await testMissingKey();
await testModelVerificationAndStrictFallback();
await testRateLimitAndMalformedCatalogue();
console.log("PaperTrail Groq tests passed: missing key, model verification, strict fallback, rate limits, malformed catalogue, and secret boundary.");
