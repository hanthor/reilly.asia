import { describe, expect, it } from "vitest";
import { contactFormSchema, type ContactFormData } from "./schema";

describe("contactFormSchema", () => {
  describe("valid data", () => {
    it("accepts a complete valid contact form", () => {
      const data = {
        name: "John Doe",
        email: "john@example.com",
        company: "ACME Corp",
        projectType: "Infrastructure",
        message: "This is a test message with enough characters.",
      };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });

    it("accepts minimal required fields", () => {
      const data = {
        name: "Jane Smith",
        email: "jane@example.com",
        message: "A message that is long enough.",
      };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Jane Smith");
        expect(result.data.email).toBe("jane@example.com");
        expect(result.data.message).toBe("A message that is long enough.");
      }
    });

    it("accepts optional company and projectType fields", () => {
      const data = {
        name: "Alice",
        email: "alice@test.com",
        message: "Testing optional fields.",
        company: "My Company",
      };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("validation errors", () => {
    it("rejects empty name", () => {
      const data = {
        name: "",
        email: "test@example.com",
        message: "This message is long enough.",
      };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes("name"))).toBe(true);
      }
    });

    it("rejects missing name", () => {
      const data = {
        email: "test@example.com",
        message: "This message is long enough.",
      };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects invalid email format", () => {
      const data = {
        name: "Test User",
        email: "not-an-email",
        message: "This message is long enough.",
      };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes("email"))).toBe(true);
      }
    });

    it("rejects empty email", () => {
      const data = {
        name: "Test User",
        email: "",
        message: "This message is long enough.",
      };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects message shorter than 10 characters", () => {
      const data = {
        name: "Test User",
        email: "test@example.com",
        message: "Short",
      };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes("message"))).toBe(true);
      }
    });

    it("rejects missing message", () => {
      const data = {
        name: "Test User",
        email: "test@example.com",
      };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects empty message", () => {
      const data = {
        name: "Test User",
        email: "test@example.com",
        message: "",
      };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("type inference", () => {
    it("infers ContactFormData type correctly", () => {
      const validData: ContactFormData = {
        name: "Test",
        email: "test@example.com",
        message: "This is a valid message.",
        company: "TestCorp",
        projectType: "Web",
      };
      expect(validData).toBeDefined();
      expect(validData.name).toBe("Test");
    });
  });
});
