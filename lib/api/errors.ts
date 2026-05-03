import axios from "axios";

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const data = error.response?.data as
    | { detail?: string; message?: string; error?: string; non_field_errors?: string[] }
    | undefined;

  if (!data) {
    return fallback;
  }

  if (typeof data.detail === "string") return data.detail;
  if (typeof data.message === "string") return data.message;
  if (typeof data.error === "string") return data.error;
  if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
    return data.non_field_errors[0] ?? fallback;
  }

  for (const [field, value] of Object.entries(data)) {
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
      return `${field}: ${value[0]}`;
    }
    if (typeof value === "string") {
      return `${field}: ${value}`;
    }
  }

  return fallback;
}

export function isUnauthorizedError(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 401;
}
