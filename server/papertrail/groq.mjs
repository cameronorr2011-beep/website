import { z } from "zod";

export const DEFAULT_GROQ_BASE_URL = "https://api.groq.com/openai/v1";
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";
export const LOWER_COST_GROQ_MODEL = "openai/gpt-oss-20b";
export const PREVIEW_GROQ_MODEL = "qwen/qwen3.8-27b";
export const STRICT_JSON_SCHEMA_DEFAULT_MODELS = Object.freeze([DEFAULT_GROQ_MODEL, LOWER_COST_GROQ_MODEL]);
export const DEFAULT_GROQ_TIMEOUT_MS = 30_000;
export const DEFAULT_GROQ_MAX_TOKENS = 4_096;
export const MAX_GROQ_RETRIES = 2;

function environment() {
  return typeof process !== "undefined" && process?.env ? process.env : {};
}

function finitePositive(value, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  const number = typeof value === "string" && value.trim() !== "" ? Number(value) : Number(value);
  if (!Number.isFinite(number) || number <= 0) return fallback;
  return Math.min(Math.trunc(number), maximum);
}

function retryLimit(value) {
  if (value === undefined || value === null || value === "") return MAX_GROQ_RETRIES;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.min(2, Math.trunc(number));
}

function nonEmptyString(value, fallback) {
  const text = value === undefined || value === null ? "" : String(value).trim();
  return text || fallback;
}

function resolveConfig(options = {}) {
  const env = environment();
  const apiKey = nonEmptyString(options.apiKey ?? env.GROQ_API_KEY, "");
  const baseUrl = nonEmptyString(options.baseUrl ?? env.GROQ_BASE_URL, DEFAULT_GROQ_BASE_URL).replace(/\/+$/, "");
  const model = nonEmptyString(options.model ?? env.GROQ_MODEL, DEFAULT_GROQ_MODEL);
  const timeoutMs = finitePositive(options.timeoutMs ?? env.GROQ_TIMEOUT_MS, DEFAULT_GROQ_TIMEOUT_MS, 10 * 60_000);
  const maxTokens = finitePositive(options.maxTokens ?? env.GROQ_MAX_TOKENS, DEFAULT_GROQ_MAX_TOKENS, 32_768);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  return {
    apiKey,
    baseUrl,
    model,
    timeoutMs,
    maxTokens,
    retryLimit: retryLimit(options.retryLimit),
    fetchImpl,
  };
}

function redact(value, secret) {
  const text = String(value ?? "");
  if (!secret) return text;
  return text.split(secret).join("[REDACTED]");
}

function safeErrorMessage(error, secret) {
  return redact(error instanceof Error ? error.message : String(error), secret).slice(0, 1_000);
}

function scrubError(error, secret) {
  if (error && typeof error.message === "string") error.message = safeErrorMessage(error, secret);
  return error;
}

function abortError(message = "Groq request aborted") {
  const error = new Error(message);
  error.name = "AbortError";
  error.code = "ABORT_ERR";
  error.status = "cancelled";
  error.retryable = false;
  return error;
}

function timeoutError() {
  const error = new Error("Groq request timed out");
  error.name = "TimeoutError";
  error.code = "ETIMEDOUT";
  error.status = "timeout";
  error.retryable = true;
  return error;
}

export class GroqClientError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = details.name ?? "GroqClientError";
    for (const [key, value] of Object.entries(details)) {
      if (key !== "name" && value !== undefined) this[key] = value;
    }
  }
}

class GroqProviderError extends GroqClientError {
  constructor(statusCode, message, details = {}) {
    super(message, {
      name: "GroqProviderError",
      statusCode,
      status: statusCode === 429 ? "rate_limited" : "provider_http_error",
      retryable: statusCode === 408 || statusCode === 425 || statusCode === 429 || statusCode >= 500,
      ...details,
    });
  }
}

class GroqOutputError extends GroqClientError {
  constructor(message, details = {}) {
    super(message, { name: "GroqOutputError", ...details });
  }
}

function isAbortSignal(signal) {
  return signal && typeof signal === "object" && typeof signal.aborted === "boolean";
}

function joinUrl(baseUrl, path) {
  return `${String(baseUrl).replace(/\/+$/, "")}/${String(path).replace(/^\/+/, "")}`;
}

function retryableError(error) {
  if (!error) return true;
  if (error.name === "AbortError" || error.code === "ABORT_ERR") return false;
  if (error.status === "cancelled") return false;
  if (error.status === "timeout" || error.code === "ETIMEDOUT") return true;
  if (error instanceof GroqProviderError) return Boolean(error.retryable);
  return true;
}

function statusForError(error) {
  if (error?.status === "cancelled" || error?.name === "AbortError" || error?.code === "ABORT_ERR") return "cancelled";
  if (error?.status === "timeout" || error?.name === "TimeoutError" || error?.code === "ETIMEDOUT") return "timeout";
  if (error?.status === "rate_limited" || error?.statusCode === 429) return "rate_limited";
  if (error?.status === "provider_http_error" || Number.isFinite(error?.statusCode)) return "provider_http_error";
  return "provider_http_error";
}

function retryPayload(error, operation, attempt, maxRetries) {
  return {
    operation,
    attempt,
    maxRetries,
    status: statusForError(error),
    httpStatus: Number.isFinite(error?.statusCode) ? error.statusCode : undefined,
  };
}

function waitForRetry(milliseconds, signal) {
  if (isAbortSignal(signal) && signal.aborted) return Promise.reject(abortError());
  return new Promise((resolve, reject) => {
    let timer;
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    timer = setTimeout(() => {
      if (isAbortSignal(signal)) signal.removeEventListener("abort", onAbort);
      resolve();
    }, milliseconds);
    if (isAbortSignal(signal)) signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function fetchWithDeadline(fetchImpl, url, init, timeoutMs, signal) {
  if (typeof fetchImpl !== "function") {
    throw new GroqClientError("No fetch implementation is available", { code: "FETCH_UNAVAILABLE", status: "provider_http_error" });
  }
  if (isAbortSignal(signal) && signal.aborted) throw abortError();

  const controller = new AbortController();
  let timer;
  let abortListener;
  let timedOut = false;
  let externallyAborted = false;
  const requestPromise = Promise.resolve().then(() => fetchImpl(url, { ...init, signal: controller.signal }));
  requestPromise.catch(() => {});

  const deadlinePromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
      reject(timeoutError());
    }, timeoutMs);
    if (isAbortSignal(signal)) {
      abortListener = () => {
        externallyAborted = true;
        controller.abort();
        reject(abortError());
      };
      signal.addEventListener("abort", abortListener, { once: true });
    }
  });

  try {
    return await Promise.race([requestPromise, deadlinePromise]);
  } catch (error) {
    if (externallyAborted || (isAbortSignal(signal) && signal.aborted)) throw abortError();
    if (timedOut || error?.status === "timeout") throw timeoutError();
    throw error;
  } finally {
    clearTimeout(timer);
    if (isAbortSignal(signal) && abortListener) signal.removeEventListener("abort", abortListener);
  }
}

async function readResponseText(response, timeoutMs, signal) {
  if (!response) return "";
  const reader = typeof response.text === "function"
    ? () => response.text()
    : typeof response.json === "function"
      ? async () => JSON.stringify(await response.json())
      : null;
  if (!reader) return "";
  if (isAbortSignal(signal) && signal.aborted) throw abortError();
  let timer;
  let abortListener;
  let externallyAborted = false;
  const readPromise = Promise.resolve().then(reader);
  readPromise.catch(() => {});
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => reject(timeoutError()), timeoutMs);
    if (isAbortSignal(signal)) {
      abortListener = () => {
        externallyAborted = true;
        reject(abortError());
      };
      signal.addEventListener("abort", abortListener, { once: true });
    }
  });
  try {
    const value = await Promise.race([readPromise, deadline]);
    return typeof value === "string" ? value : JSON.stringify(value);
  } catch (error) {
    if (externallyAborted || (isAbortSignal(signal) && signal.aborted)) throw abortError();
    throw error;
  } finally {
    clearTimeout(timer);
    if (isAbortSignal(signal) && abortListener) signal.removeEventListener("abort", abortListener);
  }
}

function responseStatus(response) {
  const status = Number(response?.status);
  return Number.isFinite(status) ? status : 200;
}

function parseProviderMessage(text) {
  if (!text) return "provider returned an error";
  try {
    const parsed = JSON.parse(text);
    const message = parsed?.error?.message ?? parsed?.message ?? parsed?.error;
    if (typeof message === "string" && message.trim()) return message.trim();
  } catch {
    // Plain-text provider errors are handled below.
  }
  return String(text).replace(/\s+/g, " ").trim().slice(0, 400) || "provider returned an error";
}

async function requestOnce(config, { url, init, signal, operation }) {
  let response;
  try {
    response = await fetchWithDeadline(config.fetchImpl, url, init, config.timeoutMs, signal);
  } catch (error) {
    throw scrubError(error, config.apiKey);
  }
  const status = responseStatus(response);
  if (status >= 400 || response?.ok === false) {
    let body = "";
    try {
      body = await readResponseText(response, config.timeoutMs, signal);
    } catch {
      // The HTTP status is sufficient to classify an unavailable provider.
    }
    throw new GroqProviderError(status, redact(parseProviderMessage(body), config.apiKey), { operation });
  }
  let body;
  try {
    body = await readResponseText(response, config.timeoutMs, signal);
  } catch (error) {
    throw scrubError(error, config.apiKey);
  }
  try {
    return body ? JSON.parse(body) : {};
  } catch {
    throw new GroqClientError(`Groq returned malformed JSON for ${operation}`, {
      name: "GroqResponseError",
      code: "MALFORMED_RESPONSE",
      status: "provider_http_error",
      operation,
    });
  }
}

async function requestWithRetry(config, request, { signal, operation, onRetry } = {}) {
  let retries = 0;
  while (true) {
    try {
      return await requestOnce(config, { ...request, signal, operation });
    } catch (error) {
      scrubError(error, config.apiKey);
      if (retries >= config.retryLimit || !retryableError(error)) throw error;
      retries += 1;
      const payload = retryPayload(error, operation, retries, config.retryLimit);
      if (typeof onRetry === "function") {
        await onRetry(payload);
      }
      await waitForRetry(Math.min(250, 50 * (2 ** (retries - 1))), signal);
    }
  }
}

function modelInfoFor(model) {
  if (!model || typeof model !== "object") return { id: String(model ?? "") };
  const result = { id: typeof model.id === "string" ? model.id : "" };
  for (const key of ["owned_by", "created", "active", "context_window", "max_completion_tokens"]) {
    if (model[key] !== undefined && ["string", "number", "boolean"].includes(typeof model[key])) result[key] = model[key];
  }
  const supported = model.supported_parameters ?? model.supportedParameters;
  if (Array.isArray(supported)) result.supportedParameters = supported.filter((item) => typeof item === "string").slice(0, 64);
  if (typeof model.supports_response_format === "boolean") result.supportsResponseFormat = model.supports_response_format;
  if (typeof model.supports_json_schema === "boolean") result.supportsJsonSchema = model.supports_json_schema;
  return result;
}

function strictSupport(model) {
  if (!model || typeof model !== "object") return null;
  if (typeof model.supports_json_schema === "boolean") return model.supports_json_schema;
  if (typeof model.supportsJsonSchema === "boolean") return model.supportsJsonSchema;
  if (typeof model.supports_response_format === "boolean") return model.supports_response_format;
  if (Array.isArray(model.supported_parameters)) {
    return model.supported_parameters.some((value) => /json[_-]?schema|response[_-]?format/i.test(String(value)));
  }
  if (Array.isArray(model.supportedParameters)) {
    return model.supportedParameters.some((value) => /json[_-]?schema|response[_-]?format/i.test(String(value)));
  }
  return null;
}

function availabilityFailure(error, model, config) {
  const status = statusForError(error);
  return {
    ok: false,
    available: false,
    status,
    code: status === "rate_limited" ? "rate_limited" : status === "timeout" ? "timeout" : "provider_http_error",
    model,
    httpStatus: Number.isFinite(error?.statusCode) ? error.statusCode : undefined,
    message: redact(safeErrorMessage(error, config.apiKey), config.apiKey),
  };
}

/**
 * Verify the configured model using the provider's own model catalogue.  The
 * catalogue is authoritative: PaperTrail does not maintain an invented model
 * allow-list and never treats a missing key as a provider outage.
 */
export async function verifyModelAvailability(options = {}) {
  const config = resolveConfig(options);
  if (!config.apiKey) {
    return {
      ok: false,
      available: false,
      status: "missing_key",
      code: "missing_api_key",
      model: config.model,
      message: "GROQ_API_KEY is not configured",
    };
  }
  if (typeof config.fetchImpl !== "function") {
    return {
      ok: false,
      available: false,
      status: "provider_http_error",
      code: "fetch_unavailable",
      model: config.model,
      message: "No fetch implementation is available",
    };
  }

  try {
    const data = await requestWithRetry(config, {
      url: joinUrl(config.baseUrl, "/models"),
      init: {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
      },
    }, {
      signal: options.signal,
      operation: "models",
      onRetry: options.onRetry,
    });
    const models = Array.isArray(data?.data) ? data.data : null;
    if (!models) {
      return {
        ok: false,
        available: false,
        status: "provider_http_error",
        code: "malformed_models_response",
        model: config.model,
        message: "Groq /models returned no model list",
      };
    }
    const match = models.find((entry) => String(entry?.id ?? "") === config.model);
    if (!match) {
      return {
        ok: false,
        available: false,
        status: "unavailable_model",
        code: "model_unavailable",
        model: config.model,
        models: models.map((entry) => String(entry?.id ?? "")).filter(Boolean),
        message: `Configured Groq model is not available: ${config.model}`,
      };
    }
    return {
      ok: true,
      available: true,
      status: "available",
      code: "model_available",
      model: config.model,
      modelInfo: modelInfoFor(match),
      strictJsonSchemaSupported: strictSupport(match),
    };
  } catch (error) {
    if (error?.status === "cancelled" || error?.name === "AbortError") throw error;
    return availabilityFailure(error, config.model, config);
  }
}

function schemaToJsonSchema(schema) {
  if (!schema) return { type: "object", additionalProperties: true };
  if (schema && typeof schema === "object" && !schema.safeParse && !schema.parse) return schema;
  try {
    if (typeof schema.toJSONSchema === "function") return schema.toJSONSchema();
    if (typeof z.toJSONSchema === "function") return z.toJSONSchema(schema);
  } catch (error) {
    throw new GroqClientError(`Unable to convert output schema: ${safeErrorMessage(error)}`, {
      name: "GroqSchemaError",
      code: "SCHEMA_CONVERSION_FAILED",
      status: "provider_http_error",
    });
  }
  throw new GroqClientError("A Zod or JSON schema is required for structured output", {
    name: "GroqSchemaError",
    code: "SCHEMA_REQUIRED",
    status: "provider_http_error",
  });
}

function schemaName(value) {
  return nonEmptyString(value, "papertrail_output").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64) || "papertrail_output";
}

function contentFromResponse(data) {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((part) => typeof part === "string" ? part : part?.text ?? "").join("");
  }
  if (content && typeof content === "object") return JSON.stringify(content);
  return "";
}

function parseJsonText(text) {
  const value = String(text ?? "").trim();
  const fenced = value.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced ? fenced[1].trim() : value;
  if (!candidate) throw new GroqOutputError("Groq returned empty structured output", { code: "EMPTY_OUTPUT" });
  try {
    return JSON.parse(candidate);
  } catch {
    throw new GroqOutputError("Groq returned invalid JSON", { code: "INVALID_JSON" });
  }
}

function zodIssues(result) {
  return result.error.issues.slice(0, 20).map((issue) => ({
    path: issue.path,
    message: String(issue.message).slice(0, 300),
  }));
}

function parseStructuredOutput(text, schema, mode) {
  let parsed;
  try {
    parsed = parseJsonText(text);
  } catch (error) {
    if (mode === "json_schema" && error instanceof GroqOutputError) error.strictRejected = true;
    throw error;
  }
  if (!schema || typeof schema.safeParse !== "function") return parsed;
  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new GroqOutputError("Groq structured output did not satisfy the requested schema", {
      code: "SCHEMA_INVALID",
      mode,
      issues: zodIssues(result),
      strictRejected: mode === "json_schema",
    });
  }
  return result.data;
}

function scrubOutput(value, secret, depth = 0) {
  if (depth > 10 || value === null || value === undefined) return value;
  if (typeof value === "string") return redact(value, secret);
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => scrubOutput(item, secret, depth + 1));
  const output = {};
  for (const [key, child] of Object.entries(value)) {
    if (/^(?:api[_-]?key|authorization|token|secret|password|groq_api_key)$/i.test(key)) continue;
    output[key] = scrubOutput(child, secret, depth + 1);
  }
  return output;
}

function strictOutputRejected(error) {
  if (error?.strictRejected) return true;
  if (!(error instanceof GroqProviderError)) return false;
  if (error.statusCode < 400 || error.statusCode >= 500) return false;
  if (error.statusCode === 400 || error.statusCode === 422) return true;
  return /json[_ -]?schema|response[_ -]?format|structured|strict|schema/i.test(String(error.message));
}

function boundedMaxTokens(requested, configured) {
  if (requested === undefined || requested === null) return configured;
  return Math.max(1, Math.min(configured, finitePositive(requested, configured, configured)));
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) throw new TypeError("generateStructured requires non-empty messages");
  return messages.map((message) => {
    if (!message || typeof message !== "object") throw new TypeError("Each Groq message must be an object");
    const role = String(message.role ?? "user");
    if (!["system", "user", "assistant"].includes(role)) throw new TypeError("Groq messages may only use system, user, or assistant roles");
    return { role, content: typeof message.content === "string" ? message.content : JSON.stringify(message.content ?? "") };
  });
}

/**
 * Create a server-only, OpenAI-compatible Groq client.  The key stays in a
 * closure and is used only for the Authorization header; it is not exposed on
 * the returned object, errors, events, or structured results.
 */
export function createGroqClient(options = {}) {
  const config = resolveConfig(options);
  let lastVerification = null;

  async function checkAvailability({ force = false, signal, onRetry } = {}) {
    if (!force && lastVerification) return lastVerification;
    const result = await verifyModelAvailability({ ...config, signal, onRetry });
    lastVerification = result;
    return result;
  }

  async function generateStructured(request = {}) {
    const availability = await checkAvailability({ signal: request.signal, onRetry: request.onRetry });
    if (!availability.ok) {
      throw new GroqClientError(availability.message, {
        name: "GroqAvailabilityError",
        code: availability.code,
        status: availability.status,
        model: config.model,
        httpStatus: availability.httpStatus,
        retryable: availability.status === "rate_limited" || availability.status === "timeout",
      });
    }

    const messages = normalizeMessages(request.messages);
    const schema = request.schema;
    const schemaJson = schemaToJsonSchema(schema);
    const schemaLabel = schemaName(request.schemaName ?? request.name ?? "papertrail_output");
    const strictSupported = availability.strictJsonSchemaSupported;
    const commonBody = {
      model: config.model,
      messages,
      max_tokens: boundedMaxTokens(request.maxTokens, config.maxTokens),
      stream: false,
    };
    if (Number.isFinite(Number(request.temperature))) commonBody.temperature = Math.max(0, Math.min(2, Number(request.temperature)));

    async function requestMode(mode) {
      const responseFormat = mode === "json_schema"
        ? { type: "json_schema", json_schema: { name: schemaLabel, strict: true, schema: schemaJson } }
        : { type: "json_object" };
      const data = await requestWithRetry(config, {
        url: joinUrl(config.baseUrl, "/chat/completions"),
        init: {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({ ...commonBody, response_format: responseFormat }),
        },
      }, {
        signal: request.signal,
        operation: `chat_completions_${mode}`,
        onRetry: request.onRetry,
      });
      return scrubOutput(parseStructuredOutput(contentFromResponse(data), schema, mode), config.apiKey);
    }

    if (strictSupported === false) return requestMode("json_object");
    try {
      return await requestMode("json_schema");
    } catch (error) {
      if (!strictOutputRejected(error)) throw error;
      // Exactly one capability fallback.  The fallback itself still has the
      // configured bounded retries, but it cannot trigger another format.
      return requestMode("json_object");
    }
  }

  return Object.freeze({
    baseUrl: config.baseUrl,
    model: config.model,
    timeoutMs: config.timeoutMs,
    maxTokens: config.maxTokens,
    retryLimit: config.retryLimit,
    verifyModelAvailability: checkAvailability,
    generateStructured,
    complete: generateStructured,
    getLastVerification: () => lastVerification,
  });
}
