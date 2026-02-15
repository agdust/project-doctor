import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Check } from "../../../types.js";
import type { DockerContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "dockerfile-exists";

export const check: Check<DockerContext> = {
  name,
  description: "Check if Dockerfile exists",
  tags: ["universal", "recommended", "effort:low"],
  run: async (_global, { dockerfile }) => {
    if (!dockerfile) return fail(name, "Dockerfile not found");
    return pass(name, "Dockerfile exists");
  },
  fix: {
    description: "Create a basic Dockerfile",
    run: async (global) => {
      const content = `FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000
CMD ["node", "dist/index.js"]
`;
      const dockerfilePath = join(global.projectPath, "Dockerfile");
      await writeFile(dockerfilePath, content, "utf-8");
      return { success: true, message: "Created Dockerfile with Node.js Alpine template" };
    },
  },
};
