import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { env } from "./env.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TaskFlow API",
      version: "1.0.0",
      description:
        "Production-grade TaskFlow MERN Backend API — authentication, boards, tasks, teams, comments, activity logs, admin, and analytics.",
      contact: { name: "TaskFlow Support" },
    },
    servers: [
      {
        url: env.apiBaseUrl,
        description: env.isProduction ? "Production" : "Development",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
            errors: { type: "array", items: { type: "object" } },
          },
        },
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            role: {
              type: "string",
              enum: ["admin", "project_manager", "team_member"],
            },
            avatar: { type: "object" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
  apis: [join(__dirname, "../docs/swagger.docs.js")],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

export const setupSwagger = (app) => {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: "TaskFlow API Docs",
      swaggerOptions: { persistAuthorization: true },
    }),
  );

  app.get("/api-docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
};

export default setupSwagger;
