import xss from "xss";
import { z } from "zod";

// Create a custom filter that strips tags but allows some safe characters
const xssOptions = {
  whiteList: {}, // empty means all tags are stripped
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script']
};

const sanitizeString = (str: string) => {
  return xss(str, xssOptions).trim();
};

// Zod helper for any string input
export const zSafeString = () => z.string().transform(val => sanitizeString(val));
